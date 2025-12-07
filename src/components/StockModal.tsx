import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface StockPiece {
  id?: string;
  name: string;
  description: string;
  purchase_price: number;
  quantity: number;
  supplier: string;
  product_link: string;
  created_at?: string;
  user_id?: string;
}

interface StockPieceModalProps {
  piece: StockPiece | null;
  onClose: () => void;
  onSave: () => void;
}

export const StockPieceModal: React.FC<StockPieceModalProps> = ({
  piece,
  onClose,
  onSave
}) => {
  const { userId } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: piece?.name || "",
    description: piece?.description || "",
    purchase_price: piece?.purchase_price || 0,
    quantity: piece?.quantity || 1,
    supplier: piece?.supplier || "",
    product_link: piece?.product_link || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        user_id: userId,
      };

      if (piece?.id) {
        const { error } = await supabase
          .from("stock_pieces")
          .update(payload)
          .eq("id", piece.id);

        if (error) throw error;
        showToast("Pièce modifiée avec succès", "success");
      } else {
        const { error } = await supabase
          .from("stock_pieces")
          .insert(payload);

        if (error) throw error;
        showToast("Pièce ajoutée avec succès", "success");
      }

      onSave();
    } catch (err: any) {
      showToast(err.message || "Erreur lors de l’enregistrement", "error");
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

        {/* HEADER IDENTIQUE */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {piece ? "Modifier la pièce" : "Ajouter une pièce"}
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORMULAIRE IDENTIQUE STYLE */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de la pièce *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500"
              placeholder="Ex: Écran iPhone 13"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white resize-none"
              placeholder="Description de la pièce..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prix d'achat (€) *
              </label>
              <input
                type="number"
                required
                value={formData.purchase_price}
                onChange={e =>
                  setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={e =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fournisseur
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={e => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              placeholder="Ex: AliExpress, Amazon..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lien du produit
            </label>
            <input
              type="url"
              value={formData.product_link}
              onChange={e => setFormData({ ...formData, product_link: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
              placeholder="https://..."
            />
          </div>

          {/* BUTTONS IDENTIQUES */}
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
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enregistrement…
                </>
              ) : (
                "Ajouter"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
