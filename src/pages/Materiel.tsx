import React, { useEffect, useState } from 'react';
import { Wrench, Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MaterielModal from '../components/MaterielModal';
import { useToast } from '../components/Toast';

interface MaterielExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  purchase_date: string;
  created_at: string;
}

export default function Materiel() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<MaterielExpense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MaterielExpense | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { showToast } = useToast();

  const CATEGORIES = ['Outils', 'Consommables', 'Colle', 'Nettoyage', 'Emballage', 'Autres'];

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('materiel_expenses')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showToast('Erreur lors du chargement des dépenses', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async (expense: Omit<MaterielExpense, 'id' | 'created_at'>) => {
    try {
      if (selectedExpense) {
        const { error } = await supabase
          .from('materiel_expenses')
          .update(expense)
          .eq('id', selectedExpense.id);

        if (error) throw error;
        showToast('Dépense mise à jour avec succès', 'success');
      } else {
        const { error } = await supabase
          .from('materiel_expenses')
          .insert([{ ...expense, user_id: user?.id }]);

        if (error) throw error;
        showToast('Dépense ajoutée avec succès', 'success');
      }
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const { error } = await supabase
        .from('materiel_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Dépense supprimée avec succès', 'success');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const openModal = (expense?: MaterielExpense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedExpense(undefined);
    setIsModalOpen(false);
  };

  const filteredExpenses = filterCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const thisMonthExpenses = expenses
    .filter(e => new Date(e.purchase_date).getMonth() === new Date().getMonth())
    .reduce((sum, exp) => sum + exp.amount, 0);

  const expensesByCategory = CATEGORIES.map(cat => ({
    category: cat,
    total: expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  }));

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Matériel & Consommables</h1>
          <p className="text-gray-400 mt-1">Suivez vos dépenses d'outils et consommables</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
        >
          <Plus size={20} />
          Ajouter une dépense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total dépenses</p>
              <p className="text-2xl font-bold text-white">{totalExpenses.toFixed(2)} €</p>
            </div>
            <Wrench className="text-blue-400" size={32} />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Ce mois</p>
              <p className="text-2xl font-bold text-white">{thisMonthExpenses.toFixed(2)} €</p>
            </div>
            <TrendingUp className="text-green-400" size={32} />
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Nombre de dépenses</p>
              <p className="text-2xl font-bold text-white">{expenses.length}</p>
            </div>
            <Wrench className="text-orange-400" size={32} />
          </div>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Dépenses par catégorie</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {expensesByCategory.map(({ category, total }) => (
            <div key={category} className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">{category}</p>
              <p className="text-lg font-bold text-white">{total.toFixed(2)} €</p>
            </div>
          ))}
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterCategory === 'all'
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Toutes
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Wrench size={48} className="mx-auto mb-4 text-gray-600" />
                    <p className="text-lg font-medium text-white">Aucune dépense enregistrée</p>
                    <p className="text-sm text-gray-400">Ajoutez votre première dépense pour commencer</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white">
                      {new Date(expense.purchase_date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-white">
                      {expense.amount.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal(expense)}
                          className="p-2 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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

      <MaterielModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleAddOrUpdate}
        expense={selectedExpense}
      />
    </div>
  );
}