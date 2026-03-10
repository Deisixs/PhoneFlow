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
  id?: string;
  stock_piece_id: string;
  quantity_used: number;
  stock_piece: {
    name: string;
    purchase_price: number;
  };
  isTemporary?: boolean;
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
  
  const phoneRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  
  const { userId } = useAuth();
  const { showToast } = useToast();

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

  const loadUsedPieces = async () => {
    if (!repair?.id) return;
    
    setLoadingPieces(true);
    try {
      // Charger les pièces avec les colonnes piece_name et piece_price
      const { data, error } = await supabase
        .from('repair_parts')
        .select('id, stock_piece_id, quantity_used, piece_name, piece_price')
        .eq('repair_id', repair.id);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('🔍 Données repair_parts:', data);

      const transformedData = data?.map((item: any) => ({
        id: item.id,
        stock_piece_id: item.stock_piece_id,
        quantity_used: item.quantity_used,
        stock_piece: {
          name: item.piece_name || 'Pièce supprimée',
          purchase_price: item.piece_price || 0
        },
        isTemporary: false
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
      loadUsedPieces();
    }
  }, [repair?.id]);

  const handlePhoneSelect = (phoneId: string) => {
    setFormData({ ...formData, phone_id: phoneId });
    setShowPhoneList(false);
  };

  const handleStatusSelect = (status: string) => {
    setFormData({ ...formData, status });
    setShowStatusList(false);
  };

  const handleAddTemporaryPiece = (piece: UsedPiece) => {
    console.log('📝 Ajout temporaire de pièce');
    const newPieces = [...usedPieces, { ...piece, isTemporary: true }];
    setUsedPieces(newPieces);
    
    // Calculer le coût TOTAL de toutes les pièces
    const totalCost = newPieces.reduce(
      (sum, p) => sum + (p.quantity_used * p.stock_piece.purchase_price), 
      0
    );
    console.log('💰 Nouveau coût total:', totalCost);
    setFormData(prev => ({ ...prev, cost: totalCost }));
  };

  const handleRemovePiece = async (piece: UsedPiece, index: number) => {
    if (!window.confirm('Retirer cette pièce de la réparation ?')) return;

    if (!piece.isTemporary && piece.id && repair?.id) {
      try {
        const { error: deleteError } = await supabase
          .from('repair_parts')
          .delete()
          .eq('id', piece.id);

        if (deleteError) throw deleteError;

        const { data: currentStock, error: fetchError } = await supabase
          .from('stock_pieces')
          .select('quantity')
          .eq('id', piece.stock_piece_id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (currentStock) {
          const newQuantity = currentStock.quantity + piece.quantity_used;

          const { error: updateError } = await supabase
            .from('stock_pieces')
            .update({ quantity: newQuantity })
            .eq('id', piece.stock_piece_id);

          if (updateError) throw updateError;
        }

        const costReduction = piece.quantity_used * piece.stock_piece.purchase_price;
        const newCost = formData.cost - costReduction;

        const { error: costError } = await supabase
          .from('repairs')
          .update({ cost: newCost })
          .eq('id', repair.id);

        if (costError) throw costError;

        setFormData(prev => ({ ...prev, cost: newCost }));

        showToast('Piece retiree avec succes', 'success');
        await loadUsedPieces();
        return;
      } catch (error: any) {
        showToast(error.message || 'Erreur lors de la suppression', 'error');
        return;
      }
    }

    const newPieces = usedPieces.filter((_, i) => i !== index);
    setUsedPieces(newPieces);

    const newCost = newPieces.reduce(
      (sum, p) => sum + (p.quantity_used * p.stock_piece.purchase_price), 
      0
    );
    setFormData(prev => ({ ...prev, cost: newCost }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let repairId = repair?.id;

      // 1. Sauvegarder/Mettre à jour la réparation
      if (repair?.id) {
        const { error } = await supabase
          .from('repairs')
          .update({
            phone_id: formData.phone_id,
            description: formData.description,
            repair_list: formData.repair_list,
            status: formData.status,
            cost: formData.cost,
          })
          .eq('id', repair.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('repairs')
          .insert({
            phone_id: formData.phone_id,
            description: formData.description,
            repair_list: formData.repair_list,
            status: formData.status,
            user_id: userId!,
            cost: formData.cost,
            technician: null,
            photo_url: null,
          })
          .select()
          .single();

        if (error) throw error;
        repairId = data.id;
      }

      // 2. Traiter TOUTES les pièces temporaires
      const temporaryPieces = usedPieces.filter(p => p.isTemporary);
      
      if (temporaryPieces.length > 0 && repairId) {
        console.log('💾 Sauvegarde de', temporaryPieces.length, 'pièces temporaires');

        for (const piece of temporaryPieces) {
          // 1. Récupérer les infos AVANT de modifier le stock
          const { data: stockPiece, error: fetchError } = await supabase
            .from('stock_pieces')
            .select('id, quantity, name, purchase_price')
            .eq('id', piece.stock_piece_id)
            .maybeSingle();

          if (fetchError) {
            console.error('❌ Erreur récupération pièce:', fetchError);
            continue;
          }

          if (!stockPiece) {
            console.error('❌ Pièce introuvable:', piece.stock_piece_id);
            continue;
          }

          console.log(`📦 Pièce trouvée: ${stockPiece.name}, stock: ${stockPiece.quantity}`);

          // 2. Insérer dans repair_parts AVEC le nom et le prix
          const { error: insertError } = await supabase
            .from('repair_parts')
            .insert({
              repair_id: repairId,
              stock_piece_id: piece.stock_piece_id,
              quantity_used: piece.quantity_used,
              piece_name: stockPiece.name,
              piece_price: stockPiece.purchase_price
            });

          if (insertError) {
            console.error('❌ Erreur insertion repair_part:', insertError);
            continue;
          }

          console.log('✅ Pièce insérée dans repair_parts');

          // 3. Mettre à jour le stock (peut supprimer si = 0)
          const newQuantity = stockPiece.quantity - piece.quantity_used;

          console.log(`📊 ${stockPiece.name}: ${stockPiece.quantity} → ${newQuantity}`);

          if (newQuantity <= 0) {
            const { error: deleteError } = await supabase
              .from('stock_pieces')
              .delete()
              .eq('id', piece.stock_piece_id);

            if (deleteError) {
              console.error('❌ Erreur suppression pièce:', deleteError);
            } else {
              console.log('🗑️ Pièce supprimée du stock (quantité = 0)');
            }
          } else {
            const { error: updateError } = await supabase
              .from('stock_pieces')
              .update({ quantity: newQuantity })
              .eq('id', piece.stock_piece_id);

            if (updateError) {
              console.error('❌ Erreur mise à jour stock:', updateError);
            } else {
              console.log('✅ Stock mis à jour');
            }
          }
        }

        console.log('✅ Toutes les pièces ont été traitées');
      }

      showToast(repair ? 'Reparation modifiee avec succes' : 'Reparation ajoutee avec succes', 'success');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onSave();
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      showToast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedPhone = phones.find(p => p.id === formData.phone_id);
  const selectedStatus = STATUS_OPTIONS.find(s => s.value === formData.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-black via-gray-900 to-black animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl shadow-violet-500/20">
        
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 pointer-events-none"></div>
        
        <div className="relative bg-gray-900/95 backdrop-blur-xl border border-violet-500/20 rounded-3xl overflow-hidden">

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

          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-5rem)] p-6 space-y-5">

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                Informations de la réparation
              </h3>

              <div className="space-y-5">
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
                        readOnly
                        className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all cursor-not-allowed"
                      />
                      <div className="absolute inset-0 bg-gray-900/30 rounded-xl pointer-events-none"></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      ✨ Coût calculé automatiquement avec les pièces
                    </p>
                  </div>

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

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                Pieces du stock
              </h3>

              {loadingPieces ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                </div>
              ) : usedPieces.length > 0 ? (
                <div className="space-y-3 mb-5">
                  {usedPieces.map((piece, index) => (
                    <div 
                      key={piece.id || `temp-${index}`}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/60 to-gray-900/30 border border-violet-500/20 rounded-xl hover:border-violet-500/40 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white flex items-center gap-2">
                            {piece.stock_piece.name}
                            {piece.isTemporary && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                Non sauvegardé
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            Quantité: {piece.quantity_used} × {piece.stock_piece.purchase_price.toFixed(2)}€ = {(piece.quantity_used * piece.stock_piece.purchase_price).toFixed(2)}€
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePiece(piece, index)}
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

              <StockPieceSelector 
                onAddPiece={handleAddTemporaryPiece}
              />
            </div>

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