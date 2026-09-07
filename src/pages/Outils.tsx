import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, AlertTriangle, Tag, ArrowRight } from 'lucide-react';

interface ToolCard {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  path: string;
  gradient: string;
}

const TOOLS: ToolCard[] = [
  {
    id: 'panic-pro',
    icon: AlertTriangle,
    title: 'Panic Pro',
    description: 'Analyse un panic log iPhone pour identifier la panne probable.',
    path: '/outils/panic-pro',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'price-estimator',
    icon: Tag,
    title: 'Estimation Prix',
    description: 'Prix de vente estimé selon modèle, stockage et état.',
    path: '/outils/estimation-prix',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export default function Outils() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Outils</h1>
          <p className="text-gray-400 mt-1">Fonctionnalités avancées pour ton activité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => navigate(tool.path)}
              className="text-left backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-violet-500/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} bg-opacity-20 flex items-center justify-center shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">{tool.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{tool.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}