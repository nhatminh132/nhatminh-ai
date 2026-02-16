import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SidebarChatGPT({ 
  userId, 
  currentChatId, 
  onNewChat, 
  onSelectChat, 
  isMinimized, 
  onToggleMinimize, 
  userEmail, 
  uploadsLeft, 
  onToggleGallery,
  isGuest = false
}) {
  // Guest mode - show only auth buttons
  if (isGuest) {
    const handleLogin = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      })
      if (error) {
        console.error('Login error:', error)
        alert('Login failed: ' + error.message)
      }
    }

    return (
      <div className={`bg-[#171717] h-screen flex flex-col transition-all duration-300 ${isMinimized ? 'w-0' : 'w-64'} border-r border-[#3f3f3f]`}>
        {!isMinimized && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Welcome to Nhat Minh AI</h3>
              <p className="text-sm text-gray-400">Sign in to unlock all features</p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
              Sign In
            </button>

            <button
              onClick={handleLogin}
              className="w-full px-4 py-3 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors"
            >
              Sign Up
            </button>

            <div className="mt-8 pt-8 border-t border-gray-700 w-full">
              <div className="text-xs text-gray-500 space-y-2">
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Unlimited AI access
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Save chat history
                </p>
                <p className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All AI models
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({ display_name: '', username: '', avatar_url: '' })
  const [showPersonalize, setShowPersonalize] = useState(false)

  useEffect(() => {
    fetchChats()
    
    const subscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        }, 
        () => fetchChats()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId])

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setChats(data || [])
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRenameChat = async (chatId, newTitle) => {
    if (!newTitle.trim()) return
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', chatId)

      if (error) throw error

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      ))
      setEditingChatId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Error renaming chat:', error)
    }
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    if (!confirm('Delete this conversation?')) return
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', chatId)

      if (error) throw error
      setChats(prev => prev.filter(chat => chat.id !== chatId))
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const groupChatsByDate = (chats) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    return {
      today: chats.filter(c => new Date(c.created_at) >= today),
      yesterday: chats.filter(c => {
        const date = new Date(c.created_at)
        return date >= yesterday && date < today
      }),
      lastWeek: chats.filter(c => {
        const date = new Date(c.created_at)
        return date >= lastWeek && date < yesterday
      }),
      older: chats.filter(c => new Date(c.created_at) < lastWeek)
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedChats = groupChatsByDate(filteredChats)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Personalize Modal */}
      {showPersonalize && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setShowPersonalize(false)}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-2xl w-full border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-6">Personalize</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Style</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Font Size</label>
                    <select className="w-full px-3 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white">
                      <option>Small</option>
                      <option selected>Medium</option>
                      <option>Large</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Features</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm text-gray-300">Enable Streaming Responses</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-sm text-gray-300">Show Markdown Formatting</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm text-gray-300">Enable Sound Notifications</span>
                  </label>
                </div>
              </div>
              

            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowPersonalize(false)} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition">
                Cancel
              </button>
              <button onClick={() => setShowPersonalize(false)} className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {editingChatId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-xl font-bold text-white mb-4">Rename Chat</h3>
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameChat(editingChatId, editingTitle)
                if (e.key === 'Escape') { setEditingChatId(null); setEditingTitle('') }
              }}
              className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white mb-4 focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingChatId(null); setEditingTitle('') }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRenameChat(editingChatId, editingTitle)}
                className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setShowSearchModal(false)}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-2xl w-full border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Search Conversations</h3>
            <div className="relative mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="absolute left-3 top-2.5 text-gray-400" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat)
                    setShowSearchModal(false)
                    setSearchQuery('')
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[#3f3f3f] rounded-lg transition text-white mb-2"
                >
                  <div className="font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(chat.created_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Menu - Appears above user button */}
      {showUserMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
          <div className={`absolute ${isMinimized ? 'bottom-14 left-1' : 'bottom-14 left-3'} bg-[#2f2f2f] rounded-lg p-4 w-56 border border-[#4a4a4a] shadow-2xl z-50`}>
            <div className="space-y-1">
              <button 
                onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] rounded-lg transition text-white text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                  <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                </svg>
                Profile
              </button>
              
              <button 
                onClick={() => { setShowPersonalize(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] rounded-lg transition text-white text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/>
                  <path d="M14.247 14.269c1.01 0 1.587-.857 1.587-2.025v-.21C15.834 10.43 14.64 9 12.52 9h-.035C10.42 9 9 10.36 9 12.432v.214C9 14.82 10.438 16 12.358 16h.044c.594 0 1.018-.074 1.237-.175v-.73c-.245.11-.673.18-1.18.18h-.044c-1.334 0-2.571-.788-2.571-2.655v-.157c0-1.657 1.058-2.724 2.64-2.724h.04c1.535 0 2.484 1.05 2.484 2.326v.118c0 .975-.324 1.39-.639 1.39-.232 0-.41-.148-.41-.42v-2.19h-.906v.569h-.03c-.084-.298-.368-.63-.954-.63-.778 0-1.259.555-1.259 1.4v.528c0 .892.49 1.434 1.26 1.434.471 0 .896-.227 1.014-.643h.043c.118.42.617.648 1.12.648m-2.453-1.588v-.227c0-.546.227-.791.573-.791.297 0 .572.192.572.708v.367c0 .573-.253.744-.564.744-.354 0-.581-.215-.581-.8Z"/>
                </svg>
                Personalize
              </button>
              
              <button className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] rounded-lg transition text-white text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                </svg>
                Settings
              </button>
              
              <button className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] rounded-lg transition text-white text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                </svg>
                Help
              </button>
              
              <div className="border-t border-gray-700 my-2"></div>
              
              <button onClick={handleSignOut} className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] rounded-lg transition text-red-400 text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                  <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-xl font-bold text-white mb-6">Edit Profile</h3>
            
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  userEmail?.charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Display Name</label>
                <input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Avatar URL</label>
                <input
                  type="text"
                  value={profileData.avatar_url}
                  onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                  className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}


      <div className={`${isMinimized ? 'w-16' : 'w-64'} bg-[#212121] h-screen flex flex-col transition-[width] duration-300 border-r border-[#3f3f3f]`}>
        {/* Header with Logo */}
        <div className="p-4 border-b border-[#3f3f3f]">
          <div className="flex justify-center mb-3">
            <img
              src="https://i.ibb.co/fdtpDM1c/nminh-white-nobg.png"
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={onNewChat} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="New Chat">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
              </svg>
              {!isMinimized && <span>New Chat</span>}
            </button>
            <button onClick={() => setShowSearchModal(true)} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Search">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/>
              </svg>
              {!isMinimized && <span>Search</span>}
            </button>
            <button onClick={onToggleGallery} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Gallery">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
                <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2M14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1M2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1z"/>
              </svg>
              {!isMinimized && <span>Gallery</span>}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {!isMinimized && (
            <>
              {loading ? (
                <div className="text-center text-gray-500 mt-4">Loading...</div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center text-gray-500 mt-4 text-sm">No chats yet</div>
              ) : (
                filteredChats.map(chat => (
                  <button key={chat.id} onClick={() => onSelectChat(chat)} className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition ${currentChatId === chat.id ? 'bg-[#3f3f3f]' : 'hover:bg-[#2f2f2f]'}`}>
                    <div className="text-sm text-white truncate">{chat.title}</div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
        <div className="border-t border-[#3f3f3f] p-3 relative">
          <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full p-2 hover:bg-[#2f2f2f] rounded-lg transition flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {userEmail?.charAt(0).toUpperCase()}
            </div>
            {!isMinimized && (
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm text-white font-medium truncate">{userEmail?.split('@')[0]}</div>
                <div className="text-xs text-gray-400 truncate">{userEmail}</div>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  )
}




