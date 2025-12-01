import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

moment.locale('tr');
const localizer = momentLocalizer(moment);

// Custom toolbar component
const CustomToolbar = (props) => {
  const { label, onNavigate, onView, view } = props;
  return (
    <div className="flex items-center justify-between mb-4 pb-4 border-b">
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            onNavigate('PREV');
          }}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-100 text-slate-700"
        >
          Önceki
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onNavigate('TODAY');
          }}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-100 text-slate-700"
        >
          Bugün
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onNavigate('NEXT');
          }}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-md hover:bg-slate-100 text-slate-700"
        >
          Sonraki
        </button>
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            onView('month');
          }}
          className={`px-3 py-1.5 text-sm rounded-md ${
            view === 'month' 
              ? 'bg-slate-800 text-white' 
              : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Ay
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onView('week');
          }}
          className={`px-3 py-1.5 text-sm rounded-md ${
            view === 'week' 
              ? 'bg-slate-800 text-white' 
              : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Hafta
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onView('day');
          }}
          className={`px-3 py-1.5 text-sm rounded-md ${
            view === 'day' 
              ? 'bg-slate-800 text-white' 
              : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Gün
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            onView('agenda');
          }}
          className={`px-3 py-1.5 text-sm rounded-md ${
            view === 'agenda' 
              ? 'bg-slate-800 text-white' 
              : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Ajanda
        </button>
      </div>
    </div>
  );
};

