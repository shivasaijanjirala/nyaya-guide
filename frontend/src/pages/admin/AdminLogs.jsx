import { useState, useEffect } from 'react'
import { FileSearch, Loader2, Filter, Clock, User, Activity } from 'lucide-react'
import api from '../../lib/api'

export default function AdminLogs() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchLogs() }, [])

    const fetchLogs = async () => {
        try { const res = await api.get('/admin/logs'); setLogs(res.data.logs || []) }
        catch { /* empty */ } finally { setLoading(false) }
    }

    // Placeholder data for demo
    const sampleLogs = [
        { id: '1', action: 'USER_LOGIN', user_email: 'demo@example.com', timestamp: '2026-02-28T22:00:00Z', details: 'Successful OTP verification' },
        { id: '2', action: 'DOCUMENT_UPLOAD', user_email: 'demo@example.com', timestamp: '2026-02-28T21:30:00Z', details: 'Uploaded FIR_copy.pdf (encrypted)' },
        { id: '3', action: 'AI_CHAT', user_email: 'user2@example.com', timestamp: '2026-02-28T21:00:00Z', details: 'Legal chat session - Risk: Medium' },
        { id: '4', action: 'CONSENT_GRANTED', user_email: 'user3@example.com', timestamp: '2026-02-28T20:30:00Z', details: 'Data processing consent accepted' },
        { id: '5', action: 'DATA_EXPORT', user_email: 'demo@example.com', timestamp: '2026-02-28T20:00:00Z', details: 'User exported personal data (DPDP)' },
    ]

    const displayLogs = logs.length > 0 ? logs : sampleLogs

    const actionColors = {
        USER_LOGIN: 'text-green-400 bg-green-500/20',
        DOCUMENT_UPLOAD: 'text-accent-400 bg-accent-500/20',
        AI_CHAT: 'text-primary-400 bg-primary-500/20',
        CONSENT_GRANTED: 'text-yellow-400 bg-yellow-500/20',
        DATA_EXPORT: 'text-cyan-400 bg-cyan-500/20',
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display font-bold text-2xl text-white">Audit Logs</h1>
                <p className="text-gray-400 text-sm">Complete trail of all user actions for DPDP compliance.</p>
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" /></div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-gray-400 font-medium">Action</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">User</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Details</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayLogs.map((log) => (
                                    <tr key={log.id || log._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${actionColors[log.action] || 'text-gray-400 bg-white/10'}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-300">{log.user_email}</td>
                                        <td className="p-4 text-gray-400">{log.details}</td>
                                        <td className="p-4 text-gray-500 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
