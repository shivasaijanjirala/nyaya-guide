import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function TimelinePage() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ event: '', date: '', legal_significance: '' })
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchTimeline() }, [])

    const fetchTimeline = async () => {
        try { const res = await api.get('/timeline'); setEvents(res.data.events || []) }
        catch { /* empty */ } finally { setLoading(false) }
    }

    const handleSave = async () => {
        if (!form.event || !form.date) return toast.error('Event and date are required')
        setSaving(true)
        try {
            await api.post('/timeline', form)
            toast.success('Event added!')
            setForm({ event: '', date: '', legal_significance: '' })
            setShowForm(false)
            fetchTimeline()
        } catch { toast.error('Failed to save') } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        try { await api.delete(`/timeline/${id}`); toast.success('Deleted'); fetchTimeline() }
        catch { toast.error('Failed') }
    }

    const sorted = [...events].sort((a, b) => new Date(b.date) - new Date(a.date))

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-2xl text-white">Case Timeline</h1>
                    <p className="text-gray-400 text-sm">Track important events and their legal significance.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Event
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 space-y-4 animate-slide-up">
                    <input value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} className="input-field" placeholder="Event description" />
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
                    <input value={form.legal_significance} onChange={(e) => setForm({ ...form, legal_significance: e.target.value })} className="input-field" placeholder="Legal significance (optional)" />
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="btn-primary" disabled={saving}>
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Event'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" /></div>
            ) : sorted.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No timeline events yet.</p>
                </div>
            ) : (
                <div className="relative pl-8">
                    {/* Vertical line */}
                    <div className="absolute left-3 top-0 bottom-0 w-px bg-white/10" />

                    {sorted.map((ev, i) => (
                        <div key={ev._id || ev.id} className="relative mb-6 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                            {/* Dot */}
                            <div className="absolute -left-5 top-4 w-4 h-4 rounded-full gradient-primary shadow-lg shadow-primary-500/30" />
                            <div className="glass-card p-4 ml-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-primary-400 font-medium mb-1">
                                            {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                        <p className="text-gray-200 font-medium">{ev.event}</p>
                                        {ev.legal_significance && (
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 text-yellow-400" /> {ev.legal_significance}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={() => handleDelete(ev._id || ev.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
