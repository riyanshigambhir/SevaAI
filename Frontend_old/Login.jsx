// src/pages/Login.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/AuthContext"

export default function Login() {
  const [email, setEmail]     = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = login(email, password)
    if (result.success) {
      if (result.user.role === "citizen") navigate("/home")
      else navigate("/officer")
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4"
      style={{ backgroundImage: "linear-gradient(rgba(81,162,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(81,162,212,0.04) 1px, transparent 1px)", backgroundSize: "52px 52px" }}>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">
            Seva<span className="text-primary">AI</span>
          </h1>
          <div className="h-0.5 w-16 mx-auto mb-4" style={{ background: "linear-gradient(90deg, #51A2D4, #7E3FFF)" }} />
          <p className="text-white font-medium">Aapki Awaaz, Sarkar Tak</p>
          <p className="text-gray-500 text-sm">Your Voice, To The Government</p>
        </div>

        {/* Login card */}
        <div className="bg-surface rounded-2xl p-6 border border-primary/20 shadow-glow">

          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                Email / User ID
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="priya@demo.com"
                className="w-full bg-elevated text-white rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="demo123"
                className="w-full bg-elevated text-white rounded-xl px-4 py-3 text-sm border border-white/10 focus:border-primary focus:outline-none"
                required
              />
            </div>

            {error && (
              <p className="text-danger text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm mt-2"
              style={{ background: "linear-gradient(135deg, #51A2D4, #7E3FFF)", boxShadow: "0 4px 20px rgba(81,162,212,0.35)" }}
            >
              {loading ? "Logging in..." : "Login Securely"}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-4 p-3 bg-elevated rounded-xl border border-white/5">
            <p className="text-gray-500 text-xs text-center mb-2 font-semibold uppercase tracking-wider">Demo Accounts</p>
            <div className="space-y-1">
              <p className="text-gray-400 text-xs text-center">Citizen: <span className="text-primary">priya@demo.com</span></p>
              <p className="text-gray-400 text-xs text-center">Officer: <span className="text-primary">rajan@demo.com</span></p>
              <p className="text-gray-400 text-xs text-center">Password: <span className="text-primary">demo123</span></p>
            </div>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex justify-center gap-0 mt-6">
          {["Hindi", "English", "Bengali", "Telugu", "Punjabi"].map((lang, i, arr) => (
            <span key={lang} className="flex items-center">
              <button className={`text-xs px-3 py-1 ${lang === "English" ? "text-primary font-semibold" : "text-gray-600"}`}>
                {lang}
              </button>
              {i < arr.length - 1 && <span className="text-gray-700 text-xs">|</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
