import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mic, MicOff, X, Send, Loader2, Scale, Volume2, VolumeX } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startListening,
  speak,
  stopSpeaking,
  buildSpeechText,
} from '../lib/voiceAssistant'

/**
 * FloatingVoiceAssistant — A global FAB (floating action button) that
 * opens a voice-driven chat overlay from any dashboard page.
 *
 * Flow:
 * 1. User taps the floating mic → overlay opens in listening mode
 * 2. User speaks → transcript shown in real-time (mic stays on)
 * 3. After 2s of silence → auto-sends to /api/chat
 * 4. AI response is read aloud + shown in overlay
 * 5. User can ask follow-up or close
 */
export default function FloatingVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState(null)
  const [history, setHistory] = useState([])

  // Refs for managing the voice controller and timers
  const controllerRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const latestTranscriptRef = useRef('')
  const navigate = useNavigate()
  const location = useLocation()

  const supported = isSpeechRecognitionSupported()

  // ── Clean up everything on unmount or route change ──
  useEffect(() => {
    return () => {
      cleanupAll()
    }
  }, [location.pathname])

  const cleanupAll = useCallback(() => {
    clearTimeout(silenceTimerRef.current)
    controllerRef.current?.stop()
    controllerRef.current = null
    stopSpeaking()
  }, [])

  // ── Start or stop listening ──
  // IMPORTANT: This must be defined BEFORE handleOpen which calls it.
  const doStartListening = useCallback(() => {
    // If already listening, stop and send whatever we have
    if (controllerRef.current) {
      clearTimeout(silenceTimerRef.current)
      controllerRef.current.stop()
      controllerRef.current = null
      // Send pending transcript
      const pending = latestTranscriptRef.current
      if (pending?.trim()) {
        sendVoiceQuery(pending)
      }
      return
    }

    latestTranscriptRef.current = ''

    const controller = startListening({
      language: 'en',
      continuous: true,
      onResult: (text) => {
        setTranscript(text)
        setInterimTranscript('')
        latestTranscriptRef.current = text

        // Wait 4s of silence after last result, then auto-send (gives user time to think)
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = setTimeout(() => {
          if (latestTranscriptRef.current?.trim()) {
            const finalText = latestTranscriptRef.current
            // Stop listening
            controllerRef.current?.stop()
            controllerRef.current = null
            sendVoiceQuery(finalText)
          }
        }, 4000)
      },
      onInterim: (text) => {
        setInterimTranscript(text)
        // Reset silence timer — user is still talking
        clearTimeout(silenceTimerRef.current)
      },
      onStart: () => {
        setIsListening(true)
      },
      onEnd: () => {
        // Only fires when user calls stop() — not on auto-restart
        setIsListening(false)
      },
      onError: (event) => {
        if (event?.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access in your browser settings.')
          setIsListening(false)
          controllerRef.current = null
        }
      },
    })

    controllerRef.current = controller
  }, [])

  // ── Open overlay and auto-start listening ──
  const handleOpen = useCallback(() => {
    setIsOpen(true)
    
    // Start listening synchronously to keep user-gesture context (fixes mic getting blocked)
    doStartListening()
  }, [doStartListening])

  // ── Close everything ──
  const handleClose = useCallback(() => {
    cleanupAll()
    setIsOpen(false)
    setIsListening(false)
    setIsSpeaking(false)
    setTranscript('')
    setInterimTranscript('')
    setAiResponse(null)
    setIsProcessing(false)
  }, [cleanupAll])

  // ── Send voice query to backend ──
  const sendVoiceQuery = useCallback(async (message) => {
    if (!message?.trim()) return

    clearTimeout(silenceTimerRef.current)
    latestTranscriptRef.current = ''
    setIsProcessing(true)
    setAiResponse(null)

    try {
      const res = await api.post('/chat', { message })
      const data = res.data

      setAiResponse(data)
      setHistory(prev => [...prev, { question: message, answer: data }])

      // Auto-speak the response
      if (isSpeechSynthesisSupported()) {
        const speechText = buildSpeechText(data)
        speak(speechText, {
          language: 'en',
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        })
      }
    } catch {
      toast.error('Failed to get AI response')
      setAiResponse({
        summary: 'Sorry, I could not process your request. Please try again.',
        disclaimer: 'This is legal information, not legal advice.',
      })
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking()
    setIsSpeaking(false)
  }, [])

  const handleGoToChat = useCallback(() => {
    handleClose()
    navigate('/dashboard/chat')
  }, [handleClose, navigate])

  if (!supported) return null

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="voice-fab"
          title="Voice Assistant"
          id="voice-assistant-fab"
        >
          <div className="voice-fab-inner">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <div className="voice-fab-ring" />
          <div className="voice-fab-ring voice-fab-ring-delay" />
        </button>
      )}

      {/* ── Voice Overlay ── */}
      {isOpen && (
        <div className="voice-overlay-backdrop" onClick={handleClose}>
          <div
            className="voice-overlay"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="voice-overlay-header">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center">
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">NyayaGuide Voice</h3>
                  <p className="text-xs text-gray-400">
                    {isListening ? 'Listening...' : isProcessing ? 'Processing...' : isSpeaking ? 'Speaking...' : 'Tap mic to speak'}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="voice-overlay-body">
              {/* Status Visual */}
              <div className="voice-orb-container">
                <div className={`voice-orb ${isListening ? 'voice-orb-listening' : ''} ${isSpeaking ? 'voice-orb-speaking' : ''} ${isProcessing ? 'voice-orb-processing' : ''}`}>
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : isListening ? (
                    <Mic className="w-8 h-8 text-white" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-8 h-8 text-white" />
                  ) : (
                    <Mic className="w-8 h-8 text-white/60" />
                  )}
                </div>

                {isListening && (
                  <div className="voice-orb-waves">
                    <span /><span /><span /><span /><span /><span /><span />
                  </div>
                )}
              </div>

              {/* Transcript */}
              {(transcript || interimTranscript) && (
                <div className="voice-transcript">
                  <p className="text-sm text-white font-medium">
                    {transcript || <span className="text-gray-400 italic">{interimTranscript}</span>}
                  </p>
                </div>
              )}

              {/* AI Response Summary */}
              {aiResponse && (
                <div className="voice-response">
                  <p className="text-sm text-gray-200 leading-relaxed">{aiResponse.summary}</p>

                  {aiResponse.risk_level && (
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        aiResponse.risk_level === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        aiResponse.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        Risk: {aiResponse.risk_level}
                      </span>
                    </div>
                  )}

                  {aiResponse.recommended_steps?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-300 mb-1">Quick Steps:</p>
                      <ul className="space-y-1">
                        {aiResponse.recommended_steps.slice(0, 3).map((step, i) => (
                          <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                            <span className="text-primary-400 font-bold">{i + 1}.</span> {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="voice-overlay-actions">
              {isSpeaking ? (
                <button onClick={handleStopSpeaking} className="voice-action-btn voice-action-stop">
                  <VolumeX className="w-4 h-4" />
                  <span>Stop Speaking</span>
                </button>
              ) : (
                <button
                  onClick={doStartListening}
                  disabled={isProcessing}
                  className={`voice-action-btn ${isListening ? 'voice-action-stop' : 'voice-action-mic'}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isListening ? 'Stop' : 'Speak'}</span>
                </button>
              )}

              <button onClick={handleGoToChat} className="voice-action-btn voice-action-chat">
                <Send className="w-4 h-4" />
                <span>Full Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
