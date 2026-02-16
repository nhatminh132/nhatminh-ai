import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PornhubTroll() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate('/')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center max-w-2xl px-6">
        <div className="mb-8">
          <div className="text-6xl mb-4">🔞</div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: '#FFA500' }}>
            Pornhub
          </h1>
          <p className="text-xl text-gray-300">Premium Authentication</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 mb-6 border-2 border-orange-500">
          <div className="text-8xl mb-6">😂</div>
          <h2 className="text-3xl font-bold mb-4">HAHA! GOT YOU!</h2>
          <p className="text-lg text-gray-300 mb-4">
            Did you really think we had Pornhub authentication? 
          </p>
          <p className="text-sm text-gray-400">
            This is a study app, not a... well, you know. 😅
          </p>
        </div>

        <div className="text-center">
          <p className="text-lg mb-4">
            Redirecting you back to real login in{' '}
            <span className="text-orange-500 font-bold text-2xl">{countdown}</span> seconds...
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg
                     transition duration-200 transform hover:scale-105"
          >
            Go Back Now
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Pro tip: Use Google, GitHub, or email to sign in instead! 🎓</p>
        </div>
      </div>
    </div>
  )
}