const WorkPlans = () => {
  const { user } = useAuth();
  const [workplans, setWorkplans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    baslik: '',
    aciklama: '',
    planTarihi: '',
    planSaati: '',
    tip: 'diger'
  });

  useEffect(() => {
    fetchWorkPlans();
  }, []);

  const fetchWorkPlans = async () => {
    try {
      const response = await api.get('/workplans');
      setWorkplans(response.data);
    } catch (error) {
      toast.error('İş planları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      baslik: '',
      aciklama: '',
      planTarihi: '',
      planSaati: '',
      tip: 'diger'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.post('/workplans', formData);
      toast.success('İş planı başarıyla oluşturuldu');
      setDialogOpen(false);
      resetForm();
      fetchWorkPlans();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/workplans/${id}?durum=${newStatus}`);
      toast.success('Durum güncellendi');
      fetchWorkPlans();
    } catch (error) {
      toast.error('Durum güncelleme başarısız');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu iş planını silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/workplans/${id}`);
      toast.success('İş planı başarıyla silindi');
      fetchWorkPlans();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    }
  };

  const events = workplans.map(wp => {
    const dateTime = wp.planSaati ? 
      `${wp.planTarihi}T${wp.planSaati}` : 
      `${wp.planTarihi}T09:00`;
    
    return {
      id: wp.id,
      title: wp.baslik,
      start: new Date(dateTime),
      end: new Date(dateTime),
      resource: wp
    };
  });

  const eventStyleGetter = (event) => {
    const status = event.resource.durum;
    let backgroundColor = '#94a3b8'; // default slate
    
    if (status === 'tamamlandi') {
      backgroundColor = '#22c55e'; // green
    } else if (status === 'iptal') {
      backgroundColor = '#ef4444'; // red
    } else if (status === 'beklemede') {
      backgroundColor = '#f59e0b'; // amber
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '13px',
        padding: '4px 8px'
      }
    };
  };

  const canManage = user?.role === 'super_admin' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="workplans-loading">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="workplans-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
            İş Planlama
          </h1>
          <p className="text-slate-600 mt-1">Görevleri ve planları takvim üzerinde yönetin</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-900" data-testid="add-workplan-button">
                <Plus className="w-4 h-4 mr-2" />
                Yeni İş Planı
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni İş Planı Ekle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="workplan-form">
                <div className="space-y-2">
                  <Label htmlFor="baslik">Başlık *</Label>
                  <Input
                    id="baslik"
                    value={formData.baslik}
                    onChange={(e) => setFormData({ ...formData, baslik: e.target.value })}
                    required
                    data-testid="baslik-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aciklama">Açıklama</Label>
                  <Textarea
                    id="aciklama"
                    value={formData.aciklama}
                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                    rows={3}
                    data-testid="aciklama-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="planTarihi">Plan Tarihi *</Label>
                    <Input
                      id="planTarihi"
                      type="date"
                      value={formData.planTarihi}
                      onChange={(e) => setFormData({ ...formData, planTarihi: e.target.value })}
                      required
                      data-testid="plan-tarihi-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planSaati">Plan Saati</Label>
                    <Input
                      id="planSaati"
                      type="time"
                      value={formData.planSaati}
                      onChange={(e) => setFormData({ ...formData, planSaati: e.target.value })}
                      data-testid="plan-saati-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tip">Tip *</Label>
                  <Select
                    value={formData.tip}
                    onValueChange={(value) => setFormData({ ...formData, tip: value })}
                    required
                  >
                    <SelectTrigger data-testid="tip-select">
                      <SelectValue placeholder="Tip seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saha_denetim">Saha Denetim</SelectItem>
                      <SelectItem value="hakedis">Hakediş</SelectItem>
                      <SelectItem value="ruhsat">Ruhsat Takibi</SelectItem>
                      <SelectItem value="proje">Proje Takibi</SelectItem>
                      <SelectItem value="evrak">Evrak Takibi</SelectItem>
                      <SelectItem value="ofis">Ofis Düzenlemesi</SelectItem>
                      <SelectItem value="diger">Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                    data-testid="cancel-button"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-900"
                    disabled={saving}
                    data-testid="submit-button"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">Beklemede</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="text-sm font-medium">Tamamlandı</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium">İptal</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white p-6 rounded-lg border" style={{ height: '700px' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          toolbar={true}
          messages={{
            next: 'Sonraki',
            previous: 'Önceki',
            today: 'Bugün',
            month: 'Ay',
            week: 'Hafta',
            day: 'Gün',
            agenda: 'Ajanda',
            date: 'Tarih',
            time: 'Saat',
            event: 'Etkinlik',
            noEventsInRange: 'Bu aralıkta etkinlik yok',
            showMore: (total) => `+${total} daha fazla`
          }}
          components={{
            toolbar: CustomToolbar
          }}
          onSelectEvent={(event) => {
            const wp = event.resource;
            const message = `${wp.baslik}\n\n${wp.aciklama || 'Açıklama yok'}\n\nDurum: ${wp.durum}\nOluşturan: ${wp.createdByName}`;
            
            if (canManage) {
              const action = window.confirm(`${message}\n\nDurum değiştirmek ister misiniz?`);
              if (action) {
                const newStatus = window.prompt('Yeni durum (beklemede/tamamlandi/iptal):', wp.durum);
                if (newStatus && ['beklemede', 'tamamlandi', 'iptal'].includes(newStatus)) {
                  handleStatusChange(wp.id, newStatus);
                }
              }
            } else {
              alert(message);
            }
          }}
        />
      </div>

      {/* List View */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Yaklaşan Görevler</h3>
        <div className="space-y-3">
          {workplans
            .filter(wp => wp.durum === 'beklemede')
            .sort((a, b) => new Date(a.planTarihi) - new Date(b.planTarihi))
            .slice(0, 10)
            .map((wp, index) => (
              <div key={wp.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50" data-testid={`workplan-item-${index}`}>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{wp.baslik}</h4>
                  <p className="text-sm text-slate-600 mt-1">{wp.aciklama}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{wp.planTarihi}</span>
                    {wp.planSaati && <span>{wp.planSaati}</span>}
                    <span className="capitalize">{wp.tip.replace('_', ' ')}</span>
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(wp.id, 'tamamlandi')}
                      data-testid={`complete-button-${index}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(wp.id)}
                      data-testid={`delete-button-${index}`}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          {workplans.filter(wp => wp.durum === 'beklemede').length === 0 && (
            <p className="text-center text-slate-500 py-8">Bekleyen görev yok</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkPlans;