import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ChatHistory({ userId, searchQuery, onClose, onLoadChat }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [userId])

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-gray-900 border-r border-gray-700 overflow-hidden flex flex-col z-40">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Chat History</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
          </button>
        </div>
        
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onLoadChat({ searchQuery: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm
                   focus:ring-2 focus:ring-gray-600 focus:border-transparent placeholder-gray-500"
        />
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="mx-auto mb-2 text-gray-600" viewBox="0 0 16 16">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
            </svg>
            <p className="text-gray-400 text-sm">
              {searchQuery ? 'No results found' : 'No chat history yet'}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <button
              key={item.id}
              onClick={() => onLoadChat(item)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition mb-2 border border-gray-800 hover:border-gray-700"
            >
              <div className="text-xs text-gray-500 mb-1">
                {new Date(item.created_at).toLocaleString()}
              </div>
              <div className="text-sm text-white font-medium mb-1 truncate">
                {item.question}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {item.answer.substring(0, 60)}...
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {item.model_used}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}


