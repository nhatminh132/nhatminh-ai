import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { routeAIRequest, callGeminiVision } from '../lib/aiRouter'
import ChatHeader from '../components/ChatHeader'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import SidebarChatGPT from '../components/SidebarChatGPT'
import Gallery from '../components/Gallery'
import LoginPopup from '../components/LoginPopup'
import AISafetyModal from '../components/AISafetyModal'
import KeyboardShortcutsHelp from '../components/KeyboardShortcutsHelp'
import RateLimitWarning from '../components/RateLimitWarning'

// Token limits per mode (TPM = Tokens Per Minute)
const TOKEN_LIMITS = {
  air: 10000,   // Air mode: 10,000 TPM
  base: 10000,  // Base mode: 10,000 TPM
  pro: 10000    // Pro mode: 10,000 TPM
}

export default function Chat({ user }) {
  const [messages, setMessages] = useState([])
  const [uploadsLeft, setUploadsLeft] = useState(5)
  const [mode, setMode] = useState('base')
  const [proMaxUsesLeft, setProMaxUsesLeft] = useState(10)
  const [proLiteUsesLeft, setProLiteUsesLeft] = useState(50)
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [currentChatId, setCurrentChatId] = useState(null)
  const [isTemporaryChat, setIsTemporaryChat] = useState(false)
  const [userName, setUserName] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [guestAirUsesLeft, setGuestAirUsesLeft] = useState(10)
  const [guestBaseUsesLeft, setGuestBaseUsesLeft] = useState(10)
  const [showAISafety, setShowAISafety] = useState(false)
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false)
  const [rateLimitRetryAfter, setRateLimitRetryAfter] = useState(null)
  const [tokenUsageThisMinute, setTokenUsageThisMinute] = useState(0)
  const [lastTokenResetTime, setLastTokenResetTime] = useState(Date.now())
  const [showShortcuts, setShowShortcuts] = useState(false)
  const messagesEndRef = useRef(null)
  const isGuest = !user

  // Welcome messages pool
  const welcomeMessages = [
    "How can I help you today",
    "What would you like to know",
    "Ready to assist you",
    "What can I help you with",
    "How may I assist you today",
    "What's on your mind",
    "I'm here to help",
    "Ask me anything",
  ]

  // Fetch profile and chat history on mount
  useEffect(() => {
    if (isGuest) {
      // Load guest usage from localStorage
      const airUses = parseInt(localStorage.getItem('guestAirUsesLeft') || '10')
      const baseUses = parseInt(localStorage.getItem('guestBaseUsesLeft') || '10')
      setGuestAirUsesLeft(airUses)
      setGuestBaseUsesLeft(baseUses)
      
      // Set guest name
      setUserName('Guest')
      
      // Check if guest has seen AI Safety
      const guestSeenSafety = localStorage.getItem('guestSeenAISafety')
      if (!guestSeenSafety) {
        setShowAISafety(true)
      }
      
      // Force guest to use only Air or Base mode
      if (mode !== 'air' && mode !== 'base') {
        setMode('base')
      }
    } else {
      loadProfile()
    }
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
    setWelcomeMessage(randomMessage)
    
    // Listen for AI Safety open event from warning text
    const handleOpenAISafety = () => setShowAISafety(true)
    window.addEventListener('openAISafety', handleOpenAISafety)
    return () => window.removeEventListener('openAISafety', handleOpenAISafety)
  }, [user])


  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('uploads_left, pro_max_uses_left, pro_max_last_reset, pro_lite_uses_left, pro_lite_last_reset, display_name, username, seen_ai_safety')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) {
        setUploadsLeft(data.uploads_left)
        
        // Set user name from display_name, username, or email username part
        const emailUsername = user.email?.split('@')[0] || 'there'
        const name = data.display_name || data.username || emailUsername
        setUserName(name)
        
        // Show AI Safety modal if user hasn't seen it
        if (!data.seen_ai_safety) {
          setShowAISafety(true)
        }
        
        // Check if we need to reset Pro Max uses (new day)
        const lastReset = data.pro_max_last_reset ? new Date(data.pro_max_last_reset) : null
        const today = new Date()
        const isNewDay = !lastReset || lastReset.toDateString() !== today.toDateString()
        
        if (isNewDay) {
          // Reset to 10 uses for new day
          setProMaxUsesLeft(10)
          // Update in database
          supabase.from('profiles').update({ 
            pro_max_uses_left: 10, 
            pro_max_last_reset: today.toISOString() 
          }).eq('id', user.id)
        } else {
          setProMaxUsesLeft(data.pro_max_uses_left ?? 10)
        }
        
        // Check if we need to reset Pro Lite uses (new day)
        const proLiteLastReset = data.pro_lite_last_reset ? new Date(data.pro_lite_last_reset) : null
        const isNewDayProLite = !proLiteLastReset || proLiteLastReset.toDateString() !== today.toDateString()
        
        if (isNewDayProLite) {
          // Reset to 50 uses for new day
          setProLiteUsesLeft(50)
          // Update in database
          supabase.from('profiles').update({ 
            pro_lite_uses_left: 50, 
            pro_lite_last_reset: today.toISOString() 
          }).eq('id', user.id)
        } else {
          setProLiteUsesLeft(data.pro_lite_uses_left ?? 50)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadChatHistory = async () => {
    try {
      // Get the most recent conversation
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (convError) throw convError
      
      if (conversations && conversations.length > 0) {
        const conversation = conversations[0]
        setCurrentChatId(conversation.id)
        
        // Load messages for this conversation
        const { data: messages, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
        
        if (msgError) throw msgError
        
        if (messages && messages.length > 0) {
          const formattedMessages = messages.flatMap(msg => [
            { text: msg.question, isUser: true, model: null },
            { text: msg.answer, isUser: false, model: msg.model_used, tokenCount: msg.token_count, latencyMs: msg.latency_ms }
          ])
          setMessages(formattedMessages)
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const saveChatHistory = async (question, answer, modelUsed, tokenCount, latencyMs) => {
    try {
      // If no current chat, create a new conversation with AI-generated title
      if (!currentChatId) {
        // Use first message as temporary title, will be updated with AI summary
        const tempTitle = question.length > 60 ? question.substring(0, 57) + '...' : question
        
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: tempTitle,
          })
          .select()
          .single()

        if (convError) throw convError
        
        // Set the current chat ID immediately so it shows in sidebar
        setCurrentChatId(convData.id)
        
        // Generate better title using AI in background
        generateChatTitle(question, convData.id)
        
        // Force sidebar refresh after 5 seconds to ensure title is updated
        setTimeout(() => {
          console.log('🔄 Forcing sidebar refresh for title update...')
          setCurrentChatId(prev => prev) // Trigger re-render
          // Dispatch custom event for sidebar to catch
          window.dispatchEvent(new CustomEvent('refreshSidebar'))
        }, 5000)
        
        // Insert the first message
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: convData.id,
            question,
            answer,
            model_used: modelUsed,
            token_count: tokenCount,
            latency_ms: latencyMs,
          })

        if (msgError) throw msgError
      } else {
        // Add message to existing conversation
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: currentChatId,
            question,
            answer,
            model_used: modelUsed,
            token_count: tokenCount,
            latency_ms: latencyMs,
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  const generateChatTitle = async (firstMessage, conversationId) => {
    try {
      console.log('🎯 Generating title for:', firstMessage.substring(0, 50))
      
      // Use better model for higher quality titles
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a concise, descriptive title (3-5 words maximum) for a conversation that starts with: "${firstMessage.substring(0, 200)}"`,
          model: 'llama-3.3-70b-versatile',
          systemPrompt: 'You are an expert at creating concise, clear conversation titles. Output ONLY the title text with no quotes, explanations, or extra words. Maximum 5 words.',
          conversationHistory: []
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let title = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        
        // Parse each chunk - format is "data: {json}\n\n"
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6) // Remove "data: " prefix
              const json = JSON.parse(jsonStr)
              if (json.content) {
                title += json.content // Accumulate content
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      // Clean up title
      title = title.trim().replace(/^["']|["']$/g, '') // Remove quotes
      console.log('✅ Generated title:', title)
      
      if (title && title.length > 0) {
        const { error } = await supabase
          .from('conversations')
          .update({ title: title.substring(0, 60) })
          .eq('id', conversationId)
        
        if (error) {
          console.error('❌ Failed to update title in DB:', error)
        } else {
          console.log('✅ Title updated in database')
          // The realtime subscription in sidebar will automatically refresh
          // But we can also trigger a manual refresh by updating currentChatId
          // (This is a no-op since the ID is the same, but triggers the useEffect)
        }
      }
    } catch (error) {
      console.error('❌ Error generating title:', error)
      // Title generation failed, but that's okay - temp title will remain
    }
  }

  const decrementUploads = async () => {
    try {
      const newCount = uploadsLeft - 1
      const { error } = await supabase
        .from('profiles')
        .update({ uploads_left: newCount })
        .eq('id', user.id)

      if (error) throw error
      setUploadsLeft(newCount)
    } catch (error) {
      console.error('Error updating uploads:', error)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setCurrentChatId(null)
    
    // Set a new random welcome message
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
    setWelcomeMessage(randomMessage)
  }

  const handleSelectChat = async (chat) => {
    try {
      // Load messages for this conversation
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', chat.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      // Format messages for display
      const chatMessages = data.flatMap(msg => [
        { text: msg.question, isUser: true, model: null },
        { text: msg.answer, isUser: false, model: msg.model_used, tokenCount: msg.token_count, latencyMs: msg.latency_ms }
      ])
      
      setMessages(chatMessages)
      setCurrentChatId(chat.id)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleSendMessage = async (message, isEdit = false, editIndex = null) => {
    if (loading) return

    // Check token usage and reset if needed (every minute)
    const now = Date.now()
    const timeSinceReset = now - lastTokenResetTime
    if (timeSinceReset > 60000) {
      // Reset token counter every minute
      setTokenUsageThisMinute(0)
      setLastTokenResetTime(now)
    }

    // Estimate tokens for this request (rough: ~4 chars per token)
    const estimatedTokens = Math.ceil(message.length / 4) + Math.ceil(messages.reduce((sum, m) => sum + m.text.length, 0) / 4)
    
    // Check if we're approaching the rate limit
    const limit = TOKEN_LIMITS[mode]
    if (tokenUsageThisMinute + estimatedTokens > limit) {
      const timeUntilReset = Math.ceil((60000 - timeSinceReset) / 1000)
      setRateLimitRetryAfter(`${timeUntilReset}s`)
      setShowRateLimitWarning(true)
      return
    }

    // Show login popup for guest users
    if (isGuest) {
      setShowLoginPopup(true)
      
      // Check if guest has uses left
      const currentUses = mode === 'air' ? guestAirUsesLeft : guestBaseUsesLeft
      if (currentUses <= 0) {
        alert(`You've used all ${mode === 'air' ? 'Air' : 'Base'} mode requests. Please sign in to continue.`)
        return
      }
    }

    // If editing, remove messages after the edit point
    if (isEdit && editIndex !== null) {
      setMessages(prev => prev.slice(0, editIndex))
    }

    // Add user message
    setMessages(prev => [...prev, { text: message, isUser: true, model: null }])
    setLoading(true)

    // Add placeholder for AI response with "Using..." status
    const aiMessageIndex = (isEdit && editIndex !== null) ? editIndex + 1 : messages.length + 1
    setMessages(prev => [...prev, { text: '', isUser: false, model: null, isStreaming: true }])

    try {
      let fullResponse = ''
      let currentModel = ''
      let responseMetadata = {}
      
      const result = await routeAIRequest(message, (chunk, streamModel) => {
        fullResponse += chunk
        currentModel = streamModel || model
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[aiMessageIndex] = { 
            text: fullResponse, 
            isUser: false, 
            model: currentModel,
            isStreaming: true // Still streaming
          }
          return newMessages
        })
      }, mode, messages)

      const { text, model, tokenCount, latencyMs } = result
      responseMetadata = { tokenCount, latencyMs }

      // Update token usage tracking
      if (tokenCount) {
        setTokenUsageThisMinute(prev => prev + tokenCount)
      }

      // Update with final response and model - mark streaming as complete
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[aiMessageIndex] = { 
          text, 
          isUser: false, 
          model,
          tokenCount,
          latencyMs,
          isStreaming: false // Streaming complete
        }
        return newMessages
      })

      // Decrement guest usage if guest
      if (isGuest) {
        if (mode === 'air') {
          const newUses = guestAirUsesLeft - 1
          setGuestAirUsesLeft(newUses)
          localStorage.setItem('guestAirUsesLeft', newUses.toString())
        } else if (mode === 'base') {
          const newUses = guestBaseUsesLeft - 1
          setGuestBaseUsesLeft(newUses)
          localStorage.setItem('guestBaseUsesLeft', newUses.toString())
        }
      } else {
        // Save to database (skip if temporary chat)
        if (!isTemporaryChat) {
          await saveChatHistory(message, text, model, responseMetadata.tokenCount, responseMetadata.latencyMs)
        }
      }
    } catch (error) {
      console.error('❌ Error getting AI response:', error)
      const errorMessage = `Sorry, all AI services are currently unavailable. ${error.message}`
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[aiMessageIndex] = { 
          text: errorMessage, 
          isUser: false, 
          model: 'Error' 
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendImage = async (base64Image, mimeType) => {
    if (loading || uploadsLeft <= 0) return

    // Add user message with image indicator
    setMessages(prev => [...prev, { 
      text: '*Uploaded an image for analysis*', 
      isUser: true, 
      model: null 
    }])
    setLoading(true)

    // Add placeholder for AI response
    const aiMessageIndex = messages.length + 1
    setMessages(prev => [...prev, { text: 'Analyzing image...', isUser: false, model: null }])

    try {
      const response = await callGeminiVision(base64Image, mimeType)
      const model = "Google Gemini Vision"

      // Update with final response
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[aiMessageIndex] = { 
          text: response, 
          isUser: false, 
          model 
        }
        return newMessages
      })

      // Save to database (skip if temporary chat)
      if (!isTemporaryChat) {
        await saveChatHistory('Image upload', response, model)
      }
      
      // Decrement uploads
      await decrementUploads()
    } catch (error) {
      console.error('Error analyzing image:', error)
      const errorMessage = `Sorry, I couldn't analyze the image: ${error.message}`
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[aiMessageIndex] = { 
          text: errorMessage, 
          isUser: false, 
          model: 'Error' 
        }
        return newMessages
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTemporaryChat = () => {
    setIsTemporaryChat(!isTemporaryChat)
    if (!isTemporaryChat) {
      // Starting temporary chat - clear current messages
      setMessages([])
      setCurrentChatId(null)
    }
  }

  const handleEditMessage = (editedMessage, messageIndex) => {
    // Call handleSendMessage with edited message
    handleSendMessage(editedMessage, true, messageIndex)
  }

  const handleGenerateSummary = async () => {
    if (messages.length === 0) {
      alert('No messages to summarize')
      return
    }

    try {
      // Create conversation text from messages
      const conversationText = messages
        .map((msg, idx) => `${msg.isUser ? 'User' : 'AI'}: ${msg.text}`)
        .join('\n\n')

      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Please provide a concise summary (2-3 sentences) of the following conversation:\n\n${conversationText.substring(0, 4000)}`,
          model: 'llama-3.3-70b-versatile',
          systemPrompt: 'You are an expert at summarizing conversations. Provide clear, concise summaries that capture the key points and topics discussed.',
          conversationHistory: []
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let summary = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.substring(6)
              const json = JSON.parse(jsonStr)
              if (json.content) {
                summary += json.content
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      if (summary) {
        alert(`Conversation Summary:\n\n${summary}`)
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Failed to generate summary. Please try again.')
    }
  }

  const handleAcceptAISafety = async () => {
    setShowAISafety(false)
    
    if (isGuest) {
      // Mark as seen in localStorage for guests
      localStorage.setItem('guestSeenAISafety', 'true')
    } else {
      // Mark as seen in database for logged-in users
      try {
        await supabase
          .from('profiles')
          .update({ seen_ai_safety: true })
          .eq('id', user.id)
      } catch (error) {
        console.error('Error updating AI safety status:', error)
      }
    }
  }

  return (
    <div className="flex h-screen bg-[#212121]">
      {/* Keyboard Shortcuts Help */}
      {showShortcuts && <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />}

      {/* AI Safety Modal */}
      {showAISafety && (
        <AISafetyModal 
          onAccept={handleAcceptAISafety}
          onClose={isGuest ? () => setShowAISafety(false) : null}
        />
      )}

      {/* Rate Limit Warning */}
      {showRateLimitWarning && (
        <RateLimitWarning 
          onClose={() => setShowRateLimitWarning(false)}
          mode={mode}
          retryAfter={rateLimitRetryAfter}
        />
      )}

      {/* Login Popup for Guests */}
      {showLoginPopup && (
        <LoginPopup onClose={() => setShowLoginPopup(false)} />
      )}

      {/* Sidebar - always visible, toggles between minimized and expanded */}
      <SidebarChatGPT
        userId={user?.id}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        isMinimized={sidebarMinimized}
        onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
        userEmail={user?.email}
        uploadsLeft={uploadsLeft}
        onToggleGallery={() => setShowGallery(!showGallery)}
        isGuest={isGuest}
        refreshTrigger={currentChatId}
      />

      {/* Gallery Modal */}
      {showGallery && (
        <Gallery
          userId={user.id}
          onClose={() => setShowGallery(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          onToggleSidebar={() => setSidebarMinimized(!sidebarMinimized)}
          sidebarMinimized={sidebarMinimized}
          isTemporaryChat={isTemporaryChat}
          onToggleTemporaryChat={isGuest ? null : handleToggleTemporaryChat}
          isGuest={isGuest}
          onGenerateSummary={handleGenerateSummary}
          hasMessages={messages.length > 0}
        />
        
        {messages.length === 0 ? (
          /* Empty chat - centered layout */
          <div className="flex-1 flex flex-col items-center justify-center pb-32">
            <div className="text-center mb-8">
              {isTemporaryChat ? (
                <>
                  <h2 className="text-3xl font-semibold text-white mb-3">Temporary Chat</h2>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">
                    This chat will not appear in your history and will not be used to train our models
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-lg">
                  {welcomeMessage}, <span className="text-white font-semibold">{userName}</span>?
                </p>
              )}
            </div>
            <div className="w-full max-w-4xl px-4">
              <ChatInput
                onSendMessage={handleSendMessage}
                onSendImage={handleSendImage}
                uploadsLeft={uploadsLeft}
                disabled={loading}
                mode={mode}
                onModeChange={setMode}
                proMaxUsesLeft={proMaxUsesLeft}
                proLiteUsesLeft={proLiteUsesLeft}
                isGuest={isGuest}
                guestAirUsesLeft={guestAirUsesLeft}
                guestBaseUsesLeft={guestBaseUsesLeft}
                tokenUsage={tokenUsageThisMinute}
                tokenLimit={TOKEN_LIMITS[mode]}
              />
            </div>
          </div>
        ) : (
          /* Active chat - normal layout */
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto">
                {messages.map((msg, index) => (
                  <ChatMessage
                    key={index}
                    message={msg.text}
                    isUser={msg.isUser}
                    model={msg.model}
                    isStreaming={msg.isStreaming || false}
                    messageIndex={index}
                    conversationId={currentChatId}
                    userId={user?.id}
                    tokenCount={msg.tokenCount}
                    latencyMs={msg.latencyMs}
                    onEdit={handleEditMessage}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <ChatInput
              onSendMessage={handleSendMessage}
              onSendImage={handleSendImage}
              uploadsLeft={uploadsLeft}
              disabled={loading}
              mode={mode}
              onModeChange={setMode}
              proMaxUsesLeft={proMaxUsesLeft}
              proLiteUsesLeft={proLiteUsesLeft}
              isGuest={isGuest}
              guestAirUsesLeft={guestAirUsesLeft}
              guestBaseUsesLeft={guestBaseUsesLeft}
              tokenUsage={tokenUsageThisMinute}
              tokenLimit={TOKEN_LIMITS[mode]}
            />
          </>
        )}
      </div>
    </div>
  )
}

















