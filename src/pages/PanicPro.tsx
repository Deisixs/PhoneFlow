import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function PanicPro() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate('/outils')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux outils
      </button>

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Panic Pro</h1>
          <p className="text-gray-400 mt-1">Bientôt disponible</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-orange-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-1">En cours de développement</h3>
        <p className="text-gray-500 text-sm">Cet outil arrive bientôt.</p>
      </div>
    </div>
  );
}
