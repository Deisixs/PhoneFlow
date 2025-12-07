import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MaterielExpense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  purchase_date: string;
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

export default function MaterielModal({ isOpen, onClose, onSubmit, expense }: MaterielModalProps) {
  const [formData, setFormData] = useState<MaterielExpense>({
    description: '',
    amount: 0,
    category: 'Autres',
    purchase_date: new Date().toISOString().split('T')[0],
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {expense ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Tournevis de précision"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (€) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d'achat *
            </label>
            <input
              type="date"
              required
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              {expense ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}