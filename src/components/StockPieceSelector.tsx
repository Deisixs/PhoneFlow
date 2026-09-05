import { useState, useEffect, useRef } from 'react';
import { X, Plus, AlertCircle, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStockPieces();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const filteredPieces = stockPieces.filter((piece) =>
    piece.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPiece = stockPieces.find((p) => p.id === selectedPieceId);

  const handleSelectPiece = (piece: StockPiece) => {
    setSelectedPieceId(piece.id);
    setSearchTerm(piece.name);
    setShowDropdown(false);
  };

  const handleAddPiece = () => {
    if (!selectedPieceId || quantity < 1) return;

    const piece = stockPieces.find(p => p.id === selectedPieceId);
    if (!piece) {
      console.error('❌ Pièce non trouvée dans la liste');
      return;
    }

    if (quantity > piece.quantity) {
      alert(`Stock insuffisant ! Disponible: ${piece.quantity}`);
      return;
    }

    onAddPiece({
      stock_piece_id: piece.id,
      quantity_used: quantity,
      stock_piece: {
        name: piece.name,
        purchase_price: piece.purchase_price
      }
    });

    // Réinitialiser
    setSelectedPieceId('');
    setSearchTerm('');
    setQuantity(1);
    setShowSelector(false);
  };

  return (
    <div className="space-y-4">
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
              <div ref={searchRef} className="relative">
                <label className="block text-sm text-gray-400 mb-2">Pièce</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedPieceId('');
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Rechercher une pièce..."
                    autoComplete="off"
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg 
                             text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                {showDropdown && (
                  <div className="absolute z-30 w-full mt-1 max-h-64 overflow-y-auto bg-gray-900 border border-gray-700 rounded-lg shadow-2xl">
                    {filteredPieces.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-gray-500 italic">
                        Aucune pièce trouvée
                      </div>
                    ) : (
                      filteredPieces.map((piece) => (
                        <div
                          key={piece.id}
                          onClick={() => handleSelectPiece(piece)}
                          className={`px-3 py-2.5 cursor-pointer transition-all border-b border-gray-800 last:border-b-0 text-sm ${
                            selectedPieceId === piece.id
                              ? 'bg-violet-500/20 text-white font-semibold'
                              : 'text-gray-200 hover:bg-white/5'
                          }`}
                        >
                          {piece.name} <span className="text-gray-500">- {piece.purchase_price}€ (Stock: {piece.quantity})</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
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

              {selectedPiece && (
                <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                  <p className="text-sm text-violet-300">
                    Coût: {(selectedPiece.purchase_price * quantity).toFixed(2)}€
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