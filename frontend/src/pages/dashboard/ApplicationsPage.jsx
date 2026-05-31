import { useState } from 'react'
import { FileText, Loader2, Copy, Download, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const APP_TYPES = [
    { value: 'police_complaint', label: '🚔 Police Complaint', desc: 'FIR filing or written complaint to police station' },
    { value: 'municipality', label: '🏛️ Municipality Application', desc: 'Applications to municipal corporation or local government' },
    { value: 'rti', label: '📋 RTI Application', desc: 'Right to Information request under RTI Act, 2005' },
    { value: 'government_letter', label: '📄 Government Request Letter', desc: 'Formal letter to any government authority' },
    { value: 'legal_notice', label: '⚖️ Legal Notice Draft', desc: 'Draft legal notice for disputes or claims' },
]

export default function ApplicationsPage() {
    const [selected, setSelected] = useState(null)
    const [details, setDetails] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        if (!selected) return toast.error('Select an application type')
        if (!details.trim()) return toast.error('Provide details about your situation')
        setLoading(true)
        try {
            const res = await api.post('/applications/generate', { type: selected, details })
            setResult(res.data)
        } catch { toast.error('Generation failed') } finally { setLoading(false) }
    }

    const copyToClipboard = () => {
        if (!result?.body) return
        navigator.clipboard.writeText(result.body)
        setCopied(true)
        toast.success('Copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="font-display font-bold text-2xl text-white">Application Generator</h1>
                <p className="text-gray-400 text-sm">Generate official application drafts powered by AI. Review before submission.</p>
            </div>

            {!result ? (
                <div className="max-w-2xl space-y-6">
                    {/* Type Selection */}
                    <div>
                        <label className="input-label">Select Application Type</label>
                        <div className="grid gap-3">
                            {APP_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => setSelected(t.value)}
                                    className={`glass-card p-4 text-left transition-all ${selected === t.value ? 'border-primary-500 bg-primary-500/10' : 'hover:bg-white/5'}`}
                                >
                                    <p className="font-medium text-white">{t.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div>
                        <label className="input-label">Describe Your Situation</label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="input-field min-h-[120px]"
                            placeholder="Provide relevant facts, dates, names, locations, and what action you want to request..."
                        />
                    </div>

                    <button onClick={handleGenerate} className="btn-primary flex items-center gap-2" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><FileText className="w-5 h-5" /> Generate Application</>}
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display font-semibold text-lg text-white">Generated Draft</h2>
                        <div className="flex gap-2">
                            <button onClick={copyToClipboard} className="btn-secondary flex items-center gap-2 text-sm !py-2 !px-4">
                                {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={() => setResult(null)} className="btn-secondary text-sm !py-2 !px-4">
                                New Draft
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="badge bg-primary-500/20 text-primary-400 border border-primary-500/30">{result.application_type}</span>
                        </div>
                        <h3 className="font-display font-semibold text-lg text-white">{result.subject}</h3>
                        <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed border-t border-white/10 pt-4">
                            {result.body}
                        </div>
                        {result.attachments_required?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-2">📎 Attachments Required</h4>
                                <ul className="space-y-1">
                                    {result.attachments_required.map((a, i) => (
                                        <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                            <span className="text-accent-400">•</span> {a}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {result.submission_steps?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-white mb-2">📋 Submission Steps</h4>
                                <ol className="space-y-1 list-decimal list-inside">
                                    {result.submission_steps.map((s, i) => (
                                        <li key={i} className="text-sm text-gray-300">{s}</li>
                                    ))}
                                </ol>
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 italic">⚖️ This is a draft. Please review carefully before submission. This is legal information, not legal advice.</p>
                </div>
            )}
        </div>
    )
}
