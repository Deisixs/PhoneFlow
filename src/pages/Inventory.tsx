import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, Archive, Smartphone, DollarSign, Calendar
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
  archived: boolean;
}

interface Repair {
  id: string;
  phone_id: string;
  status: string;
}

interface PurchaseAccount {
  id: string;
  name: string;
  color: string;
}

export const Inventory: React.FC = () => {
  const [phones, setPhones] = useState<Phone[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [accounts, setAccounts] = useState<PurchaseAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] =
    useState<'all' | 'available' | 'sold' | 'repair'>('all');
  const [showArchived, setShowArchived] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { userId } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (userId) {
      loadPhones();
      loadRepairs();
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
    } catch {
      showToast('Échec du chargement des téléphones', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRepairs = async () => {
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('id, phone_id, status')
        .eq('user_id', userId!);

      if (error) throw error;
      setRepairs(data || []);
    } catch {}
  };

  const loadAccounts = async () => {
    try {
      const { data } = await supabase
        .from('purchase_accounts')
        .select('id, name, color')
        .eq('user_id', userId!);

      setAccounts(data || []);
    } catch {}
  };

  const getPhoneStatus = (phone: Phone) => {
    if (phone.is_sold) return 'sold';

    const phoneRepairs = repairs.filter((r) => r.phone_id === phone.id);
    const hasActiveRepair = phoneRepairs.some((r) => r.status !== 'completed');

    if (hasActiveRepair) return 'repair';

    return 'available';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sold':
        return (
          <div className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/50 uppercase tracking-wider">
            Vendu
          </div>
        );
      case 'repair':
        return (
          <div className="px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg shadow-yellow-500/50 uppercase tracking-wider">
            En réparation
          </div>
        );
      default:
        return (
          <div className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/50 uppercase tracking-wider">
            En stock
          </div>
        );
    }
  };

  const handleArchiveToggle = async (phone: Phone) => {
    if (!phone.archived && !phone.is_sold) {
      showToast("Impossible d'archiver : le téléphone n'est pas vendu", 'error');
      return;
    }

    try {
      const newArchivedState = !phone.archived;

      const { error: phoneError } = await supabase
        .from('phones')
        .update({ archived: newArchivedState })
        .eq('id', phone.id);

      if (phoneError) throw phoneError;

      const { error: repairError } = await supabase
        .from('repairs')
        .update({ archived: newArchivedState })
        .eq('phone_id', phone.id);

      if (repairError) throw repairError;

      showToast(
        newArchivedState ? 'Téléphone et réparations archivés' : 'Téléphone et réparations désarchivés',
        'success'
      );
      loadPhones();
      loadRepairs();
      setSelectedPhone(null);
      setShowDetailModal(false);
    } catch {
      showToast("Erreur lors de l'archivage", 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce téléphone ?')) return;

    try {
      const { error } = await supabase.from('phones').delete().eq('id', id);

      if (error) throw error;

      showToast('Téléphone supprimé', 'success');
      loadPhones();
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const filteredPhones = phones
    .filter((phone) => (showArchived ? phone.archived : !phone.archived))
    .filter((phone) => {
      const status = getPhoneStatus(phone);

      const matchesSearch =
        phone.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.imei.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.color.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'sold' && status === 'sold') ||
        (filterStatus === 'available' && status === 'available') ||
        (filterStatus === 'repair' && status === 'repair');

      return matchesSearch && matchesStatus;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            Inventaire
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Gérez votre collection de smartphones
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedPhone(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold hover:scale-105 transition shadow-lg shadow-violet-500/50 text-white"
        >
          <Plus className="w-5 h-5" />
          Ajouter un téléphone
        </button>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par modèle, IMEI, couleur..."
            className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-gray-800/80 to-gray-800/40 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            showFilters
              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/50'
              : 'bg-gray-800/50 text-gray-300 border border-violet-500/20 hover:border-violet-500/40'
          }`}
        >
          <Filter className="w-5 h-5" />
          Filtres
        </button>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            showArchived
              ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg shadow-yellow-500/50'
              : 'bg-gray-800/50 text-gray-300 border border-violet-500/20 hover:border-violet-500/40'
          }`}
        >
          <Archive className="w-5 h-5" />
          {showArchived ? 'Voir actifs' : 'Voir archivés'}
        </button>
      </div>

      {showFilters && (
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-violet-500/20 rounded-2xl p-5 animate-slide-down shadow-xl">
          <div className="flex gap-3 flex-wrap">
            {(['all', 'available', 'repair', 'sold'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/50'
                    : 'bg-gray-900/50 text-gray-400 border border-violet-500/20 hover:border-violet-500/40'
                }`}
              >
                {status === 'all'
                  ? 'Tous'
                  : status === 'available'
                  ? 'En stock'
                  : status === 'repair'
                  ? 'En réparation'
                  : 'Vendus'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhones.map((phone) => {
          const status = getPhoneStatus(phone);

          return (
            <div
              key={phone.id}
              className="group relative bg-gradient-to-br from-gray-800/80 to-gray-800/40 border border-violet-500/20 rounded-2xl p-6 hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-500/20 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient overlay au hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

              <div className="relative z-10">
                {/* HEADER */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                        <Smartphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{phone.model}</h3>
                        <p className="text-sm text-violet-300">{phone.storage}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 ml-12">{phone.color}</p>
                  </div>

                  {getStatusBadge(status)}
                </div>

                {/* INFO */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-violet-500/10">
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">IMEI</span>
                    <span className="text-white font-mono text-sm">{phone.imei}</span>
                  </div>

                  {!phone.is_sold && (
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-violet-500/10">
                      <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Achat
                      </span>
                      <span className="text-white font-bold">{phone.purchase_price.toFixed(2)}€</span>
                    </div>
                  )}

                  {phone.is_sold && phone.sale_price && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-500/30">
                      <span className="text-xs text-emerald-400 uppercase tracking-wide font-semibold">Vendu</span>
                      <span className="text-emerald-400 font-bold text-lg">{phone.sale_price.toFixed(2)}€</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-violet-500/10">
                    <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Date d'achat
                    </span>
                    <span className="text-white text-sm">
                      {new Date(phone.purchase_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-violet-500/20">
                  <button
                    onClick={() => {
                      setSelectedPhone(phone);
                      setShowDetailModal(true);
                    }}
                    className="p-3 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-400 rounded-lg hover:from-violet-500/30 hover:to-fuchsia-500/30 transition-all group/btn"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4 mx-auto group-hover/btn:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPhone(phone);
                      setShowModal(true);
                    }}
                    className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 transition-all group/btn"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4 mx-auto group-hover/btn:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleArchiveToggle(phone)}
                    disabled={!phone.archived && !phone.is_sold}
                    className={`p-3 rounded-lg transition-all group/btn ${
                      !phone.archived && !phone.is_sold
                        ? 'bg-gray-700/20 text-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-400 hover:from-yellow-500/30 hover:to-orange-500/30'
                    }`}
                    title={
                      phone.archived
                        ? 'Désarchiver'
                        : phone.is_sold
                        ? 'Archiver'
                        : 'Archivage disponible uniquement pour les téléphones vendus'
                    }
                  >
                    <Archive className="w-4 h-4 mx-auto group-hover/btn:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleDelete(phone.id)}
                    className="p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 text-red-400 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all group/btn"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 mx-auto group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPhones.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
            <Archive className="w-10 h-10 text-gray-500" />
          </div>
          <p className="text-gray-400 text-lg font-medium">
            {showArchived
              ? 'Aucun téléphone archivé'
              : 'Aucun téléphone trouvé'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {!showArchived && "Commencez par ajouter votre premier téléphone"}
          </p>
        </div>
      )}

      {showModal && (
        <PhoneModal
          phone={selectedPhone}
          accounts={accounts}
          onClose={() => {
            setSelectedPhone(null);
            setShowModal(false);
          }}
          onSave={() => {
            loadPhones();
            setShowModal(false);
          }}
        />
      )}

      {showDetailModal && selectedPhone && (
        <PhoneDetailModal
          phone={selectedPhone}
          onClose={() => {
            setSelectedPhone(null);
            setShowDetailModal(false);
          }}
          onUpdate={loadPhones}
        />
      )}
    </div>
  );
};