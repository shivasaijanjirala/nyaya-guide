import { Link } from 'react-router-dom'
import {
    Scale, Shield, MessageSquare, FileText, Brain,
    TrendingUp, Globe, Lock, ArrowRight, Star, CheckCircle
} from 'lucide-react'

const features = [
    {
        icon: MessageSquare,
        title: 'AI Legal Chat',
        desc: 'Get case-study analysis with relevant Indian laws, sections, and judgments cited.',
        color: 'from-primary-500 to-primary-400',
    },
    {
        icon: FileText,
        title: 'Document Intelligence',
        desc: 'Upload FIRs, notices, and contracts. AI extracts details and explains them simply.',
        color: 'from-accent-500 to-accent-400',
    },
    {
        icon: Shield,
        title: 'DPDP Compliant',
        desc: 'Your data is encrypted with AES-256. Full consent control and right to deletion.',
        color: 'from-green-500 to-emerald-400',
    },
    {
        icon: Brain,
        title: 'RAG-Powered',
        desc: 'Retrieval-Augmented Generation ensures responses are backed by real Indian statutes.',
        color: 'from-saffron-500 to-yellow-400',
    },
    {
        icon: TrendingUp,
        title: 'Legal Trends',
        desc: 'Stay informed with AI-summarized recent cases, judgments, and law updates.',
        color: 'from-pink-500 to-rose-400',
    },
    {
        icon: Globe,
        title: 'Multi-Language',
        desc: 'Access legal information in English, Hindi, and Telugu with more languages coming.',
        color: 'from-cyan-500 to-teal-400',
    },
]

const stats = [
    { value: '500+', label: 'Indian Acts Indexed' },
    { value: 'AES-256', label: 'Encryption Standard' },
    { value: '100%', label: 'DPDP Compliant' },
    { value: '3+', label: 'Languages Supported' },
]

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-navy-900 gradient-mesh overflow-x-hidden">
            {/* ── Navigation ── */}
            <nav className="fixed top-0 w-full z-50 bg-navy-900/60 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <Scale className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl text-white">NyayaGuide</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-gray-300 hover:text-white transition-colors font-medium px-4 py-2">
                            Login
                        </Link>
                        <Link to="/register" className="btn-primary text-sm !px-5 !py-2.5">
                            Sign Up <ArrowRight className="w-4 h-4 inline ml-1" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative pt-32 pb-20 px-6">
                {/* Decorative blobs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float" />
                <div className="absolute top-40 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8 animate-fade-in">
                        <Lock className="w-4 h-4" />
                        Privacy-First • DPDP Act Compliant
                    </div>

                    <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6 animate-slide-up">
                        Your AI-Powered{' '}
                        <span className="text-gradient">Indian Legal</span>{' '}
                        Assistant
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Understand your legal rights, analyze cases, generate applications,
                        and access Indian laws — all in one secure, intelligent platform.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <Link to="/register" className="btn-primary text-lg !px-8 !py-4">
                            Sign Up <ArrowRight className="w-5 h-5 inline ml-2" />
                        </Link>
                        <Link to="/login" className="btn-secondary text-lg !px-8 !py-4">
                            I Have an Account
                        </Link>
                    </div>

                    {/* Disclaimer banner */}
                    <div className="mt-8 inline-flex items-center gap-2 text-xs text-gray-500 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        This platform provides legal information only, not legal advice.
                    </div>
                </div>
            </section>

            {/* ── Stats Bar ── */}
            <section className="py-8 border-y border-white/5">
                <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="font-display font-bold text-3xl text-gradient mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-400">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features Grid ── */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-display font-bold text-4xl text-white mb-4">
                            Everything You Need for{' '}
                            <span className="text-gradient">Legal Clarity</span>
                        </h2>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Powered by AI, backed by Indian law databases, and secured with military-grade encryption.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f) => (
                            <div key={f.title} className="glass-card-hover p-6 group">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <f.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-display font-semibold text-lg text-white mb-2">{f.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="py-24 px-6 border-t border-white/5">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-display font-bold text-4xl text-white text-center mb-16">
                        How <span className="text-gradient">NyayaGuide</span> Works
                    </h2>
                    <div className="space-y-8">
                        {[
                            { step: '01', title: 'Create Your Secure Account', desc: 'Register with Email OTP. Your data is encrypted from day one.' },
                            { step: '02', title: 'Describe Your Situation', desc: 'Chat with our AI or upload documents like FIR copies, notices, or contracts.' },
                            { step: '03', title: 'Get Instant Legal Information', desc: 'Receive case analysis with relevant Indian laws, rights, risk assessment, and next steps.' },
                            { step: '04', title: 'Generate Official Applications', desc: 'Draft police complaints, RTI applications, and government letters ready for submission.' },
                        ].map((item) => (
                            <div key={item.step} className="flex items-start gap-6 glass-card p-6">
                                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 font-display font-bold text-xl text-white shadow-lg shadow-primary-500/30">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="font-display font-semibold text-lg text-white mb-1">{item.title}</h3>
                                    <p className="text-gray-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-24 px-6">
                <div className="max-w-3xl mx-auto text-center glass-card p-12 relative overflow-hidden">
                    <div className="absolute inset-0 gradient-primary opacity-5" />
                    <div className="relative z-10">
                        <Star className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                        <h2 className="font-display font-bold text-3xl text-white mb-4">
                            Ready to Understand Your Rights?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                            Join thousands of Indians using AI to access legal information securely and privately.
                        </p>
                        <Link to="/register" className="btn-primary text-lg !px-10 !py-4">
                            Sign Up Now <ArrowRight className="w-5 h-5 inline ml-2" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-primary-400" />
                        <span className="font-display font-bold text-white">NyayaGuide</span>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                        © 2026 NyayaGuide. Legal information only, not legal advice. DPDP Act compliant.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-400">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
