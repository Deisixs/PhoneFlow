import React, { useEffect, useState } from 'react';
import { Package, Plus, Pencil, Trash2, ExternalLink, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import StockModal from '../components/StockModal';
import { useToast } from '../components/Toast';

interface StockPiece {
  id: string;
  name: string;
  description: string;
  purchase_price: number;
  supplier: string;
  supplier_link: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export default function Stock() {
  const { user } = useAuth();
  const [pieces, setPieces] = useState<StockPiece[]>([]);
  const [filteredPieces, setFilteredPieces] = useState<StockPiece[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<StockPiece | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPieces();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = pieces.filter(piece =>
        piece.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        piece.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPieces(filtered);
    } else {
      setFilteredPieces(pieces);
    }
  }, [searchTerm, pieces]);

  const fetchPieces = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('stock_pieces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPieces(data || []);
      setFilteredPieces(data || []);
    } catch (error) {
      console.error('Error fetching pieces:', error);
      showToast('Erreur lors du chargement des pièces', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async (piece: Omit<StockPiece, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (selectedPiece) {
        const { error } = await supabase
          .from('stock_pieces')
          .update(piece)
          .eq('id', selectedPiece.id);

        if (error) throw error;
        showToast('Pièce mise à jour avec succès', 'success');
      } else {
        const { error } = await supabase
          .from('stock_pieces')
          .insert([{ ...piece, user_id: user?.id }]);

        if (error) throw error;
        showToast('Pièce ajoutée avec succès', 'success');
      }
      fetchPieces();
    } catch (error) {
      console.error('Error saving piece:', error);
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) return;

    try {
      const { error } = await supabase
        .from('stock_pieces')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Pièce supprimée avec succès', 'success');
      fetchPieces();
    } catch (error) {
      console.error('Error deleting piece:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const openModal = (piece?: StockPiece) => {
    setSelectedPiece(piece);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPiece(undefined);
    setIsModalOpen(false);
  };

  const totalValue = pieces.reduce((sum, piece) => sum + (piece.purchase_price * piece.quantity), 0);
  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const lowStockCount = pieces.filter(piece => piece.quantity < 5).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Stock de Pièces</h1>
          <p className="text-gray-400 mt-1">Gérez votre inventaire de pièces détachées</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
        >
          <Plus size={20} />
          Ajouter une pièce
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Valeur totale</p>
              <p className="text-2xl font-bold text-white">{totalValue.toFixed(2)} €</p>
            </div>
            <Package className="text-blue-400" size={32} />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total pièces</p>
              <p className="text-2xl font-bold text-white">{totalPieces}</p>
            </div>
            <Package className="text-green-400" size={32} />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Stock faible</p>
              <p className="text-2xl font-bold text-white">{lowStockCount}</p>
            </div>
            <Package className="text-orange-400" size={32} />
          </div>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom ou fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pièce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Prix d'achat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Valeur totale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPieces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium text-white">Aucune pièce en stock</p>
                    <p className="text-sm text-gray-400">Ajoutez votre première pièce pour commencer</p>
                  </td>
                </tr>
              ) : (
                filteredPieces.map((piece) => (
                  <tr key={piece.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{piece.name}</div>
                        {piece.description && (
                          <div className="text-sm text-gray-400">{piece.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{piece.supplier || '-'}</span>
                        {piece.supplier_link && (
                          <a
                            href={piece.supplier_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-400 hover:text-violet-300"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      {piece.purchase_price.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        piece.quantity === 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : piece.quantity < 5
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {piece.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {(piece.purchase_price * piece.quantity).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(piece)}
                          className="p-2 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(piece.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StockModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleAddOrUpdate}
        piece={selectedPiece}
      />
    </div>
  );
}