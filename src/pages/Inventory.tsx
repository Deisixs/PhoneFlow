import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { PhoneModal } from '../components/PhoneModal';
import { PhoneDetailModal } from '../components/PhoneDetailModal';

interface Phone {
  id: string;
  model: string;
  storage: string;
  color: string;
  imei: string;
  condition: string;
  purchase_price: number;
  purchase_date: string;
  purchase_account_id: string | null;
  notes: string;
  sale_price: number | null;
  sale_date: string | null;
  is_sold: boolean;
  qr_code: string | null;
  created_at: string;
}

interface PurchaseAccount {
  id: string;
  name: string;
  color: string;
}

export const Inventory: React.FC = () => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [accounts, setAccounts] = useState<PurchaseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'sold'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { userId } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (userId) {
      loadPhones();
      loadAccounts();
    }
  }, [userId]);

  const loadPhones = async () => {
    try {
      const { data, error } = await supabase
        .from('phones')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhones(data || []);
    } catch (error) {
      showToast('Échec du chargement des téléphones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_accounts')
        .select('id, name, color')
        .eq('user_id', userId!);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Échec du chargement des comptes', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce téléphone ?')) return;

    try {
      const { error } = await supabase.from('phones').delete().eq('id', id);

      if (error) throw error;

      setPhones(phones.filter((p) => p.id !== id));
      showToast('Téléphone supprimé avec succès', 'success');
    } catch (error) {
      showToast('Échec de la suppression du téléphone', 'error');
    }
  };

  const handleDuplicate = async (phone: Phone) => {
    try {
      const { data, error } = await supabase
        .from('phones')
        .insert({
          user_id: userId!,
          model: phone.model,
          storage: phone.storage,
          color: phone.color,
          imei: phone.imei + '-COPIE',
          condition: phone.condition,
          purchase_price: phone.purchase_price,
          purchase_date: phone.purchase_date,
          purchase_account_id: phone.purchase_account_id,
          notes: phone.notes,
          qr_code: null,
        })
        .select()
        .single();

      if (error) throw error;

      setPhones([data, ...phones]);
      showToast('Téléphone dupliqué avec succès', 'success');
    } catch (error) {
      showToast('Échec de la duplication du téléphone', 'error');
    }
  };

  const generateListing = (phone: Phone) => {
    const template = `${phone.model} - ${phone.storage} - ${phone.color}

État : ${phone.condition}
IMEI : ${phone.imei}

${phone.notes}

Prix : €${phone.sale_price || phone.purchase_price}`;

    navigator.clipboard.writeText(template);
    showToast('Annonce copiée dans le presse-papiers', 'success');
  };

  const filteredPhones = phones.filter((phone) => {
    const matchesSearch =
      phone.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.color.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'sold' && phone.is_sold) ||
      (filterStatus === 'available' && !phone.is_sold);

    return matchesSearch && matchesStatus;
  });

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return 'N/A';
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'N/A';
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'neuf':
      case 'new':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'excellent':
        return 'text-blue-400 bg-blue-500/10';
      case 'très bon':
      case 'very good':
        return 'text-cyan-400 bg-cyan-500/10';
      case 'moyen':
      case 'average':
        return 'text-yellow-400 bg-yellow-500/10';
      default:
        return 'text-orange-400 bg-orange-500/10';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Inventaire
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Gérez votre collection</p>
        </div>
        <button
          onClick={() => {
            setSelectedPhone(null);
            setShowModal(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-violet-500/30 active:scale-95 min-h-[44px]"
        >
          <Plus className="w-5 h-5" />
          <span className="sm:inline">Ajouter</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all text-base min-h-[44px]"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all active:scale-95 min-h-[44px] sm:w-auto"
        >
          <Filter className="w-5 h-5" />
          <span>Filtres</span>
        </button>
      </div>

      {showFilters && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 animate-slide-down">
          <div className="flex gap-2">
            {(['all', 'available', 'sold'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all min-h-[44px] active:scale-95 ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {status === 'all' ? 'Tous' : status === 'available' ? 'Disponibles' : 'Vendus'}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredPhones.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Aucun téléphone trouvé</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Essayez d\'ajuster votre recherche' : 'Ajoutez votre premier téléphone pour commencer'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhones.map((phone) => (
            <div
              key={phone.id}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4 active:bg-white/10 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">{phone.model}</h3>
                  <p className="text-sm text-gray-400">
                    {phone.storage} • {phone.color}
                  </p>
                </div>
                {phone.is_sold && (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
                    VENDU
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">IMEI</span>
                  <span className="text-white font-mono text-xs">{phone.imei}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">État</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getConditionColor(phone.condition)}`}>
                    {phone.condition}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Achat</span>
                  <span className="text-white font-semibold">€{phone.purchase_price}</span>
                </div>
                {phone.is_sold && phone.sale_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Vendu pour</span>
                    <span className="text-emerald-400 font-semibold">€{phone.sale_price}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Compte</span>
                  <span className="text-white text-xs">{getAccountName(phone.purchase_account_id)}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-3 border-t border-white/10">
                <button
                  onClick={() => {
                    setSelectedPhone(phone);
                    setShowDetailModal(true);
                  }}
                  className="flex items-center justify-center p-3 bg-violet-600/20 active:bg-violet-600/40 text-violet-400 rounded-xl transition-all active:scale-95 min-h-[44px]"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedPhone(phone);
                    setShowModal(true);
                  }}
                  className="flex items-center justify-center p-3 bg-blue-600/20 active:bg-blue-600/40 text-blue-400 rounded-xl transition-all active:scale-95 min-h-[44px]"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDuplicate(phone)}
                  className="flex items-center justify-center p-3 bg-cyan-600/20 active:bg-cyan-600/40 text-cyan-400 rounded-xl transition-all active:scale-95 min-h-[44px]"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={() => generateListing(phone)}
                  className="flex items-center justify-center p-3 bg-fuchsia-600/20 active:bg-fuchsia-600/40 text-fuchsia-400 rounded-xl transition-all active:scale-95 min-h-[44px]"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(phone.id)}
                  className="flex items-center justify-center p-3 bg-red-600/20 active:bg-red-600/40 text-red-400 rounded-xl transition-all active:scale-95 min-h-[44px]"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PhoneModal
          phone={selectedPhone}
          accounts={accounts}
          onClose={() => {
            setShowModal(false);
            setSelectedPhone(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedPhone(null);
            loadPhones();
          }}
        />
      )}

      {showDetailModal && selectedPhone && (
        <PhoneDetailModal
          phone={selectedPhone}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPhone(null);
          }}
          onUpdate={loadPhones}
        />
      )}
    </div>
  );
};
