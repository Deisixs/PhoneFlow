import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Package, RefreshCw, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Phone {
  id: string;
  model: string;
  storage: string;
  color: string;
  battery_health: number | null;
  notes: string;
  diagnostic_notes: string | null;
  parts_purchased: string;
  purchase_price: number;
  sale_price: number | null;
  is_sold: boolean;
  archived: boolean;
}

interface ConditionOption {
  id: string;
  label: string;
  vintedLabel: string;
}

const CONDITIONS: ConditionOption[] = [
  { id: 'comme_neuf', label: 'Comme neuf', vintedLabel: 'Neuf sans étiquette' },
  { id: 'tres_bon', label: 'Très bon état', vintedLabel: 'Très bon état' },
  { id: 'bon', label: 'Bon état', vintedLabel: 'Bon état' },
  { id: 'correct', label: 'État correct / satisfaisant', vintedLabel: 'Satisfaisant' },
];

type Platform = 'vinted' | 'leboncoin';

const ACCESSORY_OPTIONS = [
  { id: 'boite', label: 'Boîte d\'origine' },
  { id: 'chargeur', label: 'Chargeur' },
  { id: 'cable', label: 'Câble' },
  { id: 'ecouteurs', label: 'Écouteurs' },
  { id: 'coque', label: 'Coque' },
];

export default function AdGenerator() {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [phones, setPhones] = useState<Phone[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(true);
  const [selectedPhoneId, setSelectedPhoneId] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);

  const [conditionId, setConditionId] = useState('bon');
  const [price, setPrice] = useState('');
  const [accessories, setAccessories] = useState<Set<string>>(new Set());
  const [platform, setPlatform] = useState<Platform>('vinted');

  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [copiedField, setCopiedField] = useState<'title' | 'description' | null>(null);

  useEffect(() => {
    if (userId) loadPhones();
  }, [userId]);

  const loadPhones = async () => {
    try {
      const { data, error } = await supabase
        .from('phones')
        .select('*')
        .eq('user_id', userId!)
        .eq('is_sold', false)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhones(data || []);
    } catch {
      // silencieux
    } finally {
      setLoadingPhones(false);
    }
  };

  const handleSelectPhone = (phoneId: string) => {
    setSelectedPhoneId(phoneId);
    const phone = phones.find((p) => p.id === phoneId) || null;
    setSelectedPhone(phone);
    if (phone) {
      setPrice(phone.sale_price !== null ? phone.sale_price.toString() : '');
      // Détecte automatiquement la présence d'une boîte dans "Achat pièces"
      const newAccessories = new Set<string>();
      if (phone.parts_purchased && /bo[iî]te/i.test(phone.parts_purchased)) {
        newAccessories.add('boite');
      }
      setAccessories(newAccessories);
    }
    setGeneratedTitle('');
    setGeneratedDescription('');
  };

  const toggleAccessory = (id: string) => {
    setAccessories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    if (!selectedPhone) return;

    const condition = CONDITIONS.find((c) => c.id === conditionId)!;
    const accessoryLabels = ACCESSORY_OPTIONS.filter((a) => accessories.has(a.id)).map((a) => a.label);

    // ===== TITRE =====
    const title = `${selectedPhone.model} ${selectedPhone.storage} ${selectedPhone.color} - ${condition.label}`;
    setGeneratedTitle(title);

    // ===== DESCRIPTION =====
    const lines: string[] = [];

    if (platform === 'vinted') {
      lines.push(`📱 ${selectedPhone.model} ${selectedPhone.storage} ${selectedPhone.color}`);
      lines.push('');
      lines.push(`État : ${condition.label}`);
      if (selectedPhone.battery_health !== null) {
        lines.push(`🔋 Batterie : ${selectedPhone.battery_health}%`);
      }
    } else {
      lines.push(`${selectedPhone.model} — ${selectedPhone.storage} — ${selectedPhone.color}`);
      lines.push('');
      lines.push(`État : ${condition.label}`);
      if (selectedPhone.battery_health !== null) {
        lines.push(`Batterie : ${selectedPhone.battery_health}%`);
      }
    }

    // Détails à partir des notes / diagnostic
    const details: string[] = [];
    if (selectedPhone.notes && selectedPhone.notes.trim()) {
      details.push(selectedPhone.notes.trim());
    }
    if (selectedPhone.diagnostic_notes && selectedPhone.diagnostic_notes.trim()) {
      details.push(selectedPhone.diagnostic_notes.trim());
    }
    if (details.length > 0) {
      lines.push('');
      lines.push(platform === 'vinted' ? '📋 Détails :' : 'Détails :');
      details.forEach((d) => lines.push(`- ${d}`));
    }

    // Accessoires
    if (accessoryLabels.length > 0) {
      lines.push('');
      lines.push(platform === 'vinted' ? '📦 Inclus :' : 'Fourni avec :');
      accessoryLabels.forEach((a) => lines.push(`- ${a}`));
    } else {
      lines.push('');
      lines.push('Téléphone seul (pas de boîte ni accessoires).');
    }

    // Phrase de clôture
    lines.push('');
    if (platform === 'vinted') {
      lines.push('N\'hésitez pas si vous avez des questions ! Envoi rapide et soigné 📦✨');
    } else {
      lines.push('Vendu en l\'état, testé et fonctionnel. Contactez-moi pour toute question ou pour convenir d\'une remise en main propre.');
    }

    setGeneratedDescription(lines.join('\n'));
  };

  const handleCopy = async (field: 'title' | 'description') => {
    const text = field === 'title' ? generatedTitle : generatedDescription;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // silencieux
    }
  };

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
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Générateur d'annonces</h1>
          <p className="text-gray-400 mt-1">Titre + description prêts à copier pour Vinted / LeBonCoin</p>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide flex items-center gap-2">
            <Package className="w-4 h-4" />
            Téléphone
          </label>
          {loadingPhones ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Chargement...
            </div>
          ) : phones.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Aucun téléphone disponible dans l'inventaire.</p>
          ) : (
            <select
              value={selectedPhoneId}
              onChange={(e) => handleSelectPhone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all"
            >
              <option value="">Sélectionner un téléphone...</option>
              {phones.map((phone) => (
                <option key={phone.id} value={phone.id}>
                  {phone.model} · {phone.storage} · {phone.color}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedPhone && (
          <>
            {/* Plateforme */}
            <div>
              <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                Plateforme
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('vinted')}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                    platform === 'vinted'
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Vinted
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('leboncoin')}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                    platform === 'leboncoin'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  LeBonCoin
                </button>
              </div>
            </div>

            {/* État */}
            <div>
              <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                État général
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConditionId(c.id)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition border ${
                      conditionId === c.id
                        ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 border-violet-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessoires */}
            <div>
              <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                Accessoires inclus
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCESSORY_OPTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAccessory(a.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition border ${
                      accessories.has(a.id)
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prix */}
            <div>
              <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                Prix de vente (€) <span className="text-gray-500 normal-case font-normal">(optionnel, pour info)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ex : 250"
                className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              className="w-full px-4 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition"
            >
              Générer l'annonce
            </button>
          </>
        )}
      </div>

      {/* Résultat */}
      {generatedTitle && (
        <div className="space-y-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Titre</span>
              <button
                onClick={() => handleCopy('title')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition"
              >
                {copiedField === 'title' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <p className="text-white font-semibold">{generatedTitle}</p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">Description</span>
              <button
                onClick={() => handleCopy('description')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition"
              >
                {copiedField === 'description' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{generatedDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
