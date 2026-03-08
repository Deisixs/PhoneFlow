import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Wrench, Smartphone, DollarSign, Package } from 'lucide-react';
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

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'failed', label: 'Échoué' },
];

export const RepairModal: React.FC<RepairModalProps> = ({ repair, phones, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    phone_id: repair?.phone_id || '',
    description: repair?.description || '',
    repair_list: repair?.repair_list || '',
    cost: repair?.cost ?? 0,
    status: repair?.status || 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [usedPieces, setUsedPieces] = useState<UsedPiece[]>([]);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const [showPhoneList, setShowPhoneList] = useState(false);
  const [showStatusList, setShowStatusList] = useState(false);
  
  // Refs pour détecter les clics en dehors
  const phoneRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  
  const { userId } = useAuth();
  const { showToast } = useToast();

  // Fermer les dropdowns si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneRef.current && !phoneRef.current.contains(event.target as Node)) {
        setShowPhoneList(false);
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setShowStatusList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          stock_pieces (
            name,
            purchase_price
          )
        `)
        .eq('repair_id', repair.id);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Données repair_parts chargées:', data);

      const transformedData = data?.map((item: any) => ({
        id: item.id,
        stock_piece_id: item.stock_piece_id,
        quantity_used: item.quantity_used,
        stock_piece: {
          name: item.stock_pieces?.name || 'Pièce supprimée',
          purchase_price: item.stock_pieces?.purchase_price || 0
        }
      })) || [];

      console.log('✅ Pièces transformées:', transformedData);
      setUsedPieces(transformedData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des pièces:', error);
    } finally {
      setLoadingPieces(false);
    }
  };

  useEffect(() => {
    if (repair?.id) {
      console.log('🔄 Chargement initial des pièces pour repair:', repair.id);
      loadUsedPieces();
    }
  }, [repair?.id]);

  const refreshCost = async () => {
    if (!repair?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('cost')
        .eq('id', repair.id)
        .single();
      
      if (data && !error) {
        console.log('💰 Coût mis à jour:', data.cost);
        setFormData(prev => ({ ...prev, cost: data.cost }));
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du coût:', error);
    }
  };

  const handlePhoneSelect = (phoneId: string) => {
    setFormData({ ...formData, phone_id: phoneId });
    setShowPhoneList(false);
  };

  const handleStatusSelect = (status: string) => {
    setFormData({ ...formData, status });
    setShowStatusList(false);
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
        technician: null,
        photo_url: null,
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
      showToast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePiecesChange = async (costChange?: number) => {
    console.log('🔄 handlePiecesChange appelé, rechargement...');
    await refreshCost();
    await loadUsedPieces();
  };

  const handleRemovePiece = async (repairPartId: string) => {
    if (!window.confirm('Retirer cette pièce de la réparation ?')) return;

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

  const selectedPhone = phones.find(p => p.id === formData.phone_id);
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === formData.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-black via-gray-900 to-black animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl shadow-violet-500/20">
        
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative bg-gray-900/95 backdrop-blur-xl border border-violet-500/20 rounded-3xl overflow-hidden">

          {/* HEADER avec gradient */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 px-6 py-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {repair ? 'Modifier la reparation' : 'Ajouter une reparation'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Scrollable content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-5rem)] p-6 space-y-5">

            {/* SECTION INFORMATIONS */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                Informations de la réparation
              </h3>

              <div className="space-y-5">
                {/* Téléphone avec dropdown */}
                <div ref={phoneRef} className="relative">
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    Telephone
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPhoneList(!showPhoneList)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all text-left"
                  >
                    {selectedPhone ? `${selectedPhone.model} - ${selectedPhone.imei}` : 'Selectionner un telephone'}
                  </button>
                  
                  {/* Liste déroulante téléphones */}
                  {showPhoneList && (
                    <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-gray-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20">
                      {phones.map((phone) => (
                        <div
                          key={phone.id}
                          onClick={() => handlePhoneSelect(phone.id)}
                          className={`px-4 py-3 cursor-pointer transition-all border-b border-violet-500/10 last:border-b-0 ${
                            formData.phone_id === phone.id
                              ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 text-white font-semibold'
                              : 'text-white hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-fuchsia-500/20'
                          }`}
                        >
                          {phone.model} - {phone.imei}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                    placeholder="Changement d'ecran, batterie, etc."
                  />
                </div>

                {/* Details de la reparation */}
                <div>
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                    Details de la reparation (Optionnel)
                  </label>
                  <textarea
                    value={formData.repair_list}
                    onChange={(e) => setFormData({ ...formData, repair_list: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white resize-none placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                    placeholder="Liste de toutes les reparations effectuees..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Coût total */}
                  <div>
                    <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Cout total (€)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all"
                        disabled={repair?.id ? true : false}
                      />
                      {repair?.id && (
                        <div className="absolute inset-0 bg-gray-900/30 rounded-xl pointer-events-none"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      {repair?.id 
                        ? '✨ Coût calculé automatiquement avec les pièces du stock'
                        : 'Entrez le coût manuel (0 par défaut)'}
                    </p>
                  </div>

                  {/* Statut avec dropdown */}
                  <div ref={statusRef} className="relative">
                    <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                      Statut
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowStatusList(!showStatusList)}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all text-left"
                    >
                      {selectedStatus?.label || 'En attente'}
                    </button>
                    
                    {/* Liste déroulante statuts */}
                    {showStatusList && (
                      <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-gray-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20">
                        {STATUS_OPTIONS.map((status) => (
                          <div
                            key={status.value}
                            onClick={() => handleStatusSelect(status.value)}
                            className={`px-4 py-3 cursor-pointer transition-all border-b border-violet-500/10 last:border-b-0 ${
                              formData.status === status.value
                                ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 text-white font-semibold'
                                : 'text-white hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-fuchsia-500/20'
                            }`}
                          >
                            {status.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION PIECES DU STOCK */}
            {repair?.id ? (
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  Pieces du stock
                </h3>

                {/* Historique des pièces utilisées */}
                {loadingPieces ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                ) : usedPieces.length > 0 ? (
                  <div className="space-y-3 mb-5">
                    {usedPieces.map((piece) => (
                      <div 
                        key={piece.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/60 to-gray-900/30 border border-violet-500/20 rounded-xl hover:border-violet-500/40 transition-all group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">
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
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Retirer cette pièce"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/40 rounded-xl">
                      <span className="text-sm font-bold text-violet-300 uppercase tracking-wide">Total des pièces</span>
                      <span className="text-xl font-bold text-violet-400">
                        {usedPieces.reduce((sum, piece) => 
                          sum + (piece.quantity_used * piece.stock_piece.purchase_price), 0
                        ).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-900/50 border border-violet-500/20 rounded-xl mb-5 text-center">
                    <p className="text-sm text-gray-400">
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
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
                <p className="text-sm text-blue-300 text-center">
                  💡 Enregistrez d'abord la reparation pour pouvoir ajouter des pieces du stock
                </p>
              </div>
            )}

            {/* BOUTONS */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all border border-violet-500/20"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
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
    </div>
  );
};