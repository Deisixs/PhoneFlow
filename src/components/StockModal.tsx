import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface StockPiece {
  id?: string;
  name: string;
  description: string;
  purchase_price: number;
  supplier: string;
  supplier_link: string;
  quantity: number;
}

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (piece: StockPiece) => void;
  piece?: StockPiece;
}

export default function StockModal({ isOpen, onClose, onSubmit, piece }: StockModalProps) {
  const [formData, setFormData] = useState<StockPiece>({
    name: '',
    description: '',
    purchase_price: 0,
    supplier: '',
    supplier_link: '',
    quantity: 0,
  });

  useEffect(() => {
    if (piece) {
      setFormData(piece);
    } else {
      setFormData({
        name: '',
        description: '',
        purchase_price: 0,
        supplier: '',
        supplier_link: '',
        quantity: 0,
      });
    }
  }, [piece, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      
      <div className="w-full max-w-2xl bg-neutral-900/80 border border-white/10 rounded-2xl shadow-2xl">
        
        {/* HEADER EXACTEMENT IDENTIQUE */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-violet-400">
            {piece ? "Modifier la pièce" : "Ajouter une pièce"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg transition">
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Nom */}
          <div>
            <label className="text-sm font-medium text-gray-300">Nom de la pièce *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 mt-1 bg-neutral-800 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 outline-none"
              placeholder="Ex : Écran iPhone 13"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 mt-1 bg-neutral-800 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 outline-none"
              rows={3}
              placeholder="Description de la pièce..."
            />
          </div>

          {/* Prix & quantité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Prix d'achat (€) *</label>
              <input
                type="number"
                required
                value={formData.purchase_price}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-3 mt-1 bg-neutral-800 border border-white/10 rounded-lg text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Quantité *</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 mt-1 bg-neutral-800 border border-white/10 rounded-lg text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>

          {/* Fournisseur */}
          <div>
            <label className="text-sm font-medium text-gray-300">Fournisseur</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-3 mt-1 bg-neutral-800 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 outline-none"
              placeholder="Ex : AliExpress, Amazon..."
            />
          </div>

          {/* Lien */}
          <div>
            <label className="text-sm font-medium text-gray-300">Lien du produit</label>
            <input
              type="url"
              value={formData.supplier_link}
              onChange={(e) => setFormData({ ...formData, supplier_link: e.target.value })}
              className="w-full px-4 py-3 mt-1 bg-neutral-800 border border-white/10 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-violet-500 outline-none"
              placeholder="https://..."
            />
          </div>

          {/* Boutons identiques au modal téléphone */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-200 transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex-1 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition"
            >
              {piece ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
