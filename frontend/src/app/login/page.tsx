"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { AlertCircle, ShieldAlert, UserCheck, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"REPORTER" | "ADMIN">("REPORTER");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemoLogin = async (targetRole: "REPORTER" | "ADMIN") => {
    setLoading(true);
    setError("");

    const demoEmail = targetRole === "ADMIN" ? "demo.admin@emergency.ai" : "demo.reporter@emergency.ai";
    const demoPassword = "demoPassword123!";
    const demoName = targetRole === "ADMIN" ? "Demo Admin Coordinator" : "Demo Citizen Reporter";

    try {
      let res;
      try {
        res = await api.post("/api/auth/login", { email: demoEmail, password: demoPassword });
      } catch (loginErr) {
        res = await api.post("/api/auth/register", {
          name: demoName,
          email: demoEmail,
          password: demoPassword,
          role: targetRole,
        });
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/report");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initialize demo account session.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const res = await api.post("/api/auth/login", { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        if (res.data.user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/report");
        }
      } else {
        const res = await api.post("/api/auth/register", {
          name,
          email,
          password,
          role,
        });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        if (res.data.user.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/report");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-xl border border-slate-700">
        
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-critical animate-pulse" />
            <h1 className="text-3xl font-bold text-white tracking-tight">EmergencyAI</h1>
          </div>
        </div>

        {/* 1-Click Demo Accounts Section */}
        <div className="mb-6 p-4 bg-blue-950/40 border border-blue-800/60 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider text-center">
            🚀 1-Click Instant Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin("REPORTER")}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Demo Reporter
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin("ADMIN")}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-blue-200" />
              Demo Admin
            </button>
          </div>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-xs font-medium uppercase">Or Custom Credentials</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <div className="flex mb-6 bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${isLogin ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${!isLogin ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-2 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value as "REPORTER" | "ADMIN")}
              >
                <option value="REPORTER">Citizen / Reporter</option>
                <option value="ADMIN">Response Coordinator (Admin)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>
        
      </div>
    </div>
  );
}
