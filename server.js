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

app.post('/api/groq', async (req, res) => {
  const { message, model, systemPrompt, conversationHistory } = req.body

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

    const stream = await groq.chat.completions.create({
      messages,
      model: model || 'llama-3.1-8b-instant',
      stream: true,
      temperature: 0.7,
      max_tokens: 2048
    })

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
