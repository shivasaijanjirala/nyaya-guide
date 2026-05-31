import { useState, useEffect } from 'react'
import { Upload, FileText, Eye, Trash2, Loader2, Search, Filter, ShieldCheck } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function DocumentsPage() {
    const [docs, setDocs] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [search, setSearch] = useState('')
    const [dragOver, setDragOver] = useState(false)

    useEffect(() => {
        fetchDocs()
    }, [])

    const fetchDocs = async () => {
        try {
            const res = await api.get('/documents')
            setDocs(res.data.documents || [])
        } catch { /* empty */ } finally { setLoading(false) }
    }

    const handleUpload = async (files) => {
        if (!files?.length) return
        setUploading(true)
        const formData = new FormData()
        for (const f of files) formData.append('files', f)
        try {
            await api.post('/documents/upload', formData)
            toast.success(`${files.length} file(s) uploaded & encrypted!`)
            fetchDocs()
        } catch { toast.error('Upload failed') } finally { setUploading(false) }
    }

    const handleDelete = async (id) => {
        try { await api.delete(`/documents/${id}`); toast.success('Deleted'); fetchDocs() } catch { toast.error('Delete failed') }
    }

    const filtered = docs.filter(d => d.file_name?.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-2xl text-white">Documents</h1>
                    <p className="text-gray-400 text-sm">Upload FIRs, ID cards, notices, contracts. All files are AES-256 encrypted.</p>
                </div>
                <label className="btn-primary flex items-center gap-2 cursor-pointer">
                    <Upload className="w-5 h-5" /> Upload Files
                    <input type="file" multiple className="hidden" onChange={(e) => handleUpload(Array.from(e.target.files))} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                </label>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(Array.from(e.dataTransfer.files)) }}
                className={`glass-card p-12 border-2 border-dashed text-center transition-all ${dragOver ? 'border-primary-400 bg-primary-500/10' : 'border-white/10'}`}
            >
                {uploading ? (
                    <Loader2 className="w-10 h-10 text-primary-400 mx-auto animate-spin" />
                ) : (
                    <>
                        <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                        <p className="text-gray-400">Drag & drop files here, or click "Upload Files" above</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG, DOC accepted • AES-256 encrypted at rest</p>
                    </>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="input-field !pl-12" />
            </div>

            {/* Document List */}
            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No documents uploaded yet.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((doc) => (
                        <div key={doc._id || doc.id} className="glass-card p-4 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-accent-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{doc.file_name}</p>
                                <p className="text-xs text-gray-400">{doc.file_type} • Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <ShieldCheck className="w-4 h-4 text-green-400" title="Encrypted" />
                            </div>
                            <button onClick={() => handleDelete(doc._id || doc.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
