const DEFAULT_FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant'
]

export async function streamGroq({
  message,
  systemPrompt = '',
  model,
  onChunk = () => {},
  fallbackModels = DEFAULT_FALLBACK_MODELS,
  conversationHistory = []
}) {
  const modelsToTry = model ? [model, ...fallbackModels] : fallbackModels
  let lastError = null

  for (const currentModel of modelsToTry) {
    try {
      console.log(`Attempting to use model: ${currentModel}`)
      
      // Track start time for latency
      const startTime = performance.now()

      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model: currentModel,
          systemPrompt,
          conversationHistory
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      let tokenCount = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              const endTime = performance.now()
              const latencyMs = Math.round(endTime - startTime)
              
              return { 
                text: fullText, 
                model: currentModel,
                tokenCount: tokenCount || estimateTokenCount(fullText),
                latencyMs
              }
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullText += parsed.content
                onChunk(parsed.content)
              }
              // Capture token count if provided by API
              if (parsed.usage?.total_tokens) {
                tokenCount = parsed.usage.total_tokens
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      const endTime = performance.now()
      const latencyMs = Math.round(endTime - startTime)
      
      return { 
        text: fullText, 
        model: currentModel,
        tokenCount: tokenCount || estimateTokenCount(fullText),
        latencyMs
      }
    } catch (error) {
      lastError = error
      console.warn(`Model ${currentModel} failed:`, error.message)
      
      if (currentModel === modelsToTry[modelsToTry.length - 1]) {
        throw new Error(`All Groq models failed. Last error: ${lastError.message}`)
      }
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError?.message}`)
}

// Estimate token count (rough approximation: ~4 chars per token)
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4)
}
