import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Send, Sparkles, DollarSign, Wrench, Smartphone } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================================
// PROMPT SYSTÈME — à brancher sur l'API choisie (OpenAI, Claude, etc.)
// dès qu'une clé API sera configurée côté backend (Supabase Edge Function
// recommandé pour ne jamais exposer la clé côté client).
//
// Ce prompt spécialise l'assistant dans le métier réel d'Adam :
// achat/réparation/revente de smartphones en micro-entreprise.
// ============================================================================
export const FLOW_IA_SYSTEM_PROMPT = `Tu es Flow IA, l'assistant intégré à PhoneFlow, une application de gestion pour un micro-entrepreneur qui achète des téléphones (souvent endommagés ou sous-évalués), les répare, et les revend sur Vinted et LeBonCoin.

Ton rôle est d'aider concrètement sur :
1. **Estimation de prix** : prix de rachat d'un téléphone selon son état (modèle, stockage, état écran/batterie/châssis, présence de dégâts), et prix de revente réaliste sur Vinted/LeBonCoin en France.
2. **Diagnostic de panne** : à partir d'une description de symptômes (ex: "ne s'allume plus", "écran noir mais vibre", "chauffe et se coupe"), proposer les causes probables et les pièces à vérifier en premier, par ordre de probabilité et de coût de vérification (du plus simple/moins cher au plus complexe).
3. **Coût et faisabilité de réparation** : donner une fourchette de coût de pièce et de temps de réparation pour les pannes courantes (écran, batterie, vitre arrière, port de charge, caméra, bouton...), et indiquer si une réparation vaut le coup économiquement par rapport à la valeur du téléphone.
4. **Aide à la décision d'achat** : si on te donne un prix d'achat proposé et l'état du téléphone, aide à juger si c'est une bonne affaire (marge potentielle après réparation et revente).

Règles :
- Réponds toujours en français, de façon concise et directe (pas de blabla inutile), à la manière d'un collègue expérimenté du métier.
- Quand tu donnes un prix, précise que c'est une estimation et que le marché (Vinted/LeBonCoin) varie selon la demande locale et la saison.
- Si l'information donnée est insuffisante pour répondre précisément (ex: modèle non précisé), pose une question ciblée avant de répondre, ou donne une fourchette large en le signalant clairement.
- Priorise toujours les vérifications les moins coûteuses/destructives avant de suggérer un remplacement de pièce.
- Tu n'as pas accès en temps réel aux prix du marché : base-toi sur les tendances générales connues et invite à vérifier les annonces récentes similaires pour affiner.`;

const SUGGESTIONS = [
  {
    icon: DollarSign,
    label: 'Estimer un prix de rachat',
    prompt: "Combien devrais-je proposer pour racheter un [modèle] avec [état] ?",
  },
  {
    icon: Wrench,
    label: 'Diagnostiquer une panne',
    prompt: 'Mon téléphone [modèle] présente ce symptôme : [décris le problème]. Quelles sont les causes probables ?',
  },
  {
    icon: Smartphone,
    label: 'Coût de réparation',
    prompt: 'Quel est le coût moyen pour réparer [pièce] sur un [modèle] ?',
  },
];

export default function FlowIA() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // TODO: remplacer par un vrai appel API (via une Supabase Edge Function
    // qui utilise FLOW_IA_SYSTEM_PROMPT + l'historique des messages).
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: input },
      {
        role: 'assistant',
        content: "Flow IA n'est pas encore connecté à un modèle. Cette réponse est un exemple d'affichage — le prompt spécialisé téléphones est déjà prêt côté code.",
      },
    ]);
    setInput('');
  };

  const handleSuggestion = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <button
        onClick={() => navigate('/outils')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux outils
      </button>

      <div className="flex items-center gap-3 shrink-0">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Flow IA</h1>
          <p className="text-gray-400 mt-1">Prix de rachat, diagnostic panne, coût de réparation</p>
        </div>
      </div>

      {/* Zone de conversation */}
      <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-1">Flow IA arrive bientôt</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              Estimation de prix de rachat/revente, diagnostic de pannes, et coûts de réparation — spécialisé pour ton activité.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
              {SUGGESTIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSuggestion(s.prompt)}
                    className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-violet-500/30 transition text-left"
                  >
                    <Icon className="w-5 h-5 text-violet-400" />
                    <span className="text-xs text-gray-300 text-center">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-white/10 text-gray-200'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Barre de saisie */}
      <form onSubmit={handleSend} className="flex gap-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex : Prix de rachat pour un iPhone 13 écran cassé ?"
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-semibold transition shadow-lg shadow-violet-600/20 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}