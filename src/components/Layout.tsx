import React, { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Wrench,
  BarChart3,
  Settings,
  QrCode,
  LogOut,
  Lock,
  Menu,
  X,
  Package,
  Hammer
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/inventory', icon: Smartphone, label: 'Inventaire' },
  { path: '/repairs', icon: Wrench, label: 'Réparations' },
  { path: '/stock', icon: Package, label: 'Stock Pièces' },
  { path: '/materiel', icon: Hammer, label: 'Matériel' },
  { path: '/analytics', icon: BarChart3, label: 'Analyses' },
  { path: '/scanner', icon: QrCode, label: 'Scanner' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { logout, lock, updateLastActivity } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handle = () => updateLastActivity();
    window.addEventListener('mousemove', handle);
    window.addEventListener('keydown', handle);
    window.addEventListener('click', handle);
    return () => {
      window.removeEventListener('mousemove', handle);
      window.removeEventListener('keydown', handle);
      window.removeEventListener('click', handle);
    };
  }, [updateLastActivity]);

  const handleLogout = async () => {
    await logout();
    showToast('Déconnexion réussie', 'info');
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-black text-white flex">

      {/* FOND GLOBAL */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-700/20 via-fuchsia-600/10 to-blue-800/20 pointer-events-none" />

      {/* SIDEBAR FIXE */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 backdrop-blur-xl bg-black/40 border-r border-white/10 z-50 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  PhoneFlow
                </h1>
                <p className="text-xs text-gray-400">Gestion Pro</p>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-white border border-violet-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* FOOTER */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={() => lock()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <Lock />
              Verrouiller
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 ml-0 lg:ml-72 relative z-10">

        {/* 🔥 HEADER SUPPRIMÉ DONC PLUS AUCUNE BANDE EN HAUT */}

        <main className="p-6">
          {children}
        </main>

      </div>
    </div>
  );
};
