import { useState, useEffect, useMemo } from 'react'
import {
    Calendar as CalendarIcon, Plus, Trash2, Loader2, Clock,
    ChevronLeft, ChevronRight, Gavel, Bell, Users, Target, X, AlertTriangle
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
    { value: 'deadline', label: 'Deadline', icon: Target, color: 'from-red-500 to-orange-400', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
    { value: 'hearing', label: 'Court Hearing', icon: Gavel, color: 'from-primary-500 to-primary-400', badge: 'bg-primary-500/20 text-primary-400 border-primary-500/30' },
    { value: 'meeting', label: 'Meeting', icon: Users, color: 'from-accent-500 to-accent-400', badge: 'bg-accent-500/20 text-accent-400 border-accent-500/30' },
    { value: 'reminder', label: 'Reminder', icon: Bell, color: 'from-yellow-500 to-amber-400', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDateDetail, setShowDateDetail] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [deleteConfirm, setDeleteConfirm] = useState(null) // event id to confirm deletion
    const [deleting, setDeleting] = useState(null) // event id currently being deleted

    // Form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        start: '',
        end: '',
        event_type: 'deadline',
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const res = await api.get('/calendar/events')
            setEvents(res.data.events || [])
        } catch { /* empty */ } finally { setLoading(false) }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!form.title || !form.start || !form.end) {
            return toast.error('Please fill in title, start and end date/time')
        }
        setSubmitting(true)
        try {
            await api.post('/calendar/events', {
                title: form.title,
                description: form.description || null,
                start: new Date(form.start).toISOString(),
                end: new Date(form.end).toISOString(),
                event_type: form.event_type,
            })
            toast.success('Event created!')
            setForm({ title: '', description: '', start: '', end: '', event_type: 'deadline' })
            setShowModal(false)
            fetchEvents()
        } catch {
            toast.error('Failed to create event')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        setDeleting(id)
        try {
            await api.delete(`/calendar/events/${id}`)
            toast.success('Event deleted')
            setDeleteConfirm(null)
            fetchEvents()
        } catch {
            toast.error('Failed to delete event')
        } finally {
            setDeleting(null)
        }
    }

    const handleDateClick = (date) => {
        const dayEvents = getEventsForDate(date)
        setSelectedDate(date)
        if (dayEvents.length > 0) {
            // Show date detail modal with existing events + option to add
            setShowDateDetail(true)
        } else {
            // No events — go straight to add event
            openModalForDate(date)
        }
    }

    const openModalForDate = (date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        setForm({
            title: '',
            description: '',
            start: `${dateStr}T09:00`,
            end: `${dateStr}T10:00`,
            event_type: 'deadline',
        })
        setSelectedDate(date)
        setShowDateDetail(false)
        setShowModal(true)
    }

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(currentYear - 1)
        } else {
            setCurrentMonth(currentMonth - 1)
        }
    }

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(currentYear + 1)
        } else {
            setCurrentMonth(currentMonth + 1)
        }
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentMonth(today.getMonth())
        setCurrentYear(today.getFullYear())
    }

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay()
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

        const days = []

        // Previous month's trailing days
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: daysInPrevMonth - i, currentMonth: false, date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i) })
        }
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, currentMonth: true, date: new Date(currentYear, currentMonth, i) })
        }
        // Next month's leading days
        const remaining = 42 - days.length
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false, date: new Date(currentYear, currentMonth + 1, i) })
        }

        return days
    }, [currentMonth, currentYear])

    // Map events to dates
    const eventsByDate = useMemo(() => {
        const map = {}
        events.forEach((ev) => {
            const d = new Date(ev.start)
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            if (!map[key]) map[key] = []
            map[key].push(ev)
        })
        return map
    }, [events])

    const getEventsForDate = (date) => {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        return eventsByDate[key] || []
    }

    const isToday = (date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }

    const getEventType = (type) => EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[0]

    // Upcoming events (next 30 days)
    const upcomingEvents = useMemo(() => {
        const now = new Date()
        return events
            .filter(ev => new Date(ev.start) >= now)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 8)
    }, [events])

    // Events for selected date (for date detail modal)
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return []
        return getEventsForDate(selectedDate)
    }, [selectedDate, eventsByDate])

    const formatDateTime = (isoStr) => {
        const d = new Date(isoStr)
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' at ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }

    const formatShortTime = (isoStr) => {
        const d = new Date(isoStr)
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }

    if (loading) {
        return <div className="text-center py-20"><Loader2 className="w-8 h-8 text-primary-400 mx-auto animate-spin" /></div>
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display font-bold text-2xl text-white">Calendar</h1>
                    <p className="text-gray-400 text-sm">Track legal deadlines, court hearings, and meetings.</p>
                </div>
                <button
                    onClick={() => {
                        setForm({ title: '', description: '', start: '', end: '', event_type: 'deadline' })
                        setSelectedDate(null)
                        setShowModal(true)
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add Event
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <div className="xl:col-span-2 glass-card p-4 sm:p-6">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button onClick={prevMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h2 className="font-display font-semibold text-lg text-white min-w-[180px] text-center">
                                {MONTHS[currentMonth]} {currentYear}
                            </h2>
                            <button onClick={nextMonth} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                        <button onClick={goToToday} className="text-xs px-3 py-1.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30 hover:bg-primary-500/30 transition-all">
                            Today
                        </button>
                    </div>

                    {/* Day Labels */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
                        ))}
                    </div>

                    {/* Calendar Cells */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((cell, i) => {
                            const dayEvents = getEventsForDate(cell.date)
                            const today = isToday(cell.date)

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDateClick(cell.date)}
                                    className={`
                                        relative min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl text-left transition-all duration-200
                                        ${cell.currentMonth
                                            ? 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5'
                                            : 'opacity-30'
                                        }
                                        ${today ? '!border-primary-500/50 !bg-primary-500/10 ring-1 ring-primary-500/30' : ''}
                                    `}
                                >
                                    <span className={`text-xs font-medium ${today ? 'text-primary-400' : cell.currentMonth ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {cell.day}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                            {dayEvents.slice(0, 2).map((ev, j) => {
                                                const et = getEventType(ev.event_type)
                                                return (
                                                    <div key={j} className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate bg-gradient-to-r ${et.color} text-white font-medium`}>
                                                        {ev.title}
                                                    </div>
                                                )
                                            })}
                                            {dayEvents.length > 2 && (
                                                <span className="text-[9px] text-gray-400">+{dayEvents.length - 2} more</span>
                                            )}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Upcoming Events Sidebar */}
                <div className="space-y-4">
                    <div className="glass-card p-5">
                        <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-400" />
                            Upcoming Events
                        </h3>

                        {upcomingEvents.length === 0 ? (
                            <div className="text-center py-8">
                                <CalendarIcon className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No upcoming events</p>
                                <p className="text-xs text-gray-500 mt-1">Click a date or "Add Event" to get started</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingEvents.map((ev) => {
                                    const et = getEventType(ev.event_type)
                                    const Icon = et.icon
                                    const evId = ev.id || ev._id
                                    return (
                                        <div key={evId} className="group flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all">
                                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${et.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                                <Icon className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{ev.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(ev.start)}</p>
                                                {ev.description && (
                                                    <p className="text-xs text-gray-500 mt-1 truncate">{ev.description}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setDeleteConfirm(evId)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Event Type Legend */}
                    <div className="glass-card p-4">
                        <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Event Types</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {EVENT_TYPES.map(et => (
                                <div key={et.value} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${et.color}`} />
                                    <span className="text-xs text-gray-400">{et.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* All Events List */}
            {events.length > 0 && (
                <div className="glass-card p-5">
                    <h3 className="font-display font-semibold text-white mb-4">All Events ({events.length})</h3>
                    <div className="grid gap-2">
                        {events.map((ev) => {
                            const et = getEventType(ev.event_type)
                            const Icon = et.icon
                            const evId = ev.id || ev._id
                            return (
                                <div key={evId} className="group flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${et.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{ev.title}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${et.badge}`}>{et.label}</span>
                                            <span>{formatDateTime(ev.start)}</span>
                                            <span>→ {formatShortTime(ev.end)}</span>
                                        </p>
                                        {ev.description && <p className="text-xs text-gray-500 mt-1 truncate">{ev.description}</p>}
                                    </div>
                                    <button
                                        onClick={() => setDeleteConfirm(evId)}
                                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
                                        title="Delete event"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Date Detail Modal (View Events + Delete) ── */}
            {showDateDetail && selectedDate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDateDetail(false)}>
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display font-bold text-lg text-white">
                                📅 {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </h2>
                            <button onClick={() => setShowDateDetail(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 mb-4">
                            {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''} on this date
                        </p>

                        {/* Events for this date */}
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                            {selectedDateEvents.map((ev) => {
                                const et = getEventType(ev.event_type)
                                const Icon = et.icon
                                const evId = ev.id || ev._id
                                return (
                                    <div key={evId} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-all">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${et.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white">{ev.title}</p>
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${et.badge}`}>{et.label}</span>
                                                <span>{formatShortTime(ev.start)} → {formatShortTime(ev.end)}</span>
                                            </p>
                                            {ev.description && (
                                                <p className="text-xs text-gray-500 mt-1.5">{ev.description}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setDeleteConfirm(evId)}
                                            disabled={deleting === evId}
                                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 transition-all flex-shrink-0 border border-red-500/20"
                                            title="Delete this event"
                                        >
                                            {deleting === evId
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Trash2 className="w-4 h-4" />
                                            }
                                        </button>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Add new event button */}
                        <div className="mt-5 pt-4 border-t border-white/10">
                            <button
                                onClick={() => openModalForDate(selectedDate)}
                                className="w-full btn-primary flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Event for This Date
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Event Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="glass-card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="font-display font-bold text-lg text-white">
                                {selectedDate
                                    ? `Add Event — ${selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                                    : 'Add Event'
                                }
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            {/* Title */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Title *</label>
                                <input
                                    value={form.title}
                                    onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g., Court hearing at District Court"
                                    className="input-field"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Event Type */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-2 block">Event Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {EVENT_TYPES.map(et => {
                                        const Icon = et.icon
                                        return (
                                            <button
                                                key={et.value}
                                                type="button"
                                                onClick={() => setForm({ ...form, event_type: et.value })}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                                                    form.event_type === et.value
                                                        ? `${et.badge} shadow-sm`
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {et.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Start/End */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">Start *</label>
                                    <input
                                        type="datetime-local"
                                        value={form.start}
                                        onChange={e => setForm({ ...form, start: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 mb-1 block">End *</label>
                                    <input
                                        type="datetime-local"
                                        value={form.end}
                                        onChange={e => setForm({ ...form, end: e.target.value })}
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Optional notes..."
                                    className="input-field !h-20 resize-none"
                                    rows={2}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="glass-card p-6 w-full max-w-sm animate-fade-in border border-red-500/20" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-white">Delete Event?</h3>
                                <p className="text-xs text-gray-400 mt-0.5">This action cannot be undone.</p>
                            </div>
                        </div>

                        {/* Show which event is being deleted */}
                        {(() => {
                            const ev = events.find(e => (e.id || e._id) === deleteConfirm)
                            if (!ev) return null
                            const et = getEventType(ev.event_type)
                            return (
                                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 mb-5">
                                    <p className="text-sm font-medium text-white">{ev.title}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${et.badge} mr-2`}>{et.label}</span>
                                        {formatDateTime(ev.start)}
                                    </p>
                                </div>
                            )
                        })()}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                disabled={deleting === deleteConfirm}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-all text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                {deleting === deleteConfirm
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />
                                }
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
