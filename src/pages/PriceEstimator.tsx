import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tag, Smartphone, Package, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// GRILLE DE PRIX DE RÉFÉRENCE — prix de vente estimé pour un iPhone
// 128GB en "Bon état" (référence). Ajustés ensuite par stockage/état/batterie.
//
// ⚠️ Ce sont des ESTIMATIONS DE DÉPART basées sur des ordres de grandeur
// généraux du marché occasion, PAS des données Vinted/LeBonCoin en temps réel.
// À corriger toi-même avec tes ventes réelles au fil du temps (facile à
// éditer ci-dessous — un seul chiffre par modèle).
// ============================================================================
const BASE_PRICES: Record<string, number> = {
  'iPhone X': 70,
  'iPhone XS': 80,
  'iPhone XS Max': 90,
  'iPhone XR': 75,
  'iPhone 11': 100,
  'iPhone 11 Pro': 120,
  'iPhone 11 Pro Max': 140,
  'iPhone SE (2e gen)': 70,
  'iPhone 12 mini': 110,
  'iPhone 12': 130,
  'iPhone 12 Pro': 160,
  'iPhone 12 Pro Max': 190,
  'iPhone 13 mini': 140,
  'iPhone 13': 170,
  'iPhone 13 Pro': 220,
  'iPhone 13 Pro Max': 260,
  'iPhone SE (3e gen)': 100,
  'iPhone 14': 220,
  'iPhone 14 Plus': 250,
  'iPhone 14 Pro': 320,
  'iPhone 14 Pro Max': 370,
  'iPhone 15': 320,
  'iPhone 15 Plus': 360,
  'iPhone 15 Pro': 450,
  'iPhone 15 Pro Max': 520,
  'iPhone 16': 420,
  'iPhone 16 Plus': 460,
  'iPhone 16 Pro': 600,
  'iPhone 16 Pro Max': 680,
};

const STORAGE_ADJUSTMENTS: Record<string, number> = {
  '64GB': -15,
  '128GB': 0,
  '256GB': 40,
  '512GB': 90,
  '1TB': 140,
};

interface ConditionOption {
  id: string;
  label: string;
  description: string;
  multiplier: number;
}

const CONDITIONS: ConditionOption[] = [
  { id: 'comme_neuf', label: 'Comme neuf', description: 'Aucune trace visible, tout fonctionnel', multiplier: 1.20 },
  { id: 'tres_bon', label: 'Très bon état', description: 'Micro-rayures à peine visibles', multiplier: 1.10 },
  { id: 'bon', label: 'Bon état', description: 'Traces d\'usure visibles à l\'usage normal', multiplier: 1.00 },
  { id: 'correct', label: 'État correct', description: 'Rayures/bosses nettement visibles', multiplier: 0.80 },
  { id: 'a_reparer', label: 'À réparer / pour pièces', description: 'Panne fonctionnelle ou casse importante', multiplier: 0.40 },
];

interface Phone {
  id: string;
  model: string;
  storage: string;
  color: string;
  battery_health: number | null;
  is_sold: boolean;
  archived: boolean;
}

