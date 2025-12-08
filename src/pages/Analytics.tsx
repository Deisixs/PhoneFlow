// --- ANALYTICS CORRIGÉ COMPLET ---

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
}

interface Repair {
  id: string;
  cost: number;
  created_at: string;
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
    } finally {
      setIsLoading(false);
    }
  };

  // --- FILTRAGE DES DONNÉES ---
  const getFilteredDataByTimeRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7days': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case '30days': startDate = new Date(now.getTime() - 30 * 86400000); break;
      case '90days': startDate = new Date(now.getTime() - 90 * 86400000); break;
      case '1year': startDate = new Date(now.getTime() - 365 * 86400000); break;
      default: startDate = new Date(0); break;
    }

    return {
      phones: phones.filter((p) => new Date(p.purchase_date) >= startDate),
      repairs: repairs.filter((r) => new Date(r.created_at) >= startDate),
      stockPieces: stockPieces.filter((s) => new Date(s.created_at) >= startDate),
      materielExpenses: materielExpenses.filter((m) => new Date(m.purchase_date) >= startDate),
    };
  };

  // --- CALCULS CORRIGÉS ---
  const calculateStats = () => {
    const filtered = getFilteredDataByTimeRange();

    // Achetés / Vendus
    const totalPurchased = filtered.phones.length;
    const totalSold = filtered.phones.filter((p) => p.sold_at).length;

    // CA = seulement les ventes (PAS réparations)
    const ca = filtered.phones
      .filter((p) => p.sold_at)
      .reduce((sum, p) => sum + (p.selling_price || 0), 0);

    // Coût des réparations (DÉPENSE)
    const totalRepairCost = filtered.repairs.reduce((sum, r) => sum + r.cost, 0);

    // Coût matériel (DÉPENSE)
    const totalMaterielCost = filtered.materielExpenses.reduce((sum, m) => sum + m.amount, 0);

    // Valeur stock pièces
    const totalStockValue = filtered.stockPieces.reduce(
      (sum, s) => sum + s.purchase_price * s.quantity,
      0
    );

    // Coût d'achat
    const totalPurchaseCost = filtered.phones.reduce(
      (sum, p) => sum + p.purchase_price,
      0
    );

    // BÉNÉFICE NET CORRIGÉ
    const revenue =
      ca - totalPurchaseCost - totalRepairCost - totalMaterielCost;

    return {
      ca,
      revenue,
      totalPurchased,
      totalSold,
      totalMaterielCost,
      totalRepairCost,
      totalStockValue,
    };
  };

  const stats = calculateStats();

  // --- GRAPHIQUE CA / REVENUE ---
  const generateChartData = () => {
    const filtered = getFilteredDataByTimeRange();
    const map = new Map<string, any>();

    filtered.phones.forEach((p) => {
      if (p.sold_at) {
        const date = p.sold_at.split('T')[0];
        const entry = map.get(date) || { date, ca: 0, revenue: 0, expenses: 0 };

        entry.ca += p.selling_price || 0;
        entry.revenue += (p.selling_price || 0) - p.purchase_price;

        map.set(date, entry);
      }
    });

    filtered.repairs.forEach((r) => {
      const date = r.created_at.split('T')[0];
      const entry = map.get(date) || { date, ca: 0, revenue: 0, expenses: 0 };

      entry.expenses += r.cost;
      entry.revenue -= r.cost;

      map.set(date, entry);
    });

    filtered.materielExpenses.forEach((m) => {
      const date = m.purchase_date.split('T')[0];
      const entry = map.get(date) || { date, ca: 0, revenue: 0, expenses: 0 };

      entry.expenses += m.amount;
      entry.revenue -= m.amount;

      map.set(date, entry);
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = generateChartData();

  const pieData = [
    { name: 'Ventes téléphones', value: stats.ca, color: '#8b5cf6' },
    { name: 'Coûts réparation', value: stats.totalRepairCost, color: '#ef4444' },
  ];

  if (isLoading) {
    return <div className="flex justify-center p-10">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">

      {/* TITRE */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
          Analyses
        </h1>
      </div>

      {/* CARTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* CA */}
        <div className="card">
          <DollarSign />
          <p className="value">{stats.ca.toFixed(2)} €</p>
          <p>Chiffre d'affaires</p>
        </div>

        {/* BÉNÉFICE */}
        <div className="card">
          <TrendingUp />
          <p className="value">{stats.revenue.toFixed(2)} €</p>
          <p>Bénéfice net</p>
        </div>

        {/* ACHETÉS / VENDUS */}
        <div className="card">
          <ShoppingCart />
          <p className="value">{stats.totalPurchased} / {stats.totalSold}</p>
          <p>Achetés / Vendus</p>
        </div>
      </div>

      {/* GRAPHIQUES */}
      {/* Tu gardes les composants comme avant, ils fonctionneront correctement */}

    </div>
  );
}
