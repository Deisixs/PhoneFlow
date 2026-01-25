import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Play, CheckCircle2, XCircle, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { RepairModal } from '../components/RepairModal';

interface Repair {
  id: string;
  phone_id: string;
  description: string;
  repair_list: string;
  cost: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  technician: string | null;
  photo_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  phone?: {
    model: string;
    imei: string;
  };
}

export const Repairs: React.FC = () => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [phones, setPhones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { userId } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (userId) {
      loadRepairs();
      loadPhones();
    }
  }, [userId]);

  const loadRepairs = async () => {
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select(`
          *,
          phone:phones(model, imei)
        `)
        .eq('user_id', userId!)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepairs(data || []);
    } catch (error) {
      showToast('Échec du chargement des réparations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPhones = async () => {
    try {
      const { data, error } = await supabase
        .from('phones')
        .select('id, model, imei')
        .eq('user_id', userId!)
        .eq('archived', false)
        .eq('is_sold', false)
        .order('model');

      if (error) throw error;
      setPhones(data || []);
    } catch (error) {
      console.error('Échec du chargement des téléphones', error);
    }
  };

  const handleStatusChange = async (repairId: string, newStatus: 'in_progress' | 'completed' | 'failed') => {
    try {
      const updates: any = { status: newStatus };

      if (newStatus === 'in_progress' && !repairs.find((r) => r.id === repairId)?.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (newStatus === 'completed' || newStatus === 'failed') {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from('repairs').update(updates).eq('id', repairId);

      if (error) throw error;

      loadRepairs();
      showToast(`Statut mis à jour : ${newStatus.replace('_', ' ')}`, 'success');
    } catch (error) {
      showToast('Échec de la mise à jour du statut', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette réparation ?')) return;

    try {
      const { error } = await supabase.from('repairs').delete().eq('id', id);

      if (error) throw error;

      setRepairs(repairs.filter((r) => r.id !== id));
      showToast('Réparation supprimée avec succès', 'success');
    } catch (error) {
      showToast('Échec de la suppression', 'error');
    }
  };

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.repair_list.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repair.phone && repair.phone.model.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || repair.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const sortedRepairs = filteredRepairs.sort((a, b) => {
    const statusPriority = {
      'in_progress': 0,
      'pending': 1,
      'completed': 2,
      'failed': 3
    };

    const priorityA = statusPriority[a.status];
    const priorityB = statusPriority[b.status];

    if (priorityA === priorityB) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }

    return priorityA - priorityB;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in_progress':
        return <Play className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
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
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Réparations
          </h1>
          <p className="text-gray-400 mt-1">Suivez et gérez vos réparations de téléphones</p>
        </div>
        <button
          onClick={() => {
            setSelectedRepair(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-violet-500/30 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Ajouter une réparation
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une réparation..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <Filter className="w-5 h-5" />
          Filtres
        </button>
      </div>

      {showFilters && (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 animate-slide-down">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'in_progress', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {{
                  all: "Tous",
                  pending: "En attente",
                  in_progress: "En cours",
                  completed: "Terminée",
                  failed: "Échouée"
                }[status]}
              </button>
            ))}
          </div>
        </div>
      )}

      {sortedRepairs.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Aucune réparation trouvée</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Essayez de modifier votre recherche' : 'Ajoutez votre première réparation pour commencer'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {sortedRepairs.map((repair) => (
            <div
              key={repair.id}
              className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">{repair.description}</h3>

                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(repair.status)}`}>
                      {getStatusIcon(repair.status)}
                      {{
                        pending: "En attente",
                        in_progress: "En cours",
                        completed: "Terminée",
                        failed: "Échouée"
                      }[repair.status]}
                    </span>
                  </div>

                  {repair.phone && (
                    <p className="text-sm text-gray-400 mb-2">
                      {repair.phone.model} • {repair.phone.imei}
                    </p>
                  )}

                  <p className="text-gray-300 whitespace-pre-wrap">{repair.repair_list}</p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-400">€{repair.cost.toFixed(2)}</p>
                  {repair.technician && (
                    <p className="text-sm text-gray-400 mt-1">{repair.technician}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                
                <div className="flex gap-2">
                  {repair.status === 'pending' && (
                    <button
                      onClick={() => handleStatusChange(repair.id, 'in_progress')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Démarrer
                    </button>
                  )}

                  {repair.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(repair.id, 'completed')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 text-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Terminer
                      </button>

                      <button
                        onClick={() => handleStatusChange(repair.id, 'failed')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Échec
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRepair(repair);
                      setShowModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/20 text-violet-400 rounded-lg hover:bg-violet-600/30 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>

                  <button
                    onClick={() => handleDelete(repair.id)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>

                <span className="text-xs text-gray-500">
                  {new Date(repair.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RepairModal
          repair={selectedRepair}
          phones={phones}
          onClose={() => {
            setShowModal(false);
            setSelectedRepair(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedRepair(null);
            loadRepairs();
          }}
        />
      )}
    </div>
  );
};