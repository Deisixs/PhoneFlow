import React, { useState, useEffect } from 'react';
import { X, Package, Calendar, DollarSign, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';

interface Phone {
  id: string;
  model: string;
  storage: string;
  color: string;
  imei: string;
  condition: string;
  purchase_price: number;
  purchase_date: string;
  notes: string;
  sale_price: number | null;
  sale_date: string | null;
  is_sold: boolean;
  qr_code: string | null;
}

interface Repair {
  id: string;
  description: string;
  repair_list: string;
  cost: number;
  status: string;
  technician: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface RepairPart {
  id: string;
  repair_id: string;
  quantity_used: number;
  stock_piece: {
    name: string;
    purchase_price: number;
  };
}

interface PhoneDetailModalProps {
  phone: Phone;
  onClose: () => void;
  onUpdate?: () => void;
}

export const PhoneDetailModal: React.FC<PhoneDetailModalProps> = ({ phone, onClose }) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [repairParts, setRepairParts] = useState<Record<string, RepairPart[]>>({});
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadRepairs();
  }, [phone.id]);

  const loadRepairs = async () => {
    try {
      const { data, error } = await supabase
        .from('repairs')
        .select('*')
        .eq('phone_id', phone.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRepairs(data || []);

      if (data && data.length > 0) {
        await loadRepairParts(data.map(r => r.id));
      }
    } catch (error) {
      showToast("Échec du chargement des réparations", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadRepairParts = async (repairIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('repair_parts')
        .select(`
          id,
          repair_id,
          quantity_used,
          stock_pieces (
            name,
            purchase_price
          )
        `)
        .in('repair_id', repairIds);

      if (error) throw error;

      const grouped: Record<string, RepairPart[]> = {};
      data?.forEach((part: any) => {
        if (!grouped[part.repair_id]) {
          grouped[part.repair_id] = [];
        }
        grouped[part.repair_id].push({
          id: part.id,
          repair_id: part.repair_id,
          quantity_used: part.quantity_used,
          stock_piece: {
            name: part.stock_pieces?.name || 'Pièce supprimée',
            purchase_price: part.stock_pieces?.purchase_price || 0
          }
        });
      });

      setRepairParts(grouped);
    } catch (error) {
      console.error('Erreur chargement pièces:', error);
    }
  };

  const getPhoneStatus = () => {
    if (phone.is_sold) return "sold";
    const hasActiveRepair = repairs.some(r => r.status !== "completed");
    if (hasActiveRepair) return "repair";
    return "available";
  };

  const getStatusBadge = () => {
    const status = getPhoneStatus();

    switch (status) {
      case "sold":
        return (
          <span className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-full uppercase tracking-wide">
            Vendu
          </span>
        );
      case "repair":
        return (
          <span className="px-4 py-1.5 bg-yellow-500/20 text-yellow-400 text-sm font-bold rounded-full uppercase tracking-wide">
            En réparation
          </span>
        );
      default:
        return (
          <span className="px-4 py-1.5 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-full uppercase tracking-wide">
            En stock
          </span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'failed':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "completed": return "Terminé";
      case "in_progress": return "En cours";
      case "failed": return "Échoué";
      default: return "En attente";
    }
  };

  const totalRepairCost = repairs.reduce((sum, repair) => sum + repair.cost, 0);
  const netProfit = phone.is_sold && phone.sale_price
    ? phone.sale_price - phone.purchase_price - totalRepairCost
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[95vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-8 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {phone.model}
            </h2>
            <p className="text-sm text-gray-400 mt-1 font-mono">{phone.imei}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-6">

          {/* CARDS TOP */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* INFOS GÉNÉRALES */}
            <div className="lg:col-span-2 backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-400"></div>
                  Informations générales
                </h3>
                {getStatusBadge()}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Modèle</p>
                  <p className="text-white font-bold text-lg">{phone.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Stockage</p>
                  <p className="text-white font-bold text-lg">{phone.storage}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Couleur</p>
                  <p className="text-white font-semibold">{phone.color}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">État</p>
                  <p className="text-white font-semibold">{phone.condition}</p>
                </div>
              </div>
            </div>

            {/* STATUT VENDU (si vendu) */}
            {phone.is_sold && (
              <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-6 shadow-xl text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/40">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-emerald-400 font-bold text-2xl mb-2">VENDU</p>
                {phone.sale_date && (
                  <p className="text-emerald-400/70 text-sm mb-4">
                    {new Date(phone.sale_date).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                )}
                {phone.sale_price && (
                  <div className="mt-4 pt-4 border-t border-emerald-500/20">
                    <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-1">Prix de vente</p>
                    <p className="text-emerald-400 font-bold text-3xl">
                      {phone.sale_price.toFixed(2)}€
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RÉSUMÉ FINANCIER */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-violet-400" />
              Résumé financier
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Prix d'achat</p>
                </div>
                <p className="text-white font-bold text-2xl">{phone.purchase_price.toFixed(2)}€</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Date d'achat</p>
                </div>
                <p className="text-white font-semibold">
                  {new Date(phone.purchase_date).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="w-3 h-3 text-orange-400" />
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total réparations</p>
                </div>
                <p className="text-orange-400 font-bold text-2xl">{totalRepairCost.toFixed(2)}€</p>
              </div>

              {phone.is_sold && phone.sale_price && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${netProfit >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Bénéfice net</p>
                  </div>
                  <p className={`font-bold text-3xl ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}€
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* NOTES */}
          {phone.notes && (
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-3">📝 Notes</h3>
              <p className="text-gray-300 leading-relaxed">{phone.notes}</p>
            </div>
          )}

          {/* HISTORIQUE DES RÉPARATIONS */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-violet-400" />
              Historique des réparations
            </h3>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : repairs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Wrench className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-400 font-medium">Aucune réparation enregistrée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {repairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all"
                  >
                    {/* Header réparation */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-1">{repair.description}</h4>
                        {repair.repair_list && (
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {repair.repair_list}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wide ${getStatusColor(repair.status)}`}>
                        {translateStatus(repair.status)}
                      </span>
                    </div>

                    {/* Pièces utilisées */}
                    {repairParts[repair.id] && repairParts[repair.id].length > 0 && (
                      <div className="mt-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                        <p className="text-xs text-violet-300 uppercase tracking-wide font-bold mb-3 flex items-center gap-2">
                          <Package size={14} />
                          Pièces utilisées
                        </p>
                        <div className="space-y-2">
                          {repairParts[repair.id].map((part) => (
                            <div key={part.id} className="flex items-center justify-between">
                              <span className="text-white font-medium">{part.stock_piece.name}</span>
                              <span className="text-violet-300 font-mono text-sm">
                                {part.quantity_used} × {part.stock_piece.purchase_price.toFixed(2)}€ = {(part.quantity_used * part.stock_piece.purchase_price).toFixed(2)}€
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer réparation */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Coût total</span>
                          <span className="text-orange-400 font-bold text-lg">{repair.cost.toFixed(2)}€</span>
                        </div>

                        {repair.technician && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Technicien:</span>
                            <span className="text-gray-300 font-medium">{repair.technician}</span>
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(repair.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};