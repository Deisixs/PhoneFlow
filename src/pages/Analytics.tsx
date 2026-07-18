import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Wrench,
  Calendar,
  ChevronDown,
  Target,
  Lock,
  Percent
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type TimeRange = '7days' | '30days' | '90days' | '1year' | 'all';

interface Phone {
  id: string;
  purchase_price: number;
  purchase_date: string;
  sale_price: number | null;
  sale_date: string | null;
  is_sold: boolean | null;
}

interface Repair {
  id: string;
  cost: number;
  created_at: string;
  completed_at: string | null;
  phone_id: string;
  status: string;
}

interface StockPiece {
  id: string;
  purchase_price: number;
  quantity: number;
  created_at: string;
}

interface MaterielExpense {
  id: string;
  amount: number;
  purchase_date: string;
}

export function Analytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [showTimeRangeMenu, setShowTimeRangeMenu] = useState(false);

  const [phones, setPhones] = useState<Phone[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [stockPieces, setStockPieces] = useState<StockPiece[]>([]);
  const [materielExpenses, setMaterielExpenses] = useState<MaterielExpense[]>([]);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      const [phonesRes, repairsRes, stockRes, materielRes] = await Promise.all([
        supabase.from('phones').select('*').order('purchase_date', { ascending: false }),
        supabase.from('repairs').select('*').order('created_at', { ascending: false }),
        supabase.from('stock_pieces').select('*'),
        supabase.from('materiel_expenses').select('*').order('purchase_date', { ascending: false }),
      ]);

      if (phonesRes.data) setPhones(phonesRes.data);
      if (repairsRes.data) setRepairs(repairsRes.data);
      if (stockRes.data) setStockPieces(stockRes.data);
      if (materielRes.data) setMaterielExpenses(materielRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPhoneSold = (p: Phone) => {
    return p.is_sold === true || !!p.sale_date;
  };

  const getPhoneDate = (p: Phone) => {
    if (isPhoneSold(p)) {
      return p.sale_date ? new Date(p.sale_date) : new Date();
    }
    return new Date(p.purchase_date);
  };

  const getFilteredDataByTimeRange = () => {
    const now = new Date();
    let startDate: Date;

    now.setHours(23, 59, 59, 999);

    switch (timeRange) {
      case '7days':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate = new Date();
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    startDate.setHours(0, 0, 0, 0);

    return {
      phones: phones.filter((p) => {
        const dateToCheck = getPhoneDate(p);
        return dateToCheck >= startDate;
      }),
      repairs: repairs.filter((r) => new Date(r.created_at) >= startDate),
      stockPieces: stockPieces.filter((s) => new Date(s.created_at) >= startDate),
      materielExpenses: materielExpenses.filter((m) => new Date(m.purchase_date) >= startDate),
    };
  };

  const calculateStats = () => {
    const filtered = getFilteredDataByTimeRange();

    const totalPurchased = filtered.phones.length;

    const soldPhones = filtered.phones.filter(isPhoneSold);
    const totalSold = soldPhones.length;

    const totalPhoneCA = soldPhones.reduce((sum, p) => sum + Number(p.sale_price || 0), 0);
    const ca = totalPhoneCA;

    const totalPurchaseCost = filtered.phones.reduce((sum, p) => sum + Number(p.purchase_price || 0), 0);
    const totalRepairCost = filtered.repairs.reduce((sum, r) => sum + Number(r.cost || 0), 0);
    const totalMaterielCost = filtered.materielExpenses.reduce((sum, m) => sum + Number(m.amount || 0), 0);

    const revenue = totalPhoneCA - totalPurchaseCost - totalRepairCost - totalMaterielCost;

    const totalStockValue = filtered.stockPieces.reduce(
      (sum, s) => sum + (Number(s.purchase_price) * Number(s.quantity)),
      0
    );

    // Calcul du profit net (vente - achat - réparations)
    const netProfitData = soldPhones.map(phone => {
      const phoneRepairs = repairs.filter(r =>
        r.phone_id === phone.id &&
        r.status === 'completed'
      );
      const repairCosts = phoneRepairs.reduce((sum, r) => sum + Number(r.cost || 0), 0);

      return {
        netProfit: Number(phone.sale_price || 0) - Number(phone.purchase_price) - repairCosts,
        salePrice: Number(phone.sale_price || 0),
        purchasePrice: Number(phone.purchase_price),
        repairCosts: repairCosts
      };
    });

    const totalNetProfit = netProfitData.reduce((sum, item) => sum + item.netProfit, 0);
    const averageNetProfit = netProfitData.length > 0 ? totalNetProfit / netProfitData.length : 0;

    // Marge sur le prix de vente (CA) — celle qui compte pour le seuil micro-entreprise
    // Marge (%) = Bénéfice net total / CA total × 100
    const averageMarginPercentage = ca > 0 ? (totalNetProfit / ca) * 100 : 0;

    // Argent gelé (prix d'achat des téléphones non vendus)
    const unsoldPhones = filtered.phones.filter(p => !isPhoneSold(p));
    const frozenMoney = unsoldPhones.reduce((sum, p) => sum + Number(p.purchase_price), 0);

    return {
      ca,
      revenue,
      totalPurchased,
      totalSold,
      totalMaterielCost,
      totalStockValue,
      totalRepairCost,
      totalNetProfit,
      averageNetProfit,
      averageMarginPercentage,
      netProfitCount: netProfitData.length,
      frozenMoney
    };
  };

  const stats = calculateStats();

  const timeRangeLabels: Record<TimeRange, string> = {
    '7days': '7 derniers jours',
    '30days': '30 derniers jours',
    '90days': '90 derniers jours',
    '1year': '1 an',
    'all': 'Tout',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Analyses
          </h1>
          <p className="text-gray-400 mt-1">Tableau de bord financier et statistiques</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowTimeRangeMenu(!showTimeRangeMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white"
          >
            <Calendar size={20} />
            <span>{timeRangeLabels[timeRange]}</span>
            <ChevronDown size={16} />
          </button>

          {showTimeRangeMenu && (
            <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-[#1a1b26] border border-white/10 rounded-xl shadow-xl z-10">
              {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setTimeRange(range);
                    setShowTimeRangeMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-all first:rounded-t-xl last:rounded-b-xl ${
                    timeRange === range ? 'bg-violet-600/20 text-violet-400' : 'text-white'
                  }`}
                >
                  {timeRangeLabels[range]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. PROFIT NET TOTAL */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20">
              <Target className="text-emerald-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Profit Net Total</span>
          </div>
          <p className={`text-3xl font-bold ${stats.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.totalNetProfit.toFixed(2)} €
          </p>
          <p className="text-sm text-gray-400 mt-1">Vente - (Achat + Réparations)</p>
        </div>

        {/* 2. CHIFFRE D'AFFAIRES */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20">
              <DollarSign className="text-blue-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Chiffre d'affaires</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.ca.toFixed(2)} €</p>
          <p className="text-sm text-gray-400 mt-1">Total des ventes</p>
        </div>

        {/* 3. ARGENT GELÉ */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <Lock className="text-amber-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Argent gelé</span>
          </div>
          <p className="text-3xl font-bold text-amber-400">{stats.frozenMoney.toFixed(2)} €</p>
          <p className="text-sm text-gray-400 mt-1">Stock non vendu</p>
        </div>

        {/* 4. TÉLÉPHONES ACHETÉS / VENDUS */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20">
              <ShoppingCart className="text-violet-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Téléphones</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.totalPurchased} / {stats.totalSold}
          </p>
          <p className="text-sm text-gray-400 mt-1">Achetés / Vendus</p>
        </div>

        {/* 5. MARGE MOYENNE (%) */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20">
              <Percent className="text-pink-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Marge moyenne</span>
          </div>
          <p className={`text-3xl font-bold ${stats.averageMarginPercentage >= 0 ? 'text-pink-400' : 'text-red-400'}`}>
            {stats.averageMarginPercentage.toFixed(1)} %
          </p>
          <p className="text-sm text-gray-400 mt-1">Bénéfice net / CA</p>
        </div>

        {/* 6. COÛT DES RÉPARATIONS */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
              <Wrench className="text-cyan-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Réparations</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalRepairCost.toFixed(2)} €</p>
          <p className="text-sm text-gray-400 mt-1">Coût des réparations</p>
        </div>
      </div>
    </div>
  );
}