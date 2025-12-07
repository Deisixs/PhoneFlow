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
    const handleActivity = () => updateLastActivity();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [updateLastActivity]);

  const handleLogout = async () => {
    await logout();
    showToast('Déconnexion réussie', 'info');
    navigate('/');
  };

  const handleLock = () => {
    lock();
    showToast('Session verrouillée', 'info');
  };

  return (
    <div className="min-h-screen flex text-white overflow-hidden bg-transparent">

      {/* FULL PAGE GRADIENT OVERLAY */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-transparent via-purple-900/10 to-fuchsia-900/10" />

      {/* SIDEBAR (FIXE) */}
      <aside
        className={`fixed lg:relative z-40 h-screen w-72 
          backdrop-blur-2xl bg-gradient-to-br from-[#1a0d30]/90 to-[#0b0318]/90 
          border-r border-white/10 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">

          {/* Logo section */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 text-white border border-violet-500/30 shadow-lg shadow-violet-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom buttons */}
          <div className="p-4 border-t border-white/10 space-y-2">
            <button
              onClick={handleLock}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <Lock className="w-5 h-5" /> Verrouiller
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" /> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">

        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 bg-transparent">
          {children}
        </main>

      </div>
    </div>
  );
};
