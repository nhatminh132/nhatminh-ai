import React from 'react'

export default function PersonalizeModal({ onClose, personality = 'default', onPersonalityChange }) {
  const personalities = [
    { 
      id: 'default', 
      name: 'Default', 
      description: 'Balanced and educational',
      icon: '🎓'
    },
    { 
      id: 'professional', 
      name: 'Professional', 
      description: 'Formal and precise',
      icon: '💼'
    },
    { 
      id: 'casual', 
      name: 'Casual', 
      description: 'Friendly and relaxed',
      icon: '😊'
    },
    { 
      id: 'eli5', 
      name: 'ELI5', 
      description: 'Explain Like I\'m 5 - Simple explanations',
      icon: '🧒'
    },
    { 
      id: 'concise', 
      name: 'Concise', 
      description: 'Brief and to the point',
      icon: '⚡'
    },
    { 
      id: 'detailed', 
      name: 'Detailed', 
      description: 'Thorough explanations with examples',
      icon: '📚'
    },
    { 
      id: 'socratic', 
      name: 'Socratic', 
      description: 'Guides you with questions',
      icon: '🤔'
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[#4a4a4a]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Personalize</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* AI Personality */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">AI Personality</h4>
            <p className="text-sm text-gray-400 mb-4">Choose how the AI responds to you</p>
            <div className="grid grid-cols-1 gap-2">
              {personalities.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPersonalityChange(p.id)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    personality === p.id
                      ? 'bg-blue-600/20 border-blue-500 shadow-lg'
                      : 'bg-[#2a2a2a] border-[#3f3f3f] hover:bg-[#333] hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white flex items-center gap-2">
                        {p.name}
                        {personality === p.id && (
                          <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
