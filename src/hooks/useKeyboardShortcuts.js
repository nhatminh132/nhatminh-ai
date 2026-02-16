import { useEffect } from 'react'

export default function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const alt = e.altKey

      shortcuts.forEach(shortcut => {
        const match = 
          shortcut.key === key &&
          shortcut.ctrl === ctrl &&
          shortcut.shift === shift &&
          (shortcut.alt === undefined || shortcut.alt === alt)

        if (match) {
          e.preventDefault()
          shortcut.action()
        }
      })
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [shortcuts])
}
