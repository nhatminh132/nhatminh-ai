import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function FlashcardsPanel({ userId, onClose }) {
  const [decks, setDecks] = useState([])
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [flashcards, setFlashcards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showStudyMode, setShowStudyMode] = useState(false)
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [showNewCard, setShowNewCard] = useState(false)

  useEffect(() => {
    if (userId) {
      loadDecks()
    }
  }, [userId])

  const loadDecks = async () => {
    try {
      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDecks(data || [])
    } catch (error) {
      console.error('Error loading decks:', error)
    }
  }

  const loadFlashcards = async (deckId) => {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at')

      if (error) throw error
      setFlashcards(data || [])
    } catch (error) {
      console.error('Error loading flashcards:', error)
    }
  }

  const handleCreateDeck = async (name, topicId) => {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .insert({ user_id: userId, name, topic_id: topicId })

      if (error) throw error
      loadDecks()
      setShowNewDeck(false)
    } catch (error) {
      console.error('Error creating deck:', error)
    }
  }

  const handleCreateCard = async (front, back) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .insert({ deck_id: selectedDeck.id, front, back })

      if (error) throw error
      loadFlashcards(selectedDeck.id)
      setShowNewCard(false)
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleDeleteDeck = async (deckId) => {
    if (!confirm('Delete this deck and all its cards?')) return
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', deckId)

      if (error) throw error
      setDecks(decks.filter(d => d.id !== deckId))
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(null)
        setShowStudyMode(false)
      }
    } catch (error) {
      console.error('Error deleting deck:', error)
    }
  }

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Delete this card?')) return
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)

      if (error) throw error
      setFlashcards(flashcards.filter(c => c.id !== cardId))
    } catch (error) {
      console.error('Error deleting card:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-[#2f2f2f] rounded-lg w-full max-w-4xl h-[90vh] flex flex-col border border-[#4a4a4a]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#4a4a4a]">
          <h2 className="text-2xl font-bold text-white">Flashcards</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedDeck ? (
            /* Deck List View */
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Your Decks</h3>
                <button
                  onClick={() => setShowNewDeck(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  + New Deck
                </button>
              </div>

              {decks.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No flashcard decks yet. Create your first deck!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {decks.map(deck => (
                    <div key={deck.id} className="bg-[#212121] p-4 rounded-lg border border-[#4a4a4a] hover:border-blue-500 transition">
                      <h4 className="text-white font-semibold mb-2">{deck.name}</h4>
                      <p className="text-sm text-gray-400 mb-4">0 cards</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedDeck(deck); loadFlashcards(deck.id); }}
                          className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
                        >
                          View Cards
                        </button>
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !showStudyMode ? (
            /* Card List View */
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedDeck(null)} className="text-gray-400 hover:text-white">
                    ← Back
                  </button>
                  <h3 className="text-lg font-semibold text-white">{selectedDeck.name}</h3>
                </div>
                <div className="flex gap-2">
                  {flashcards.length > 0 && (
                    <button
                      onClick={() => { setShowStudyMode(true); setCurrentCardIndex(0); setIsFlipped(false); }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      Study
                    </button>
                  )}
                  <button
                    onClick={() => setShowNewCard(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    + New Card
                  </button>
                </div>
              </div>

              {flashcards.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No cards yet. Add your first flashcard!
                </div>
              ) : (
                <div className="space-y-3">
                  {flashcards.map(card => (
                    <div key={card.id} className="bg-[#212121] p-4 rounded-lg border border-[#4a4a4a]">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-white font-medium mb-2">{card.front}</div>
                          <div className="text-gray-400 text-sm">{card.back}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-red-500 hover:text-red-400 ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Study Mode */
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-6 text-gray-400">
                Card {currentCardIndex + 1} of {flashcards.length}
              </div>

              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-2xl h-96 cursor-pointer perspective-1000"
              >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  <div className="absolute w-full h-full backface-hidden bg-blue-600 rounded-lg p-8 flex items-center justify-center text-white text-2xl text-center">
                    {flashcards[currentCardIndex]?.front}
                  </div>
                  <div className="absolute w-full h-full backface-hidden bg-green-600 rounded-lg p-8 flex items-center justify-center text-white text-xl text-center rotate-y-180">
                    {flashcards[currentCardIndex]?.back}
                  </div>
                </div>
              </div>

              <div className="mt-6 text-sm text-gray-400">Click card to flip</div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    if (currentCardIndex > 0) {
                      setCurrentCardIndex(currentCardIndex - 1)
                      setIsFlipped(false)
                    }
                  }}
                  disabled={currentCardIndex === 0}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setShowStudyMode(false)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Exit Study
                </button>
                <button
                  onClick={() => {
                    if (currentCardIndex < flashcards.length - 1) {
                      setCurrentCardIndex(currentCardIndex + 1)
                      setIsFlipped(false)
                    }
                  }}
                  disabled={currentCardIndex === flashcards.length - 1}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Deck Modal */}
      {showNewDeck && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-xl font-bold text-white mb-4">New Deck</h3>
            <input
              type="text"
              placeholder="Deck name"
              className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateDeck(e.target.value, null)
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewDeck(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  const input = e.target.parentElement.previousElementSibling
                  handleCreateDeck(input.value, null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Card Modal */}
      {showNewCard && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60 flex items-center justify-center p-4">
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md w-full border border-[#4a4a4a]">
            <h3 className="text-xl font-bold text-white mb-4">New Card</h3>
            <input
              id="card-front"
              type="text"
              placeholder="Front (Question)"
              className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white mb-3"
            />
            <textarea
              id="card-back"
              placeholder="Back (Answer)"
              rows="4"
              className="w-full px-4 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNewCard(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const front = document.getElementById('card-front').value
                  const back = document.getElementById('card-back').value
                  if (front && back) handleCreateCard(front, back)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
