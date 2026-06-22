import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const API = `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/auth`;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dt_user")) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const persist = (userData) => {
    setUser(userData);
    if (userData) localStorage.setItem("dt_user", JSON.stringify(userData));
    else localStorage.removeItem("dt_user");
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed.");
      persist(data);
      toast.success(`Welcome, ${data.name}!`);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed.");
      persist(data);
      toast.success(`Welcome back, ${data.name}!`);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    persist(null);
    toast.success("Signed out successfully.");
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
