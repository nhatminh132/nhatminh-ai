import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import HelpModal from './HelpModal'
import SettingsModal from './SettingsModal'
import BookmarksPanel from './BookmarksPanel'
import NotesPanel from './NotesPanel'
import FlashcardsPanel from './FlashcardsPanel'

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
  isGuest = false,
  refreshTrigger
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
          <>
            {/* Logo at top */}
            <div className="p-4 border-b border-[#3f3f3f]">
              <div className="flex items-center gap-3">
                <img 
                  src="https://i.ibb.co/zW49H0zK/nminh.png" 
                  alt="Logo" 
                  className="w-10 h-10 rounded-full"
                />
                <h2 className="text-xl font-bold text-white">Nhat Minh AI</h2>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Welcome!</h3>
                <p className="text-sm text-gray-400">Sign in to unlock all features</p>
              </div>

              <button
                onClick={handleLogin}
                className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
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
          </>
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
  const [profileData, setProfileData] = useState({ display_name: '', username: '' })
  const [showPersonalize, setShowPersonalize] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showBookmarks, setShowBookmarks] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6')
  const [openMenuId, setOpenMenuId] = useState(null)
  const [chatToDelete, setChatToDelete] = useState(null)

  useEffect(() => {
    fetchChats()
    fetchFolders()
    loadProfile()
    
    const subscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversations',
          filter: `user_id=eq.${userId}`
        }, 
        () => {
          console.log('🔄 Conversation change detected, refreshing...')
          fetchChats()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId])

  // Refresh chats when a new chat is created
  useEffect(() => {
    if (refreshTrigger) {
      console.log('🔄 New chat detected, refreshing sidebar...')
      fetchChats()
    }
  }, [refreshTrigger])

  // Listen for custom refresh events (for title updates)
  useEffect(() => {
    const handleRefresh = () => {
      console.log('🔄 Custom refresh event received, updating sidebar...')
      fetchChats()
    }
    window.addEventListener('refreshSidebar', handleRefresh)
    return () => window.removeEventListener('refreshSidebar', handleRefresh)
  }, [])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) {
        setProfileData({
          display_name: data.display_name || '',
          username: data.username || ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          username: profileData.username
        })
        .eq('id', userId)

      if (error) throw error
      
      setShowProfileModal(false)
      alert('Profile updated successfully!')
      
      // Reload the page to update the welcome message
      window.location.reload()
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile: ' + error.message)
    }
  }

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

  const fetchFolders = async () => {
    if (!userId) return
    
    try {
      const { data, error } = await supabase
        .from('chat_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setFolders(data || [])
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const handleRenameChat = async (chatId, newTitle) => {
    if (!newTitle.trim()) {
      alert('Please enter a valid title')
      return
    }
    
    if (newTitle.trim().length > 100) {
      alert('Title is too long (max 100 characters)')
      return
    }
    
    try {
      const trimmedTitle = newTitle.trim()
      const { error } = await supabase
        .from('conversations')
        .update({ title: trimmedTitle })
        .eq('id', chatId)

      if (error) throw error

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: trimmedTitle } : chat
      ))
      setEditingChatId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Error renaming chat:', error)
      alert('Failed to rename conversation. Please try again.')
    }
  }

  const handleDeleteChat = async (chatId) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', chatId)

      if (error) throw error
      
      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatId))
      
      // If we deleted the current chat, start a new one
      if (currentChatId === chatId) {
        onNewChat()
      }
      
      setChatToDelete(null)
    } catch (error) {
      console.error('Error deleting chat:', error)
      alert('Failed to delete conversation. Please try again.')
    }
  }

  const handleTogglePin = async (chatId, e) => {
    e.stopPropagation()
    
    try {
      const chat = chats.find(c => c.id === chatId)
      const newPinState = !chat.is_pinned
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: newPinState })
        .eq('id', chatId)

      if (error) throw error
      
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, is_pinned: newPinState } : c
      ))
    } catch (error) {
      console.error('Error toggling pin:', error)
      alert('Failed to pin/unpin conversation.')
    }
  }

  const handleToggleArchive = async (chatId, e) => {
    e.stopPropagation()
    
    try {
      const chat = chats.find(c => c.id === chatId)
      const newArchiveState = !chat.is_archived
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: newArchiveState })
        .eq('id', chatId)

      if (error) throw error
      
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, is_archived: newArchiveState } : c
      ))
    } catch (error) {
      console.error('Error toggling archive:', error)
      alert('Failed to archive/unarchive conversation.')
    }
  }

  const renderChatItem = (chat) => (
    <div 
      key={chat.id} 
      className={`relative group rounded-lg mb-1 transition ${currentChatId === chat.id ? 'bg-[#3f3f3f]' : 'hover:bg-[#2f2f2f]'}`}
      onContextMenu={(e) => {
        e.preventDefault()
        setContextMenu({ chatId: chat.id, chatTitle: chat.title, x: e.clientX, y: e.clientY })
      }}
    >
      <button onClick={() => onSelectChat(chat)} className="w-full text-left px-3 py-2">
        <div className="text-sm text-white truncate pr-20 flex items-center gap-2">
          {chat.is_pinned && (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="text-yellow-500 flex-shrink-0" viewBox="0 0 16 16">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146"/>
            </svg>
          )}
          <span className="truncate">{chat.title}</span>
        </div>
      </button>
      
      {/* Menu button */}
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpenMenuId(openMenuId === chat.id ? null : chat.id)
          }}
          className="p-1.5 hover:bg-[#4a4a4a] rounded transition-colors"
          title="More options"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400 hover:text-white transition-colors" viewBox="0 0 16 16">
            <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {openMenuId === chat.id && (
        <div 
          className="absolute right-8 top-0 bg-[#2f2f2f] rounded-lg shadow-2xl border border-[#4a4a4a] py-1 z-50 min-w-[160px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              handleTogglePin(chat.id, e)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] text-white text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146"/>
            </svg>
            {chat.is_pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingChatId(chat.id)
              setEditingTitle(chat.title)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] text-white text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
            </svg>
            Rename
          </button>
          <button
            onClick={(e) => {
              handleToggleArchive(chat.id, e)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] text-white text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
            </svg>
            {chat.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <div className="border-t border-[#4a4a4a] my-1"></div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setChatToDelete(chat.id)
              setOpenMenuId(null)
            }}
            className="w-full text-left px-3 py-2 hover:bg-red-600/20 text-red-400 text-sm flex items-center gap-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  )

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

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArchive = showArchived ? chat.is_archived : !chat.is_archived
    const matchesFolder = selectedFolder ? chat.folder_id === selectedFolder : true
    return matchesSearch && matchesArchive && matchesFolder
  })

  // Separate pinned and unpinned chats
  const pinnedChats = filteredChats.filter(chat => chat.is_pinned)
  const unpinnedChats = filteredChats.filter(chat => !chat.is_pinned)

  const groupedChats = groupChatsByDate(unpinnedChats)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Close context menu when clicking anywhere
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null)
      setOpenMenuId(null)
    }
    if (contextMenu || openMenuId) {
      document.addEventListener('click', handleClick)
      return () => document.removeEventListener('click', handleClick)
    }
  }, [contextMenu, openMenuId])

  return (
    <>
      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => setChatToDelete(null)}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">Delete Conversation?</h3>
            <p className="text-sm text-gray-400 mb-6">This will delete "{chats.find(c => c.id === chatToDelete)?.title}". This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setChatToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteChat(chatToDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-[#2f2f2f] rounded-lg shadow-2xl border border-[#4a4a4a] py-2 z-50 min-w-[180px]"
          style={{ 
            left: `${contextMenu.x}px`, 
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              handleTogglePin(contextMenu.chatId, e)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-[#3f3f3f] text-white text-sm flex items-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146"/>
            </svg>
            {chats.find(c => c.id === contextMenu.chatId)?.is_pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            onClick={() => {
              setEditingChatId(contextMenu.chatId)
              setEditingTitle(contextMenu.chatTitle)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-[#3f3f3f] text-white text-sm flex items-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
            </svg>
            Rename
          </button>
          <button
            onClick={(e) => {
              handleToggleArchive(contextMenu.chatId, e)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-[#3f3f3f] text-white text-sm flex items-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
            </svg>
            {chats.find(c => c.id === contextMenu.chatId)?.is_archived ? 'Unarchive' : 'Archive'}
          </button>
          <div className="border-t border-[#4a4a4a] my-1"></div>
          <button
            onClick={(e) => {
              handleDeleteChat(contextMenu.chatId, e)
              setContextMenu(null)
            }}
            className="w-full text-left px-4 py-2 hover:bg-red-600/20 text-red-400 text-sm flex items-center gap-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
            </svg>
            Delete
          </button>
        </div>
      )}

      {/* Flashcards Panel */}
      {showFlashcards && <FlashcardsPanel userId={userId} onClose={() => setShowFlashcards(false)} />}

      {/* Notes Panel */}
      {showNotes && <NotesPanel userId={userId} onClose={() => setShowNotes(false)} />}

      {/* Bookmarks Panel */}
      {showBookmarks && <BookmarksPanel userId={userId} onClose={() => setShowBookmarks(false)} />}

      {/* Help Modal */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

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
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={() => { setEditingChatId(null); setEditingTitle('') }}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">Rename Conversation</h3>
            <p className="text-sm text-gray-400 mb-4">Give this conversation a memorable name</p>
            <div className="relative">
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameChat(editingChatId, editingTitle)
                  if (e.key === 'Escape') { setEditingChatId(null); setEditingTitle('') }
                }}
                maxLength={100}
                className="w-full px-4 py-3 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                placeholder="Enter conversation title..."
                autoFocus
              />
              <div className="text-xs text-gray-500 mb-4 text-right">
                {editingTitle.length}/100
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingChatId(null); setEditingTitle('') }}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRenameChat(editingChatId, editingTitle)}
                disabled={!editingTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
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
              
              <button 
                onClick={() => { setShowSettings(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] rounded-lg transition text-white text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
                </svg>
                Settings
              </button>
              
              <button 
                onClick={() => { setShowHelp(true); setShowUserMenu(false); }}
                className="w-full text-left px-3 py-2 hover:bg-[#3f3f3f] rounded-lg transition text-white text-sm flex items-center gap-2">
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
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
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
            <button onClick={() => window.location.href = '/study'} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Study Dashboard">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
              </svg>
              {!isMinimized && <span>Study Dashboard</span>}
            </button>

            <button onClick={onToggleGallery} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Gallery">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3"/>
                <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2M14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1M2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1z"/>
              </svg>
              {!isMinimized && <span>Gallery</span>}
            </button>
            <button onClick={() => setShowNotes(true)} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Notes">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h6a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h6a.5.5 0 0 1 0 1zm0 3a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1z"/>
              </svg>
              {!isMinimized && <span>Notes</span>}
            </button>
            <button onClick={() => setShowFlashcards(true)} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Flashcards">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5z"/>
              </svg>
              {!isMinimized && <span>Flashcards</span>}
            </button>
            <button onClick={() => setShowBookmarks(true)} className={`w-full hover:bg-[#2f2f2f] text-white px-3 py-2.5 rounded-lg transition flex items-center ${isMinimized ? 'justify-center' : 'gap-3'}`} title="Bookmarks">
              <svg xmlns="http://www.w3.org/2000/svg" className={`${isMinimized ? 'w-6 h-6' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5z"/>
              </svg>
              {!isMinimized && <span>Bookmarks</span>}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {!isMinimized && (
            <>
              {/* Archive toggle button */}
              <div className="mb-2">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#2f2f2f] rounded-lg transition flex items-center justify-between"
                >
                  <span>{showArchived ? 'Show Active' : 'Show Archived'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"/>
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="text-center text-gray-500 mt-4">Loading...</div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center text-gray-500 mt-4 text-sm">No chats yet</div>
              ) : (
                <>
                  {/* Pinned Chats */}
                  {pinnedChats.length > 0 && (
                    <>
                      <div className="text-xs text-gray-500 font-semibold px-3 py-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a6 6 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707s.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a6 6 0 0 1 1.013.16l3.134-3.133a3 3 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146"/>
                        </svg>
                        PINNED
                      </div>
                      {pinnedChats.map(chat => renderChatItem(chat))}
                    </>
                  )}

                  {/* Regular Chats */}
                  {unpinnedChats.length > 0 && pinnedChats.length > 0 && (
                    <div className="text-xs text-gray-500 font-semibold px-3 py-2 mt-2">CHATS</div>
                  )}
                  {unpinnedChats.map(chat => renderChatItem(chat))}
                </>
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




