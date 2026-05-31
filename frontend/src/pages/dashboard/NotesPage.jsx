import { useState, useEffect } from 'react'
import { StickyNote, Plus, Trash2, Loader2, Search, Link2, FileText } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function NotesPage() {
    const [notes, setNotes] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ note_text: '', related_document_id: '' })
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => { fetchNotes() }, [])

    const fetchNotes = async () => {
        try { const res = await api.get('/notes'); setNotes(res.data.notes || []) }
        catch { /* empty */ } finally { setLoading(false) }
    }

    const handleSave = async () => {
        if (!form.note_text.trim()) return toast.error('Note cannot be empty')
        setSaving(true)
        try {
            await api.post('/notes', form)
            toast.success('Note saved!')
            setForm({ note_text: '', related_document_id: '' })
            setShowForm(false)
            fetchNotes()
        } catch { toast.error('Failed to save') } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        try { await api.delete(`/notes/${id}`); toast.success('Deleted'); fetchNotes() }
        catch { toast.error('Delete failed') }
    }

    const filtered = notes.filter(n => n.note_text?.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-2xl text-white">Case Notes</h1>
                    <p className="text-gray-400 text-sm">Track personal notes and link them to documents or evidence.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Note
                </button>
            </div>

            {showForm && (
                <div className="glass-card p-6 space-y-4 animate-slide-up">
                    <textarea
                        value={form.note_text}
                        onChange={(e) => setForm({ ...form, note_text: e.target.value })}
                        className="input-field min-h-[100px]"
                        placeholder="Write your case notes here..."
                    />
                    <input
                        value={form.related_document_id}
                        onChange={(e) => setForm({ ...form, related_document_id: e.target.value })}
                        className="input-field"
                        placeholder="Related Document ID (optional)"
                    />
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="btn-primary flex items-center gap-2" disabled={saving}>
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Note'}
                        </button>
                        <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." className="input-field !pl-12" />
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <StickyNote className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No notes yet. Click "Add Note" to start tracking.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((note) => (
                        <div key={note._id || note.id} className="glass-card p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{note.note_text}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                                        {note.related_document_id && (
                                            <span className="text-xs text-accent-400 flex items-center gap-1">
                                                <Link2 className="w-3 h-3" /> Linked to document
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(note._id || note.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
