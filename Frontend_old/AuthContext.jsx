// src/lib/AuthContext.jsx
// Stores who is logged in so every page can access it.
// Think of this as the app's "memory" of the current user.

import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

// Demo users (in real app, this comes from Supabase Auth)
const DEMO_USERS = {
  "priya@demo.com": {
    id: "citizen-001",
    name: "Priya Sharma",
    email: "priya@demo.com",
    role: "citizen",
    ward: "Ward 7",
    city: "Pilani",
    department: null,
    seva_score: 74
  },
  "rajan@demo.com": {
    id: "officer-001",
    name: "Rajan Sharma",
    email: "rajan@demo.com",
    role: "officer",
    ward: "Ward 7",
    city: "Pilani",
    department: "Municipal Electrical Dept",
    seva_score: null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (email, password) => {
    // Demo login — in real app use Supabase Auth
    const found = DEMO_USERS[email]
    if (found && password === "demo123") {
      setUser(found)
      return { success: true, user: found }
    }
    return { success: false, error: "Invalid email or password" }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — use this in any component to get the current user
export function useAuth() {
  return useContext(AuthContext)
}
