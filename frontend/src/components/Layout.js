import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  FileText,
  Calendar,
  FileCheck,
  Activity,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  User,
  Building2,
  BarChart3,
  MessageCircle
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Varsayılan açık

  const menuItems = [
    { path: '/dashboard', label: 'Anasayfa', icon: LayoutDashboard },
    { path: '/constructions', label: 'İnşaat Listesi', icon: Building2 },
    { path: '/inspections', label: 'Saha Denetimi', icon: ClipboardList },
    { path: '/payments', label: 'Hakediş', icon: FileText },
    { path: '/hakedis-evrak', label: 'Hakediş Evrakları', icon: FileCheck },
    { path: '/workplans', label: 'İş Planlama', icon: Calendar },
    { path: '/licenses', label: 'Ruhsat & Proje', icon: FileCheck },
    { path: '/aylik-raporlar', label: 'Aylık Raporlar', icon: FileText },
    { path: '/yilsonu-raporlar', label: 'Yıl Sonu Raporlar', icon: FileCheck },
    { path: '/activities', label: 'Aktivite Logları', icon: Activity },
    ...(user?.role !== 'user' ? [
      { path: '/mesajlasma', label: 'Mesajlaşma', icon: MessageCircle },
      { path: '/super-admin-reports', label: 'Eksiklik Raporları', icon: FileText }
    ] : []),
    ...(user?.role === 'super_admin' ? [
      { path: '/reports', label: 'Raporlar', icon: BarChart3 },
      { path: '/companies', label: 'Firmalar', icon: Building2 },
      { path: '/users', label: 'Kullanıcılar', icon: User }
    ] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50" data-testid="layout-container">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar - Siyah Tema */}
      <aside
        className={`fixed top-0 left-0 h-full bg-black text-white w-64 z-50 transform transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar"
      >
        <div className="p-6 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <img src="/batlama-logo.png" alt="Batlama Logo" className="h-12 w-auto" />
          </div>
          <p className="text-sm text-gray-300 font-medium">{user?.name}</p>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">{user?.role?.replace('_', ' ')}</p>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900" data-testid="sidebar-nav">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    // Menü otomatik kapanmasın - kullanıcı karar versin
                  }}
                  data-testid={`nav-${item.path.slice(1)}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.path)
                      ? 'bg-gray-700 text-white shadow-lg'
                      : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <Button
            onClick={logout}
            variant="ghost"
            data-testid="logout-button"
            className="w-full justify-start text-gray-400 hover:bg-gray-900 hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Çıkış Yap
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar - Gümüş Gri */}
        <header className="bg-gray-100 border-b border-gray-300 sticky top-0 z-30" data-testid="header">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
              data-testid="mobile-menu-button"
              title={sidebarOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            >
              {sidebarOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                <User className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;