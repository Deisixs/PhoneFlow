import { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
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

interface UsedPiece {
  stock_piece_id: string;
  quantity_used: number;
  stock_piece: {
    name: string;
    purchase_price: number;
  };
}

interface StockPieceSelectorProps {
  onAddPiece: (piece: UsedPiece) => void;
}

function StockPieceSelector({ onAddPiece }: StockPieceSelectorProps) {
  const { user } = useAuth();
  const [stockPieces, setStockPieces] = useState<StockPiece[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [selectedPieceId, setSelectedPieceId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Charger les pièces du stock
  useEffect(() => {
    fetchStockPieces();
  }, [user]);

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

  const handleAddPiece = () => {
    if (!selectedPieceId || quantity < 1) return;

    const piece = stockPieces.find(p => p.id === selectedPieceId);
    if (!piece) return;

    if (quantity > piece.quantity) {
      alert(`Stock insuffisant ! Disponible: ${piece.quantity}`);
      return;
    }

    // Ajouter la pièce temporairement (pas de sauvegarde en base)
    onAddPiece({
      stock_piece_id: selectedPieceId,
      quantity_used: quantity,
      stock_piece: {
        name: piece.name,
        purchase_price: piece.purchase_price
      }
    });

    // Réinitialiser
    setSelectedPieceId('');
    setQuantity(1);
    setShowSelector(false);
  };

  return (
    <div className="space-y-4">
      {/* Bouton pour ajouter une pièce */}
      {!showSelector && (
        <button
          type="button"
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
              type="button"
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
                type="button"
                onClick={handleAddPiece}
                disabled={!selectedPieceId}
                className="w-full px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-700 
                         disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Ajouter cette pièce
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StockPieceSelector;