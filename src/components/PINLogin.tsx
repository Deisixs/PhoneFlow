import React, { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { PINSignup } from './PINSignup';

export const PINLogin: React.FC = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, pin);

    if (result.success) {
      showToast('Welcome back!', 'success');
    } else {
      showToast(result.error || 'Login failed', 'error');
    }

    setLoading(false);
  };

  if (showSignup) {
    return <PINSignup onBackToLogin={() => setShowSignup(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/20 to-blue-600/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/50">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            PhoneFlow Pro
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Enterprise Smartphone Management
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-2">
                PIN (4-6 digits)
              </label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                pattern="\d{4,6}"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                placeholder="••••"
                maxLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => setShowSignup(true)}
                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
