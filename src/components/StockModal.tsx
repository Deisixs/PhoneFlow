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
    supplier_link: ""
  });

  const [priceTTC, setPriceTTC] = useState<string>('');
  const [priceHT, setPriceHT] = useState<string>('');

  useEffect(() => {
    if (piece) {
      setFormData(piece);
      // Initialiser avec le prix TTC de la pièce
      setPriceTTC(piece.purchase_price.toString());
      setPriceHT((piece.purchase_price / 1.20).toFixed(2));
    } else {
      setFormData({
        name: "",
        description: "",
        purchase_price: 0,
        quantity: 0,
        supplier: "",
        supplier_link: ""
      });
      setPriceTTC('');
      setPriceHT('');
    }
  }, [piece, isOpen]);

  if (!isOpen) return null;

  // Calcul automatique TTC → HT
  const handleTTCChange = (value: string) => {
    setPriceTTC(value);
    
    if (value === '') {
      setPriceHT('');
      setFormData({ ...formData, purchase_price: 0 });
      return;
    }

    const ttc = parseFloat(value);
    if (isNaN(ttc)) return;

    const ht = ttc / 1.20;
    setPriceHT(ht.toFixed(2));
    setFormData({ ...formData, purchase_price: ttc });
  };

  // Calcul automatique HT → TTC
  const handleHTChange = (value: string) => {
    setPriceHT(value);
    
    if (value === '') {
      setPriceTTC('');
      setFormData({ ...formData, purchase_price: 0 });
      return;
    }

    const ht = parseFloat(value);
    if (isNaN(ht)) return;

    const ttc = ht * 1.20;
    setPriceTTC(ttc.toFixed(2));
    setFormData({ ...formData, purchase_price: ttc });
  };

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
              placeholder="Ex : Écran iPhone 13"
            />
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

          {/* Prix TTC et HT avec calcul automatique */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-px flex-1 bg-white/10"></div>
              <span>Remplissez l'un des deux champs</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prix TTC */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Prix TTC (€) *
                  <span className="text-xs text-gray-500 ml-2">(Toutes Taxes Comprises)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceTTC}
                  onChange={(e) => handleTTCChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                  text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                  placeholder="0.00"
                />
              </div>

              {/* Prix HT */}
              <div>
                <label className="text-sm text-gray-300 mb-1 block">
                  Prix HT (€)
                  <span className="text-xs text-gray-500 ml-2">(Hors Taxe)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceHT}
                  onChange={(e) => handleHTChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                  text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Affichage de la TVA */}
            {priceTTC && priceHT && (
              <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">TVA (20%)</span>
                  <span className="font-semibold text-violet-400">
                    {(parseFloat(priceTTC) - parseFloat(priceHT)).toFixed(2)}€
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quantité */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Quantité *</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
              placeholder="0"
            />
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