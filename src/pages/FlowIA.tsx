import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Send, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FlowIA() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // TODO: brancher sur une vraie API IA (OpenAI / Claude) une fois la clé API prête.
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: input },
      { role: 'assistant', content: "Flow IA n'est pas encore connecté à un modèle. Cette réponse est un exemple d'affichage." },
    ]);
    setInput('');
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
          <p className="text-gray-400 mt-1">Pose tes questions sur les réparations et les prix</p>
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
            <p className="text-gray-500 text-sm max-w-sm">
              Ici tu pourras poser des questions sur les réparations, les prix des pièces, ou demander des conseils.
            </p>
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
          placeholder="Écris ta question..."
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
