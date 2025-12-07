import React, { useState } from 'react';
import { Lock, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { hashPin, validatePin } from '../lib/auth';

interface PINSignupProps {
  onBackToLogin: () => void;
}

export const PINSignup: React.FC<PINSignupProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePin(pin)) {
      showToast('Le code PIN doit contenir 4 à 6 chiffres', 'error');
      return;
    }

    if (pin !== confirmPin) {
      showToast('Les codes PIN ne correspondent pas', 'error');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pin + email,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            display_name: displayName,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const pinHash = await hashPin(pin);

        const { error: profileError } = await supabase.from('users').insert({
          id: authData.user.id,
          email,
          pin_hash: pinHash,
          display_name: displayName,
        });

        if (profileError) throw profileError;

        await supabase.from('audit_logs').insert({
          user_id: authData.user.id,
          action: 'signup',
          metadata: { timestamp: new Date().toISOString() },
        });

        if (authData.session) {
          showToast('Compte créé ! Vous pouvez maintenant vous connecter.', 'success');
          setTimeout(() => {
            onBackToLogin();
          }, 1500);
        } else {
          showToast(
            'Compte créé ! Vérifiez votre e-mail pour confirmer votre adresse, puis connectez-vous.',
            'info'
          );
          setTimeout(() => {
            onBackToLogin();
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      showToast(error.message || 'Échec de création du compte', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/20 to-blue-600/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md px-6">
        <button
          onClick={onBackToLogin}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </button>

        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/50">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Créer un compte
          </h1>
          <p className="text-center text-gray-400 mb-8">
            Rejoignez PhoneFlow
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Nom affiché
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-2">
                Code PIN (4 à 6 chiffres)
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

            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le PIN
              </label>
              <input
                id="confirmPin"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                  Création du compte...
                </>
              ) : (
                'Créer le compte'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
