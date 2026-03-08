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
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase">
            Vendu
          </span>
        );
      case "repair":
        return (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full uppercase">
            En réparation
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full uppercase">
            Disponible
          </span>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {phone.model}
              </h2>
              <p className="text-xs text-gray-400 font-mono">{phone.imei}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* 1. INFORMATIONS DU TÉLÉPHONE */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-violet-400" />
              Informations du téléphone
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Ligne 1 */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Modèle</p>
                <p className="text-white font-semibold">{phone.model}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Stockage</p>
                <p className="text-white font-semibold">{phone.storage}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Couleur</p>
                <p className="text-white font-semibold">{phone.color}</p>
              </div>

              {/* Ligne 2 */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">IMEI</p>
                <p className="text-white font-mono text-sm">{phone.imei}</p>
              </div>

              {phone.battery_health ? (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Batterie</p>
                  <p className={`font-bold flex items-center gap-1 ${getBatteryColor(phone.battery_health)}`}>
                    <Battery className="w-4 h-4" />
                    {phone.battery_health}%
                  </p>
                </div>
              ) : (
                <div></div>
              )}

              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date d'achat</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {new Date(phone.purchase_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {phone.notes && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-gray-300 text-sm leading-relaxed">{phone.notes}</p>
              </div>
            )}
          </div>

          {/* 2. HISTORIQUE DES RÉPARATIONS */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-violet-400" />
              Historique des réparations
            </h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : repairs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-400 text-sm">Aucune réparation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {repairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{repair.description}</h4>
                        {repair.repair_list && (
                          <p className="text-sm text-gray-400">{repair.repair_list}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(repair.status)}`}>
                        {translateStatus(repair.status)}
                      </span>
                    </div>

                    {/* Pièces */}
                    {repairParts[repair.id] && repairParts[repair.id].length > 0 && (
                      <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                        <p className="text-xs text-violet-300 uppercase tracking-wide font-semibold mb-2 flex items-center gap-2">
                          <Package size={12} />
                          Pièces utilisées
                        </p>
                        <div className="space-y-1">
                          {repairParts[repair.id].map((part) => (
                            <div key={part.id} className="flex items-center justify-between text-sm">
                              <span className="text-white">{part.stock_piece.name}</span>
                              <span className="text-violet-300 font-mono text-xs">
                                {part.quantity_used} × {part.stock_piece.purchase_price.toFixed(2)}€
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-orange-400 font-bold">{repair.cost.toFixed(2)}€</span>
                        {repair.technician && (
                          <span className="text-gray-400 text-xs">• {repair.technician}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(repair.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. RÉSUMÉ FINANCIER */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-violet-400" />
              Résumé financier
            </h3>

            <div className="space-y-3">
              {/* Prix d'achat */}
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400">Prix d'achat</span>
                <span className="text-white font-bold text-lg">{phone.purchase_price.toFixed(2)}€</span>
              </div>

              {/* Total réparations */}
              <div className="flex items-center justify-between py-2 border-t border-white/10">
                <span className="text-gray-400">Total réparations</span>
                <span className="text-orange-400 font-bold text-lg">{totalRepairCost.toFixed(2)}€</span>
              </div>

              {/* Si vendu */}
              {phone.is_sold && phone.sale_price && (
                <>
                  <div className="flex items-center justify-between py-2 border-t border-white/10">
                    <span className="text-gray-400">Prix de vente</span>
                    <span className="text-emerald-400 font-bold text-lg">{phone.sale_price.toFixed(2)}€</span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t-2 border-white/20">
                    <span className="text-white font-bold">Bénéfice net</span>
                    <span className={`font-bold text-2xl ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {netProfit >= 0 ? '+' : ''}{netProfit.toFixed(2)}€
                    </span>
                  </div>

                  {phone.sale_date && (
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-gray-400 text-center">
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
  );
};