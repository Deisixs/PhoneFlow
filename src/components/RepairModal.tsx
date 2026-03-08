import React, { useState, useEffect } from 'react';
import { X, Loader2, Package, Trash2 } from 'lucide-react';
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

interface UsedPiece {
  id: string;
  stock_piece_id: string;
  quantity_used: number;
  stock_piece: {
    name: string;
    purchase_price: number;
  };
}

export const RepairModal: React.FC<RepairModalProps> = ({ repair, phones, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    phone_id: repair?.phone_id || '',
    description: repair?.description || '',
    repair_list: repair?.repair_list || '',
    cost: repair?.cost ?? 0,
    status: repair?.status || 'pending',
    technician: repair?.technician || '',
    photo_url: repair?.photo_url || '',
  });
  const [loading, setLoading] = useState(false);
  const [usedPieces, setUsedPieces] = useState<UsedPiece[]>([]);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const { userId } = useAuth();
  const { showToast } = useToast();

  // Charger les pièces utilisées
  const loadUsedPieces = async () => {
    if (!repair?.id) return;
    
    setLoadingPieces(true);
    try {
      const { data, error } = await supabase
        .from('repair_parts')
        .select(`
          id,
          stock_piece_id,
          quantity_used,
          stock_pieces!inner (
            name,
            purchase_price
          )
        `)
        .eq('repair_id', repair.id);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('Données repair_parts chargées:', data);

      // Transformer les données pour matcher l'interface
      const transformedData = data?.map((item: any) => ({
        id: item.id,
        stock_piece_id: item.stock_piece_id,
        quantity_used: item.quantity_used,
        stock_piece: {
          name: item.stock_pieces.name,
          purchase_price: item.stock_pieces.purchase_price
        }
      })) || [];

      setUsedPieces(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces:', error);
      showToast('Erreur lors du chargement des pièces', 'error');
    } finally {
      setLoadingPieces(false);
    }
  };

  useEffect(() => {
    if (repair?.id) {
      loadUsedPieces();
    }
  }, [repair?.id]);

  // Recharger le coût depuis la base de données
  const refreshCost = async () => {
    if (!repair?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('cost')
        .eq('id', repair.id)
        .single();
      
      if (data && !error) {
        setFormData(prev => ({ ...prev, cost: data.cost }));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du coût:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const repairData = {
        phone_id: formData.phone_id,
        description: formData.description,
        repair_list: formData.repair_list,
        status: formData.status,
        user_id: userId!,
        technician: formData.technician || null,
        photo_url: formData.photo_url || null,
        ...(repair?.id ? {} : { cost: Number(formData.cost) || 0 })
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

  const handlePiecesChange = async () => {
    await refreshCost();
    await loadUsedPieces();
  };

  const handleRemovePiece = async (repairPartId: string) => {
    try {
      const { error } = await supabase
        .from('repair_parts')
        .delete()
        .eq('id', repairPartId);

      if (error) throw error;
      
      showToast('Piece retiree avec succes', 'success');
      await handlePiecesChange();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la suppression', 'error');
    }
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Cout total (€)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
                  disabled={repair?.id ? true : false}
                />
                {repair?.id && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl pointer-events-none"></div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {repair?.id 
                  ? '✨ Coût calculé automatiquement avec les pièces du stock'
                  : 'Entrez le coût manuel (0 par défaut)'}
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

              {/* Historique des pièces utilisées */}
              {loadingPieces ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              ) : usedPieces.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {usedPieces.map((piece) => (
                    <div 
                      key={piece.id}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                          <Package className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {piece.stock_piece.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Quantité: {piece.quantity_used} × {piece.stock_piece.purchase_price.toFixed(2)}€ = {(piece.quantity_used * piece.stock_piece.purchase_price).toFixed(2)}€
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePiece(piece.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Retirer cette pièce"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg mt-3">
                    <span className="text-sm font-semibold text-violet-300">Total des pièces</span>
                    <span className="text-lg font-bold text-violet-400">
                      {usedPieces.reduce((sum, piece) => 
                        sum + (piece.quantity_used * piece.stock_piece.purchase_price), 0
                      ).toFixed(2)}€
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg mb-4">
                  <p className="text-sm text-gray-400 text-center">
                    Aucune pièce du stock utilisée pour cette réparation
                  </p>
                </div>
              )}

              {/* Sélecteur pour ajouter des pièces */}
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