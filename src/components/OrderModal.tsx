import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

const SUPPLIER_OPTIONS = ['Utopya', 'LCD-Phone', 'p2m'];

interface OrderItem {
  name: string;
  description: string;
  purchase_price: string; // string pour éviter les bugs de saisie décimale
  quantity: string;
  supplier: string;
  supplier_link: string;
}

interface OrderModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const emptyItem = (): OrderItem => ({
  name: '',
  description: '',
  purchase_price: '',
  quantity: '1',
  supplier: '',
  supplier_link: '',
});

export default function OrderModal({ onClose, onCreated }: OrderModalProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingLink, setTrackingLink] = useState('');
  const [carrier, setCarrier] = useState('');
  const [supplier, setSupplier] = useState('');
  const [showOrderSupplierList, setShowOrderSupplierList] = useState(false);
  const orderSupplierRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [openSupplierIndex, setOpenSupplierIndex] = useState<number | null>(null);
  const supplierRef = useRef<HTMLDivElement>(null);

  const { userId } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) {
        setOpenSupplierIndex(null);
      }
      if (orderSupplierRef.current && !orderSupplierRef.current.contains(e.target as Node)) {
        setShowOrderSupplierList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalValue = items.reduce(
    (sum, it) => sum + (parseFloat(it.purchase_price) || 0) * (parseInt(it.quantity) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = items.filter((it) => it.name.trim() && parseFloat(it.purchase_price) >= 0);

    setSubmitting(true);
    try {
      // 1. Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId!,
          tracking_number: trackingNumber,
          tracking_link: trackingLink,
          carrier,
          supplier,
          notes,
          status: 'en_transit',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Pour chaque pièce : l'ajouter au stock ET l'enregistrer dans order_items
      for (const item of validItems) {
        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.purchase_price) || 0;

        // Ajout dans stock_pieces
        const { data: stockPiece, error: stockError } = await supabase
          .from('stock_pieces')
          .insert({
            user_id: userId!,
            name: item.name,
            description: item.description,
            purchase_price: price,
            quantity,
            supplier: item.supplier,
            supplier_link: item.supplier_link,
          })
          .select()
          .single();

        if (stockError) {
          console.error('Erreur ajout stock:', stockError);
          continue;
        }

        // Enregistrement dans order_items (référence vers la pièce créée)
        await supabase.from('order_items').insert({
          order_id: order.id,
          name: item.name,
          description: item.description,
          purchase_price: price,
          quantity,
          supplier: item.supplier,
          supplier_link: item.supplier_link,
          stock_piece_id: stockPiece?.id || null,
        });
      }

      showToast(
        validItems.length > 0
          ? 'Commande créée et pièces ajoutées au stock'
          : 'Commande créée',
        'success'
      );
      onCreated();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création de la commande', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto
      bg-neutral-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">

        <div className="sticky top-0 z-10 bg-neutral-900/40 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Nouvelle commande
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          {/* Suivi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div ref={orderSupplierRef} className="relative">
              <label className="text-sm text-gray-300 mb-1 block">Fournisseur</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                onFocus={() => setShowOrderSupplierList(true)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                placeholder="Ex : Utopya, LCD-Phone, p2m…"
                autoComplete="off"
              />
              {showOrderSupplierList && (
                <div className="absolute z-20 w-full mt-2 max-h-48 overflow-y-auto bg-neutral-900 border border-white/10 rounded-xl shadow-2xl">
                  {SUPPLIER_OPTIONS
                    .filter((s) => s.toLowerCase().includes(supplier.toLowerCase()))
                    .map((s) => (
                      <div
                        key={s}
                        onClick={() => {
                          setSupplier(s);
                          setShowOrderSupplierList(false);
                        }}
                        className={`px-4 py-2.5 cursor-pointer transition-all border-b border-white/5 last:border-b-0 ${
                          supplier === s
                            ? 'bg-violet-500/20 text-white font-semibold'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {s}
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">Transporteur</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                placeholder="Ex : Colissimo, DHL..."
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">
                Numéro de suivi <span className="text-gray-500">(optionnel)</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                placeholder="Ex : FR123456789CN"
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1 block">
                Lien de suivi <span className="text-gray-500">(optionnel)</span>
              </label>
              <input
                type="url"
                value={trackingLink}
                onChange={(e) => setTrackingLink(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Pièces */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-violet-300 uppercase tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4" />
                Pièces de la commande
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600/20 text-violet-300 rounded-lg hover:bg-violet-600/30 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une pièce
              </button>
            </div>

            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-gray-500 italic px-1">
                  Aucune pièce — la commande peut être créée sans, tu pourras en ajouter plus tard.
                </p>
              )}
              {items.map((item, index) => (
                <div key={index} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, { name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                        placeholder="Nom de la pièce (ex: Écran iPhone 13)"
                      />
                    </div>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.purchase_price}
                      onChange={(e) => updateItem(index, { purchase_price: e.target.value })}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                      placeholder="Prix €"
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: e.target.value })}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                      placeholder="Quantité"
                    />

                    {/* Fournisseur - combo */}
                    <div className="relative col-span-2" ref={openSupplierIndex === index ? supplierRef : null}>
                      <input
                        type="text"
                        value={item.supplier}
                        onChange={(e) => updateItem(index, { supplier: e.target.value })}
                        onFocus={() => setOpenSupplierIndex(index)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-violet-500/40"
                        placeholder="Fournisseur"
                        autoComplete="off"
                      />
                      {openSupplierIndex === index && (
                        <div className="absolute z-20 w-full mt-1 bg-neutral-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden">
                          {SUPPLIER_OPTIONS
                            .filter((s) => s.toLowerCase().includes(item.supplier.toLowerCase()))
                            .map((s) => (
                              <div
                                key={s}
                                onClick={() => {
                                  updateItem(index, { supplier: s });
                                  setOpenSupplierIndex(null);
                                }}
                                className="px-3 py-2 text-sm text-white hover:bg-violet-500/20 cursor-pointer transition"
                              >
                                {s}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalValue > 0 && (
              <div className="mt-3 flex items-center justify-between px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                <span className="text-sm text-gray-300">Valeur totale de la commande</span>
                <span className="text-sm font-bold text-violet-300">{totalValue.toFixed(2)}€</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm text-gray-300 mb-1 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
              text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-violet-500/40"
              placeholder="Notes sur la commande..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white
              bg-gradient-to-r from-violet-600 to-fuchsia-600
              hover:from-violet-500 hover:to-fuchsia-500 shadow-lg disabled:opacity-50
              flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la commande'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}