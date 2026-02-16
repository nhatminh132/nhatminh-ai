import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function StudyDashboard({ user }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    notesCount: 0,
    bookmarksCount: 0,
    flashcardsCount: 0,
    recentNotes: [],
    recentBookmarks: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)

      // Load notes count and recent notes
      const { data: notes, error: notesError } = await supabase
        .from('study_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Load bookmarks count and recent bookmarks
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Load flashcards count
      const { data: flashcards, error: flashcardsError } = await supabase
        .from('flashcards')
        .select('deck_name')
        .eq('user_id', user.id)

      const uniqueDecks = flashcards ? [...new Set(flashcards.map(f => f.deck_name))] : []

      setStats({
        notesCount: notes?.length || 0,
        bookmarksCount: bookmarks?.length || 0,
        flashcardsCount: uniqueDecks.length,
        recentNotes: notes || [],
        recentBookmarks: bookmarks || []
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#212121] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">📚 Study Dashboard</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            ← Back to Chat
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading your study data...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm">Total Notes</h3>
                  <span className="text-3xl">📝</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stats.notesCount}</div>
                <div className="text-sm text-gray-500">Organized study notes</div>
              </div>

              <div className="bg-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm">Bookmarks</h3>
                  <span className="text-3xl">🔖</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stats.bookmarksCount}</div>
                <div className="text-sm text-gray-500">Saved AI responses</div>
              </div>

              <div className="bg-[#2a2a2a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm">Flashcard Decks</h3>
                  <span className="text-3xl">📇</span>
                </div>
                <div className="text-4xl font-bold text-white mb-2">{stats.flashcardsCount}</div>
                <div className="text-sm text-gray-500">Ready for review</div>
              </div>
            </div>

            {/* Recent Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Notes */}
              <div className="bg-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">📝 Recent Notes</h3>
                {stats.recentNotes.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No notes yet</div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentNotes.map(note => (
                      <div key={note.id} className="bg-[#1f1f1f] rounded-lg p-4">
                        <div className="font-medium text-white mb-1">{note.title}</div>
                        <div className="text-sm text-gray-400 line-clamp-2">{note.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Bookmarks */}
              <div className="bg-[#2a2a2a] rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">🔖 Recent Bookmarks</h3>
                {stats.recentBookmarks.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No bookmarks yet</div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentBookmarks.map(bookmark => (
                      <div key={bookmark.id} className="bg-[#1f1f1f] rounded-lg p-4">
                        <div className="text-sm text-gray-300 line-clamp-3">{bookmark.message_text}</div>
                        {bookmark.note && (
                          <div className="text-xs text-blue-400 mt-2">Note: {bookmark.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
