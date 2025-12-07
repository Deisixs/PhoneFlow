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
        showToast('Phone updated successfully', 'success');
      } else {
        const { error } = await supabase.from('phones').insert(phoneData);

        if (error) throw error;
        showToast('Phone added successfully', 'success');
      }

      onSave();
    } catch (error: any) {
      showToast(error.message || 'Failed to save phone', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-black/95 sm:bg-white/10 border-t sm:border border-white/20 sm:rounded-2xl shadow-2xl animate-slide-up">
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {phone ? 'Modifier' : 'Nouveau'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 pb-24 sm:pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
                placeholder="iPhone 14 Pro"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Storage</label>
              <select
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
              >
                {STORAGE_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-gray-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
                placeholder="Space Black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">IMEI</label>
              <input
                type="text"
                value={formData.imei}
                onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
                placeholder="123456789012345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
              >
                {CONDITION_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-gray-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Prix d'achat (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date d'achat</label>
              <input
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                required
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Compte</label>
              <select
                value={formData.purchase_account_id || ''}
                onChange={(e) => setFormData({ ...formData, purchase_account_id: e.target.value === '' ? null : e.target.value })}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
              >
                <option value="" className="bg-gray-900">Sélectionner</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id} className="bg-gray-900">
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
              placeholder="Notes additionnelles..."
            />
          </div>

          <div className="border-t border-white/10 pt-4">
            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
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
                className="w-6 h-6 rounded bg-white/5 border-white/10 text-violet-600 focus:ring-violet-500/50"
              />
              <span className="text-base font-medium text-gray-300">Marquer comme vendu</span>
            </label>
          </div>

          {formData.is_sold && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prix de vente (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sale_price || ''}
                  onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || null })}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date de vente</label>
                <input
                  type="date"
                  value={formData.sale_date || ''}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px]"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 sticky sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-black/95 sm:bg-transparent border-t sm:border-t-0 border-white/10 -mx-4 sm:mx-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white rounded-xl transition-all min-h-[44px] active:scale-95"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:from-violet-700 active:to-fuchsia-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] active:scale-95"
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
