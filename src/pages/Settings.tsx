import React, { useState, useEffect } from 'react';
import {
  Lock,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit,
  Shield,
  Database,
  Palette,
  Clock,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { hashPin, validatePin } from '../lib/auth';
import Papa from 'papaparse';

interface PurchaseAccount {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export const Settings: React.FC = () => {
  const [accounts, setAccounts] = useState<PurchaseAccount[]>([]);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountColor, setNewAccountColor] = useState('#8b5cf6');
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId, user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (userId) {
      loadAccounts();
    }
  }, [userId]);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_accounts')
        .select('*')
        .eq('user_id', userId!);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      showToast('Échec du chargement des comptes', 'error');
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      showToast('Veuillez entrer un nom de compte', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('purchase_accounts').insert({
        user_id: userId!,
        name: newAccountName,
        color: newAccountColor,
        icon: 'shopping-bag',
      });

      if (error) throw error;

      setNewAccountName('');
      setNewAccountColor('#8b5cf6');
      loadAccounts();
      showToast('Compte ajouté avec succès', 'success');
    } catch (error) {
      showToast('Échec de l\'ajout du compte', 'error');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;

    try {
      const { error } = await supabase.from('purchase_accounts').delete().eq('id', id);

      if (error) throw error;

      setAccounts(accounts.filter((a) => a.id !== id));
      showToast('Compte supprimé avec succès', 'success');
    } catch (error) {
      showToast('Échec de la suppression du compte', 'error');
    }
  };

  const handleChangePin = async () => {
    if (!validatePin(newPin)) {
      showToast('Le code PIN doit contenir 4 à 6 chiffres', 'error');
      return;
    }

    if (newPin !== confirmPin) {
      showToast('Les codes PIN ne correspondent pas', 'error');
      return;
    }

    setLoading(true);
    try {
      const pinHash = await hashPin(newPin);

      const { error } = await supabase
        .from('users')
        .update({ pin_hash: pinHash })
        .eq('id', userId!);

      if (error) throw error;

      if (user?.email) {
        await supabase.auth.updateUser({
          password: newPin + user.email,
        });
      }

      setShowPinModal(false);
      setNewPin('');
      setConfirmPin('');
      showToast('Code PIN modifié avec succès', 'success');
    } catch (error) {
      showToast('Échec de la modification du code PIN', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data: phones, error: phonesError } = await supabase
        .from('phones')
        .select('*')
        .eq('user_id', userId!);

      if (phonesError) throw phonesError;

      const { data: repairs, error: repairsError } = await supabase
        .from('repairs')
        .select('*')
        .eq('user_id', userId!);

      if (repairsError) throw repairsError;

      const phonesCSV = Papa.unparse(phones || []);
      const repairsCSV = Papa.unparse(repairs || []);

      const blob1 = new Blob([phonesCSV], { type: 'text/csv' });
      const blob2 = new Blob([repairsCSV], { type: 'text/csv' });

      const link1 = document.createElement('a');
      link1.href = URL.createObjectURL(blob1);
      link1.download = `phones-export-${Date.now()}.csv`;
      link1.click();

      const link2 = document.createElement('a');
      link2.href = URL.createObjectURL(blob2);
      link2.download = `repairs-export-${Date.now()}.csv`;
      link2.click();

      showToast('Données exportées avec succès', 'success');
    } catch (error) {
      showToast('Échec de l\'exportation des données', 'error');
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const { errors } = Papa.parse(text, { header: true });

      if (errors.length > 0) {
        showToast(`Erreurs d'analyse CSV : ${errors.length}`, 'error');
        return;
      }

      showToast('Fonctionnalité d\'importation CSV à venir', 'info');
    } catch (error) {
      showToast('Échec de l\'importation CSV', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Paramètres
        </h1>
        <p className="text-gray-400 mt-1">Configurez les préférences de votre application</p>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sécurité</h2>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowPinModal(true)}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              <div className="text-left">
                <p className="text-white font-semibold">Changer le code PIN</p>
                <p className="text-sm text-gray-400">Modifier votre code PIN d'authentification</p>
              </div>
            </div>
            <Edit className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>

          <div className="px-5 py-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <p className="text-white font-semibold">Délai d'expiration de session</p>
            </div>
            <p className="text-sm text-gray-400 ml-8">
              Verrouillage automatique après 30 minutes d'inactivité
            </p>
          </div>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Comptes d'achat</h2>
        </div>

        <div className="space-y-4 mb-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between px-5 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: account.color }}
                />
                <p className="text-white font-semibold">{account.name}</p>
              </div>
              <button
                onClick={() => handleDeleteAccount(account.id)}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="Nom du compte (ex: Vinted, eBay)"
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <input
            type="color"
            value={newAccountColor}
            onChange={(e) => setNewAccountColor(e.target.value)}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl cursor-pointer"
          />
          <button
            onClick={handleAddAccount}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>
      </div>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Gestion des données</h2>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleExportCSV}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" />
              <div className="text-left">
                <p className="text-white font-semibold">Exporter les données</p>
                <p className="text-sm text-gray-400">Télécharger tous les téléphones et réparations en CSV</p>
              </div>
            </div>
          </button>

          <label className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
              <div className="text-left">
                <p className="text-white font-semibold">Importer les données</p>
                <p className="text-sm text-gray-400">Télécharger un fichier CSV pour importer des téléphones</p>
              </div>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold text-white mb-6">Changer le code PIN</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nouveau code PIN (4-6 chiffres)
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le code PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  placeholder="••••"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleChangePin}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer le code PIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
