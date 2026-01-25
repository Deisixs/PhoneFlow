import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface StockPiece {
  id?: string;
  name: string;
  description: string;
  purchase_price: number;
  quantity: number;
  supplier: string;
  supplier_link: string;
  phone_model: string; // ⬅️ AJOUTÉ
}

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (piece: StockPiece) => void;
  piece?: StockPiece;
}

export default function StockModal({ isOpen, onClose, onSubmit, piece }: StockModalProps) {
  const [formData, setFormData] = useState<StockPiece>({
    name: "",
    description: "",
    purchase_price: 0,
    quantity: 0,
    supplier: "",
    supplier_link: "",
    phone_model: "iPhone 15" // ⬅️ AJOUTÉ
  });

  useEffect(() => {
    if (piece) {
      setFormData(piece);
    } else {
      setFormData({
        name: "",
        description: "",
        purchase_price: 0,
        quantity: 0,
        supplier: "",
        supplier_link: "",
        phone_model: "iPhone 15" // ⬅️ AJOUTÉ
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto 
      bg-neutral-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 bg-neutral-900/40 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {piece ? "Modifier une pièce" : "Ajouter une pièce"}
          </h2>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Nom */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Nom *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              placeholder="Ex : Écran OLED"
            />
          </div>

          {/* Modèle de téléphone - NOUVEAU */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Modèle de téléphone *</label>
            <select
              required
              value={formData.phone_model}
              onChange={(e) => setFormData({ ...formData, phone_model: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="iPhone 15">iPhone 15</option>
              <option value="iPhone 15 Plus">iPhone 15 Plus</option>
              <option value="iPhone 15 Pro">iPhone 15 Pro</option>
              <option value="iPhone 15 Pro Max">iPhone 15 Pro Max</option>
              <option value="iPhone 14">iPhone 14</option>
              <option value="iPhone 14 Plus">iPhone 14 Plus</option>
              <option value="iPhone 14 Pro">iPhone 14 Pro</option>
              <option value="iPhone 14 Pro Max">iPhone 14 Pro Max</option>
              <option value="iPhone 13">iPhone 13</option>
              <option value="iPhone 13 Mini">iPhone 13 Mini</option>
              <option value="iPhone 13 Pro">iPhone 13 Pro</option>
              <option value="iPhone 13 Pro Max">iPhone 13 Pro Max</option>
              <option value="iPhone 12">iPhone 12</option>
              <option value="iPhone 12 Mini">iPhone 12 Mini</option>
              <option value="iPhone 12 Pro">iPhone 12 Pro</option>
              <option value="iPhone 12 Pro Max">iPhone 12 Pro Max</option>
              <option value="iPhone 11">iPhone 11</option>
              <option value="iPhone 11 Pro">iPhone 11 Pro</option>
              <option value="iPhone 11 Pro Max">iPhone 11 Pro Max</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="Description de la pièce…"
            />
          </div>

          {/* Prix + Quantité */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Prix d'achat (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) =>
                  setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              />
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-1 block">Quantité *</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </div>

          {/* Fournisseur */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Fournisseur</label>
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
            <label className="text-sm text-gray-300 mb-1 block">Lien du produit</label>
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
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 
              rounded-xl text-white transition"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white 
              bg-gradient-to-r from-violet-600 to-fuchsia-600 
              hover:from-violet-500 hover:to-fuchsia-500 shadow-lg"
            >
              {piece ? "Mettre à jour" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}