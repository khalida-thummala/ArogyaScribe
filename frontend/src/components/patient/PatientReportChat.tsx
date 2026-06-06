import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, Loader2 } from 'lucide-react'
import { apiClient } from '@/api/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface PatientReportChatProps {
  reportId: string
}

export default function PatientReportChat({ reportId }: PatientReportChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI health assistant. Do you have any questions about this report? I can explain medical terms, medications, or the doctor's plan in simple words.",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load history on mount
    apiClient.get(`/patient/reports/${reportId}/chat`)
      .then(res => {
        if (res.data && res.data.length > 0) {
          setMessages(res.data)
        }
      })
      .catch(err => console.error("Failed to load chat history:", err))
  }, [reportId])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const response = await apiClient.post(`/patient/reports/${reportId}/chat`, {
        question: userMsg.content,
      })

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.answer,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while trying to answer your question. Please try again later.",
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-transform duration-300 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 text-white" style={{ background: 'linear-gradient(135deg, #0d9488, #14b8a6)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">AI Assistant</h3>
              <p className="text-xs text-teal-100">Ask about your report</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {/* For assistant messages, we might have paragraphs. Simple split by newline. */}
                {msg.role === 'assistant' ? (
                  msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">
                      {line}
                    </p>
                  ))
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 shadow-sm">
                <Loader2 size={16} className="animate-spin text-teal-600" />
                <span className="text-xs text-gray-500 font-medium">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="w-full pl-4 pr-12 py-3 bg-gray-100/50 hover:bg-gray-100 focus:bg-white border border-gray-200 focus:border-teal-500 rounded-full text-sm outline-none transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white rounded-full transition-colors"
            >
              <Send size={16} className="ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
