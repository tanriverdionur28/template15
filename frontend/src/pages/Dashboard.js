import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, FileText, FileCheck, Calendar, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/activities')
      ]);
      setStats(statsRes.data);
      setRecentActivities(activitiesRes.data.slice(0, 10));
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'İnşaat Listesi',
      value: stats?.total_constructions || 0,
      icon: ClipboardList,
      color: 'bg-indigo-500',
      path: '/constructions'
    },
    {
      title: 'Saha Denetimi',
      value: stats?.total_inspections || 0,
      icon: ClipboardList,
      color: 'bg-blue-500',
      path: '/inspections'
    },
    {
      title: 'Hakediş',
      value: stats?.total_payments || 0,
      icon: FileText,
      color: 'bg-green-500',
      path: '/payments'
    },
    {
      title: 'Ruhsat Kaydı',
      value: stats?.total_licenses || 0,
      icon: FileCheck,
      color: 'bg-purple-500',
      path: '/licenses'
    },
    {
      title: 'Bekleyen İş',
      value: stats?.pending_workplans || 0,
      icon: Calendar,
      color: 'bg-amber-500',
      path: '/workplans'
    },
    {
      title: 'Son 7 Gün',
      value: stats?.recent_inspections || 0,
      icon: TrendingUp,
      color: 'bg-red-500',
      path: '/inspections'
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
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
          Anasayfa
        </h1>
        <p className="text-slate-600 mt-1">Yapı denetim sistemi özet görünümü</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-all border-l-4 hover:scale-105"
            style={{ borderLeftColor: stat.color.replace('bg-', '#') }}
            onClick={() => navigate(stat.path)}
            data-testid={`stat-card-${index}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card data-testid="recent-activities-card">
        <CardHeader>
          <CardTitle className="text-xl">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Henüz aktivite yok</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  data-testid={`activity-${index}`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.aciklama}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">{activity.userName}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{formatDate(activity.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    activity.aksiyon === 'create' ? 'bg-green-100 text-green-700' :
                    activity.aksiyon === 'update' ? 'bg-blue-100 text-blue-700' :
                    activity.aksiyon === 'delete' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {activity.aksiyon === 'create' ? 'Oluşturma' :
                     activity.aksiyon === 'update' ? 'Güncelleme' :
                     activity.aksiyon === 'delete' ? 'Silme' :
                     activity.aksiyon}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
