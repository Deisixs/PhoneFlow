import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Wrench,
  Calendar,
  ChevronDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type TimeRange = '7days' | '30days' | '90days' | '1year' | 'all';

interface Phone {
  id: string;
  purchase_price: number;
  purchase_date: string;
  selling_price: number | null;
  sold_at: string | null;
  status: string;
}

interface Repair {
  id: string;
  cost: number;
  created_at: string;
  completed_at: string | null;
  phone_id: string;
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

      if (phonesRes.data) {
        console.log("Données téléphones brutes:", phonesRes.data); // Pour le débogage
        setPhones(phonesRes.data);
      }
      if (repairsRes.data) setRepairs(repairsRes.data);
      if (stockRes.data) setStockPieces(stockRes.data);
      if (materielRes.data) setMaterielExpenses(materielRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FONCTIONS UTILITAIRES ROBUSTES ---

  // Vérifie si vendu (insensible à la casse, aux espaces, ou si date présente)
  const isPhoneSold = (p: Phone) => {
    const statusClean = p.status ? p.status.toLowerCase().trim() : '';
    return statusClean === 'vendu' || !!p.sold_at;
  };

  // Récupère la date "effective" pour le graphique
  const getPhoneDate = (p: Phone) => {
    if (isPhoneSold(p)) {
      // Si vendu mais pas de date sold_at, on utilise AUJOURD'HUI (pour qu'il apparaisse dans les stats récentes)
      // Sinon on utiliserait la date d'achat et il disparaitrait des stats si acheté il y a longtemps
      return p.sold_at ? new Date(p.sold_at) : new Date(); 
    }
    return new Date(p.purchase_date);
  };

  const getFilteredDataByTimeRange = () => {
    const now = new Date();
    let startDate: Date;

    // Réinitialiser l'heure pour éviter les décalages de quelques heures
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
        startDate = new Date(0); // 1970
        break;
    }
    
    // Mettre startDate à 00:00:00
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

    // Téléphones achetés (tous ceux dont la date d'achat ou de vente tombe dans la période)
    const totalPurchased = filtered.phones.length;
    
    // Filtrer uniquement les vendus
    const soldPhones = filtered.phones.filter(isPhoneSold);
    const totalSold = soldPhones.length;

    // VENTES (CA) - On sécurise avec Number()
    const totalPhoneCA = soldPhones.reduce((sum, p) => sum + Number(p.selling_price || 0), 0);

    const ca = totalPhoneCA;

    // COÛTS
    const totalPurchaseCost = filtered.phones.reduce((sum, p) => sum + Number(p.purchase_price || 0), 0);
    const totalRepairCost = filtered.repairs.reduce((sum, r) => sum + Number(r.cost || 0), 0);
    const totalMaterielCost = filtered.materielExpenses.reduce((sum, m) => sum + Number(m.amount || 0), 0);

    // BENEFICE
    const revenue =
      totalPhoneCA -
      totalPurchaseCost -
      totalRepairCost -
      totalMaterielCost;

    // Valeur du stock pièces
    const totalStockValue = filtered.stockPieces.reduce(
      (sum, s) => sum + (Number(s.purchase_price) * Number(s.quantity)),
      0
    );

    return {
      ca,
      revenue,
      totalPurchased,
      totalSold,
      totalMaterielCost,
      totalStockValue,
      totalRepairCost,
    };
  };

  const generateChartData = () => {
    const filtered = getFilteredDataByTimeRange();
    const dataMap = new Map<
      string,
      { date: string; ca: number; revenue: number; expenses: number }
    >();

    const getOrCreateEntry = (dateStr: string) => {
        if (!dataMap.has(dateStr)) {
            dataMap.set(dateStr, { date: dateStr, ca: 0, revenue: 0, expenses: 0 });
        }
        return dataMap.get(dateStr)!;
    };

    // --- 1️⃣ CA & Ventes Téléphones
    filtered.phones.forEach((phone) => {
      if (isPhoneSold(phone)) {
        // On utilise la date calculée (Aujourd'hui si pas de sold_at)
        const dateObj = getPhoneDate(phone);
        const date = dateObj.toISOString().split("T")[0];
        
        const entry = getOrCreateEntry(date);
        const sellingPrice = Number(phone.selling_price || 0);
        const purchasePrice = Number(phone.purchase_price || 0);

        entry.ca += sellingPrice;
        entry.revenue += (sellingPrice - purchasePrice);
      }
    });

    // --- 2️⃣ Coût des réparations
    filtered.repairs.forEach((repair) => {
      const dateRef = repair.completed_at || repair.created_at;
      const date = new Date(dateRef).toISOString().split("T")[0];
      const entry = getOrCreateEntry(date);

      const cost = Number(repair.cost || 0);
      entry.revenue -= cost;
      entry.expenses += cost;
    });

    // --- 3️⃣ Coût matériel
    filtered.materielExpenses.forEach((exp) => {
      const date = new Date(exp.purchase_date).toISOString().split("T")[0];
      const entry = getOrCreateEntry(date);

      const amount = Number(exp.amount || 0);
      entry.revenue -= amount;
      entry.expenses += amount;
    });

    return [...dataMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  };

  const generatePieData = () => {
    const filtered = getFilteredDataByTimeRange();

    let repairRevenue = filtered.repairs.reduce((sum, r) => sum + Number(r.cost || 0), 0);
    
    let phoneMargin = filtered.phones
      .filter(isPhoneSold)
      .reduce((sum, p) => sum + (Number(p.selling_price || 0) - Number(p.purchase_price || 0)), 0);

    // Empêcher les valeurs négatives
    repairRevenue = Math.max(repairRevenue, 0);
    phoneMargin = Math.max(phoneMargin, 0);

    return [
      { name: 'Marge Téléphones', value: phoneMargin, color: '#8b5cf6' },
      { name: 'Coût Réparations', value: repairRevenue, color: '#ec4899' },
    ];
  };

  const stats = calculateStats();
  const chartData = generateChartData();
  const pieData = generatePieData();

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

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20">
              <TrendingUp className="text-green-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Bénéfice net</span>
          </div>
          <p className={`text-3xl font-bold ${stats.revenue >= 0 ? 'text-white' : 'text-red-400'}`}>
            {stats.revenue.toFixed(2)} €
          </p>
          <p className="text-sm text-gray-400 mt-1">Après déduction des frais</p>
        </div>

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

         <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20">
              <Wrench className="text-orange-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Coût matériel</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalMaterielCost.toFixed(2)} €</p>
          <p className="text-sm text-gray-400 mt-1">Frais d'entretien</p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-600/20">
              <Package className="text-pink-400" size={24} />
            </div>
            <span className="text-sm text-gray-400">Valeur stock pièces</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalStockValue.toFixed(2)} €</p>
          <p className="text-sm text-gray-400 mt-1">Investissement total</p>
        </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Évolution du chiffre d'affaires</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ca"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="CA (€)"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Bénéfice (€)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Répartition des revenus</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                   color: '#fff'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6">Comparaison des dépenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                   color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="expenses" fill="#ef4444" name="Dépenses (€)" />
              <Bar dataKey="revenue" fill="#10b981" name="Bénéfice Net (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}