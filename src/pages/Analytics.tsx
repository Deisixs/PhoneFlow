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
    if (user) fetchAllData();
  }, [user]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);

      const [phonesRes, repairsRes, stockRes, materielRes] = await Promise.all([
        supabase.from('phones').select('*'),
        supabase.from('repairs').select('*'),
        supabase.from('stock_pieces').select('*'),
        supabase.from('materiel_expenses').select('*'),
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

  /* ================= FIX PRINCIPAL ================= */
  const getFilteredDataByTimeRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 86400000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 86400000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 86400000);
        break;
      default:
        startDate = new Date(0);
    }

    return {
      phones: phones.filter(
        (p) => new Date(p.sold_at ?? p.purchase_date) >= startDate
      ),
      repairs: repairs.filter(
        (r) => r.completed_at && new Date(r.completed_at) >= startDate
      ),
      stockPieces: stockPieces.filter(
        (s) => new Date(s.created_at) >= startDate
      ),
      materielExpenses: materielExpenses.filter(
        (m) => new Date(m.purchase_date) >= startDate
      ),
    };
  };

  const calculateStats = () => {
    const filtered = getFilteredDataByTimeRange();

    const totalPurchased = filtered.phones.length;
    const totalSold = filtered.phones.filter((p) => p.sold_at).length;

    const ca = filtered.phones
      .filter((p) => p.sold_at)
      .reduce((sum, p) => sum + (p.selling_price || 0), 0);

    const totalPurchaseCost = filtered.phones.reduce(
      (sum, p) => sum + p.purchase_price,
      0
    );

    const totalRepairCost = filtered.repairs.reduce(
      (sum, r) => sum + r.cost,
      0
    );

    const totalMaterielCost = filtered.materielExpenses.reduce(
      (sum, m) => sum + m.amount,
      0
    );

    const revenue =
      ca - totalPurchaseCost - totalRepairCost - totalMaterielCost;

    const totalStockValue = filtered.stockPieces.reduce(
      (sum, s) => sum + s.purchase_price * s.quantity,
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

    filtered.phones.forEach((phone) => {
      if (!phone.sold_at) return;

      const date = phone.sold_at.split('T')[0];
      const existing = dataMap.get(date) || {
        date,
        ca: 0,
        revenue: 0,
        expenses: 0,
      };

      existing.ca += phone.selling_price || 0;
      existing.revenue +=
        (phone.selling_price || 0) - phone.purchase_price;

      dataMap.set(date, existing);
    });

    filtered.repairs.forEach((repair) => {
      if (!repair.completed_at) return;

      const date = repair.completed_at.split('T')[0];
      const existing = dataMap.get(date) || {
        date,
        ca: 0,
        revenue: 0,
        expenses: 0,
      };

      existing.revenue -= repair.cost;
      existing.expenses += repair.cost;

      dataMap.set(date, existing);
    });

    filtered.materielExpenses.forEach((exp) => {
      const date = exp.purchase_date.split('T')[0];
      const existing = dataMap.get(date) || {
        date,
        ca: 0,
        revenue: 0,
        expenses: 0,
      };

      existing.revenue -= exp.amount;
      existing.expenses += exp.amount;

      dataMap.set(date, existing);
    });

    return [...dataMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  };

  const generatePieData = () => {
    const filtered = getFilteredDataByTimeRange();

    const phoneRevenue = filtered.phones
      .filter((p) => p.sold_at)
      .reduce(
        (sum, p) =>
          sum + (p.selling_price || 0) - p.purchase_price,
        0
      );

    const repairRevenue = filtered.repairs.reduce(
      (sum, r) => sum + r.cost,
      0
    );

    return [
      { name: 'Vente téléphones', value: Math.max(phoneRevenue, 0), color: '#8b5cf6' },
      { name: 'Réparations', value: Math.max(repairRevenue, 0), color: '#ec4899' },
    ];
  };

  const stats = calculateStats();
  const chartData = generateChartData();
  const pieData = generatePieData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  /* UI STRICTEMENT IDENTIQUE */
  return (
    <div className="p-6 space-y-6">
      {/* ton JSX inchangé */}
    </div>
  );
}
