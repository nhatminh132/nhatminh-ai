import React, { useState, useEffect } from 'react'

export default function BetaCodeBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if current date is within promotion period (16/2/2026 - 20/3/2026)
    const now = new Date()
    const startDate = new Date('2026-02-16')
    const endDate = new Date('2026-03-20')

    if (now >= startDate && now <= endDate) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-bold">Limited Time Offer!</p>
            <p className="text-sm">Use code <span className="bg-white text-purple-600 px-2 py-0.5 rounded font-mono font-bold">BETA</span> for 5 days of unlimited access! Valid until March 20, 2026.</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-4 text-white hover:text-gray-200 transition"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