export default function PriceEstimator() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [mode, setMode] = useState<'inventory' | 'manual'>('inventory');
  const [inventoryPhones, setInventoryPhones] = useState<Phone[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [selectedPhoneId, setSelectedPhoneId] = useState('');

  const [model, setModel] = useState('');
  const [storage, setStorage] = useState('128GB');
  const [batteryHealth, setBatteryHealth] = useState<string>('');
  const [conditionId, setConditionId] = useState('bon');

  useEffect(() => {
    if (userId) loadInventory();
  }, [userId]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('phones')
        .select('id, model, storage, color, battery_health, is_sold, archived')
        .eq('user_id', userId!)
        .eq('is_sold', false)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventoryPhones(data || []);
    } catch {
      // silencieux
    } finally {
      setLoadingInventory(false);
    }
  };

  const handleSelectInventoryPhone = (phoneId: string) => {
    setSelectedPhoneId(phoneId);
    const phone = inventoryPhones.find((p) => p.id === phoneId);
    if (phone) {
      setModel(phone.model);
      setStorage(phone.storage);
      setBatteryHealth(phone.battery_health !== null ? phone.battery_health.toString() : '');
    }
  };

  const switchMode = (newMode: 'inventory' | 'manual') => {
    setMode(newMode);
    setSelectedPhoneId('');
    setModel('');
    setStorage('128GB');
    setBatteryHealth('');
  };

  // Recherche floue du modèle dans la grille (au cas où le nom exact ne matche pas parfaitement)
  const findBasePrice = (modelName: string): number | null => {
    if (BASE_PRICES[modelName] !== undefined) return BASE_PRICES[modelName];
    const normalized = modelName.toLowerCase().trim();
    const match = Object.keys(BASE_PRICES).find((key) => key.toLowerCase() === normalized);
    return match ? BASE_PRICES[match] : null;
  };

  const basePrice = model ? findBasePrice(model) : null;
  const storageAdjustment = STORAGE_ADJUSTMENTS[storage] ?? 0;
  const condition = CONDITIONS.find((c) => c.id === conditionId)!;

  const batteryNum = batteryHealth ? parseInt(batteryHealth) : null;
  const batteryAdjustment =
    batteryNum !== null && batteryNum < 85
      ? batteryNum < 70
        ? -30
        : batteryNum < 80
        ? -15
        : -5
      : 0;

  const priceBeforeCondition = basePrice !== null ? basePrice + storageAdjustment + batteryAdjustment : null;
  const estimatedPrice =
    priceBeforeCondition !== null ? Math.max(10, Math.round(priceBeforeCondition * condition.multiplier)) : null;

  const modelOptions = Object.keys(BASE_PRICES);

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
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Tag className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Estimation Prix</h1>
          <p className="text-gray-400 mt-1">Prix de vente estimé selon modèle, stockage et état</p>
        </div>
      </div>

      {/* Toggle mode */}
      <div className="flex gap-2">
        <button
          onClick={() => switchMode('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
            mode === 'inventory'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Package className="w-4 h-4" />
          Depuis mon inventaire
        </button>
        <button
          onClick={() => switchMode('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
            mode === 'manual'
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Simulation libre
        </button>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">

        {mode === 'inventory' ? (
          <div>
            <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
              Téléphone de l'inventaire
            </label>
            {loadingInventory ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Chargement...
              </div>
            ) : inventoryPhones.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Aucun téléphone disponible (en stock, non vendu) dans l'inventaire.</p>
            ) : (
              <select
                value={selectedPhoneId}
                onChange={(e) => handleSelectInventoryPhone(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all"
              >
                <option value="">Sélectionner un téléphone...</option>
                {inventoryPhones.map((phone) => (
                  <option key={phone.id} value={phone.id}>
                    {phone.model} · {phone.storage} · {phone.color}
                    {phone.battery_health !== null ? ` · 🔋 ${phone.battery_health}%` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                Modèle
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all"
              >
                <option value="">Sélectionner un modèle...</option>
                {modelOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                Stockage
              </label>
              <select
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all"
              >
                {Object.keys(STORAGE_ADJUSTMENTS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                Batterie (%) <span className="text-gray-500 normal-case font-normal">(optionnel)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={batteryHealth}
                onChange={(e) => setBatteryHealth(e.target.value)}
                placeholder="Inconnu"
                className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Si sélectionné depuis inventaire : affichage lecture seule + batterie éditable */}
        {mode === 'inventory' && selectedPhoneId && (
          <div>
            <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
              Batterie (%) <span className="text-gray-500 normal-case font-normal">(modifiable)</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={batteryHealth}
              onChange={(e) => setBatteryHealth(e.target.value)}
              placeholder="Inconnu"
              className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
            />
          </div>
        )}

        {/* État */}
        <div>
          <label className="block text-sm font-semibold text-violet-300 mb-3 uppercase tracking-wide">
            État général
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setConditionId(c.id)}
                className={`p-3 rounded-xl border text-left transition ${
                  conditionId === c.id
                    ? 'bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border-violet-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <p className="text-sm font-semibold text-white">{c.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{c.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Résultat */}
      {model && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2 mb-4">
            <Smartphone className="w-4 h-4" />
            Estimation
          </h3>

          {estimatedPrice === null ? (
            <p className="text-sm text-gray-500 italic">
              Modèle non présent dans la grille de référence. Ajoute-le toi-même dans <code className="text-violet-400">BASE_PRICES</code> pour l'inclure.
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-4xl font-bold text-emerald-400">{estimatedPrice}€</span>
                <span className="text-sm text-gray-400">prix de vente estimé</span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-400 border-t border-white/5 pt-4">
                <div className="flex justify-between">
                  <span>Prix de base ({model}, 128GB, bon état)</span>
                  <span className="text-gray-300">{basePrice}€</span>
                </div>
                {storageAdjustment !== 0 && (
                  <div className="flex justify-between">
                    <span>Ajustement stockage ({storage})</span>
                    <span className="text-gray-300">{storageAdjustment > 0 ? '+' : ''}{storageAdjustment}€</span>
                  </div>
                )}
                {batteryAdjustment !== 0 && (
                  <div className="flex justify-between">
                    <span>Ajustement batterie ({batteryNum}%)</span>
                    <span className="text-gray-300">{batteryAdjustment}€</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Coefficient état — {condition.label}</span>
                  <span className="text-gray-300">×{condition.multiplier.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-600 mt-4 italic">
                Estimation basée sur une grille de référence générale — vérifie toujours les annonces récentes similaires sur Vinted/LeBonCoin pour affiner selon la demande du moment.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
