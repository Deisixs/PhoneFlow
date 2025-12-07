import React, { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Smartphone,
  Wrench,
  BarChart3,
  Settings,
  QrCode,
  LogOut,
  Lock,
  Package,
  Hammer,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

interface LayoutProps {
  children: ReactNode;
}

const mainNavItems = [
  { path: '/inventory', icon: Smartphone, label: 'Stock' },
  { path: '/repairs', icon: Wrench, label: 'Réparations' },
  { path: '/scanner', icon: QrCode, label: 'Scanner' },
  { path: '/analytics', icon: BarChart3, label: 'Stats' },
];

const moreNavItems = [
  { path: '/stock', icon: Package, label: 'Pièces' },
  { path: '/materiel', icon: Hammer, label: 'Matériel' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);
  const { logout, lock, updateLastActivity } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const handleActivity = () => updateLastActivity();
    const events = ['touchstart', 'touchmove', 'click', 'scroll'];

    events.forEach(event => window.addEventListener(event, handleActivity, { passive: true }));

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
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

  const isMoreActive = moreNavItems.some(item => location.pathname === item.path);

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-fuchsia-500/10 to-blue-600/10 pointer-events-none" />

      <main className="flex-1 overflow-auto pb-20 relative">
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/80 border-t border-white/10 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2 max-w-screen-xl mx-auto">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30'
                      : 'bg-transparent'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
              isMoreActive ? 'text-white' : 'text-gray-400'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${
              isMoreActive
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30'
                : 'bg-transparent'
            }`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>

      {showMoreMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="fixed bottom-20 right-4 left-4 z-50 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
            <div className="p-2">
              {moreNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setShowMoreMenu(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/30'
                        : 'text-gray-300 hover:bg-white/5'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>

            <div className="border-t border-white/10 p-2">
              <button
                onClick={() => {
                  handleLock();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 transition-all duration-200"
              >
                <Lock className="w-5 h-5" />
                <span className="font-medium">Verrouiller</span>
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
