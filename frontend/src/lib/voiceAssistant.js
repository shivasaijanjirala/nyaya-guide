/**
 * Voice Assistant Utility — NyayaGuide
 *
 * Uses browser-native Web Speech API for:
 * - Speech-to-Text (SpeechRecognition) — user speaks, we get text
 * - Text-to-Speech (SpeechSynthesis)   — AI answers read aloud
 *
 * No external packages or API keys required.
 * Supports English, Hindi, and Telugu.
 */

const LANGUAGE_MAP = {
  en: 'en-IN',   // Indian English
  hi: 'hi-IN',   // Hindi
  te: 'te-IN',   // Telugu
}

// ─── Speech-to-Text ────────────────────────────────────────

/**
 * Check whether the browser supports SpeechRecognition
 */
export function isSpeechRecognitionSupported() {
  return !!(
    window.SpeechRecognition ||
    window.webkitSpeechRecognition
  )
}

/**
 * Create a managed SpeechRecognition session that auto-restarts
 * when the browser silently stops it (due to silence, timeouts, etc.)
 *
 * Returns a controller object with .stop() method.
 *
 * @param {Object} options
 * @param {string}   options.language       — 'en' | 'hi' | 'te'
 * @param {function} options.onResult       — called with final transcript string
 * @param {function} options.onInterim      — called with interim transcript (live feedback)
 * @param {function} options.onStart        — called when recognition starts
 * @param {function} options.onEnd          — called when recognition fully ends (user-initiated stop)
 * @param {function} options.onError        — called on error (err object)
 * @param {boolean}  options.continuous     — keep listening after each result?
 * @returns {{ stop: function }} — controller with a stop() method to end recognition
 */
export function startListening({
  language = 'en',
  onResult = () => {},
  onInterim = () => {},
  onStart = () => {},
  onEnd = () => {},
  onError = () => {},
  continuous = false,
} = {}) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    onError(new Error('SpeechRecognition not supported in this browser'))
    return null
  }

  // Controller state
  let wantActive = true          // true = user wants mic on; false = user called stop()
  let accumulatedFinal = ''      // accumulate final text across restarts
  let recognition = null
  let restartTimeoutId = null

  function createAndStart() {
    if (!wantActive) return

    const currentRecognition = new SpeechRecognition()
    recognition = currentRecognition

    currentRecognition.lang = LANGUAGE_MAP[language] || 'en-IN'
    currentRecognition.interimResults = true
    currentRecognition.continuous = continuous
    currentRecognition.maxAlternatives = 3

    currentRecognition.onstart = () => {
      if (recognition === currentRecognition) onStart()
    }

    currentRecognition.onresult = (event) => {
      if (recognition !== currentRecognition) return

      let interimTranscript = ''
      let segmentFinal = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]

        if (result.isFinal) {
          // Pick the alternative with the highest confidence score
          let bestTranscript = result[0].transcript
          let bestConfidence = result[0].confidence || 0

          for (let j = 1; j < result.length; j++) {
            if ((result[j].confidence || 0) > bestConfidence) {
              bestConfidence = result[j].confidence
              bestTranscript = result[j].transcript
            }
          }

          segmentFinal += bestTranscript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      if (interimTranscript) onInterim(accumulatedFinal + interimTranscript)
      if (segmentFinal) {
        accumulatedFinal += segmentFinal
        onResult(accumulatedFinal.trim())
      }
    }

    currentRecognition.onerror = (event) => {
      if (recognition !== currentRecognition) return

      // 'not-allowed' = user denied microphone
      if (event.error === 'not-allowed') {
        wantActive = false
        onError(event)
        // Don't restart — onEnd will fire naturally from browser
        return
      }
      // 'no-speech' and 'aborted' are normal — don't report as errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError(event)
      }
      // Let onend handle restart logic
    }

    currentRecognition.onend = () => {
      if (recognition !== currentRecognition) return

      if (wantActive) {
        // Browser stopped recognition unexpectedly (silence, timeout, etc.)
        // Create a brand-new instance and restart after a brief pause
        clearTimeout(restartTimeoutId)
        restartTimeoutId = setTimeout(() => {
          if (wantActive && recognition === currentRecognition) {
            createAndStart()
          }
        }, 300)
      } else {
        // User-initiated stop — fire the final onEnd callback
        onEnd()
      }
    }

    try {
      currentRecognition.start()
    } catch (err) {
      // May throw if another recognition is still running
      // Retry after a delay
      if (wantActive && recognition === currentRecognition) {
        clearTimeout(restartTimeoutId)
        restartTimeoutId = setTimeout(() => {
          if (wantActive) createAndStart()
        }, 500)
      }
    }
  }

  // Start the first session
  createAndStart()

  // Return a controller object
  return {
    /** Permanently stop recognition (user-initiated) */
    stop() {
      wantActive = false
      clearTimeout(restartTimeoutId)
      try {
        recognition?.stop()
      } catch {
        // Already stopped
        onEnd()
      }
    },

    /** Get the accumulated transcript so far */
    getTranscript() {
      return accumulatedFinal.trim()
    }
  }
}


// ─── Text-to-Speech ────────────────────────────────────────

/**
 * Check whether the browser supports SpeechSynthesis
 */
export function isSpeechSynthesisSupported() {
  return !!(window.speechSynthesis)
}

/**
 * Speak text aloud using the browser's speech synthesis.
 *
 * @param {string} text      — text to speak
 * @param {Object} options
 * @param {string}   options.language   — 'en' | 'hi' | 'te'
 * @param {number}   options.rate       — speed (0.1 – 10, default 1)
 * @param {number}   options.pitch      — pitch (0 – 2, default 1)
 * @param {function} options.onStart    — called when speaking starts
 * @param {function} options.onEnd      — called when speaking finishes
 * @param {function} options.onError    — called on error
 * @returns {SpeechSynthesisUtterance}
 */
export function speak(text, {
  language = 'en',
  rate = 0.95,
  pitch = 1,
  onStart = () => {},
  onEnd = () => {},
  onError = () => {},
} = {}) {
  if (!isSpeechSynthesisSupported()) {
    onError(new Error('SpeechSynthesis not supported'))
    return null
  }

  // Cancel anything currently being spoken
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANGUAGE_MAP[language] || 'en-IN'
  utterance.rate = rate
  utterance.pitch = pitch

  // Try to select an Indian English voice if available
  const voices = window.speechSynthesis.getVoices()
  const preferredVoice = voices.find(
    (v) => v.lang === (LANGUAGE_MAP[language] || 'en-IN')
  ) || voices.find(
    (v) => v.lang.startsWith(language)
  )
  if (preferredVoice) utterance.voice = preferredVoice

  utterance.onstart = onStart
  utterance.onend = onEnd
  utterance.onerror = onError

  window.speechSynthesis.speak(utterance)
  return utterance
}

/**
 * Stop any current speech synthesis.
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
}

/**
 * Build a readable summary from AI response data
 * so TTS speaks something meaningful, not JSON.
 */
export function buildSpeechText(data) {
  if (!data) return 'Sorry, I could not process that.'

  const parts = []

  if (data.summary) {
    parts.push(data.summary)
  }

  if (data.risk_level) {
    parts.push(`The risk level is ${data.risk_level}.`)
  }

  if (data.rights?.length > 0) {
    parts.push(`Your rights include: ${data.rights.join('. ')}.`)
  }

  if (data.recommended_steps?.length > 0) {
    parts.push(`Recommended steps: ${data.recommended_steps.join('. ')}.`)
  }

  if (data.disclaimer) {
    parts.push(data.disclaimer)
  }

  return parts.join(' ') || 'No response available.'
}
