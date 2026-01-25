import React, { useState, useEffect } from 'react';
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
    cost: repair?.cost || 0,
    status: repair?.status || 'pending',
    technician: repair?.technician || '',
    photo_url: repair?.photo_url || '',
  });
  const [loading, setLoading] = useState(false);
  const [stockPiecesCost, setStockPiecesCost] = useState(0);
  const { userId } = useAuth();
  const { showToast } = useToast();

  // Charger le coût des pièces au chargement du modal
  useEffect(() => {
    if (repair?.id) {
      loadRepairPartsCost(repair.id);
    }
  }, [repair?.id]);

  const loadRepairPartsCost = async (repairId: string) => {
    try {
      const { data, error } = await supabase
        .from('repair_parts')
        .select(`
          quantity_used,
          stock_piece:stock_pieces(purchase_price)
        `)
        .eq('repair_id', repairId);

      if (error) throw error;

      const totalCost = (data || []).reduce((sum, part: any) => {
        return sum + (part.stock_piece?.purchase_price || 0) * part.quantity_used;
      }, 0);

      setStockPiecesCost(totalCost);
    } catch (error) {
      console.error('Erreur lors du chargement du coût des pièces:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Le coût total = coût manuel + coût des pièces du stock
      const totalCost = formData.cost + stockPiecesCost;

      const repairData = {
        ...formData,
        cost: totalCost, // Coût total incluant les pièces
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
        showToast('Réparation modifiée avec succès', 'success');
      } else {
        const { error } = await supabase.from('repairs').insert(repairData);

        if (error) throw error;
        showToast('Réparation ajoutée avec succès', 'success');
      }

      onSave();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePiecesChange = async (costChange: number) => {
    // Mettre à jour le coût des pièces
    const newStockPiecesCost = stockPiecesCost + costChange;
    setStockPiecesCost(newStockPiecesCost);

    // Mettre à jour immédiatement dans la base de données
    if (repair?.id) {
      try {
        const totalCost = formData.cost + newStockPiecesCost;
        
        const { error } = await supabase
          .from('repairs')
          .update({ cost: totalCost })
          .eq('id', repair.id);

        if (error) throw error;
        
        console.log('Coût mis à jour:', totalCost, '€ (Manuel:', formData.cost, '€ + Pièces:', newStockPiecesCost, '€)');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du coût:', error);
        showToast('Erreur lors de la mise à jour du coût', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {repair ? 'Modifier la réparation' : 'Ajouter une réparation'}
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Téléphone</label>
            <select
              value={formData.phone_id}
              onChange={(e) => setFormData({ ...formData, phone_id: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
            >
              <option value="" className="bg-gray-900">Sélectionner un téléphone</option>
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
              placeholder="Changement d'écran, batterie, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Détails de la réparation</label>
            <textarea
              value={formData.repair_list}
              onChange={(e) => setFormData({ ...formData, repair_list: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white resize-none placeholder-gray-500"
              placeholder="Liste de toutes les réparations effectuées..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Coût manuel (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Coût manuel (main d'œuvre, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Coût total (€)</label>
              <div className="w-full px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <p className="text-xl font-bold text-violet-400">
                  {(formData.cost + stockPiecesCost).toFixed(2)}€
                </p>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Manuel: {formData.cost.toFixed(2)}€ + Pièces: {stockPiecesCost.toFixed(2)}€
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
                <option value="completed" className="bg-gray-900">Terminée</option>
                <option value="failed" className="bg-gray-900">Échec</option>
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

            <div className="md:col-span-2">
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
                Pièces du stock
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
                  💡 Enregistrez d'abord la réparation pour pouvoir ajouter des pièces du stock
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
                'Enregistrer la réparation'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};