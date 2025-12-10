import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { generateQRCode } from '../lib/auth';

const normalizePrice = (value: string) => {
  if (!value) return "";
  value = value.replace(",", ".");
  const number = parseFloat(value);
  return isNaN(number) ? "" : number.toFixed(2);
};

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
const CONDITION_OPTIONS = ['Neuf', 'Excellent', 'Très bon', 'Moyen', 'Mauvais'];

export const PhoneModal: React.FC<PhoneModalProps> = ({ phone, accounts, onClose, onSave }) => {

  const [formData, setFormData] = useState({
    model: phone?.model || '',
    storage: phone?.storage || '128GB',
    color: phone?.color || '',
    imei: phone?.imei || '',
    condition: phone?.condition || 'Excellent',
    purchase_price: phone?.purchase_price || 0,
    purchase_date: phone?.purchase_date || new Date().toISOString().split('T')[0],
    purchase_account_id: phone?.purchase_account_id || null,
    notes: phone?.notes || '',
    sale_price: phone?.sale_price || null,
    sale_date: phone?.sale_date || null,
    is_sold: phone?.is_sold || false,
  });

  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phoneData = {
        ...formData,
        user_id: userId!,
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
      showToast(error.message || 'Erreur lors de l’enregistrement', 'error');
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
            
            {/* --- MODEL --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Modèle</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* --- STORAGE --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Stockage</label>
              <select
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                {STORAGE_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-gray-900">{s}</option>
                ))}
              </select>
            </div>

            {/* --- COLOR --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Couleur</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* --- IMEI --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IMEI</label>
              <input
                type="text"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* --- CONDITION --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">État</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-gray-900">{c}</option>
                ))}
              </select>
            </div>

            {/* --- PURCHASE PRICE (CORRIGÉ FR) --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix d'achat (€)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.purchase_price.toString().replace(".", ",")}
                onChange={(e) => {
                  const clean = e.target.value.replace(",", ".");
                  setFormData({
                    ...formData,
                    purchase_price: parseFloat(clean) || 0
                  });
                }}
                onBlur={(e) => {
                  const normalized = normalizePrice(e.target.value);
                  setFormData({
                    ...formData,
                    purchase_price: parseFloat(normalized) || 0
                  });
                }}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* --- PURCHASE DATE --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date d'achat</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* --- ACCOUNT --- */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Compte d'achat</label>
              <select
                value={formData.purchase_account_id || ''}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_account_id: e.target.value || null })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                <option value="" className="bg-gray-900">Aucun / Non spécifié</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id} className="bg-gray-900">{a.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* --- NOTES --- */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
            />
          </div>

          {/* --- SOLD CHECKBOX --- */}
          <div className="border-t border-white/10 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_sold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_sold: e.target.checked,
                    sale_date: e.target.checked ? new Date().toISOString().split('T')[0] : null,
                  })
                }
                className="w-5 h-5 bg-white/5 border-white/10 rounded"
              />
              <span className="text-sm font-medium text-gray-300">Marquer comme vendu</span>
            </label>
          </div>

          {/* --- SALE PRICE (CORRIGÉ FR) --- */}
          {formData.is_sold && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prix de vente (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={(formData.sale_price ?? "").toString().replace(".", ",")}
                  onChange={(e) => {
                    const clean = e.target.value.replace(",", ".");
                    setFormData({
                      ...formData,
                      sale_price: parseFloat(clean) || null
                    });
                  }}
                  onBlur={(e) => {
                    const normalized = normalizePrice(e.target.value);
                    setFormData({
                      ...formData,
                      sale_price: parseFloat(normalized) || null
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>

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

          {/* --- BUTTONS --- */}
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
