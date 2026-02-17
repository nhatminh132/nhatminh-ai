import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { audio } = req.body // base64 encoded audio
    
    if (!audio) {
      return res.status(400).json({ error: 'No audio provided' })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64')
    
    // Create a File object for Groq API
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })

    // Transcribe using Whisper
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'en', // Auto-detect or specify
      response_format: 'json'
    })

    res.status(200).json({ text: transcription.text })
  } catch (error) {
    console.error('Whisper API error:', error)
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error.message 
    })
  }
}
