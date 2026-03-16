import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, FileText, Package, Wallet,
  LogOut, Shield, Sun, Moon, Languages, ChevronRight, Menu, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLang } from '../contexts/LangContext';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLang, lang } = useLang();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/admin/companies', icon: Building2, label: t('companies') },
    { to: '/admin/applications', icon: FileText, label: t('applications') },
    { to: '/admin/manifests', icon: Package, label: t('manifests') },
    { to: '/admin/wallet', icon: Wallet, label: t('wallet') },
  ];

  const handleLogout = () => {
    logout();
    toast.success(t('loggedOut'));
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b dark:border-slate-700/50 border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold dark:text-slate-100 text-gray-900">{t('appName')}</h1>
            <p className="text-xs dark:text-slate-500 text-gray-400 font-medium">{t('adminPanel')}</p>
          </div>
        </div>
      </div>

      {/* Theme & Lang toggles */}
      <div className="px-4 py-3 flex gap-2 border-b dark:border-slate-700/50 border-gray-100">
        <button
          onClick={toggleTheme}
          className="btn-ghost btn-sm btn flex-1 rounded-xl"
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4 text-indigo-500" />
          }
          <span className="text-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button
          onClick={toggleLang}
          className="btn-ghost btn-sm btn flex-1 rounded-xl"
          title="Toggle Language"
        >
          <Languages className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold">{lang === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-30 ltr-icon flex-shrink-0" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t dark:border-slate-700/50 border-gray-100">
        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl dark:bg-slate-700/30 bg-gray-50">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold dark:text-slate-200 text-gray-800 truncate">{user?.name}</p>
            <p className="text-xs dark:text-slate-500 text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost btn w-full justify-start gap-2 text-xs rounded-xl">
          <LogOut className="w-3.5 h-3.5" />
          {t('signOut')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen dark:bg-slate-950 bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 dark:bg-slate-900/80 bg-white border-r dark:border-slate-700/50 border-gray-200 flex-col backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-64 flex-shrink-0 dark:bg-slate-900 bg-white border-e dark:border-slate-700/50 border-gray-200 flex flex-col transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}>
        <div className="flex items-center justify-end p-4">
          <button onClick={() => setSidebarOpen(false)} className="btn-ghost btn btn-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="flex lg:hidden items-center gap-3 p-4 border-b dark:border-slate-700/50 border-gray-200 dark:bg-slate-900/60 bg-white backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost btn btn-sm">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="font-bold dark:text-slate-100 text-gray-900 text-sm">{t('appName')}</span>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
