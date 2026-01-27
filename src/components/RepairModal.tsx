import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import StockPieceSelector from './StockPieceSelector';

interface Repair {
  id: string;
  phone_id: string;
  description: string;
  repair_list: string;
  cost: number;
  status: string;
  technician: string | null;
  photo_url: string | null;
}

interface Phone {
  id: string;
  model: string;
  imei: string;
}

interface RepairModalProps {
  repair: Repair | null;
  phones: Phone[];
  onClose: () => void;
  onSave: () => void;
}

export const RepairModal: React.FC<RepairModalProps> = ({ repair, phones, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    phone_id: repair?.phone_id || '',
    description: repair?.description || '',
    repair_list: repair?.repair_list || '',
    cost: repair?.cost ?? 0, // Utilisez ?? au lieu de || pour gérer 0
    status: repair?.status || 'pending',
    technician: repair?.technician || '',
    photo_url: repair?.photo_url || '',
  });
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const repairData = {
        ...formData,
        cost: Number(formData.cost) || 0, // Convertir en nombre et forcer 0 si invalide
        user_id: userId!,
        technician: formData.technician || null,
        photo_url: formData.photo_url || null,
      };

      if (repair?.id) {
        const { error } = await supabase
          .from('repairs')
          .update(repairData)
          .eq('id', repair.id);

        if (error) throw error;
        showToast('Reparation modifiee avec succes', 'success');
      } else {
        const { error } = await supabase.from('repairs').insert(repairData);

        if (error) throw error;
        showToast('Reparation ajoutee avec succes', 'success');
      }

      onSave();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePiecesChange = (costChange: number) => {
    console.log('Cout des pieces modifie de', costChange, 'euros');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {repair ? 'Modifier la reparation' : 'Ajouter une reparation'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Telephone</label>
            <select
              value={formData.phone_id}
              onChange={(e) => setFormData({ ...formData, phone_id: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
            >
              <option value="" className="bg-gray-900">Selectionner un telephone</option>
              {phones.map((phone) => (
                <option key={phone.id} value={phone.id} className="bg-gray-900">
                  {phone.model} - {phone.imei}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
              placeholder="Changement d'ecran, batterie, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Details de la reparation</label>
            <textarea
              value={formData.repair_list}
              onChange={(e) => setFormData({ ...formData, repair_list: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white resize-none placeholder-gray-500"
              placeholder="Liste de toutes les reparations effectuees..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Cout manuel (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Le cout des pieces du stock s'ajoute automatiquement
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Statut</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              >
                <option value="pending" className="bg-gray-900">En attente</option>
                <option value="in_progress" className="bg-gray-900">En cours</option>
                <option value="completed" className="bg-gray-900">Terminee</option>
                <option value="failed" className="bg-gray-900">Echec</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Technicien (Optionnel)</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                placeholder="Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">URL Photo (Optionnel)</label>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
                placeholder="https://..."
              />
            </div>

          </div>

          {repair?.id ? (
            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-violet-400 rounded-full"></span>
                Pieces du stock
              </h3>
              <StockPieceSelector 
                repairId={repair.id}
                onPiecesChange={handlePiecesChange}
              />
            </div>
          ) : (
            <div className="border-t border-white/10 pt-6 mt-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-300">
                  💡 Enregistrez d'abord la reparation pour pouvoir ajouter des pieces du stock
                </p>
              </div>
            </div>
          )}

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
                'Enregistrer la reparation'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};