import { Users, MessageSquare, FileText, Shield, TrendingUp, Activity } from 'lucide-react'

export default function AdminDashboard() {
    // In production these come from /api/admin/stats
    const stats = [
        { icon: Users, label: 'Total Users', value: '—', color: 'from-primary-500 to-primary-400' },
        { icon: MessageSquare, label: 'AI Chats', value: '—', color: 'from-accent-500 to-accent-400' },
        { icon: FileText, label: 'Documents', value: '—', color: 'from-saffron-500 to-yellow-400' },
        { icon: Shield, label: 'Active Consents', value: '—', color: 'from-green-500 to-emerald-400' },
    ]

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="font-display font-bold text-3xl text-white">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Monitor platform activity, user consents, and audit trails.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="glass-card p-5">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                            <s.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-display font-bold text-2xl text-white">{s.value}</p>
                        <p className="text-sm text-gray-400">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="glass-card p-8 text-center">
                <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Real-time analytics and activity feed will appear here once the backend is connected.</p>
            </div>
        </div>
    )
}
