import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { QRCodeSVG } from 'qrcode.react';

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

interface PhoneDetailModalProps {
  phone: Phone;
  onClose: () => void;
  onUpdate?: () => void;
}

export const PhoneDetailModal: React.FC<PhoneDetailModalProps> = ({ phone, onClose }) => {
  const [repairs, setRepairs] = useState<Repair[]>([]);
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
    } catch (error) {
      showToast("Échec du chargement des réparations", "error");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // STATUT DU TÉLÉPHONE
  // -----------------------------
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
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
            VENDU
          </span>
        );

      case "repair":
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

  // -----------------------------
  // QR CODE DOWNLOAD
  // -----------------------------
  const downloadQR = () => {
    const svg = document.getElementById('qr-code') as unknown as SVGElement;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 180;
      canvas.height = 180;

      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${phone.model}-${phone.imei}-QR.png`;
        link.href = url;
        link.click();
        showToast("QR Code téléchargé", "success");
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/10';
      case 'failed':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-yellow-400 bg-yellow-500/10';
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
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">

        {/* HEADER */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Détails du téléphone
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* INFOS GÉNÉRALES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">

              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Informations générales</h3>

                  {/* BADGE STATUT */}
                  {getStatusBadge()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Modèle</p>
                    <p className="text-white font-semibold">{phone.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Stockage</p>
                    <p className="text-white font-semibold">{phone.storage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Couleur</p>
                    <p className="text-white font-semibold">{phone.color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">État</p>
                    <p className="text-white font-semibold">{phone.condition}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-400 mb-1">IMEI</p>
                    <p className="text-white font-mono font-semibold">{phone.imei}</p>
                  </div>
                </div>
              </div>

              {/* RÉSUMÉ FINANCIER */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Résumé financier</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Prix d’achat</p>
                    <p className="text-white font-semibold text-lg">€{phone.purchase_price.toFixed(2)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Date d’achat</p>
                    <p className="text-white font-semibold">
                      {new Date(phone.purchase_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total réparations</p>
                    <p className="text-orange-400 font-semibold text-lg">€{totalRepairCost.toFixed(2)}</p>
                  </div>

                  {phone.is_sold && phone.sale_price && (
                    <>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Prix de vente</p>
                        <p className="text-emerald-400 font-semibold text-lg">€{phone.sale_price.toFixed(2)}</p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-sm text-gray-400 mb-1">Bénéfice net</p>
                        <p className={`font-bold text-2xl ${netProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          €{netProfit.toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* NOTES */}
              {phone.notes && (
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Notes</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{phone.notes}</p>
                </div>
              )}
            </div>

            {/* QR CODE */}
            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 text-center">Code QR</h3>

                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-white rounded-xl">
                    <QRCodeSVG id="qr-code" value={phone.qr_code || phone.imei} size={180} level="H" />
                  </div>
                </div>

                <button
                  onClick={downloadQR}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le QR
                </button>
              </div>

              {/* SECTION VENDU */}
              {phone.is_sold && (
                <div className="backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  <p className="text-emerald-400 font-bold text-lg">VENDU</p>
                  {phone.sale_date && (
                    <p className="text-emerald-400/70 text-sm mt-1">
                      {new Date(phone.sale_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* HISTORIQUE DES RÉPARATIONS */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Historique des réparations</h3>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : repairs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Aucune réparation enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {repairs.map((repair) => (
                  <div
                    key={repair.id}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{repair.description}</h4>
                        <p className="text-sm text-gray-400 whitespace-pre-wrap">
                          {repair.repair_list}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(repair.status)}`}>
                        {translateStatus(repair.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">Coût :</span>
                        <span className="text-orange-400 font-semibold">€{repair.cost.toFixed(2)}</span>

                        {repair.technician && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{repair.technician}</span>
                          </>
                        )}
                      </div>

                      <span className="text-xs text-gray-500">
                        {new Date(repair.created_at).toLocaleDateString()}
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
