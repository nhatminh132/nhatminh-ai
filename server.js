import express from 'express'
import Groq from 'groq-sdk'
import cors from 'cors'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
})

// Whisper endpoint for speech-to-text
app.post('/api/whisper', async (req, res) => {
  try {
    const { audio } = req.body
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio provided' })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64')
    
    // Create a blob-like object for Groq API
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'json'
    })

    res.json({ text: transcription.text })
  } catch (error) {
    console.error('Whisper error:', error)
    res.status(500).json({ error: 'Transcription failed', details: error.message })
  }
})

app.post('/api/groq', async (req, res) => {
  const { message, model, systemPrompt, conversationHistory, maxTokens = 4096 } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  try {
    // Build messages array with conversation history
    const messages = []
    
    // Add system prompt
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        })
      })
    }
    
    // Add current message
    messages.push({ role: 'user', content: message })

    // Enable web search for compound models
    const isCompoundModel = model && (model.includes('compound') || model.includes('groq/compound'))
    
    const completionOptions = {
      messages,
      model: model || 'llama-3.1-8b-instant',
      stream: true,
      temperature: 0.7,
      max_tokens: maxTokens
    }

    // Add compound tools for web search, code interpreter, visit website
    if (isCompoundModel) {
      completionOptions.compound_custom = {
        tools: {
          enabled_tools: ['web_search', 'code_interpreter', 'visit_website']
        }
      }
    }

    const stream = await groq.chat.completions.create(completionOptions)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || ''
      if (content) {
        res.write(`data: ${JSON.stringify({ content, model })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      model 
    })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Groq proxy server running on port ${PORT}`)
})
