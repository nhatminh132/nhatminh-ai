import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function BookmarksPanel({ userId, onClose }) {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (userId) {
      loadBookmarks()
    }
  }, [userId])

  const loadBookmarks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookmarks(data || [])
    } catch (error) {
      console.error('Error loading bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (bookmarkId) => {
    if (!confirm('Delete this bookmark?')) return

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)

      if (error) throw error
      setBookmarks(bookmarks.filter(b => b.id !== bookmarkId))
    } catch (error) {
      console.error('Error deleting bookmark:', error)
      alert('Failed to delete bookmark')
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const filteredBookmarks = bookmarks.filter(b =>
    b.message_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.personal_note && b.personal_note.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2f2f2f] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#4a4a4a]">
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="text-yellow-400" viewBox="0 0 16 16">
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
            </svg>
            <h2 className="text-2xl font-bold text-white">My Bookmarks</h2>
            <span className="text-gray-400 text-sm">({filteredBookmarks.length})</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#4a4a4a]">
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Bookmarks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading bookmarks...</div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {searchQuery ? 'No bookmarks found' : 'No bookmarks yet. Start bookmarking AI responses!'}
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-[#212121] rounded-lg p-4 border border-[#4a4a4a]">
                {/* Message */}
                <div className="text-white mb-3 prose prose-invert max-w-none">
                  {bookmark.message_text}
                </div>

                {/* Personal Note */}
                {bookmark.personal_note && (
                  <div className="bg-[#2f2f2f] border-l-4 border-blue-500 p-3 mb-3 rounded">
                    <div className="text-xs text-gray-400 mb-1">Your Note:</div>
                    <div className="text-gray-300 text-sm">{bookmark.personal_note}</div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#4a4a4a]">
                  <div className="text-xs text-gray-500">
                    {new Date(bookmark.created_at).toLocaleDateString()} at {new Date(bookmark.created_at).toLocaleTimeString()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(bookmark.message_text)}
                      className="px-3 py-1 bg-[#3f3f3f] hover:bg-[#4a4a4a] text-white rounded text-sm transition"
                      title="Copy"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={() => handleDelete(bookmark.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
                      title="Delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
