import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ClipboardList, 
  FileText, 
  FileCheck, 
  Calendar, 
  TrendingUp, 
  Activity,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [animatedStats, setAnimatedStats] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  // Animasyonlu sayılar için
  useEffect(() => {
    if (stats) {
      Object.keys(stats).forEach((key) => {
        animateValue(key, 0, stats[key], 1000);
      });
    }
  }, [stats]);

  const animateValue = (key, start, end, duration) => {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
        current = end;
        clearInterval(timer);
      }
      setAnimatedStats(prev => ({ ...prev, [key]: Math.floor(current) }));
    }, 16);
  };

  const fetchData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/activities')
      ]);
      setStats(statsRes.data);
      setRecentActivities(activitiesRes.data.slice(0, 8));
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Grafik verileri
  const monthlyData = [
    { name: 'Oca', denetim: 45, hakedis: 28, ruhsat: 15 },
    { name: 'Şub', denetim: 52, hakedis: 35, ruhsat: 20 },
    { name: 'Mar', denetim: 61, hakedis: 42, ruhsat: 25 },
    { name: 'Nis', denetim: 58, hakedis: 38, ruhsat: 22 },
    { name: 'May', denetim: 70, hakedis: 48, ruhsat: 30 },
    { name: 'Haz', denetim: 75, hakedis: 52, ruhsat: 28 }
  ];

  const pieData = [
    { name: 'Tamamlandı', value: animatedStats.total_inspections || 0, color: '#10b981' },
    { name: 'Bekliyor', value: animatedStats.pending_workplans || 0, color: '#f59e0b' },
    { name: 'İptal', value: 5, color: '#ef4444' }
  ];

  const weeklyActivityData = [
    { day: 'Pzt', aktivite: 12 },
    { day: 'Sal', aktivite: 19 },
    { day: 'Çar', aktivite: 15 },
    { day: 'Per', aktivite: 25 },
    { day: 'Cum', aktivite: 22 },
    { day: 'Cmt', aktivite: 8 },
    { day: 'Paz', aktivite: 5 }
  ];

  const statCards = [
    {
      title: 'İnşaat Listesi',
      value: animatedStats.total_constructions || 0,
      icon: ClipboardList,
      gradient: 'from-indigo-500 to-purple-600',
      path: '/constructions',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Saha Denetimi',
      value: animatedStats.total_inspections || 0,
      icon: FileCheck,
      gradient: 'from-blue-500 to-cyan-600',
      path: '/inspections',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Hakediş',
      value: animatedStats.total_payments || 0,
      icon: FileText,
      gradient: 'from-green-500 to-emerald-600',
      path: '/payments',
      change: '+15%',
      changeType: 'increase'
    },
    {
      title: 'Ruhsat Kaydı',
      value: animatedStats.total_licenses || 0,
      icon: CheckCircle2,
      gradient: 'from-purple-500 to-pink-600',
      path: '/licenses',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Bekleyen İş',
      value: animatedStats.pending_workplans || 0,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-600',
      path: '/workplans',
      change: '-3%',
      changeType: 'decrease'
    },
    {
      title: 'Son 7 Gün',
      value: animatedStats.recent_inspections || 0,
      icon: TrendingUp,
      gradient: 'from-red-500 to-rose-600',
      path: '/inspections',
      change: '+20%',
      changeType: 'increase'
    }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-medium animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn" data-testid="dashboard-page">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 animate-slideInLeft">
              Hoş Geldiniz! 👋
            </h1>
            <p className="text-indigo-100 text-lg animate-slideInLeft animation-delay-100">
              Yapı Denetim Sistemi - Güncel Durum
            </p>
          </div>
          <div className="hidden md:block animate-bounce-slow">
            <Activity className="w-16 h-16 text-white/80" />
          </div>
        </div>
      </div>

      {/* Stats Grid - Animated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 overflow-hidden group animate-scaleIn"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => navigate(stat.path)}
            data-testid={`stat-card-${index}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 group-hover:text-white transition-colors">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <p className="text-4xl font-bold text-slate-900 group-hover:text-white transition-colors">
                      {stat.value}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      stat.changeType === 'increase' 
                        ? 'bg-green-100 text-green-700 group-hover:bg-white/20 group-hover:text-white' 
                        : 'bg-red-100 text-red-700 group-hover:bg-white/20 group-hover:text-white'
                    } transition-colors flex items-center gap-1`}>
                      {stat.changeType === 'increase' ? '↑' : '↓'} {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-lg`}>
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              
              {/* Mini Sparkline Effect */}
              <div className="mt-4 flex items-center gap-1 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-slate-300 to-slate-100 group-hover:from-white/40 group-hover:to-white/20 rounded-full transition-all"
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 50}ms`
                    }}
                  ></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Aylık Trend */}
        <Card className="shadow-xl border-0 animate-slideInLeft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Aylık İstatistikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorDenetim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHakedis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area type="monotone" dataKey="denetim" stroke="#6366f1" fillOpacity={1} fill="url(#colorDenetim)" />
                <Area type="monotone" dataKey="hakedis" stroke="#10b981" fillOpacity={1} fill="url(#colorHakedis)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Durum Dağılımı */}
        <Card className="shadow-xl border-0 animate-slideInRight">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <PieChart className="w-5 h-5 text-purple-500" />
              Durum Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Haftalık Aktivite */}
        <Card className="shadow-xl border-0 animate-slideInLeft animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Activity className="w-5 h-5 text-green-500" />
              Haftalık Aktivite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="aktivite" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities with Animation */}
        <Card className="shadow-xl border-0 animate-slideInRight animation-delay-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5 text-blue-500" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {recentActivities.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Henüz aktivite yok</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-105 border border-slate-200 hover:border-indigo-300 animate-slideInUp"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.aksiyon === 'create' ? 'bg-green-100' :
                      activity.aksiyon === 'update' ? 'bg-blue-100' :
                      activity.aksiyon === 'delete' ? 'bg-red-100' :
                      'bg-slate-100'
                    }`}>
                      {activity.aksiyon === 'create' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                       activity.aksiyon === 'update' ? <ArrowUpRight className="w-4 h-4 text-blue-600" /> :
                       activity.aksiyon === 'delete' ? <AlertCircle className="w-4 h-4 text-red-600" /> :
                       <Activity className="w-4 h-4 text-slate-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{activity.aciklama}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-600 font-medium">{activity.userName}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{formatDate(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
        .animate-slideInUp { animation: slideInUp 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.5s ease-out; }
        .animate-bounce-slow { animation: bounce 3s infinite; }
        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default Dashboard;
