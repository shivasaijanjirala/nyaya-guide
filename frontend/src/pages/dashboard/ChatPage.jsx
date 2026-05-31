import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Send, Loader2, Scale, AlertTriangle, CheckCircle, Info,
    BookOpen, User, History, Trash2, Search, Plus, X,
    ChevronLeft, Clock, MessageSquare, ArrowLeft
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'
import { VoiceMicButton, SpeakButton } from '../../components/VoiceButton'

/**
 * AI Legal Chat Page — with History Sidebar
 *
 * Layout:
 * ┌─────────────┬──────────────────────────┐
 * │  History     │  Active Chat             │
 * │  Sidebar     │                          │
 * │  (past chats)│                          │
 * │             │                          │
 * │             │  Input bar               │
 * └─────────────┴──────────────────────────┘
 */
export default function ChatPage() {
    // ── Current chat state ──
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef(null)

    // ── History state ──
    const [historyOpen, setHistoryOpen] = useState(false)
    const [historyChats, setHistoryChats] = useState([])
    const [historyTotal, setHistoryTotal] = useState(0)
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historySearch, setHistorySearch] = useState('')
    const [historyPage, setHistoryPage] = useState(0)
    const [selectedHistoryId, setSelectedHistoryId] = useState(null)
    const [viewingHistory, setViewingHistory] = useState(false)

    const ITEMS_PER_PAGE = 20

    // ── Auto scroll ──
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── Fetch history ──
    const fetchHistory = useCallback(async (page = 0, search = '') => {
        setHistoryLoading(true)
        try {
            const res = await api.get('/chat/history', {
                params: {
                    skip: page * ITEMS_PER_PAGE,
                    limit: ITEMS_PER_PAGE,
                    ...(search ? { search } : {}),
                },
            })
            if (page === 0) {
                setHistoryChats(res.data.chats)
            } else {
                setHistoryChats(prev => [...prev, ...res.data.chats])
            }
            setHistoryTotal(res.data.total)
        } catch {
            toast.error('Failed to load chat history')
        } finally {
            setHistoryLoading(false)
        }
    }, [])

    // Load history when sidebar opens
    useEffect(() => {
        if (historyOpen) {
            setHistoryPage(0)
            fetchHistory(0, historySearch)
        }
    }, [historyOpen])

    // Search with debounce
    useEffect(() => {
        if (!historyOpen) return
        const timer = setTimeout(() => {
            setHistoryPage(0)
            fetchHistory(0, historySearch)
        }, 400)
        return () => clearTimeout(timer)
    }, [historySearch])

    // ── Load more pages ──
    const loadMore = () => {
        const nextPage = historyPage + 1
        setHistoryPage(nextPage)
        fetchHistory(nextPage, historySearch)
    }

    // ── View a past chat ──
    const viewHistoryChat = (chat) => {
        setSelectedHistoryId(chat.id)
        setViewingHistory(true)
        setMessages([
            { role: 'user', content: chat.user_message, timestamp: chat.created_at },
            { role: 'ai', data: chat.ai_response, timestamp: chat.created_at },
        ])
        // Close sidebar on mobile
        if (window.innerWidth < 1024) {
            setHistoryOpen(false)
        }
    }

    // ── Start new chat ──
    const startNewChat = () => {
        setMessages([])
        setSelectedHistoryId(null)
        setViewingHistory(false)
        setInput('')
    }

    // ── Delete a single chat ──
    const deleteChat = async (chatId, e) => {
        e.stopPropagation()
        if (!confirm('Delete this chat?')) return

        try {
            await api.delete(`/chat/history/${chatId}`)
            setHistoryChats(prev => prev.filter(c => c.id !== chatId))
            setHistoryTotal(prev => prev - 1)
            if (selectedHistoryId === chatId) {
                startNewChat()
            }
            toast.success('Chat deleted')
        } catch {
            toast.error('Failed to delete chat')
        }
    }

    // ── Clear all history ──
    const clearAllHistory = async () => {
        if (!confirm('Clear all chat history? This cannot be undone.')) return

        try {
            await api.delete('/chat/history')
            setHistoryChats([])
            setHistoryTotal(0)
            startNewChat()
            toast.success('All chat history cleared')
        } catch {
            toast.error('Failed to clear history')
        }
    }

    // ── Send message ──
    const handleSend = async (e) => {
        if (e) e.preventDefault()
        if (!input.trim() || loading) return

        // If viewing history, switch to a new chat continuation
        if (viewingHistory) {
            setViewingHistory(false)
            setSelectedHistoryId(null)
        }

        const userMsg = { role: 'user', content: input }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const res = await api.post('/chat', { message: input })
            const aiData = res.data
            setMessages((prev) => [...prev, { role: 'ai', data: aiData }])
            // Refresh history sidebar if open
            if (historyOpen) {
                fetchHistory(0, historySearch)
            }
        } catch {
            toast.error('Failed to get AI response')
            setMessages((prev) => [...prev, { role: 'ai', data: { summary: 'Sorry, I could not process your request. Please try again.', disclaimer: 'This is legal information, not legal advice.' } }])
        } finally {
            setLoading(false)
        }
    }

    // ── Voice handlers ──
    const handleVoiceResult = (transcript) => {
        setInput(transcript)
        setTimeout(() => {
            if (viewingHistory) {
                setViewingHistory(false)
                setSelectedHistoryId(null)
            }
            const userMsg = { role: 'user', content: transcript }
            setMessages((prev) => [...prev, userMsg])
            setInput('')
            setLoading(true)

            api.post('/chat', { message: transcript })
                .then((res) => {
                    setMessages((prev) => [...prev, { role: 'ai', data: res.data }])
                    if (historyOpen) fetchHistory(0, historySearch)
                })
                .catch(() => {
                    toast.error('Failed to get AI response')
                    setMessages((prev) => [...prev, { role: 'ai', data: { summary: 'Sorry, I could not process your request. Please try again.', disclaimer: 'This is legal information, not legal advice.' } }])
                })
                .finally(() => setLoading(false))
        }, 500)
    }

    const handleVoiceInterim = (text) => setInput(text)

    // ── Risk helpers ──
    const getRiskColor = (level) => {
        if (level === 'High') return 'badge-high'
        if (level === 'Medium') return 'badge-medium'
        return 'badge-low'
    }

    const getRiskIcon = (level) => {
        if (level === 'High') return <AlertTriangle className="w-3.5 h-3.5" />
        if (level === 'Medium') return <Info className="w-3.5 h-3.5" />
        return <CheckCircle className="w-3.5 h-3.5" />
    }

    // ── Format timestamp ──
    const formatTime = (isoStr) => {
        if (!isoStr) return ''
        const d = new Date(isoStr)
        const now = new Date()
        const diffMs = now - d
        const diffMins = Math.floor(diffMs / 60000)
        const diffHrs = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHrs < 24) return `${diffHrs}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }

    // ── Truncate text ──
    const truncate = (text, len = 60) => {
        if (!text) return ''
        return text.length > len ? text.slice(0, len) + '...' : text
    }

    return (
        <div className="flex h-[calc(100vh-10rem)] animate-fade-in gap-0">

            {/* ═══════════ HISTORY SIDEBAR ═══════════ */}
            {historyOpen && (
                <>
                    {/* Mobile backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setHistoryOpen(false)}
                    />

                    <div className="chat-history-sidebar">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-primary-400" />
                                <h3 className="text-sm font-bold text-white">Chat History</h3>
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-medium">
                                    {historyTotal}
                                </span>
                            </div>
                            <button
                                onClick={() => setHistoryOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* New Chat Button */}
                        <div className="px-3 py-2">
                            <button
                                onClick={startNewChat}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold
                                           bg-gradient-to-r from-primary-600 to-primary-500 text-white
                                           hover:from-primary-500 hover:to-primary-400 transition-all duration-200
                                           shadow-lg shadow-primary-500/20 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                New Chat
                            </button>
                        </div>

                        {/* Search */}
                        <div className="px-3 pb-2">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    placeholder="Search chats..."
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10
                                               text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1
                                               focus:ring-primary-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto px-2 space-y-1">
                            {historyLoading && historyChats.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                                </div>
                            ) : historyChats.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">
                                        {historySearch ? 'No chats match your search' : 'No chat history yet'}
                                    </p>
                                </div>
                            ) : (
                                historyChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => viewHistoryChat(chat)}
                                        className={`chat-history-item group ${
                                            selectedHistoryId === chat.id ? 'chat-history-item-active' : ''
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="text-sm text-gray-200 font-medium truncate">
                                                {truncate(chat.user_message, 45)}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    {formatTime(chat.created_at)}
                                                </span>
                                                {chat.risk_level && chat.risk_level !== 'Low' && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                                        chat.risk_level === 'High'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                        {chat.risk_level}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteChat(chat.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md
                                                       hover:bg-red-500/20 text-gray-500 hover:text-red-400
                                                       transition-all flex-shrink-0"
                                            title="Delete chat"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </button>
                                ))
                            )}

                            {/* Load More */}
                            {historyChats.length < historyTotal && (
                                <button
                                    onClick={loadMore}
                                    disabled={historyLoading}
                                    className="w-full py-2 text-xs text-primary-400 hover:text-primary-300
                                               transition-colors disabled:opacity-50"
                                >
                                    {historyLoading ? 'Loading...' : 'Load more'}
                                </button>
                            )}
                        </div>

                        {/* Clear All */}
                        {historyChats.length > 0 && (
                            <div className="px-3 py-2 border-t border-white/5">
                                <button
                                    onClick={clearAllHistory}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg
                                               text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Clear All History
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ═══════════ MAIN CHAT AREA ═══════════ */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <button
                        onClick={() => setHistoryOpen(!historyOpen)}
                        className={`p-2 rounded-xl transition-all duration-200 ${
                            historyOpen
                                ? 'bg-primary-500/20 text-primary-400'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                        title="Chat History"
                    >
                        <History className="w-5 h-5" />
                    </button>

                    <div className="flex-1">
                        <h1 className="font-display font-bold text-2xl text-white">
                            {viewingHistory ? 'Past Conversation' : 'AI Legal Assistant'}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {viewingHistory
                                ? 'Viewing a previous chat — you can continue the conversation below'
                                : 'Ask any legal question — type or use the 🎙️ mic'}
                        </p>
                    </div>

                    {viewingHistory && (
                        <button
                            onClick={startNewChat}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-500/20
                                       text-primary-400 text-sm font-medium hover:bg-primary-500/30 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New Chat
                        </button>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {/* Viewing history banner */}
                    {viewingHistory && messages.length > 0 && messages[0].timestamp && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20">
                            <Clock className="w-4 h-4 text-primary-400 flex-shrink-0" />
                            <p className="text-xs text-primary-300">
                                This conversation was from <strong>{formatTime(messages[0].timestamp)}</strong>.
                                You can continue asking follow-up questions below.
                            </p>
                        </div>
                    )}

                    {messages.length === 0 && (
                        <div className="glass-card p-12 text-center">
                            <Scale className="w-14 h-14 text-primary-400 mx-auto mb-4" />
                            <h2 className="font-display font-semibold text-xl text-white mb-2">How can I help you?</h2>
                            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                                Describe your legal situation by typing or speaking. I'll analyze it as a case study and cite relevant Indian laws, rights, and recommended steps.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {[
                                    'My landlord is not returning my security deposit',
                                    'I received a legal notice from a company',
                                    'How to file an RTI application?',
                                    'My employer is not paying my salary',
                                ].map((q) => (
                                    <button key={q} onClick={() => setInput(q)} className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-colors">
                                        {q}
                                    </button>
                                ))}
                            </div>

                            {/* History Quick Access */}
                            <button
                                onClick={() => setHistoryOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                                           bg-white/5 border border-white/10 text-gray-400
                                           hover:bg-white/10 hover:text-white transition-colors text-xs"
                            >
                                <History className="w-3.5 h-3.5" />
                                View Past Conversations
                            </button>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'user' ? (
                                <div className="max-w-xl">
                                    <div className="flex items-center gap-2 mb-1 justify-end">
                                        <span className="text-xs text-gray-400">You</span>
                                        <div className="w-6 h-6 rounded-full bg-primary-500/30 flex items-center justify-center">
                                            <User className="w-3.5 h-3.5 text-primary-300" />
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 rounded-2xl rounded-br-md bg-primary-600/30 border border-primary-500/20 text-gray-100">
                                        {msg.content}
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-2xl w-full">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                                            <Scale className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <span className="text-xs text-gray-400">NyayaGuide AI</span>
                                        <SpeakButton data={msg.data} language="en" />
                                    </div>
                                    <div className="glass-card p-5 space-y-4">
                                        {/* Summary */}
                                        {msg.data?.summary && (
                                            <p className="text-gray-200 leading-relaxed">{msg.data.summary}</p>
                                        )}

                                        {/* Risk + Confidence */}
                                        {(msg.data?.risk_level || msg.data?.confidence_score !== undefined) && (
                                            <div className="flex flex-wrap gap-3">
                                                {msg.data.risk_level && (
                                                    <span className={getRiskColor(msg.data.risk_level)}>
                                                        {getRiskIcon(msg.data.risk_level)} Risk: {msg.data.risk_level}
                                                    </span>
                                                )}
                                                {msg.data.confidence_score !== undefined && (
                                                    <span className="badge bg-primary-500/20 text-primary-400 border border-primary-500/30">
                                                        Confidence: {msg.data.confidence_score}%
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Issues */}
                                        {msg.data?.issues?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-white mb-2">⚠️ Issues Identified</h4>
                                                <ul className="space-y-1">
                                                    {msg.data.issues.map((issue, j) => (
                                                        <li key={j} className="text-sm text-gray-300 flex items-start gap-2">
                                                            <span className="text-yellow-400 mt-0.5">•</span> {issue}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Applicable Laws */}
                                        {msg.data?.applicable_laws?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-white mb-2">📜 Applicable Laws</h4>
                                                <div className="space-y-2">
                                                    {msg.data.applicable_laws.map((law, j) => (
                                                        <div key={j} className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-sm text-gray-300">
                                                            {typeof law === 'string' ? law : `${law.act} — ${law.section}: ${law.description}`}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rights */}
                                        {msg.data?.rights?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-white mb-2">✊ Your Rights</h4>
                                                <ul className="space-y-1">
                                                    {msg.data.rights.map((r, j) => (
                                                        <li key={j} className="text-sm text-gray-300 flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommended Steps */}
                                        {msg.data?.recommended_steps?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-white mb-2">✅ Recommended Steps</h4>
                                                <ol className="space-y-1 list-decimal list-inside">
                                                    {msg.data.recommended_steps.map((s, j) => (
                                                        <li key={j} className="text-sm text-gray-300">{s}</li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}

                                        {/* References */}
                                        {msg.data?.references?.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-white mb-2">📚 References</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {msg.data.references.map((ref, j) => (
                                                        <span key={j} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
                                                            <BookOpen className="w-3 h-3 inline mr-1" />
                                                            {typeof ref === 'string' ? ref : ref.title || ref.source}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Disclaimer */}
                                        <div className="pt-3 border-t border-white/5">
                                            <p className="text-xs text-gray-500 italic">
                                                ⚖️ {msg.data?.disclaimer || 'This is legal information, not legal advice. Consult a licensed advocate for your specific case.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="glass-card p-5 flex items-center gap-3">
                                <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                                <span className="text-gray-400 text-sm">Analyzing your case...</span>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>

                {/* Input with Voice Mic */}
                <form onSubmit={handleSend} className="mt-4 flex gap-3 items-center">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe your legal situation or tap 🎙️ to speak..."
                        className="input-field flex-1"
                        disabled={loading}
                    />
                    <VoiceMicButton
                        onResult={handleVoiceResult}
                        onInterim={handleVoiceInterim}
                        language="en"
                        disabled={loading}
                        size="md"
                    />
                    <button type="submit" className="btn-primary !px-5" disabled={loading || !input.trim()}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </form>
            </div>
        </div>
    )
}
