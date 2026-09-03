import React, { useState, useEffect } from 'react';
import { Plus, Truck, Package, CheckCircle2, AlertTriangle, Edit2, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import OrderModal from '../components/OrderModal';

interface OrderItem {
  id: string;
  name: string;
  purchase_price: number;
  quantity: number;
  supplier: string;
}

interface Order {
  id: string;
  tracking_number: string;
  carrier: string;
  status: 'en_transit' | 'recu' | 'probleme';
  notes: string;
  created_at: string;
}

const STATUS_CONFIG = {
  en_transit: { label: 'En transit', icon: Truck, badgeClass: 'bg-blue-500/20 text-blue-400' },
  recu: { label: 'Reçu', icon: CheckCircle2, badgeClass: 'bg-emerald-500/20 text-emerald-400' },
  probleme: { label: 'Problème', icon: AlertTriangle, badgeClass: 'bg-red-500/20 text-red-400' },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingDraft, setTrackingDraft] = useState('');

  const { userId } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (userId) loadOrders();
  }, [userId]);

  const loadOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      if (ordersData && ordersData.length > 0) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .in('order_id', ordersData.map((o) => o.id));

        if (itemsError) throw itemsError;

        const grouped: Record<string, OrderItem[]> = {};
        itemsData?.forEach((item: any) => {
          if (!grouped[item.order_id]) grouped[item.order_id] = [];
          grouped[item.order_id].push(item);
        });
        setItemsByOrder(grouped);
      }
    } catch {
      showToast('Erreur lors du chargement des commandes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch {
      showToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const startEditTracking = (order: Order) => {
    setEditingTracking(order.id);
    setTrackingDraft(order.tracking_number || '');
  };

  const saveTracking = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingDraft })
        .eq('id', orderId);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_number: trackingDraft } : o))
      );
      setEditingTracking(null);
      showToast('Numéro de suivi mis à jour', 'success');
    } catch {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Supprimer cette commande ? (les pièces déjà ajoutées au stock resteront présentes)')) return;
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('Commande supprimée', 'success');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const getOrderTotal = (orderId: string) => {
    return (itemsByOrder[orderId] || []).reduce(
      (sum, it) => sum + it.purchase_price * it.quantity,
      0
    );
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
          <h1 className="text-3xl font-bold text-white">Suivi Commandes</h1>
          <p className="text-gray-400 mt-1">Suivez vos commandes de pièces en cours</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition shadow-lg shadow-violet-600/20"
        >
          <Plus size={20} /> Nouvelle commande
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Package className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-1">Aucune commande</h3>
          <p className="text-gray-500 text-sm">Crée ta première commande pour commencer le suivi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((order) => {
            const items = itemsByOrder[order.id] || [];
            const StatusIcon = STATUS_CONFIG[order.status].icon;

            return (
              <div
                key={order.id}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    {order.carrier && (
                      <p className="text-xs text-gray-400 mt-0.5">{order.carrier}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_CONFIG[order.status].badgeClass}`}>
                      <StatusIcon className="w-3 h-3" />
                      {STATUS_CONFIG[order.status].label}
                    </span>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Numéro de suivi éditable */}
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-black/20 rounded-xl">
                  <Truck className="w-4 h-4 text-gray-500 shrink-0" />
                  {editingTracking === order.id ? (
                    <>
                      <input
                        type="text"
                        value={trackingDraft}
                        onChange={(e) => setTrackingDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveTracking(order.id)}
                        autoFocus
                        className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-violet-500/40"
                        placeholder="Numéro de suivi"
                      />
                      <button onClick={() => saveTracking(order.id)} className="text-emerald-400 hover:text-emerald-300">
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-300 font-mono">
                        {order.tracking_number || <span className="text-gray-600 italic font-sans">Pas de numéro</span>}
                      </span>
                      <button onClick={() => startEditTracking(order)} className="text-gray-500 hover:text-violet-400 transition">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Liste des pièces */}
                <div className="space-y-1.5 mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300 truncate">{item.name} <span className="text-gray-600">×{item.quantity}</span></span>
                      <span className="text-white font-medium shrink-0 ml-2">{(item.purchase_price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                  <span className="text-sm font-bold text-violet-300">{getOrderTotal(order.id).toFixed(2)}€</span>
                </div>

                {order.notes && (
                  <p className="text-xs text-gray-500 italic mt-3 bg-white/5 p-2 rounded-lg">{order.notes}</p>
                )}

                {/* Actions de statut */}
                {order.status !== 'recu' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleStatusChange(order.id, 'recu')}
                      className="flex-1 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition"
                    >
                      Marquer reçu
                    </button>
                    {order.status !== 'probleme' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'probleme')}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                      >
                        Signaler un problème
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <OrderModal
          onClose={() => setShowModal(false)}
          onCreated={loadOrders}
        />
      )}
    </div>
  );
}
