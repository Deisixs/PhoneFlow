import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, Copy, ExternalLink, Archive
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

  // ---------------------
  // LOAD DATA
  // ---------------------
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

  // ---------------------
  // PHONE STATUS LOGIC
  // ---------------------
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
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
            VENDU
          </span>
        );
      case 'repair':
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full">
            EN RÉPARATION
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
            EN STOCK
          </span>
        );
    }
  };

  // ---------------------
  // ARCHIVAGE
  // ---------------------
  const handleArchiveToggle = async (phone: Phone) => {
    // Si le téléphone n'est pas archivé et qu'on veut l'archiver
    if (!phone.archived && !phone.is_sold) {
      showToast('Impossible d\'archiver : le téléphone n\'est pas vendu', 'error');
      return;
    }

    try {
      const newArchivedState = !phone.archived;

      // Archiver/désarchiver le téléphone
      const { error: phoneError } = await supabase
        .from('phones')
        .update({ archived: newArchivedState })
        .eq('id', phone.id);

      if (phoneError) throw phoneError;

      // Archiver/désarchiver toutes les réparations associées
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
      showToast('Erreur lors de l\'archivage', 'error');
    }
  };

  // ---------------------
  // DELETE
  // ---------------------
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

  // ---------------------
  // FILTERING
  // ---------------------
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

  // ---------------------
  // UI
  // ---------------------

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Inventaire
          </h1>
          <p className="text-gray-400 mt-1">Gérez votre collection de smartphones</p>
        </div>

        <button
          onClick={() => {
            setSelectedPhone(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold hover:scale-105 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un téléphone
        </button>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl"
        >
          <Filter className="w-5 h-5" />
          Filtres
        </button>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-colors ${
            showArchived
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-white/5 text-gray-400 border border-white/10'
          }`}
        >
          <Archive className="w-5 h-5" />
          {showArchived ? 'Voir actifs' : 'Voir archivés'}
        </button>
      </div>

      {showFilters && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 animate-slide-down">
          <div className="flex gap-2">
            {(['all', 'available', 'repair', 'sold'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-white/5 text-gray-400'
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

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhones.map((phone) => {
          const status = getPhoneStatus(phone);

          return (
            <div
              key={phone.id}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:scale-105 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{phone.model}</h3>
                  <p className="text-sm text-gray-400">{phone.storage} • {phone.color}</p>
                </div>

                {/* STATUS BADGE */}
                {getStatusBadge(status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">IMEI</span>
                  <span className="text-white font-mono">{phone.imei}</span>
                </div>

                {!phone.is_sold && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Achat</span>
                    <span className="text-white">€{phone.purchase_price}</span>
                  </div>
                )}

                {phone.is_sold && phone.sale_price && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vendu</span>
                    <span className="text-emerald-400">€{phone.sale_price}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={() => {
                    setSelectedPhone(phone);
                    setShowDetailModal(true);
                  }}
                  className="flex-1 bg-violet-600/20 text-violet-400 p-2 rounded-lg"
                >
                  <Eye className="w-4 h-4 mx-auto" />
                </button>

                <button
                  onClick={() => {
                    setSelectedPhone(phone);
                    setShowModal(true);
                  }}
                  className="flex-1 bg-blue-600/20 text-blue-400 p-2 rounded-lg"
                >
                  <Edit className="w-4 h-4 mx-auto" />
                </button>

                <button
                  onClick={() => handleArchiveToggle(phone)}
                  disabled={!phone.archived && !phone.is_sold}
                  className={`flex-1 p-2 rounded-lg transition-all ${
                    !phone.archived && !phone.is_sold
                      ? 'bg-gray-700/20 text-gray-600 cursor-not-allowed opacity-50'
                      : 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                  }`}
                  title={
                    phone.archived
                      ? 'Désarchiver'
                      : phone.is_sold
                      ? 'Archiver'
                      : 'Archivage disponible uniquement pour les téléphones vendus'
                  }
                >
                  <Archive className="w-4 h-4 mx-auto" />
                </button>

                <button
                  onClick={() => handleDelete(phone.id)}
                  className="flex-1 bg-red-600/20 text-red-400 p-2 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPhones.length === 0 && (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {showArchived
              ? 'Aucun téléphone archivé'
              : 'Aucun téléphone trouvé'}
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