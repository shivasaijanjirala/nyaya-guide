import { useState, useEffect } from 'react'
import { TrendingUp, Loader2, Calendar, ExternalLink, BookOpen, Filter, RefreshCw } from 'lucide-react'
import api from '../../lib/api'

export default function LegalTrendsPage() {
    const [articles, setArticles] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        fetchTrends()
    }, [])

    const fetchTrends = async () => {
        setLoading(true)
        try {
            const res = await api.get('/legal-trends')
            setArticles(res.data.articles || [])
        } catch { /* use placeholders */ } finally { setLoading(false) }
    }

    // Fallback sample data — mirrors backend curated articles
    const sampleArticles = [
        { id: '1', title: 'Supreme Court Allows Withdrawal of Life-Sustaining Treatment in Landmark Passive Euthanasia Ruling', summary: 'In Harish Rana v. Union of India (March 11, 2026), the Supreme Court ruled that CANH constitutes "medical treatment" rather than primary care. Doctors may exercise clinical judgment to withhold it, affirming the right to die with dignity under Article 21.', category: 'Constitutional Law', date: '2026-03-11', source: 'Supreme Court of India' },
        { id: '2', title: 'Transgender Persons (Protection of Rights) Amendment Bill, 2026 Passed by Parliament', summary: 'Passed by both Houses by March 25, 2026, this Bill amends the 2019 Act. It introduces new requirements for identity certification involving medical boards, sparking significant debate regarding the right to self-identification.', category: 'Human Rights', date: '2026-03-25', source: 'Parliament of India' },
        { id: '3', title: 'Jan Vishwas Bill 2026: Decriminalizing 717 Minor Offenses Across 79 Acts', summary: 'This bill seeks to amend 79 central acts to decriminalize 717 minor offenses and rationalize penalties, aiming to improve ease of doing business and ease of living.', category: 'Administrative Law', date: '2026-03-22', source: 'Lok Sabha / Ministry of Law' },
        { id: '4', title: 'DPDP Rules 2025: Phase I Now Active — Data Protection Board Operational', summary: 'The Digital Personal Data Protection Rules took effect on November 13, 2025. Phase II (Consent Manager registration) is due by November 2026, with full compliance required by May 13, 2027.', category: 'Data Protection', date: '2026-03-15', source: 'MeitY / Data Protection Board' },
        { id: '5', title: 'Bharatiya Nyaya Sanhita (BNS): Implementation Progress and Key Changes', summary: 'Since July 1, 2024, all new FIRs are registered under BNS/BNSS/BSA. Key reforms include e-FIRs, electronic summons, digital evidence, and community service for minor offenses.', category: 'Criminal Law', date: '2026-03-10', source: 'Ministry of Home Affairs' },
        { id: '6', title: 'Supreme Court: No Mandatory Valuation Report for Reduction of Share Capital', summary: 'In Pannalal Bhansali v. Bharti Telecom Ltd., the Court held that a formal valuation report is not mandatory for reduction of share capital under Section 66 of the Companies Act.', category: 'Corporate Law', date: '2026-03-10', source: 'Supreme Court of India' },
        { id: '7', title: 'Supreme Court Affirms State Obligation for Vaccine Adverse Event Redressal', summary: 'The Court affirmed that under Article 21, the State has an obligation to provide a structured redressal mechanism when grave harm is alleged due to state-led public health interventions.', category: 'Constitutional Law', date: '2026-03-08', source: 'Supreme Court of India' },
        { id: '8', title: 'Consumer Protection: DPDP Act Works Alongside Consumer Protection Act 2019', summary: 'The DPDP Act operates alongside the CPA 2019. While CPA addresses fair trade and quality, the DPDP Act secures informational privacy, empowering citizens with data rights.', category: 'Consumer Law', date: '2026-03-05', source: 'Legal Research / MeitY' },
    ]

    const displayArticles = articles.length > 0 ? articles : sampleArticles

    // Extract unique categories for filter tabs
    const categories = ['All', ...new Set(displayArticles.map(a => a.category))]

    const filteredArticles = selectedCategory === 'All'
        ? displayArticles
        : displayArticles.filter(a => a.category === selectedCategory)

    const categoryColors = {
        'Constitutional Law': 'from-primary-500 to-primary-400',
        'Cyber Law': 'from-accent-500 to-accent-400',
        'Data Protection': 'from-green-500 to-emerald-400',
        'Property Law': 'from-saffron-500 to-yellow-400',
        'Administrative Law': 'from-pink-500 to-rose-400',
        'Criminal Law': 'from-red-500 to-orange-400',
        'Human Rights': 'from-violet-500 to-purple-400',
        'Corporate Law': 'from-blue-500 to-cyan-400',
        'Consumer Law': 'from-teal-500 to-emerald-400',
        'Legal Profession': 'from-amber-500 to-yellow-400',
    }

    const categoryBadgeColors = {
        'Constitutional Law': 'bg-primary-500/20 text-primary-400 border-primary-500/30',
        'Cyber Law': 'bg-accent-500/20 text-accent-400 border-accent-500/30',
        'Data Protection': 'bg-green-500/20 text-green-400 border-green-500/30',
        'Property Law': 'bg-saffron-500/20 text-saffron-400 border-saffron-500/30',
        'Administrative Law': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        'Criminal Law': 'bg-red-500/20 text-red-400 border-red-500/30',
        'Human Rights': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
        'Corporate Law': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'Consumer Law': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
        'Legal Profession': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-2xl text-white">Legal Trends & Articles</h1>
                    <p className="text-gray-400 text-sm">Latest Indian legal developments, judgments, and legislative updates — March 2026</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3" />
                        Updated: Mar 2026
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 font-medium">
                        {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all duration-200 ${
                            selectedCategory === cat
                                ? 'bg-primary-500/30 text-primary-300 border-primary-500/40 shadow-sm shadow-primary-500/20'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" /></div>
            ) : (
                <div className="grid gap-4">
                    {filteredArticles.map((a, index) => (
                        <div
                            key={a.id || a._id}
                            className="glass-card-hover p-6 group"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[a.category] || 'from-gray-500 to-gray-400'} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryBadgeColors[a.category] || 'bg-white/10 text-gray-300 border-white/10'}`}>
                                            {a.category}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(a.date)}
                                        </span>
                                    </div>
                                    <h3 className="font-display font-semibold text-lg text-white mb-2 group-hover:text-primary-400 transition-colors duration-200 leading-snug">{a.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{a.summary}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <ExternalLink className="w-3 h-3" />
                                            {a.source}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredArticles.length === 0 && (
                        <div className="glass-card p-12 text-center">
                            <Filter className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">No articles found for "{selectedCategory}".</p>
                            <button
                                onClick={() => setSelectedCategory('All')}
                                className="mt-3 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                Show all articles
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
