import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2, FileText, Search } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const YilSonuRaporlar = () => {
  const { user } = useAuth();
  const [raporlar, setRaporlar] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getErrorMessage = (error) => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      if (typeof detail === 'object') return JSON.stringify(detail);
    }
    return error.message || 'İşlem başarısız';
  };
  
  const [formData, setFormData] = useState({
    licenseId: '',
    yibfNo: '',
    insaatIsmi: '',
    yil: '',
    raporTarihi: '',
    raporVarMi: false,
    notlar: ''
  });

  useEffect(() => {
    fetchRaporlar();
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const response = await api.get('/licenses');
      setLicenses(response.data);
    } catch (error) {
      console.error('Lisanslar yüklenemedi:', error);
    }
  };

  const fetchRaporlar = async () => {
    try {
      const response = await api.get('/yilsonu-rapor');
      setRaporlar(response.data);
    } catch (error) {
      toast.error('Yıl sonu raporları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseSelect = (licenseId) => {
    const license = licenses.find(l => l.id === licenseId);
    if (license) {
      setFormData({
        ...formData,
        licenseId: license.id,
        yibfNo: license.yibfNo,
        insaatIsmi: license.insaatIsmi
      });
    }
  };

  const resetForm = () => {
    setFormData({
      licenseId: '',
      yibfNo: '',
      insaatIsmi: '',
      yil: '',
      raporTarihi: '',
      raporVarMi: false,
      notlar: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/yilsonu-rapor/${editingId}`, formData);
        toast.success('Yıl sonu raporu başarıyla güncellendi');
      } else {
        await api.post('/yilsonu-rapor', formData);
        toast.success('Yıl sonu raporu başarıyla oluşturuldu');
      }
      setDialogOpen(false);
      resetForm();
      fetchRaporlar();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rapor) => {
    setFormData({
      licenseId: rapor.licenseId,
      yibfNo: rapor.yibfNo,
      insaatIsmi: rapor.insaatIsmi,
      yil: rapor.yil,
      raporTarihi: rapor.raporTarihi,
      raporVarMi: rapor.raporVarMi,
      notlar: rapor.notlar || ''
    });
    setEditingId(rapor.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu yıl sonu raporunu silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/yilsonu-rapor/${id}`);
      toast.success('Yıl sonu raporu başarıyla silindi');
      fetchRaporlar();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const filteredRaporlar = raporlar.filter(rapor =>
    rapor.insaatIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rapor.yibfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rapor.yil.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="yilsonu-raporlar-loading">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="yilsonu-raporlar-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
            Yıl Sonu Seviye Tespit Tutanakları
          </h1>
          <p className="text-slate-600 mt-1">Her yıl için seviye tespit tutanaklarını yönetin</p>
        </div>
        {canEdit && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-slate-800 hover:bg-slate-900" data-testid="add-rapor-button">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Yıl Sonu Raporu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Yıl Sonu Raporunu Düzenle' : 'Yeni Yıl Sonu Raporu Ekle'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="rapor-form">
                <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Label>Ruhsat Seç (Otomatik Doldurma)</Label>
                  <Select onValueChange={handleLicenseSelect} value={formData.licenseId}>
                    <SelectTrigger data-testid="license-select">
                      <SelectValue placeholder="Ruhsat seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {licenses.map((license) => (
                        <SelectItem key={license.id} value={license.id}>
                          {license.yibfNo} - {license.insaatIsmi}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="insaatIsmi">İnşaat İsmi *</Label>
                    <Input
                      id="insaatIsmi"
                      value={formData.insaatIsmi}
                      onChange={(e) => setFormData({ ...formData, insaatIsmi: e.target.value })}
                      required
                      data-testid="insaat-ismi-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yibfNo">YIBF No *</Label>
                    <Input
                      id="yibfNo"
                      value={formData.yibfNo}
                      onChange={(e) => setFormData({ ...formData, yibfNo: e.target.value })}
                      required
                      data-testid="yibf-no-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yil">Yıl *</Label>
                    <Input
                      id="yil"
                      type="number"
                      min="2000"
                      max="2100"
                      placeholder="Örn: 2025"
                      value={formData.yil}
                      onChange={(e) => setFormData({ ...formData, yil: e.target.value })}
                      required
                      data-testid="yil-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raporTarihi">Rapor Tarihi *</Label>
                    <Input
                      id="raporTarihi"
                      type="date"
                      value={formData.raporTarihi}
                      onChange={(e) => setFormData({ ...formData, raporTarihi: e.target.value })}
                      required
                      data-testid="rapor-tarihi-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="raporVarMi"
                      checked={formData.raporVarMi}
                      onChange={(e) => setFormData({ ...formData, raporVarMi: e.target.checked })}
                      className="w-4 h-4"
                      data-testid="rapor-var-mi-checkbox"
                    />
                    <Label htmlFor="raporVarMi" className="cursor-pointer">Rapor Hazırlandı</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notlar">Notlar</Label>
                  <textarea
                    id="notlar"
                    className="w-full min-h-[80px] px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    value={formData.notlar}
                    onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                    placeholder="Ek notlar..."
                    data-testid="notlar-input"
                  />
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
                    ) : editingId ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="İnşaat ismi, YIBF No veya Yıl ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Yıl</TableHead>
                  <TableHead>İnşaat İsmi</TableHead>
                  <TableHead>YIBF No</TableHead>
                  <TableHead>Rapor Tarihi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Notlar</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRaporlar.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Henüz yıl sonu raporu yok
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRaporlar.map((rapor, index) => (
                    <TableRow key={rapor.id} data-testid={`rapor-row-${index}`}>
                      <TableCell className="font-medium">{rapor.yil}</TableCell>
                      <TableCell>{rapor.insaatIsmi}</TableCell>
                      <TableCell>{rapor.yibfNo}</TableCell>
                      <TableCell>{rapor.raporTarihi}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rapor.raporVarMi 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rapor.raporVarMi ? '✓ Hazırlandı' : '⏳ Bekliyor'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 max-w-xs truncate">
                        {rapor.notlar || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(rapor)}
                              data-testid={`edit-button-${index}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(rapor.id)}
                              data-testid={`delete-button-${index}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YilSonuRaporlar;
