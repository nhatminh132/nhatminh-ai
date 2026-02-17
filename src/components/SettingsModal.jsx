import React from 'react'

export default function SettingsModal({ onClose, personality = 'default', onPersonalityChange }) {
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
          <h3 className="text-2xl font-bold text-white">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Appearance</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Theme</label>
                <select className="w-full px-3 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Font Size</label>
                <select className="w-full px-3 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white">
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Language</h4>
            <select className="w-full px-3 py-2 bg-[#212121] border border-[#4a4a4a] rounded-lg text-white">
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>

          {/* Notifications */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Notifications</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Enable sound notifications</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Desktop notifications</span>
              </label>
            </div>
          </div>

          {/* Personalization */}
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

          {/* Data & Privacy */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Data & Privacy</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                <span className="text-sm text-gray-300">Save chat history</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm text-gray-300">Allow data for model improvement</span>
              </label>
            </div>
          </div>

          {/* Token Limits Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-3">Token Limits (TPM)</h4>
            <div className="bg-[#212121] rounded-lg p-4 border border-[#4a4a4a] space-y-3">
              <p className="text-xs text-gray-400 mb-3">
                TPM = Tokens Per Minute. Rate limits are enforced by the API provider to ensure fair usage.
              </p>
              
              {/* Air Mode */}
              <div className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded">
                <div>
                  <div className="text-sm font-medium text-blue-400">Air Mode</div>
                  <div className="text-xs text-gray-500">Lightweight models</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">6,000 TPM</div>
                </div>
              </div>

              {/* Base Mode */}
              <div className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded">
                <div>
                  <div className="text-sm font-medium text-green-400">Base Mode</div>
                  <div className="text-xs text-gray-500">Balanced models</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">30,000 TPM</div>
                </div>
              </div>

              {/* Pro Mode */}
              <div className="flex items-center justify-between p-2 bg-[#2a2a2a] rounded">
                <div>
                  <div className="text-sm font-medium text-purple-400">Pro Mode</div>
                  <div className="text-xs text-gray-500">Advanced models</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-white">30,000 TPM</div>
                </div>
              </div>

              <div className="mt-3 p-3 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded">
                <p className="text-xs text-gray-300">
                  💡 <strong>Tip:</strong> If you hit a rate limit, wait ~1 minute or switch to a different mode to continue chatting.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition">
            Close
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-white hover:bg-gray-200 text-black rounded-lg transition font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
