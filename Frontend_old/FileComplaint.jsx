// src/pages/FileComplaint.jsx
// This is the voice/text complaint filing screen.
// Uses the browser's built-in speech recognition (Web Speech API).

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"
import { fileComplaint } from "../lib/api"
import BottomNav from "../components/BottomNav"

export default function FileComplaint() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  const [mode, setMode]           = useState("voice")       // "voice" or "text"
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [textInput, setTextInput] = useState("")
  const [parsed, setParsed]       = useState(null)          // Claude's classification
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")

  const recognitionRef = useRef(null)

  // ── Start voice recording ──
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Voice not supported in this browser. Please use Chrome.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "hi-IN"          // Hindi — change to "en-IN" for English
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join("")
      setTranscript(text)
    }

    recognition.onerror = (e) => {
      console.error("Speech error", e)
      setRecording(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setRecording(true)
    setParsed(null)
    setError("")
  }

  // ── Stop recording ──
  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  // ── Send to Claude for classification ──
  const handleFile = async () => {
    const input = mode === "voice" ? transcript : textInput
    if (!input.trim()) { setError("Please speak or type your complaint first."); return }

    setLoading(true)
    setError("")

    try {
      const result = await fileComplaint({
        raw_input: input,
        citizen_id: user?.id || "citizen-001",
        language: mode === "voice" ? "hi" : "en",
        address: null,
        latitude: null,
        longitude: null
      })
      setParsed(result)
    } catch (e) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Navigate to confirmation ──
  const confirmFiling = () => {
    navigate(`/confirmed/${parsed.complaint_id}`, { state: { parsed } })
  }

  const PRIORITY_COLORS = { low: "text-success", medium: "text-primary", high: "text-yellow-400", critical: "text-danger" }

  return (
    <div className="min-h-screen bg-navy text-white pb-24"
      style={{ backgroundImage: "linear-gradient(rgba(81,162,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(81,162,212,0.03) 1px, transparent 1px)", backgroundSize: "52px 52px" }}>

      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-6 gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-elevated flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
        {/* Hindi header for demo */}
        <div>
          <p className="text-white font-bold text-base">शिकायत दर्ज करें</p>
          <p className="text-gray-500 text-xs">File Complaint</p>
        </div>
      </div>

      {/* Mic Orb */}
      <div className="flex flex-col items-center px-5 mb-6">
        <p className="text-gray-500 text-sm mb-6">अपनी समस्या बोल कर बताएं</p>

        <button
          onClick={recording ? stopRecording : startRecording}
          className="relative w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: "#1C2333",
            border: "3px solid transparent",
            backgroundClip: "padding-box",
            boxShadow: recording
              ? "0 0 0 3px #51A2D4, 0 0 40px rgba(81,162,212,0.5), 0 0 80px rgba(126,63,255,0.3)"
              : "0 0 0 2px #7E3FFF, 0 0 20px rgba(126,63,255,0.2)"
          }}
        >
          {/* Pulsing rings when recording */}
          {recording && (
            <>
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(81,162,212,0.15)" }} />
              <span className="absolute inset-[-12px] rounded-full animate-ping animation-delay-300" style={{ background: "rgba(81,162,212,0.08)" }} />
            </>
          )}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="2" width="6" height="12" rx="3" fill="white"/>
            <path d="M5 10c0 3.87 3.13 7 7 7s7-3.13 7-7M12 17v4M8 21h8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>

        {recording && (
          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"/>
            <span className="text-success text-xs font-bold tracking-widest uppercase">RECORDING • रिकॉर्डिंग</span>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="px-5 mb-4 text-center">
        <button
          onClick={() => setMode(mode === "voice" ? "text" : "voice")}
          className="text-gray-500 text-xs underline"
        >
          {mode === "voice" ? "टाइप करें / Type instead" : "Voice input / बोलें"}
        </button>
      </div>

      {/* Text input (if text mode) */}
      {mode === "text" && (
        <div className="px-5 mb-4">
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Describe your complaint in English or Hindi..."
            rows={3}
            className="w-full bg-elevated text-white rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-primary focus:outline-none resize-none"
          />
        </div>
      )}

      {/* Live transcription */}
      {transcript && (
        <div className="mx-5 mb-4 bg-elevated rounded-xl p-4 border border-white/10">
          <p className="text-white text-sm leading-relaxed">"{transcript}"</p>
        </div>
      )}

      {/* AI Parsing result */}
      {parsed && (
        <div className="mx-5 mb-4 bg-surface rounded-xl p-4 border border-primary/20"
          style={{ boxShadow: "0 0 16px rgba(81,162,212,0.1)" }}>
          <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">AI Parsing • AI विश्लेषण</p>
          {[
            { label: "Category / श्रेणी",    value: parsed.category },
            { label: "Location / स्थान",      value: parsed.address  },
            { label: "Department / विभाग",    value: parsed.department },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-gray-500 text-xs">{row.label}</span>
              <span className="text-white text-xs font-medium text-right max-w-[55%]">{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1.5">
            <span className="text-gray-500 text-xs">Priority / प्राथमिकता</span>
            <span className={`text-xs font-bold uppercase ${PRIORITY_COLORS[parsed.priority]}`}>{parsed.priority}</span>
          </div>
        </div>
      )}

      {error && <p className="px-5 text-danger text-sm mb-4">{error}</p>}

      {/* Action button */}
      <div className="px-5">
        {!parsed ? (
          <button
            onClick={handleFile}
            disabled={loading || (!transcript && !textInput)}
            className="w-full py-4 rounded-xl font-bold text-white text-sm disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #51A2D4, #7E3FFF)", boxShadow: "0 4px 20px rgba(81,162,212,0.3)" }}
          >
            {loading ? "Analysing... / विश्लेषण हो रहा है..." : "पुष्टि करें और दर्ज करें / Confirm & File"}
          </button>
        ) : (
          <button
            onClick={confirmFiling}
            className="w-full py-4 rounded-xl font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
          >
            Confirm Filing →
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
