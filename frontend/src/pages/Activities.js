import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Activity as ActivityIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await api.get('/activities');
      setActivities(response.data);
    } catch (error) {
      toast.error('Aktivite logları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionLabel = (action) => {
    const labels = {
      'create': 'Oluşturma',
      'update': 'Güncelleme',
      'delete': 'Silme',
      'login': 'Giriş'
    };
    return labels[action] || action;
  };

  const getActionColor = (action) => {
    const colors = {
      'create': 'bg-green-100 text-green-700',
      'update': 'bg-blue-100 text-blue-700',
      'delete': 'bg-red-100 text-red-700',
      'login': 'bg-purple-100 text-purple-700'
    };
    return colors[action] || 'bg-slate-100 text-slate-700';
  };

  const getTypeLabel = (tip) => {
    const labels = {
      'saha_denetim': 'Saha Denetimi',
      'hakedis': 'Hakediş',
      'ruhsat': 'Ruhsat',
      'workplan': 'İş Planı',
      'login': 'Giriş'
    };
    return labels[tip] || tip;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || activity.tip === filterType;
    const matchesAction = filterAction === 'all' || activity.aksiyon === filterAction;
    
    return matchesSearch && matchesType && matchesAction;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="activities-loading">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="activities-page">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
          Aktivite Logları
        </h1>
        <p className="text-slate-600 mt-1">Tüm sistem aktivitelerini görüntüleyin</p>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger data-testid="filter-type-select">
                <SelectValue placeholder="Tüm Tipler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tipler</SelectItem>
                <SelectItem value="saha_denetim">Saha Denetimi</SelectItem>
                <SelectItem value="hakedis">Hakediş</SelectItem>
                <SelectItem value="ruhsat">Ruhsat</SelectItem>
                <SelectItem value="workplan">İş Planı</SelectItem>
                <SelectItem value="login">Giriş</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger data-testid="filter-action-select">
                <SelectValue placeholder="Tüm Aksiyonlar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Aksiyonlar</SelectItem>
                <SelectItem value="create">Oluşturma</SelectItem>
                <SelectItem value="update">Güncelleme</SelectItem>
                <SelectItem value="delete">Silme</SelectItem>
                <SelectItem value="login">Giriş</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <ActivityIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Aktivite bulunamadı</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  data-testid={`activity-${index}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(activity.aksiyon)}`}>
                        {getActionLabel(activity.aksiyon)}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700">
                        {getTypeLabel(activity.tip)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900">{activity.aciklama}</p>
                    <div className="flex items-center gap-2 mt-2">
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
  );
};

export default Activities;
