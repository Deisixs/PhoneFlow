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

  const getFilteredDataByTimeRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date(0);
        break;
    }

    return {
      phones: phones.filter((p) => new Date(p.purchase_date) >= startDate),
      repairs: repairs.filter((r) => new Date(r.created_at) >= startDate),
      stockPieces: stockPieces.filter((s) => new Date(s.created_at) >= startDate),
      materielExpenses: materielExpenses.filter((m) => new Date(m.purchase_date) >= startDate),
    };
  };

  const calculateStats = () => {
    const filtered = getFilteredDataByTimeRange();

    const totalPurchased = filtered.phones.length;
    const totalSold = filtered.phones.filter((p) => p.sold_at).length;

    const totalRevenue = filtered.phones
      .filter((p) => p.sold_at)
      .reduce((sum, p) => sum + (p.selling_price || 0) - p.purchase_price, 0);

    const totalRepairCost = filtered.repairs.reduce((sum, r) => sum + r.cost, 0);

    const totalMaterielCost = filtered.materielExpenses.reduce((sum, m) => sum + m.amount, 0);

    const totalStockValue = filtered.stockPieces.reduce(
      (sum, s) => sum + s.purchase_price * s.quantity,
      0
    );

    const revenue = totalRevenue + totalRepairCost - totalMaterielCost;

    const ca = filtered.phones
      .filter((p) => p.sold_at)
      .reduce((sum, p) => sum + (p.selling_price || 0), 0) + totalRepairCost;

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
    const dataMap = new Map<string, { date: string; revenue: number; ca: number; expenses: number }>();

    filtered.phones.forEach((phone) => {
      if (phone.sold_at) {
        const date = new Date(phone.sold_at).toISOString().split('T')[0];
        const existing = dataMap.get(date) || { date, revenue: 0, ca: 0, expenses: 0 };
        existing.ca += phone.selling_price || 0;
        existing.revenue += (phone.selling_price || 0) - phone.purchase_price;
        dataMap.set(date, existing);
      }
    });

    filtered.repairs.forEach((repair) => {
      if (repair.completed_at) {
        const date = new Date(repair.completed_at).toISOString().split('T')[0];
        const existing = dataMap.get(date) || { date, revenue: 0, ca: 0, expenses: 0 };
        existing.ca += repair.cost;
        existing.revenue += repair.cost;
        dataMap.set(date, existing);
      }
    });

    filtered.materielExpenses.forEach((expense) => {
      const date = new Date(expense.purchase_date).toISOString().split('T')[0];
      const existing = dataMap.get(date) || { date, revenue: 0, ca: 0, expenses: 0 };
      existing.expenses += expense.amount;
      existing.revenue -= expense.amount;
      dataMap.set(date, existing);
    });

    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const generatePieData = () => {
    const filtered = getFilteredDataByTimeRange();

    const repairRevenue = filtered.repairs.reduce((sum, r) => sum + r.cost, 0);
    const phoneRevenue = filtered.phones
      .filter((p) => p.sold_at)
      .reduce((sum, p) => sum + (p.selling_price || 0) - p.purchase_price, 0);

    return [
      { name: 'Vente téléphones', value: phoneRevenue, color: '#8b5cf6' },
      { name: 'Réparations', value: repairRevenue, color: '#ec4899' },
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
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#140923] to-[#0d0815] p-6 space-y-6 animate-fade-in">
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
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            <Calendar size={20} />
            <span>{timeRangeLabels[timeRange]}</span>
            <ChevronDown size={16} />
          </button>

          {showTimeRangeMenu && (
            <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-white/10 border border-white/10 rounded-xl shadow-xl z-10">
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
          <p className="text-3xl font-bold text-white">{stats.revenue.toFixed(2)} €</p>
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
          <p className="text-sm text-gray-400 mt-1">Revenus des réparations</p>
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
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
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
                }}
              />
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
                }}
              />
              <Legend />
              <Bar dataKey="expenses" fill="#ef4444" name="Dépenses (€)" />
              <Bar dataKey="revenue" fill="#10b981" name="Bénéfice (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}