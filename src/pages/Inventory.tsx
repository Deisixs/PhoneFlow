import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit, Trash2, Archive, MessageSquare, Upload
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { PhoneModal } from '../components/PhoneModal';
import { PhoneDetailModal } from '../components/PhoneDetailModal';
import BulkImportModal from '../components/BulkImportModal';

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
  is_incoming: boolean;
  qr_code: string | null;
  created_at: string;
  archived: boolean;
  battery_health: number | null;
}

interface Repair {
  id: string;
  phone_id: string;
  status: string;
  cost: number;
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
  const [showImportModal, setShowImportModal] = useState(false);
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
        .select('id, phone_id, status, cost')
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
    if (phone.is_incoming) return 'incoming';
    return 'available';
  };

  // Bascule entre "En stock" et "Arrivage" (uniquement possible si pas vendu / pas en réparation)
  const handleToggleIncoming = async (phone: Phone) => {
    try {
      const newValue = !phone.is_incoming;
      const { error } = await supabase
        .from('phones')
        .update({ is_incoming: newValue })
        .eq('id', phone.id);

      if (error) throw error;

      setPhones((prev) =>
        prev.map((p) => (p.id === phone.id ? { ...p, is_incoming: newValue } : p))
      );
    } catch {
      showToast('Erreur lors du changement de statut', 'error');
    }
  };

  // Calcule le total des coûts de réparation pour un téléphone
  const getTotalRepairCost = (phoneId: string) => {
    return repairs
      .filter((r) => r.phone_id === phoneId)
      .reduce((sum, r) => sum + (r.cost || 0), 0);
  };

  // Calcule le bénéfice net pour un téléphone vendu
  const getNetProfit = (phone: Phone) => {
    if (!phone.is_sold || phone.sale_price === null) return null;
    const totalRepairs = getTotalRepairCost(phone.id);
    return phone.sale_price - phone.purchase_price - totalRepairs;
  };

  // Calcule la marge sur le prix de vente (CA) — celle qui compte pour le seuil micro-entreprise
  // Marge (%) = Bénéfice net / Prix de vente × 100
  const getProfitPercentage = (phone: Phone) => {
    if (!phone.is_sold || phone.sale_price === null || phone.sale_price === 0) return null;
    const totalRepairs = getTotalRepairCost(phone.id);
    const profit = phone.sale_price - phone.purchase_price - totalRepairs;
    return (profit / phone.sale_price) * 100;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sold':
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full shadow-lg shadow-emerald-500/10">VENDU</span>;
      case 'repair':
        return <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full shadow-lg shadow-yellow-500/10 uppercase">En réparation</span>;
      case 'incoming':
        return <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full shadow-lg shadow-orange-500/10 uppercase">Arrivage</span>;
      default:
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full shadow-lg shadow-blue-500/10 uppercase">En stock</span>;
    }
  };

  // Toggle "En stock" / "Arrivage" cliquable — seulement quand le téléphone n'est ni vendu ni en réparation
  const renderStatusToggle = (phone: Phone, status: string) => {
    if (status !== 'available' && status !== 'incoming') {
      return getStatusBadge(status);
    }

    return (
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => status !== 'available' && handleToggleIncoming(phone)}
          className={`px-3 py-1 text-xs font-semibold rounded-full uppercase transition-all ${
            status === 'available'
              ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
              : 'bg-white/5 text-gray-500 hover:bg-blue-500/10 hover:text-blue-400'
          }`}
        >
          En stock
        </button>
        <button
          type="button"
          onClick={() => status !== 'incoming' && handleToggleIncoming(phone)}
          className={`px-3 py-1 text-xs font-semibold rounded-full uppercase transition-all ${
            status === 'incoming'
              ? 'bg-orange-500/20 text-orange-400 shadow-lg shadow-orange-500/10'
              : 'bg-white/5 text-gray-500 hover:bg-orange-500/10 hover:text-orange-400'
          }`}
        >
          Arrivage
        </button>
      </div>
    );
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
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition"
          >
            <Upload size={20} /> Importer
          </button>
          <button
            onClick={() => { setSelectedPhone(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition shadow-lg shadow-violet-600/20"
          >
            <Plus size={20} /> Ajouter un téléphone
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par modèle, IMEI, couleur..."
            className="w-full pl-12 pr-4 py-3 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition"
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
          const netProfit = getNetProfit(phone);
          const profitPercentage = getProfitPercentage(phone);
          return (
            <div key={phone.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center text-violet-400">
                    <Edit size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-none mb-1">{phone.model}</h3>
                    <p className="text-sm text-gray-500">
                      {phone.storage} • {phone.color} • 🔋 {phone.battery_health !== null ? `${phone.battery_health}%` : 'Inconnu'}
                    </p>
                  </div>
                </div>
                {renderStatusToggle(phone, status)}
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

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    Date d'achat
                  </span>
                  <span className="text-sm text-gray-300">
                    {new Date(phone.purchase_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* BÉNÉFICE NET + POURCENTAGE - Affiché seulement si vendu */}
                {netProfit !== null && profitPercentage !== null && (
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1">
                      <span className="opacity-50">$</span> Bénéfice
                    </span>
                    <span className={`text-sm font-bold flex items-center gap-2 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}€
                      <span className={`text-xs px-2 py-0.5 rounded-full ${netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                        {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
                      </span>
                    </span>
                  </div>
                )}

                {/* SECTION NOTE */}
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

      {showImportModal && (
        <BulkImportModal
          onClose={() => setShowImportModal(false)}
          onImported={loadPhones}
        />
      )}
    </div>
  );
};