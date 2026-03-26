import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2, Smartphone, Calendar, Battery, DollarSign, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { generateQRCode } from '../lib/auth';

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
  battery_health: number | null;
}

interface PurchaseAccount {
  id: string;
  name: string;
  color: string;
}

interface PhoneModalProps {
  phone: Phone | null;
  accounts: PurchaseAccount[];
  onClose: () => void;
  onSave: () => void;
}

const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

const COLOR_OPTIONS = [
  'Noir',
  'Blanc',
  'Rouge',
  'Vert',
  'Bleu',
  'Gris',
  'Or',
  'Argent',
  'Rose',
  'Violet',
  'Noir sidéral',
  'Bleu pacifique',
  'Minuit',
  'Lumière stellaire',
];

const IPHONE_MODELS = [
  // iPhone 16 (2024)
  'iPhone 16 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Plus',
  'iPhone 16',
  
  // iPhone 15 (2023)
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Plus',
  'iPhone 15',
  
  // iPhone 14 (2022)
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Plus',
  'iPhone 14',
  
  // iPhone 13 (2021)
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 13 mini',
  
  // iPhone 12 (2020)
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'iPhone 12 mini',
  
  // iPhone 11 (2019)
  'iPhone 11 Pro Max',
  'iPhone 11 Pro',
  'iPhone 11',
];

