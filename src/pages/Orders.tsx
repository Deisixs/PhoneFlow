import React, { useState, useEffect } from 'react';
import { Plus, Truck, Package, Edit2, Check, Trash2, ExternalLink, Archive, Edit3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import OrderModal from '../components/OrderModal';

interface OrderItem {
  id: string;
  name: string;
  description?: string;
  purchase_price: number;
  quantity: number;
  supplier: string;
  supplier_link?: string;
  stock_piece_id?: string | null;
}

interface Order {
  id: string;
  tracking_number: string;
  tracking_link: string;
  carrier: string;
  supplier: string;
  status: 'en_transit' | 'recu';
  archived: boolean;
  notes: string;
  created_at: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [numberDraft, setNumberDraft] = useState('');
  const [linkDraft, setLinkDraft] = useState('');

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

  // Toggle "En cours" / "Arrivé"
  const handleStatusToggle = async (order: Order, newStatus: 'en_transit' | 'recu') => {
    if (order.status === newStatus) return;
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
    } catch {
      showToast('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const handleArchiveToggle = async (order: Order) => {
    if (!order.archived && order.status !== 'recu') {
      showToast('La commande doit être marquée "Arrivé" avant de pouvoir être archivée', 'error');
      return;
    }
    try {
      const newArchived = !order.archived;
      const { error } = await supabase.from('orders').update({ archived: newArchived }).eq('id', order.id);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, archived: newArchived } : o)));
      showToast(newArchived ? 'Commande archivée' : 'Commande désarchivée', 'success');
    } catch {
      showToast('Erreur lors de l\'archivage', 'error');
    }
  };

  const startEdit = (order: Order) => {
    setEditingOrder(order.id);
    setNumberDraft(order.tracking_number || '');
    setLinkDraft(order.tracking_link || '');
  };

  const saveTracking = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: numberDraft, tracking_link: linkDraft })
        .eq('id', orderId);
      if (error) throw error;
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, tracking_number: numberDraft, tracking_link: linkDraft } : o))
      );
      setEditingOrder(null);
      showToast('Suivi mis à jour', 'success');
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

  const filteredOrders = orders.filter((o) => (showArchived ? o.archived : !o.archived));

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
        <div className="flex gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors border ${
              showArchived
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-white/5 text-gray-400 border-white/10'
            }`}
          >
            <Archive size={18} /> {showArchived ? 'Voir actives' : 'Voir archivées'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition shadow-lg shadow-violet-600/20"
          >
            <Plus size={20} /> Nouvelle commande
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
            <Package className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-300 mb-1">
            {showArchived ? 'Aucune commande archivée' : 'Aucune commande'}
          </h3>
          {!showArchived && (
            <p className="text-gray-500 text-sm">Crée ta première commande pour commencer le suivi</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const items = itemsByOrder[order.id] || [];

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
                    {order.supplier && (
                      <p className="text-sm text-white font-semibold mt-1">{order.supplier}</p>
                    )}
                    {order.carrier && (
                      <p className="text-xs text-gray-400 mt-0.5">{order.carrier}</p>
                    )}
                  </div>

                  {/* Toggle En cours / Arrivé */}
                  {!order.archived ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(order, 'en_transit')}
                        className={`px-3 py-1 text-xs font-semibold rounded-full uppercase transition-all ${
                          order.status === 'en_transit'
                            ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                            : 'bg-white/5 text-gray-500 hover:bg-blue-500/10 hover:text-blue-400'
                        }`}
                      >
                        En cours
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(order, 'recu')}
                        className={`px-3 py-1 text-xs font-semibold rounded-full uppercase transition-all ${
                          order.status === 'recu'
                            ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10'
                            : 'bg-white/5 text-gray-500 hover:bg-emerald-500/10 hover:text-emerald-400'
                        }`}
                      >
                        Arrivé
                      </button>
                    </div>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full uppercase">
                      Archivée
                    </span>
                  )}
                </div>

                {/* Suivi : numéro + lien */}
                <div className="mb-4 px-3 py-2.5 bg-black/20 rounded-xl space-y-2">
                  {editingOrder === order.id ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-500 shrink-0" />
                        <input
                          type="text"
                          value={numberDraft}
                          onChange={(e) => setNumberDraft(e.target.value)}
                          className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-violet-500/40"
                          placeholder="Numéro de suivi"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
                        <input
                          type="url"
                          value={linkDraft}
                          onChange={(e) => setLinkDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTracking(order.id)}
                          className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-violet-500/40"
                          placeholder="https://lien-de-suivi.com/..."
                        />
                        <button onClick={() => saveTracking(order.id)} className="text-emerald-400 hover:text-emerald-300 shrink-0">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="flex-1 text-sm text-gray-300 font-mono">
                          {order.tracking_number || <span className="text-gray-600 italic font-sans">Pas de numéro</span>}
                        </span>
                        <button onClick={() => startEdit(order)} className="text-gray-500 hover:text-violet-400 transition shrink-0">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
                        {order.tracking_link ? (
                          <a
                            href={order.tracking_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-sm text-violet-400 hover:text-violet-300 hover:underline truncate transition"
                          >
                            Ouvrir le suivi colis
                          </a>
                        ) : (
                          <button
                            onClick={() => startEdit(order)}
                            className="flex-1 text-left text-sm text-gray-600 italic hover:text-gray-400 transition"
                          >
                            Ajouter un lien de suivi
                          </button>
                        )}
                      </div>
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

                <div className="flex items-center justify-between pt-3 border-t border-white/5 mb-1">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                  <span className="text-sm font-bold text-violet-300">{getOrderTotal(order.id).toFixed(2)}€</span>
                </div>

                {order.notes && (
                  <p className="text-xs text-gray-500 italic mt-3 bg-white/5 p-2 rounded-lg">{order.notes}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setOrderToEdit(order)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleArchiveToggle(order)}
                    disabled={!order.archived && order.status !== 'recu'}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {order.archived ? 'Désarchiver' : 'Archiver'}
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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

      {orderToEdit && (
        <OrderModal
          order={{
            id: orderToEdit.id,
            tracking_number: orderToEdit.tracking_number,
            tracking_link: orderToEdit.tracking_link,
            carrier: orderToEdit.carrier,
            supplier: orderToEdit.supplier,
            notes: orderToEdit.notes,
            items: itemsByOrder[orderToEdit.id] || [],
          }}
          onClose={() => setOrderToEdit(null)}
          onCreated={() => {
            loadOrders();
            setOrderToEdit(null);
          }}
        />
      )}
    </div>
  );
}