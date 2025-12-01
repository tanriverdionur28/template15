import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { HAKEDIS_TIPI_OPTIONS, HAKEDIS_DURUM_OPTIONS, EKSIK_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import ConstructionCombobox from '@/components/ConstructionCombobox';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [constructions, setConstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedConstruction, setSelectedConstruction] = useState(null);
  
  const [formData, setFormData] = useState({
    insaatIsmi: '',
    yibfNo: '',
    adaParsel: '',
    hakedisNo: '',
    hakedisTipi: '',
    hakedisYuzdesi: '',
    belediye: '',
    hakedisDurumu: '',
    eksik: '',
    hakedisHazirlamaTarihi: '',
    belediyeyeGirisTarihi: '',
    malMudurlugneGirisTarihi: '',
    ileriTarihliHakedisHazirlamaTarihi: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchConstructions();
  }, []);

  const fetchConstructions = async () => {
    try {
      const response = await api.get('/constructions');
      setConstructions(response.data);
    } catch (error) {
      console.error('İnşaat listesi yüklenemedi');
    }
  };

  const handleConstructionSelect = (constructionId) => {
    const construction = constructions.find(c => c.id === constructionId);
    if (construction) {
      setFormData({
        ...formData,
        insaatIsmi: construction.isBaslik || '',
        yibfNo: construction.yibfNo || '',
        adaParsel: construction.ada && construction.parsel ? `${construction.ada}/${construction.parsel}` : ''
      });
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      toast.error('Hakediş kayıtları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      insaatIsmi: '',
      yibfNo: '',
      adaParsel: '',
      hakedisNo: '',
      hakedisTipi: '',
      hakedisYuzdesi: '',
      belediye: '',
      hakedisDurumu: '',
      eksik: '',
      hakedisHazirlamaTarihi: '',
      belediyeyeGirisTarihi: '',
      malMudurlugneGirisTarihi: '',
      ileriTarihliHakedisHazirlamaTarihi: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/payments/${editingId}`, formData);
        toast.success('Hakediş başarıyla güncellendi');
      } else {
        await api.post('/payments', formData);
        toast.success('Hakediş başarıyla oluşturuldu');
      }
      setDialogOpen(false);
      resetForm();
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (payment) => {
    setFormData(payment);
    setEditingId(payment.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu hakediş kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/payments/${id}`);
      toast.success('Hakediş başarıyla silindi');
      fetchPayments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.insaatIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.yibfNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.hakedisNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  const getDurumColor = (durum) => {
    const colors = {
      'Hazırlanacak': 'bg-slate-100 text-slate-700',
      'Evraklar Hazırlandı': 'bg-blue-100 text-blue-700',
      'İmzalar Atıldı': 'bg-indigo-100 text-indigo-700',
      'Fatura Kesildi': 'bg-purple-100 text-purple-700',
      'Belediyeye Verildi': 'bg-cyan-100 text-cyan-700',
      'Mal Müdürlüğüne Verildi': 'bg-teal-100 text-teal-700',
      'Ödeme Alındı': 'bg-green-100 text-green-700',
      'Ödeme Yapıldı': 'bg-emerald-100 text-emerald-700',
      'İptal veya Fesihli': 'bg-red-100 text-red-700'
    };
    return colors[durum] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="payments-loading">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
            Hakediş Yönetimi
          </h1>
          <p className="text-slate-600 mt-1">Hakediş kayıtlarını takip edin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-900" data-testid="add-payment-button">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Hakediş
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Hakediş Düzenle' : 'Yeni Hakediş Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="payment-form">
              <ConstructionCombobox
                constructions={constructions}
                onSelect={(construction) => {
                  if (construction) {
                    handleConstructionSelect(construction.id);
                    setSelectedConstruction(construction);
                  } else {
                    setSelectedConstruction(null);
                  }
                }}
                selectedConstruction={selectedConstruction}
              />
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
                  <Label htmlFor="adaParsel">Ada/Parsel</Label>
                  <Input
                    id="adaParsel"
                    value={formData.adaParsel}
                    onChange={(e) => setFormData({ ...formData, adaParsel: e.target.value })}
                    data-testid="ada-parsel-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hakedisNo">Hakediş No *</Label>
                  <Input
                    id="hakedisNo"
                    value={formData.hakedisNo}
                    onChange={(e) => setFormData({ ...formData, hakedisNo: e.target.value })}
                    required
                    data-testid="hakedis-no-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hakedisTipi">Hakediş Tipi *</Label>
                  <Select
                    value={formData.hakedisTipi}
                    onValueChange={(value) => setFormData({ ...formData, hakedisTipi: value })}
                    required
                  >
                    <SelectTrigger data-testid="hakedis-tipi-select">
                      <SelectValue placeholder="Hakediş tipi seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {HAKEDIS_TIPI_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hakedisYuzdesi">Hakediş Yüzdesi (%)</Label>
                  <Input
                    id="hakedisYuzdesi"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.hakedisYuzdesi}
                    onChange={(e) => setFormData({ ...formData, hakedisYuzdesi: e.target.value })}
                    data-testid="hakedis-yuzdesi-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="belediye">Belediye</Label>
                <Input
                  id="belediye"
                  value={formData.belediye}
                  onChange={(e) => setFormData({ ...formData, belediye: e.target.value })}
                  data-testid="belediye-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hakedisDurumu">Hakediş Durumu *</Label>
                  <Select
                    value={formData.hakedisDurumu}
                    onValueChange={(value) => setFormData({ ...formData, hakedisDurumu: value })}
                    required
                  >
                    <SelectTrigger data-testid="hakedis-durumu-select">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {HAKEDIS_DURUM_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eksik">Eksik *</Label>
                  <Select
                    value={formData.eksik}
                    onValueChange={(value) => setFormData({ ...formData, eksik: value })}
                    required
                  >
                    <SelectTrigger data-testid="eksik-select">
                      <SelectValue placeholder="Eksik durumu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {EKSIK_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hakedisHazirlamaTarihi">Hakediş Hazırlama Tarihi</Label>
                  <Input
                    id="hakedisHazirlamaTarihi"
                    type="date"
                    value={formData.hakedisHazirlamaTarihi}
                    onChange={(e) => setFormData({ ...formData, hakedisHazirlamaTarihi: e.target.value })}
                    data-testid="hakedis-hazirlama-tarihi-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="belediyeyeGirisTarihi">Belediyeye Giriş Tarihi</Label>
                  <Input
                    id="belediyeyeGirisTarihi"
                    type="date"
                    value={formData.belediyeyeGirisTarihi}
                    onChange={(e) => setFormData({ ...formData, belediyeyeGirisTarihi: e.target.value })}
                    data-testid="belediyeye-giris-tarihi-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="malMudurlugneGirisTarihi">Mal Müdürlüğüne Giriş Tarihi</Label>
                  <Input
                    id="malMudurlugneGirisTarihi"
                    type="date"
                    value={formData.malMudurlugneGirisTarihi}
                    onChange={(e) => setFormData({ ...formData, malMudurlugneGirisTarihi: e.target.value })}
                    data-testid="mal-mudurlugune-giris-tarihi-input"
                  />
                </div>
              </div>

              {/* İleri Tarihli Planlama */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">İleri Tarihli Planlama</h3>
                <div className="space-y-2">
                  <Label htmlFor="ileriTarihliHakedisHazirlamaTarihi">İleri Tarihli Hakediş Hazırlama Tarihi</Label>
                  <Input
                    id="ileriTarihliHakedisHazirlamaTarihi"
                    type="date"
                    value={formData.ileriTarihliHakedisHazirlamaTarihi}
                    onChange={(e) => setFormData({ ...formData, ileriTarihliHakedisHazirlamaTarihi: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Bu tarih girildiğinde otomatik olarak iş planına eklenecektir
                  </p>
                </div>
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="İnşaat ismi, YIBF No veya Hakediş No ile ara..."
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
                  <TableHead>Hakediş No</TableHead>
                  <TableHead>İnşaat İsmi</TableHead>
                  <TableHead>YIBF No</TableHead>
                  <TableHead>Hakediş Tipi</TableHead>
                  <TableHead>Yüzde</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Eksik</TableHead>
                  <TableHead>Veriyi Giren</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      Henüz hakediş kaydı yok
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <TableRow key={payment.id} data-testid={`payment-row-${index}`}>
                      <TableCell className="font-medium">{payment.hakedisNo}</TableCell>
                      <TableCell>{payment.insaatIsmi}</TableCell>
                      <TableCell>{payment.yibfNo}</TableCell>
                      <TableCell className="text-sm">{payment.hakedisTipi}</TableCell>
                      <TableCell>{payment.hakedisYuzdesi ? `${payment.hakedisYuzdesi}%` : '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDurumColor(payment.hakedisDurumu)}`}>
                          {payment.hakedisDurumu}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{payment.eksik}</TableCell>
                      <TableCell className="text-sm text-slate-600">{payment.createdByName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(payment)}
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
                              onClick={() => handleDelete(payment.id)}
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

export default Payments;
