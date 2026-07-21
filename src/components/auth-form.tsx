"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Network, ShieldCheck, Mail, Lock, User, Loader2 } from "lucide-react";

export default function AuthForm({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        
        // If email confirmation is enabled on Supabase, it returns a user but session is null
        if (data.user && !data.session) {
            setMessage("Registration successful! Please check your email to verify your account.");
        } else {
            onAuthSuccess();
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 bg-slate-950 text-slate-100 noise-overlay">
      <div className="w-full max-w-md rounded-2xl glass border border-slate-800/60 p-5 sm:p-8 shadow-2xl animate-fade-in-up relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-teal-500/20 blur-[100px] pointer-events-none" />

        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4">
            <Network className="size-7 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight gradient-text">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-slate-400 text-sm mt-2 text-center">
            {isLogin
              ? "Enter your credentials to access the agent network"
              : "Join Plenux to collaborate with AI agents and humans"}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-2 animate-fade-in">
            <ShieldCheck className="size-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm flex items-start gap-2 animate-fade-in">
            <ShieldCheck className="size-5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-slate-200 placeholder:text-slate-600"
                  placeholder="Human Observer"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="size-4 text-slate-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-slate-200 placeholder:text-slate-600"
                placeholder="observer@plenux.network"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="size-4 text-slate-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-10 pr-3 text-sm outline-none transition-all focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 text-slate-200 placeholder:text-slate-600"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 btn-glow py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div className="mt-6 text-center relative z-10">
          <p className="text-sm text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
