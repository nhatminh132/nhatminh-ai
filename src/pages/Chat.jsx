import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { routeAIRequest, callGeminiVision } from '../lib/aiRouter'
import ChatHeader from '../components/ChatHeader'
import ChatMessage from '../components/ChatMessage'
import ChatInput from '../components/ChatInput'
import SidebarChatGPT from '../components/SidebarChatGPT'
import Gallery from '../components/Gallery'
import LoginPopup from '../components/LoginPopup'

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
      
      // Force guest to use only Air or Base mode
      if (mode !== 'air' && mode !== 'base') {
        setMode('base')
      }
    } else {
      loadProfile()
    }
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
    setWelcomeMessage(randomMessage)
  }, [user])


  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('uploads_left, pro_max_uses_left, pro_max_last_reset, pro_lite_uses_left, pro_lite_last_reset, display_name')
        .eq('id', user.id)
        .single()

      if (error) throw error
      if (data) {
        setUploadsLeft(data.uploads_left)
        
        // Set user name from display_name or email
        const name = data.display_name || user.email?.split('@')[0] || 'there'
        setUserName(name)
        
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
            { text: msg.answer, isUser: false, model: msg.model_used }
          ])
          setMessages(formattedMessages)
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const saveChatHistory = async (question, answer, modelUsed) => {
    try {
      // If no current chat, create a new conversation
      if (!currentChatId) {
        // Generate title from first message (max 60 chars)
        const title = question.length > 60 ? question.substring(0, 57) + '...' : question
        
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: title,
          })
          .select()
          .single()

        if (convError) throw convError
        
        // Set the current chat ID
        setCurrentChatId(convData.id)
        
        // Now insert the message
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: convData.id,
            question,
            answer,
            model_used: modelUsed,
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
          })

        if (error) throw error
      }
    } catch (error) {
      console.error('Error saving chat history:', error)
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
        { text: msg.answer, isUser: false, model: msg.model_used }
      ])
      
      setMessages(chatMessages)
      setCurrentChatId(chat.id)
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleSendMessage = async (message) => {
    if (loading) return

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

    // Add user message
    setMessages(prev => [...prev, { text: message, isUser: true, model: null }])
    setLoading(true)

    // Add placeholder for AI response with "Using..." status
    const aiMessageIndex = messages.length + 1
    setMessages(prev => [...prev, { text: '', isUser: false, model: null, isStreaming: true }])

    try {
      let fullResponse = ''
      let currentModel = ''
      
      const { text, model } = await routeAIRequest(message, (chunk, streamModel) => {
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

      // Update with final response and model - mark streaming as complete
      setMessages(prev => {
        const newMessages = [...prev]
        newMessages[aiMessageIndex] = { 
          text, 
          isUser: false, 
          model,
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
          await saveChatHistory(message, text, model)
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

  return (
    <div className="flex h-screen bg-[#212121]">
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
            />
          </>
        )}
      </div>
    </div>
  )
}

















