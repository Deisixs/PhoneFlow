import { useState, useEffect } from 'react';
import { X, Plus, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StockPiece {
  id: string;
  name: string;
  description: string;
  purchase_price: number;
  quantity: number;
  supplier: string;
  supplier_link: string;
}

interface RepairPart {
  id: string;
  repair_id: string;
  stock_piece_id: string;
  quantity_used: number;
  stock_piece?: StockPiece;
}

interface StockPieceSelectorProps {
  repairId: string;
  onPiecesChange?: (costChange: number) => void;
}

export default function StockPieceSelector({ repairId, onPiecesChange }: StockPieceSelectorProps) {
  const { user } = useAuth();
  const [stockPieces, setStockPieces] = useState<StockPiece[]>([]);
  const [selectedPieces, setSelectedPieces] = useState<RepairPart[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedPieceId, setSelectedPieceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Charger les pièces du stock
  useEffect(() => {
    fetchStockPieces();
    if (repairId) {
      fetchRepairParts();
    }
  }, [repairId, user]);

  const fetchStockPieces = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('stock_pieces')
        .select('*')
        .eq('user_id', user.id)
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;
      setStockPieces(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces:', error);
    }
  };

  const fetchRepairParts = async () => {
    try {
      const { data, error } = await supabase
        .from('repair_parts')
        .select(`
          *,
          stock_piece:stock_pieces(*)
        `)
        .eq('repair_id', repairId);

      if (error) throw error;
      setSelectedPieces(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces de réparation:', error);
    }
  };

  const handleAddPiece = async () => {
    if (!selectedPieceId || quantity < 1 || !user) return;

    const piece = stockPieces.find(p => p.id === selectedPieceId);
    if (!piece) return;

    if (quantity > piece.quantity) {
      alert(`Stock insuffisant ! Disponible: ${piece.quantity}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('repair_parts')
        .insert({
          repair_id: repairId,
          stock_piece_id: selectedPieceId,
          quantity_used: quantity
        })
        .select(`
          *,
          stock_piece:stock_pieces(*)
        `)
        .single();

      if (error) throw error;

      // Ajouter à la liste locale
      setSelectedPieces([...selectedPieces, data]);
      
      // Mettre à jour le stock localement
      setStockPieces(stockPieces.map(p => 
        p.id === selectedPieceId 
          ? { ...p, quantity: p.quantity - quantity }
          : p
      ));

      // Notifier le parent du changement de coût
      const totalCost = piece.purchase_price * quantity;
      onPiecesChange?.(totalCost);

      // Réinitialiser
      setSelectedPieceId('');
      setQuantity(1);
      setShowSelector(false);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la pièce:', error);
      alert('Erreur lors de l\'ajout de la pièce');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePiece = async (partId: string, pieceId: string, quantityUsed: number) => {
    if (!window.confirm('Retirer cette pièce de la réparation ?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('repair_parts')
        .delete()
        .eq('id', partId);

      if (error) throw error;

      // Retirer de la liste locale
      setSelectedPieces(selectedPieces.filter(p => p.id !== partId));
      
      // Remettre en stock localement
      setStockPieces(stockPieces.map(p => 
        p.id === pieceId 
          ? { ...p, quantity: p.quantity + quantityUsed }
          : p
      ));

      // Notifier le parent
      const piece = stockPieces.find(p => p.id === pieceId);
      if (piece) {
        const costReduction = -(piece.purchase_price * quantityUsed);
        onPiecesChange?.(costReduction);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const getTotalCost = () => {
    return selectedPieces.reduce((total, part) => {
      const piece = part.stock_piece as StockPiece;
      return total + (piece?.purchase_price || 0) * part.quantity_used;
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Liste des pièces sélectionnées */}
      {selectedPieces.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-200">Pièces utilisées</h4>
          {selectedPieces.map((part) => {
            const piece = part.stock_piece as StockPiece;
            return (
              <div 
                key={part.id} 
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-violet-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {piece?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Quantité: {part.quantity_used} × {piece?.purchase_price}€
                      = {(part.quantity_used * piece?.purchase_price).toFixed(2)}€
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePiece(part.id, part.stock_piece_id, part.quantity_used)}
                  disabled={loading}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            );
          })}
          
          {/* Coût total */}
          <div className="flex justify-between items-center p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
            <span className="text-sm font-medium text-violet-300">Coût total des pièces</span>
            <span className="text-lg font-bold text-violet-400">{getTotalCost().toFixed(2)}€</span>
          </div>
        </div>
      )}

      {/* Bouton pour ajouter une pièce */}
      {!showSelector && (
        <button
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 
                     text-violet-300 rounded-lg transition-colors border border-violet-500/20"
        >
          <Plus className="w-4 h-4" />
          Ajouter une pièce du stock
        </button>
      )}

      {/* Sélecteur de pièce */}
      {showSelector && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-200">Sélectionner une pièce</h4>
            <button 
              onClick={() => setShowSelector(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {stockPieces.length === 0 ? (
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              Aucune pièce en stock
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Pièce</label>
                <select
                  value={selectedPieceId}
                  onChange={(e) => setSelectedPieceId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg 
                           text-white focus:outline-none focus:border-violet-500"
                >
                  <option value="">Sélectionner une pièce...</option>
                  {stockPieces.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.name} - {piece.purchase_price}€ (Stock: {piece.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Quantité</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg 
                           text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              {selectedPieceId && (
                <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                  <p className="text-sm text-violet-300">
                    Coût: {(stockPieces.find(p => p.id === selectedPieceId)?.purchase_price! * quantity).toFixed(2)}€
                  </p>
                </div>
              )}

              <button
                onClick={handleAddPiece}
                disabled={!selectedPieceId || loading}
                className="w-full px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-700 
                         disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter cette pièce'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}