export const PhoneModal: React.FC<PhoneModalProps> = ({ phone, accounts, onClose, onSave }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    model: phone?.model || '',
    storage: phone?.storage || '128GB',
    color: phone?.color || '',
    imei: phone?.imei || '',
    purchase_price: phone?.purchase_price || 0,
    purchase_date: phone?.purchase_date || today,
    battery_health: phone?.battery_health || null,
    purchase_account_id: phone?.purchase_account_id || null,
    notes: phone?.notes || '',
    sale_price: phone?.sale_price || null,
    sale_date: phone?.sale_date || null,
    is_sold: phone?.is_sold || false,
  });

  const [loading, setLoading] = useState(false);
  const [showModelList, setShowModelList] = useState(false);
  const [showStorageList, setShowStorageList] = useState(false);
  const [showColorList, setShowColorList] = useState(false);
  const [showAccountList, setShowAccountList] = useState(false);
  const [modelSearch, setModelSearch] = useState(phone?.model || '');
  const [colorSearch, setColorSearch] = useState(phone?.color || '');
  
  // Refs pour détecter les clics en dehors
  const modelRef = useRef<HTMLDivElement>(null);
  const storageRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  
  const { userId } = useAuth();
  const { showToast } = useToast();

  // Fermer les dropdowns si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModelList(false);
      }
      if (storageRef.current && !storageRef.current.contains(event.target as Node)) {
        setShowStorageList(false);
      }
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setShowColorList(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setShowAccountList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les modèles selon la recherche
  const filteredModels = IPHONE_MODELS.filter(model =>
    model.toLowerCase().includes(modelSearch.toLowerCase())
  );

  // Filtrer les couleurs selon la recherche
  const filteredColors = COLOR_OPTIONS.filter(color =>
    color.toLowerCase().includes(colorSearch.toLowerCase())
  );

  const handleModelSelect = (model: string) => {
    setFormData({ ...formData, model });
    setModelSearch(model);
    setShowModelList(false);
  };

  const handleStorageSelect = (storage: string) => {
    setFormData({ ...formData, storage });
    setShowStorageList(false);
  };

  const handleColorSelect = (color: string) => {
    setFormData({ ...formData, color });
    setColorSearch(color);
    setShowColorList(false);
  };

  const handleAccountSelect = (accountId: string) => {
    setFormData({ ...formData, purchase_account_id: accountId || null });
    setShowAccountList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phoneData = {
        ...formData,
        user_id: userId!,
        condition: 'Non spécifié',
        qr_code: phone?.id ? (phone.qr_code || null) : generateQRCode('', formData.imei),
      };

      if (phone?.id) {
        const { error } = await supabase
          .from('phones')
          .update(phoneData)
          .eq('id', phone.id);

        if (error) throw error;
        showToast('Téléphone modifié avec succès', 'success');
      } else {
        const { error } = await supabase.from('phones').insert(phoneData);

        if (error) throw error;
        showToast('Téléphone ajouté avec succès', 'success');
      }

      onSave();
    } catch (error: any) {
      showToast(error.message || "Erreur lors de l'enregistrement", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-black via-gray-900 to-black animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl shadow-violet-500/20">
        
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
              <h2 className="text-2xl font-bold text-white">
                {phone ? 'Modifier le téléphone' : 'Ajouter un téléphone'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Scrollable content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-5rem)] p-6 space-y-5">

            {/* SECTION PRINCIPALE */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Modèle avec auto-complétion */}
                <div ref={modelRef} className="relative">
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                    Modèle
                  </label>
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => {
                      setModelSearch(e.target.value);
                      setFormData({ ...formData, model: e.target.value });
                      setShowModelList(true);
                    }}
                    onFocus={() => setShowModelList(true)}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                    placeholder="Rechercher un modèle..."
                    autoComplete="off"
                  />
                  
                  {/* Liste déroulante modèles */}
                  {showModelList && filteredModels.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-gray-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20">
                      {filteredModels.map((model, index) => (
                        <div
                          key={index}
                          onClick={() => handleModelSelect(model)}
                          className="px-4 py-3 hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-fuchsia-500/20 cursor-pointer text-white transition-all border-b border-violet-500/10 last:border-b-0"
                        >
                          {model}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stockage avec dropdown */}
                <div ref={storageRef} className="relative">
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                    Stockage
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStorageList(!showStorageList)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all text-left"
                  >
                    {formData.storage}
                  </button>
                  
                  {/* Liste déroulante stockage */}
                  {showStorageList && (
                    <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-gray-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20">
                      {STORAGE_OPTIONS.map((storage, index) => (
                        <div
                          key={index}
                          onClick={() => handleStorageSelect(storage)}
                          className={`px-4 py-3 cursor-pointer transition-all border-b border-violet-500/10 last:border-b-0 ${
                            formData.storage === storage
                              ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 text-white font-semibold'
                              : 'text-white hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-fuchsia-500/20'
                          }`}
                        >
                          {storage}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Couleur avec auto-complétion */}
                <div ref={colorRef} className="relative">
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                    Couleur
                  </label>
                  <input
                    type="text"
                    value={colorSearch}
                    onChange={(e) => {
                      setColorSearch(e.target.value);
                      setFormData({ ...formData, color: e.target.value });
                      setShowColorList(true);
                    }}
                    onFocus={() => setShowColorList(true)}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                    placeholder="Rechercher une couleur..."
                    autoComplete="off"
                  />
                  
                  {/* Liste déroulante couleurs */}
                  {showColorList && filteredColors.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-gray-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20">
                      {filteredColors.map((color, index) => (
                        <div
                          key={index}
                          onClick={() => handleColorSelect(color)}
                          className="px-4 py-3 hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-fuchsia-500/20 cursor-pointer text-white transition-all border-b border-violet-500/10 last:border-b-0"
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* IMEI */}
                <div>
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                    IMEI
                  </label>
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all font-mono"
                    placeholder="123456789012345"
                  />
                </div>

                {/* Prix d'achat - CORRIGÉ */}
                <div>
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Prix d'achat (€)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.purchase_price.toString().replace('.', ',')}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Accepter virgule ET point
                      const cleaned = value.replace(/[^\d,\.]/g, '');
                      // Remplacer virgule par point pour le stockage
                      const withDot = cleaned.replace(',', '.');
                      const parsed = parseFloat(withDot);
                      setFormData({ ...formData, purchase_price: isNaN(parsed) ? 0 : parsed });
                    }}
                    onKeyDown={(e) => {
                      // Accepter les touches: chiffres, virgule, point, backspace, delete, tab, flèches
                      const allowed = ['0','1','2','3','4','5','6','7','8','9',',','.','Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                      if (!allowed.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                    placeholder="999,00"
                  />
                </div>

                {/* Date d'achat */}
                <div>
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date d'achat
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all"
                  />
                </div>

                {/* Santé de la batterie */}
                <div>
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    Santé de la batterie (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.battery_health || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      battery_health: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                    placeholder="100"
                  />
                </div>

                {/* Compte d'achat avec dropdown */}
                <div ref={accountRef} className="relative">
                  <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Compte d'achat
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAccountList(!showAccountList)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all text-left"
                  >
                    {formData.purchase_account_id 
                      ? accounts.find(a => a.id === formData.purchase_account_id)?.name 
                      : 'Aucun / Non spécifié'}
                  </button>
                  
                  {/* Liste déroulante comptes */}
                  {showAccountList && (
                    <div className="absolute z-20 w-full mt-2 max-h-60 overflow-y-auto bg-gray-900 border border-violet-500/30 rounded-xl shadow-2xl shadow-violet-500/20">
                      <div
                        onClick={() => handleAccountSelect('')}
                        className={`px-4 py-3 cursor-pointer transition-all border-b border-violet-500/10 ${
                          !formData.purchase_account_id
                            ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 text-white font-semibold'
                            : 'text-white hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-fuchsia-500/20'
                        }`}
                      >
                        Aucun / Non spécifié
                      </div>
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          onClick={() => handleAccountSelect(account.id)}
                          className={`px-4 py-3 cursor-pointer transition-all border-b border-violet-500/10 last:border-b-0 ${
                            formData.purchase_account_id === account.id
                              ? 'bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 text-white font-semibold'
                              : 'text-white hover:bg-gradient-to-r hover:from-violet-500/20 hover:to-fuchsia-500/20'
                          }`}
                        >
                          {account.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Notes */}
              <div className="mt-5">
                <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white resize-none placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </div>

            {/* SECTION VENTE */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 shadow-xl">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_sold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_sold: e.target.checked,
                      sale_date: e.target.checked ? today : null,
                    })
                  }
                  className="w-5 h-5 rounded bg-gray-900/50 border-violet-500/30 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm font-semibold text-white uppercase tracking-wide">Marquer comme vendu</span>
              </label>

              {formData.is_sold && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 animate-slide-down">
                  {/* Prix de vente - CORRIGÉ */}
                  <div>
                    <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                      Prix de vente (€)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.sale_price !== null ? formData.sale_price.toString().replace('.', ',') : ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const cleaned = value.replace(/[^\d,\.]/g, '');
                        const withDot = cleaned.replace(',', '.');
                        const parsed = parseFloat(withDot);
                        setFormData({ ...formData, sale_price: isNaN(parsed) ? null : parsed });
                      }}
                      onKeyDown={(e) => {
                        const allowed = ['0','1','2','3','4','5','6','7','8','9',',','.','Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                        if (!allowed.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none transition-all"
                      placeholder="1199,00"
                    />
                  </div>

                  {/* Date de vente */}
                  <div>
                    <label className="block text-sm font-semibold text-violet-300 mb-2 uppercase tracking-wide">
                      Date de vente
                    </label>
                    <input
                      type="date"
                      value={formData.sale_date || ''}
                      onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-violet-500/30 rounded-xl text-white focus:border-violet-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BOUTONS */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800/50 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all border border-violet-500/20"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-violet-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};