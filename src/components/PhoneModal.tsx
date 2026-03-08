import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { generateQRCode } from '../lib/auth';

interface Phone {
  id: string;
  model: string;
  storage: string;
  color: string;
  imei: string;
  condition: string;
  purchase_price: number;
  purchase_date: string;
  purchase_account_id: string | null;
  notes: string;
  sale_price: number | null;
  sale_date: string | null;
  is_sold: boolean;
  qr_code: string | null;
  battery_health: number | null;
}

interface PurchaseAccount {
  id: string;
  name: string;
  color: string;
}

interface PhoneModalProps {
  phone: Phone | null;
  accounts: PurchaseAccount[];
  onClose: () => void;
  onSave: () => void;
}

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const IPHONE_MODELS = [
  // iPhone 16 (2024)
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  
  // iPhone 15 (2023)
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  
  // iPhone 14 (2022)
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Plus',
  'iPhone 14',
  
  // iPhone 13 (2021)
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 13 mini',
  
  // iPhone 12 (2020)
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'iPhone 12 mini',
  
  // iPhone 11 (2019)
  'iPhone 11 Pro Max',
  'iPhone 11 Pro',
  'iPhone 11',
];

// ---- GESTION VIRGULE / POINT ---- //
const parsePriceInput = (val: string) => {
  if (!val.trim()) return "";
  val = val.replace(",", ".");
  const parsed = parseFloat(val);
  return isNaN(parsed) ? "" : parsed;
};

const formatPriceDisplay = (n: number | null) => {
  if (n === null || n === undefined) return "";
  return n.toString().replace(".", ",");
};
// -------------------------------- //

export const PhoneModal: React.FC<PhoneModalProps> = ({ phone, accounts, onClose, onSave }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    model: phone?.model || '',
    storage: phone?.storage || '128GB',
    color: phone?.color || '',
    imei: phone?.imei || '',
    purchase_price: phone?.purchase_price || 0,
    purchase_date: phone?.purchase_date || today,
    battery_health: phone?.battery_health || null,
    purchase_account_id: phone?.purchase_account_id || null,
    notes: phone?.notes || '',
    sale_price: phone?.sale_price || null,
    sale_date: phone?.sale_date || null,
    is_sold: phone?.is_sold || false,
  });

  const [loading, setLoading] = useState(false);
  const [showModelList, setShowModelList] = useState(false);
  const [modelSearch, setModelSearch] = useState(phone?.model || '');
  const { userId } = useAuth();
  const { showToast } = useToast();

  // Filtrer les modèles selon la recherche
  const filteredModels = IPHONE_MODELS.filter(model =>
    model.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const handleModelSelect = (model: string) => {
    setFormData({ ...formData, model });
    setModelSearch(model);
    setShowModelList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phoneData = {
        ...formData,
        user_id: userId!,
        condition: 'Non spécifié',
        qr_code: phone?.id ? (phone.qr_code || null) : generateQRCode('', formData.imei),
      };

      if (phone?.id) {
        const { error } = await supabase
          .from('phones')
          .update(phoneData)
          .eq('id', phone.id);

        if (error) throw error;
        showToast('Téléphone modifié avec succès', 'success');
      } else {
        const { error } = await supabase.from('phones').insert(phoneData);

        if (error) throw error;
        showToast('Téléphone ajouté avec succès', 'success');
      }

      onSave();
    } catch (error: any) {
      showToast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {phone ? 'Modifier le téléphone' : 'Ajouter un téléphone'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Modèle avec auto-complétion */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-2">Modèle</label>
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => {
                  setModelSearch(e.target.value);
                  setFormData({ ...formData, model: e.target.value });
                  setShowModelList(true);
                }}
                onFocus={() => setShowModelList(true)}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                placeholder="Rechercher un modèle..."
                autoComplete="off"
              />
              
              {/* Liste déroulante des modèles */}
              {showModelList && filteredModels.length > 0 && (
                <div className="absolute z-20 w-full mt-1 max-h-60 overflow-y-auto bg-gray-900 border border-white/10 rounded-xl shadow-2xl">
                  {filteredModels.map((model, index) => (
                    <div
                      key={index}
                      onClick={() => handleModelSelect(model)}
                      className="px-4 py-2.5 hover:bg-violet-500/20 cursor-pointer text-white transition-colors border-b border-white/5 last:border-b-0"
                    >
                      {model}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stockage */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stockage</label>
              <select
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                {STORAGE_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-gray-900">{s}</option>
                ))}
              </select>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Couleur</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                placeholder="Noir sidéral"
              />
            </div>

            {/* IMEI */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IMEI</label>
              <input
                type="text"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                placeholder="123456789012345"
              />
            </div>

            {/* Prix d'achat */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix d'achat (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formatPriceDisplay(formData.purchase_price)}
                onChange={(e) => {
                  const parsed = parsePriceInput(e.target.value);
                  setFormData({ ...formData, purchase_price: parsed === "" ? 0 : parsed });
                }}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                placeholder="999,00"
              />
            </div>

            {/* Date d'achat */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date d'achat</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* Santé de la batterie */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Santé de la batterie (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.battery_health || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  battery_health: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                placeholder="100"
              />
            </div>

            {/* Compte d'achat */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Compte d'achat</label>
              <select
                value={formData.purchase_account_id || ''}
                onChange={(e) => setFormData({ ...formData, purchase_account_id: e.target.value || null })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                <option value="" className="bg-gray-900">Aucun / Non spécifié</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-gray-900">{a.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white resize-none placeholder-gray-500"
              placeholder="Notes supplémentaires..."
            />
          </div>

          {/* Checkbox vendu */}
          <div className="border-t border-white/10 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_sold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_sold: e.target.checked,
                    sale_date: e.target.checked ? today : null,
                  })
                }
                className="w-5 h-5 bg-white/5 border-white/10 rounded"
              />
              <span className="text-sm font-medium text-gray-300">Marquer comme vendu</span>
            </label>
          </div>

          {/* Prix + date de vente */}
          {formData.is_sold && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">

              {/* Prix de vente */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prix de vente (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatPriceDisplay(formData.sale_price)}
                  onChange={(e) => {
                    const parsed = parsePriceInput(e.target.value);
                    setFormData({ ...formData, sale_price: parsed === "" ? null : parsed });
                  }}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                  placeholder="1199,00"
                />
              </div>

              {/* Date de vente */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de vente</label>
                <input
                  type="date"
                  value={formData.sale_date || ''}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};