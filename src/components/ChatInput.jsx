import React, { useState, useRef, useEffect } from 'react'

export default function ChatInput({ onSendMessage, onSendImage, uploadsLeft, disabled, mode, onModeChange, proMaxUsesLeft, proLiteUsesLeft, isGuest = false, guestAirUsesLeft = 10, guestBaseUsesLeft = 10 }) {
  const [message, setMessage] = useState('')
  const [rows, setRows] = useState(1)
  const [showModeMenu, setShowModeMenu] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const modeMenuRef = useRef(null)

  useEffect(() => {
    const lines = message.split('\n').length
    setRows(Math.min(lines, 5))
  }, [message])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
      setRows(1)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file && uploadsLeft > 0) {
      onSendImage(file)
      e.target.value = ''
    } else if (uploadsLeft === 0) {
      alert('You have used all your image uploads for today!')
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(e.target)) {
        setShowModeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  const modeConfig = isGuest ? {
    air: { label: 'Air', description: `Quick responses (${guestAirUsesLeft}/10 uses left)`, disabled: guestAirUsesLeft <= 0 },
    base: { label: 'Base', description: `Standard model (${guestBaseUsesLeft}/10 uses left)`, disabled: guestBaseUsesLeft <= 0 }
  } : {
    air: { label: 'Air', description: 'Quick responses (No limit)' },
    base: { label: 'Base', description: 'Standard model (No limit)' },
    pro: { label: 'Pro', description: 'Advanced model (No limit)' },
    'pro-max': { label: 'Pro Max', description: 'Premium model (No limit)' },
    ultra: { label: 'Ultra', description: 'Best model (No limit)' }
  }

  const currentMode = modeConfig[mode]

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const audioChunks = []

      recorder.ondataavailable = (e) => audioChunks.push(e.data)
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        setIsTranscribing(true)
        
        stream.getTracks().forEach(track => track.stop())

        try {
          const formData = new FormData()
          formData.append('file', audioBlob, 'recording.webm')
          formData.append('model', 'whisper-large-v3')
          formData.append('language', 'en')
          formData.append('response_format', 'json')

          const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + import.meta.env.VITE_GROQ_API_KEY
            },
            body: formData
          })

          if (!response.ok) throw new Error('Transcription failed')

          const data = await response.json()
          setMessage(prev => prev + (prev ? ' ' : '') + data.text)
          textareaRef.current?.focus()
        } catch (error) {
          console.error('Transcription error:', error)
          alert('Failed to transcribe audio. Please try again.')
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingStartTime(Date.now())
    } catch (error) {
      console.error('Recording error:', error)
      alert('Could not access microphone. Please grant permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      setIsRecording(false)
      setRecordingStartTime(null)
    }
  }

  const [recordingDuration, setRecordingDuration] = useState(0)

  useEffect(() => {
    let interval
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordingStartTime) / 1000))
      }, 100)
    } else {
      setRecordingDuration(0)
    }
    return () => clearInterval(interval)
  }, [isRecording, recordingStartTime])

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins + ':' + secs.toString().padStart(2, '0')
  }

  return (
    <div className="border-t border-[#3f3f3f] bg-[#212121] p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative" ref={modeMenuRef}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploadsLeft === 0}
                className="absolute left-3 bottom-3 p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={uploadsLeft === 0 ? 'No uploads remaining today' : uploadsLeft + ' uploads remaining'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-gray-700 dark:bg-gray-400 text-white dark:text-gray-900 px-1.5 py-0.5 rounded-full text-xs font-bold">{uploadsLeft}</span>
              </button>

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder={isTranscribing ? "Transcribing..." : "Ask me anything... (Shift+Enter for new line)"}
                disabled={disabled || isTranscribing}
                rows={rows}
                className="w-full pl-14 pr-24 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-white resize-none"
              />
              
              <button
                type="button"
                onClick={() => setShowModeMenu(!showModeMenu)}
                className="absolute right-28 bottom-3 px-4 py-2 rounded-full bg-transparent hover:bg-gray-700/50 text-white text-sm font-medium transition-colors flex items-center gap-2 border border-gray-600"
                disabled={disabled}
              >
                <span>{currentMode.label}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showModeMenu && (
                <div className="absolute bottom-12 right-28 w-64 bg-[#2f2f2f] border border-[#3f3f3f] rounded-lg shadow-lg overflow-hidden z-10">
                  {Object.entries(modeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        if (!config.disabled) {
                          onModeChange(key)
                          setShowModeMenu(false)
                        }
                      }}
                      className={'w-full px-4 py-3 text-left transition-colors flex items-start gap-3 ' + 
                        (config.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3f3f3f]') + ' ' +
                        (mode === key ? 'bg-[#3f3f3f]' : '')}
                      disabled={disabled || config.disabled}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-white">{config.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{config.description}</div>
                      </div>
                      {mode === key && (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={disabled || isTranscribing}
                className={'absolute right-14 bottom-3 p-2 rounded-lg transition-all ' + (isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500') + ' disabled:opacity-50 disabled:cursor-not-allowed'}
                title={isRecording ? 'Recording... ' + formatDuration(recordingDuration) : 'Voice input'}
              >
                {isTranscribing ? (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isRecording ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                type="submit"
                disabled={disabled || !message.trim()}
                className="absolute right-3 bottom-3 p-2 bg-gray-800 dark:bg-gray-200 hover:bg-black dark:hover:bg-white text-white dark:text-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {isRecording && (
            <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              Recording... {formatDuration(recordingDuration)}
            </div>
          )}

          {/* AI Warning Text */}
          <div className="mt-2 text-xs text-gray-500 text-center">
            AI can make mistakes. Check important info. Please read{' '}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('openAISafety'))}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              AI Safety guidelines
            </button>
            {' '}before use.
          </div>
        </div>
      </form>
    </div>
  )
}