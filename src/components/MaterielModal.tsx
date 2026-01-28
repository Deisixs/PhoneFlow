import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MaterielExpense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  purchase_date: string;
  product_link?: string; // ← AJOUTÉ
}

interface MaterielModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: MaterielExpense) => void;
  expense?: MaterielExpense;
}

const CATEGORIES = [
  'Outils',
  'Consommables',
  'Colle',
  'Nettoyage',
  'Emballage',
  'Autres'
];

// --- GESTION VIRGULE / POINT ---
const parsePriceInput = (val: string) => {
  if (!val.trim()) return "";
  val = val.replace(",", ".");
  const parsed = parseFloat(val);
  return isNaN(parsed) ? "" : parsed;
};

const formatPriceDisplay = (n: number | null) => {
  if (n === null || n === undefined) return "";
  return n.toString().replace(".", ",");
};
// -------------------------------

export default function MaterielModal({ isOpen, onClose, onSubmit, expense }: MaterielModalProps) {
  const [formData, setFormData] = useState<MaterielExpense>({
    description: '',
    amount: 0,
    category: 'Autres',
    purchase_date: new Date().toISOString().split('T')[0],
    product_link: '', // ← AJOUTÉ
  });

  useEffect(() => {
    if (expense) {
      setFormData(expense);
    } else {
      setFormData({
        description: '',
        amount: 0,
        category: 'Autres',
        purchase_date: new Date().toISOString().split('T')[0],
        product_link: '', // ← AJOUTÉ
      });
    }
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

        {/* HEADER */}
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            {expense ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* DESCRIPTION */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 focus:outline-none focus:ring-2 
              focus:ring-violet-500/50"
              placeholder="Ex: Tournevis de précision"
            />
          </div>

          {/* ========== NOUVEAU CHAMP : LIEN PRODUIT ========== */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Lien produit
              <span className="text-gray-500 text-xs ml-2">(optionnel)</span>
            </label>
            <input
              type="url"
              value={formData.product_link || ''}
              onChange={(e) => setFormData({ ...formData, product_link: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white placeholder-gray-500 focus:outline-none focus:ring-2 
              focus:ring-violet-500/50"
              placeholder="https://exemple.com/produit"
            />
          </div>
          {/* ================================================== */}

          {/* AMOUNT + CATEGORY */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* MONTANT € */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Montant (€) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={formatPriceDisplay(formData.amount)}
                onChange={(e) => {
                  const parsed = parsePriceInput(e.target.value);
                  setFormData({
                    ...formData,
                    amount: parsed === "" ? 0 : parsed
                  });
                }}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                text-white placeholder-gray-500 focus:outline-none focus:ring-2 
                focus:ring-violet-500/50"
              />
            </div>

            {/* CATÉGORIE */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Catégorie *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
                text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                ))}
              </select>
            </div>

          </div>

          {/* DATE */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date d'achat *
            </label>
            <input
              type="date"
              required
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl 
              text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 
              text-white rounded-xl transition-all"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 
              hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold 
              rounded-xl transition-all shadow-lg shadow-violet-500/30"
            >
              {expense ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}