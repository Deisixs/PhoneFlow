import React, { useState, useEffect } from 'react';
import { X, Package, Smartphone, Wrench, DollarSign, Calendar, Battery } from 'lucide-react';
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
  battery_health: number | null;
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
          <div className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full shadow-lg shadow-emerald-500/50 uppercase tracking-wider">
            Vendu
          </div>
        );
      case "repair":
        return (
          <div className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg shadow-yellow-500/50 uppercase tracking-wider">
            En réparation
          </div>
        );
      default:
        return (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-500/50 uppercase tracking-wider">
            Disponible
          </div>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30';
      case 'in_progress':
        return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30';
      case 'failed':
        return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-500/30';
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

  const getBatteryColor = (health: number | null) => {
    if (!health) return 'text-gray-400';
    if (health >= 90) return 'text-emerald-400';
    if (health >= 80) return 'text-green-400';
    if (health >= 70) return 'text-yellow-400';
    if (health >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-black via-gray-900 to-black animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl shadow-violet-500/20">
        
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10 pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative bg-gray-900/95 backdrop-blur-xl border border-violet-500/20 rounded-3xl overflow-hidden">

          {/* HEADER avec gradient */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 px-6 py-5 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {phone.model}
                </h2>
                <p className="text-xs text-white/70 font-mono mt-0.5">{phone.imei}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <button 
                onClick={onClose} 
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[calc(90vh-5rem)] p-6 space-y-6">

            {/* 1. INFORMATIONS DU TÉLÉPHONE */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-white" />
                </div>
                Informations du téléphone
              </h3>

              <div className="grid grid-cols-3 gap-5">
                {/* Ligne 1 */}
                <div className="space-y-2">
                  <p className="text-xs text-violet-300 uppercase tracking-wider font-semibold">Modèle</p>
                  <p className="text-white font-bold text-base">{phone.model}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-violet-300 uppercase tracking-wider font-semibold">Stockage</p>
                  <p className="text-white font-bold text-base">{phone.storage}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-violet-300 uppercase tracking-wider font-semibold">Couleur</p>
                  <p className="text-white font-bold text-base">{phone.color}</p>
                </div>

                {/* Ligne 2 */}
                <div className="space-y-2">
                  <p className="text-xs text-violet-300 uppercase tracking-wider font-semibold">IMEI</p>
                  <p className="text-white font-mono text-sm font-semibold">{phone.imei}</p>
                </div>

                {phone.battery_health ? (
                  <div className="space-y-2">
                    <p className="text-xs text-violet-300 uppercase tracking-wider font-semibold">Batterie</p>
                    <p className={`font-bold text-lg flex items-center gap-2 ${getBatteryColor(phone.battery_health)}`}>
                      <Battery className="w-5 h-5" />
                      {phone.battery_health}%
                    </p>
                  </div>
                ) : (
                  <div></div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-violet-300 uppercase tracking-wider font-semibold">Date d'achat</p>
                  <p className="text-white font-semibold text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-400" />
                    {new Date(phone.purchase_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {phone.notes && (
                <div className="mt-6 pt-6 border-t border-violet-500/20">
                  <p className="text-xs text-violet-300 uppercase tracking-wider font-semibold mb-3">Notes</p>
                  <p className="text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-4 rounded-xl border border-violet-500/10">
                    {phone.notes}
                  </p>
                </div>
              )}
            </div>

            {/* 2. HISTORIQUE DES RÉPARATIONS */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                Historique des réparations
              </h3>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : repairs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <Wrench className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 font-medium">Aucune réparation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {repairs.map((repair) => (
                    <div
                      key={repair.id}
                      className="bg-gradient-to-br from-gray-900/60 to-gray-900/30 border border-violet-500/20 rounded-xl p-5 hover:border-violet-500/40 transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-base mb-1">{repair.description}</h4>
                          {repair.repair_list && (
                            <p className="text-sm text-gray-400">{repair.repair_list}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusColor(repair.status)}`}>
                          {translateStatus(repair.status)}
                        </span>
                      </div>

                      {/* Pièces */}
                      {repairParts[repair.id] && repairParts[repair.id].length > 0 && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-lg">
                          <p className="text-xs text-violet-300 uppercase tracking-wide font-bold mb-3 flex items-center gap-2">
                            <Package className="w-3.5 h-3.5" />
                            Pièces utilisées
                          </p>
                          <div className="space-y-2">
                            {repairParts[repair.id].map((part) => (
                              <div key={part.id} className="flex items-center justify-between">
                                <span className="text-white font-medium">{part.stock_piece.name}</span>
                                <span className="text-violet-300 font-mono text-sm font-semibold">
                                  {part.quantity_used} × {part.stock_piece.purchase_price.toFixed(2)}€
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-violet-500/20">
                        <div className="flex items-center gap-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Coût</span>
                            <span className="text-orange-400 font-bold text-lg">{repair.cost.toFixed(2)}€</span>
                          </div>
                          {repair.technician && (
                            <span className="text-gray-400 text-sm">• {repair.technician}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(repair.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. RÉSUMÉ FINANCIER */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                Résumé financier
              </h3>

              <div className="space-y-4">
                {/* Prix d'achat */}
                <div className="flex items-center justify-between py-3 px-4 bg-gray-900/50 rounded-xl border border-violet-500/10">
                  <span className="text-gray-300 font-medium">Prix d'achat</span>
                  <span className="text-white font-bold text-xl">{phone.purchase_price.toFixed(2)}€</span>
                </div>

                {/* Total réparations */}
                <div className="flex items-center justify-between py-3 px-4 bg-gray-900/50 rounded-xl border border-violet-500/10">
                  <span className="text-gray-300 font-medium">Total réparations</span>
                  <span className="text-orange-400 font-bold text-xl">{totalRepairCost.toFixed(2)}€</span>
                </div>

                {/* Si vendu */}
                {phone.is_sold && phone.sale_price && (
                  <>
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-900/50 rounded-xl border border-violet-500/10">
                      <span className="text-gray-300 font-medium">Prix de vente</span>
                      <span className="text-emerald-400 font-bold text-xl">{phone.sale_price.toFixed(2)}€</span>
                    </div>

                    <div className="flex items-center justify-between py-4 px-5 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-xl border-2 border-violet-500/40 mt-2">
                      <span className="text-white font-bold text-lg">Bénéfice net</span>
                      <span className={`font-bold text-3xl ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}€
                      </span>
                    </div>

                    {phone.sale_date && (
                      <div className="pt-3 text-center">
                        <p className="text-xs text-gray-400">
                          Vendu le {new Date(phone.sale_date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};