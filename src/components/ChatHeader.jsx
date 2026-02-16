import React from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ChatHeader({ onToggleSidebar, sidebarMinimized, isTemporaryChat, onToggleTemporaryChat, isGuest = false }) {
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
    <header className="bg-[#212121] border-b border-[#3f3f3f] p-4">
      <div className="w-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-[#2f2f2f] hover:bg-[#3f3f3f] transition text-white"
            title={sidebarMinimized ? 'Expand sidebar' : 'Minimize sidebar'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/>
            </svg>
          </button>

          <h1 className="text-2xl font-bold text-white">
            Nhat Minh AI
          </h1>

          {/* Guest Auth Buttons */}
          {isGuest && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm"
              >
                Sign In
              </button>
              <button
                onClick={handleLogin}
                className="px-4 py-2 rounded-lg bg-white hover:bg-gray-100 text-gray-900 font-medium transition-colors text-sm"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Temporary Chat Toggle Button */}
        {!isGuest && onToggleTemporaryChat && (
          <button
            onClick={onToggleTemporaryChat}
            className={`p-2 rounded-lg transition ${
              isTemporaryChat 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white'
            }`}
            title={isTemporaryChat ? 'Exit temporary chat' : 'Start temporary chat'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
