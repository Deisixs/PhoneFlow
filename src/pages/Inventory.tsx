import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, Archive, MessageSquare
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
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full shadow-lg shadow-emerald-500/10">VENDU</span>;
      case 'repair':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full shadow-lg shadow-yellow-500/10 uppercase">En réparation</span>;
      default:
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full shadow-lg shadow-blue-500/10 uppercase">En stock</span>;
    }
  };

  const handleArchiveToggle = async (phone: Phone) => {
    if (!phone.archived && !phone.is_sold) {
      showToast('Impossible d\'archiver : le téléphone n\'est pas vendu', 'error');
      return;
    }
    try {
      const newArchivedState = !phone.archived;
      const { error: phoneError } = await supabase
        .from('phones')
        .update({ archived: newArchivedState })
        .eq('id', phone.id);

      if (phoneError) throw phoneError;

      await supabase
        .from('repairs')
        .update({ archived: newArchivedState })
        .eq('phone_id', phone.id);

      showToast(newArchivedState ? 'Téléphone archivé' : 'Téléphone désarchivé', 'success');
      loadPhones();
    } catch {
      showToast('Erreur lors de l\'archivage', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce téléphone ?')) return;
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
        phone.imei.toLowerCase().includes(searchQuery.toLowerCase());
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Inventaire</h1>
          <p className="text-gray-400 mt-1">Gérez votre collection de smartphones</p>
        </div>
        <button
          onClick={() => { setSelectedPhone(null); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition shadow-lg shadow-violet-600/20"
        >
          <Plus size={20} /> Ajouter un téléphone
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par modèle, IMEI, couleur..."
            className="w-full pl-12 pr-4 py-3 bg-[#1a1425] border border-white/5 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300">
          <Filter size={20} /> Filtres
        </button>
        <button onClick={() => setShowArchived(!showArchived)} className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-colors border ${showArchived ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}>
          <Archive size={20} /> {showArchived ? 'Voir actifs' : 'Voir archivés'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhones.map((phone) => {
          const status = getPhoneStatus(phone);
          return (
            <div key={phone.id} className="bg-[#1a1425] border border-white/5 rounded-2xl p-6 hover:border-violet-500/30 transition-all group shadow-xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-400">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none mb-1">{phone.model}</h3>
                    <p className="text-sm text-gray-500">{phone.storage} • {phone.color}</p>
                  </div>
                </div>
                {getStatusBadge(status)}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">IMEI</span>
                  <span className="text-sm text-gray-300 font-mono">{phone.imei}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                    <span className="opacity-50">$</span> Achat
                  </span>
                  <span className="text-sm text-white font-bold">{phone.purchase_price}€</span>
                </div>

                {/* SECTION NOTE AJOUTÉE ICI */}
                {phone.notes && (
                  <div className="flex flex-col gap-1 py-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Note</span>
                    <p className="text-xs text-gray-400 italic bg-white/5 p-2 rounded-lg border border-white/5">
                      {phone.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => { setSelectedPhone(phone); setShowDetailModal(true); }} className="p-2.5 bg-violet-600/10 text-violet-400 rounded-xl hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center">
                  <Eye size={18} />
                </button>
                <button onClick={() => { setSelectedPhone(phone); setShowModal(true); }} className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleArchiveToggle(phone)} className="p-2.5 bg-yellow-600/10 text-yellow-400 rounded-xl hover:bg-yellow-600 hover:text-white transition-all flex items-center justify-center disabled:opacity-30" disabled={!phone.archived && !phone.is_sold}>
                  <Archive size={18} />
                </button>
                <button onClick={() => handleDelete(phone.id)} className="p-2.5 bg-red-600/10 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <PhoneModal
          phone={selectedPhone}
          accounts={accounts}
          onClose={() => { setSelectedPhone(null); setShowModal(false); }}
          onSave={() => { loadPhones(); setShowModal(false); }}
        />
      )}

      {showDetailModal && selectedPhone && (
        <PhoneDetailModal
          phone={selectedPhone}
          onClose={() => { setSelectedPhone(null); setShowDetailModal(false); }}
          onUpdate={loadPhones}
        />
      )}
    </div>
  );
};