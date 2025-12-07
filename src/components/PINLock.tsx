import React, { useState } from 'react';
import { Lock, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

export const PINLock: React.FC = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { unlock, logout } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await unlock(pin);

    if (result.success) {
      showToast('Unlocked successfully', 'success');
      setPin('');
    } else {
      showToast(result.error || 'Invalid PIN', 'error');
      setPin('');
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    showToast('Logged out successfully', 'info');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/20 to-blue-600/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/50 animate-pulse">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-white">
            Session Locked
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Enter your PIN to unlock
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                pattern="\d{4,6}"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                placeholder="••••"
                maxLength={6}
                autoFocus
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
                  Unlocking...
                </>
              ) : (
                'Unlock'
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
