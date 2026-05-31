import { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react'
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  startListening,
  speak,
  stopSpeaking,
  buildSpeechText,
} from '../lib/voiceAssistant'

/**
 * VoiceButton — A mic button with pulse animation for speech-to-text.
 *
 * @param {Object} props
 * @param {function} props.onResult     — receives final transcript text
 * @param {function} props.onInterim    — receives interim transcript (live)
 * @param {string}   props.language     — 'en' | 'hi' | 'te'
 * @param {boolean}  props.disabled     — disable the button
 * @param {string}   props.className    — extra class names
 * @param {string}   props.size         — 'sm' | 'md' | 'lg'
 */
export function VoiceMicButton({
  onResult = () => {},
  onInterim = () => {},
  language = 'en',
  disabled = false,
  className = '',
  size = 'md',
}) {
  const [isListening, setIsListening] = useState(false)
  const [interimText, setInterimText] = useState('')
  const controllerRef = useRef(null)

  const supported = isSpeechRecognitionSupported()

  const toggleListening = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stop()
      controllerRef.current = null
      setInterimText('')
      return
    }

    const controller = startListening({
      language,
      onResult: (text) => {
        onResult(text)
        setInterimText('')
      },
      onInterim: (text) => {
        setInterimText(text)
        onInterim(text)
      },
      onStart: () => setIsListening(true),
      onEnd: () => {
        setIsListening(false)
        setInterimText('')
        controllerRef.current = null
      },
      onError: () => {
        setIsListening(false)
        setInterimText('')
        controllerRef.current = null
      },
    })

    controllerRef.current = controller
  }, [language, onResult, onInterim])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.stop()
      controllerRef.current = null
    }
  }, [])

  if (!supported) return null

  const sizeClasses = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className={`voice-mic-wrapper ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Speak your question'}
        className={`
          voice-mic-btn ${sizeClasses[size]}
          ${isListening ? 'voice-mic-active' : ''}
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        {isListening ? (
          <MicOff className={`${iconSizes[size]} text-white`} />
        ) : (
          <Mic className={`${iconSizes[size]} text-white`} />
        )}
      </button>

      {isListening && (
        <div className="voice-listening-indicator">
          <div className="voice-wave">
            <span /><span /><span /><span /><span />
          </div>
        </div>
      )}

      {interimText && (
        <div className="voice-interim-text">
          <Loader2 className="w-3 h-3 animate-spin text-primary-400 flex-shrink-0" />
          <span className="text-xs text-gray-400 truncate">{interimText}</span>
        </div>
      )}
    </div>
  )
}


/**
 * SpeakButton — Reads AI response text aloud using TTS.
 *
 * @param {Object} props
 * @param {Object}  props.data       — AI response data object
 * @param {string}  props.text       — raw text to speak (override data)
 * @param {string}  props.language   — 'en' | 'hi' | 'te'
 * @param {string}  props.className  — extra class names
 */
export function SpeakButton({
  data = null,
  text = '',
  language = 'en',
  className = '',
}) {
  const [isSpeaking, setIsSpeaking] = useState(false)

  if (!isSpeechSynthesisSupported()) return null

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
      return
    }

    const speechText = text || buildSpeechText(data)
    speak(speechText, {
      language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    })
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title={isSpeaking ? 'Stop reading' : 'Read aloud'}
      className={`
        voice-speak-btn
        ${isSpeaking ? 'voice-speak-active' : ''}
        ${className}
      `}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="w-3.5 h-3.5" />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span>Listen</span>
        </>
      )}
    </button>
  )
}
