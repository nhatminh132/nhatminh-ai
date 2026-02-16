import React from 'react'

export default function KeyboardShortcutsHelp({ onClose }) {
  const shortcuts = [
    { category: 'Chat', items: [
      { keys: 'Ctrl + N', description: 'New chat' },
      { keys: 'Ctrl + K', description: 'Toggle sidebar' },
      { keys: 'Ctrl + /', description: 'Focus message input' },
      { keys: 'Ctrl + Enter', description: 'Send message' }
    ]},
    { category: 'Study Tools', items: [
      { keys: 'Ctrl + B', description: 'Open Bookmarks' },
      { keys: 'Ctrl + E', description: 'Open Notes' },
      { keys: 'Ctrl + F', description: 'Open Flashcards' },
      { keys: 'Ctrl + D', description: 'Study Dashboard' }
    ]},
    { category: 'Navigation', items: [
      { keys: 'Esc', description: 'Close modal/panel' },
      { keys: '?', description: 'Show this help' }
    ]}
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2a2a] rounded-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="space-y-6">
          {shortcuts.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 px-4 bg-[#1f1f1f] rounded-lg">
                    <span className="text-gray-300">{item.description}</span>
                    <kbd className="px-3 py-1 bg-gray-700 text-white rounded text-sm font-mono">{item.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          Press <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-xs">?</kbd> anytime to see shortcuts
        </div>
      </div>
    </div>
  )
}
