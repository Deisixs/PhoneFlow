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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto 
        backdrop-blur-2xl bg-neutral-900/60 border border-white/10 
        rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-neutral-900/40 
          border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {piece ? "Modifier une pièce" : "Ajouter une pièce"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom de la pièce *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              placeholder="Ex : Écran iPhone 13"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="Description de la pièce…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prix */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prix d'achat (€) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            {/* Quantité */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantité *
              </label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </div>

          {/* Fournisseur */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Fournisseur
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              placeholder="Ex : AliExpress, Amazon…"
            />
          </div>

          {/* Lien */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lien du produit
            </label>
            <input
              type="url"
              value={formData.supplier_link}
              onChange={(e) => setFormData({ ...formData, supplier_link: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              placeholder="https://…"
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white 
              rounded-xl transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r 
              from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 
              text-white font-semibold rounded-xl shadow-lg"
            >
              {piece ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
