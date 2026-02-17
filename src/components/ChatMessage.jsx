import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BookmarkButton from './BookmarkButton'

export default function ChatMessage({ message, isUser, model, isStreaming, messageIndex, conversationId, userId, tokenCount, latencyMs, onEdit }) {
  const [showLinkWarning, setShowLinkWarning] = useState(false)
  const [pendingLink, setPendingLink] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message)

  const handleLinkClick = (e) => {
    if (!isUser) {
      e.preventDefault()
      setPendingLink(e.currentTarget.href)
      setShowLinkWarning(true)
    }
  }

  const confirmOpenLink = () => {
    window.open(pendingLink, '_blank', 'noopener,noreferrer')
    setShowLinkWarning(false)
    setPendingLink('')
  }

  const cancelOpenLink = () => {
    setShowLinkWarning(false)
    setPendingLink('')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    if (editedMessage.trim() && editedMessage !== message) {
      onEdit?.(editedMessage, messageIndex)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedMessage(message)
    setIsEditing(false)
  }

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div
          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-[#2f2f2f] text-white'
              : 'text-gray-300'
          }`}
        >
          {!isUser && model && (
            <div className="text-xs font-semibold mb-2 opacity-70 flex items-center gap-1 whitespace-nowrap">
              {isStreaming ? (
                <>
                  <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  <span>Using {model}</span>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>Used {model}</span>
                </>
              )}
            </div>
          )}
          <div className="prose prose-sm prose-invert max-w-none break-words overflow-wrap-anywhere">
            {isUser ? (
              isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editedMessage}
                    onChange={(e) => setEditedMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f1f1f] text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                    >
                      Send Edited
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="m-0 whitespace-pre-wrap">{message}</p>
              )
            ) : (
                <>
                  <style>{`
                    .prose table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 1em 0;
                    }
                    .prose th {
                      background-color: #3f3f3f;
                      border: 1px solid #666;
                      padding: 0.75rem;
                      text-align: left;
                      font-weight: bold;
                    }
                    .prose td {
                      border: 1px solid #666;
                      padding: 0.75rem;
                    }
                    .prose tr:nth-child(even) {
                      background-color: #2a2a2a;
                    }
                  `}</style>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => (
                        <a {...props} onClick={handleLinkClick} className="text-blue-400 hover:underline cursor-pointer" />
                      )
                    }}
                  >
                    {message}
                  </ReactMarkdown>
                </>
              )}
          </div>
          
          {/* Metadata for AI messages */}
          {!isUser && !isStreaming && (tokenCount || latencyMs) && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {tokenCount && (
                <div className="flex items-center gap-1" title="Approximate token count">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5z"/>
                  </svg>
                  <span>{tokenCount.toLocaleString()} tokens</span>
                </div>
              )}
              {latencyMs && (
                <div className="flex items-center gap-1" title="Response time">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
                  </svg>
                  <span>{(latencyMs / 1000).toFixed(2)}s</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons for User messages */}
          {isUser && !isEditing && (
            <div className="flex items-center gap-2 mt-2 ml-2">
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 transition"
                title="Edit and resend"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
                </svg>
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(message)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 transition"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                </svg>
              </button>
            </div>
          )}

          {/* Action Buttons for AI messages */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-2 mt-2 ml-2">
              <BookmarkButton
                messageText={message}
                messageIndex={messageIndex}
                conversationId={conversationId}
                userId={userId}
                isBookmarked={false}
              />
              <button
                onClick={() => navigator.clipboard.writeText(message)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 transition"
                title="Copy to clipboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Warning Modal */}
      {showLinkWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={cancelOpenLink}>
          <div className="bg-[#2f2f2f] rounded-lg p-6 max-w-md mx-4 border border-[#3f3f3f]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-3">⚠️ AI-Generated Link Warning</h3>
            <p className="text-gray-300 mb-4">
              This link was generated by AI and may not be accurate or safe. Please verify the destination before proceeding.
            </p>
            <p className="text-sm text-gray-400 mb-4 break-all">
              <strong>URL:</strong> {pendingLink}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelOpenLink}
                className="px-4 py-2 bg-[#3f3f3f] hover:bg-[#4f4f4f] text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmOpenLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Open Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}



