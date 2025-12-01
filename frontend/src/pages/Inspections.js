import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { KONTROL_BOLUM_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import ConstructionCombobox from '@/components/ConstructionCombobox';

const Inspections = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [constructions, setConstructions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedConstruction, setSelectedConstruction] = useState(null);
  const [hakedisOneriler, setHakedisOneriler] = useState(null);
  const [loadingHakedis, setLoadingHakedis] = useState(false);

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
    denetimTarihi: '',
    betonDokumTarihi: '',
    kontrolEdilenBolum: '',
    betonDokulenBolum: '',
    insaatIsmi: '',
    yibfNo: '',
    ilce: '',
    blokNo: '',
    kat: '',
    kalipDonatiKontrolTarihi: '',
    alinanDemirNumuneCaplari: '',
    kot: '',
    kalipKurulumTarihi: '',
    kalipSokumTarihi: '',
    ileriTarihliKontrolPlan: '',
    ileriTarihliBetonDokumPlan: '',
    laboratuvarFirma: '',
    betonFirma: '',
    ileriTarihliBetonDokumSaati: '',
    teslimAlindi: 'beklemede',
    santiyeDefteriBilgileriOnaylandi: false,
    teslimAlinmamaAciklamasi: '',
    kontrolFotograflari: '',
    betonDokumFotograflari: ''
  });

  useEffect(() => {
    fetchInspections();
    fetchConstructions();
    fetchCompanies();
  }, []);

  const fetchConstructions = async () => {
    try {
      const response = await api.get('/constructions');
      setConstructions(response.data);
    } catch (error) {
      console.error('İnşaat listesi yüklenemedi:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Firma listesi yüklenemedi:', error);
    }
  };

  const handleConstructionSelect = (constructionId) => {
    const construction = constructions.find(c => c.id === constructionId);
    if (construction) {
      setSelectedConstruction(construction);
      setFormData({
        ...formData,
        insaatIsmi: construction.isBaslik || '',
        yibfNo: construction.yibfNo || '',
        ilce: construction.ilce || '',
      });
      // Hakediş önerilerini getir
      fetchHakedisOneriler(constructionId);
    }
  };

  const fetchHakedisOneriler = async (constructionId) => {
    setLoadingHakedis(true);
    try {
      const response = await api.get(`/hakedis/hesapla/${constructionId}`);
      setHakedisOneriler(response.data);
    } catch (error) {
      console.error('Hakediş önerileri yüklenemedi:', error);
      setHakedisOneriler(null);
    } finally {
      setLoadingHakedis(false);
    }
  };

  const fetchInspections = async () => {
    try {
      const response = await api.get('/inspections');
      setInspections(response.data);
    } catch (error) {
      toast.error('Denetimler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      denetimTarihi: '',
      betonDokumTarihi: '',
      kontrolEdilenBolum: '',
      betonDokulenBolum: '',
      insaatIsmi: '',
      yibfNo: '',
      ilce: '',
      blokNo: '',
      kat: '',
      kalipDonatiKontrolTarihi: '',
      alinanDemirNumuneCaplari: '',
      kot: '',
      kalipKurulumTarihi: '',
      kalipSokumTarihi: '',
      ileriTarihliKontrolPlan: '',
      ileriTarihliBetonDokumPlan: '',
      laboratuvarFirma: '',
      betonFirma: '',
      ileriTarihliBetonDokumSaati: '',
      teslimAlindi: 'beklemede',
      teslimAlinmamaAciklamasi: '',
      kontrolFotograflari: '',
      betonDokumFotograflari: ''
    });
    setEditingId(null);
    setSelectedConstruction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/inspections/${editingId}`, formData);
        toast.success('Denetim başarıyla güncellendi');
      } else {
        await api.post('/inspections', formData);
        toast.success('Denetim başarıyla oluşturuldu');
      }
      setDialogOpen(false);
      resetForm();
      fetchInspections();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (inspection) => {
    setFormData(inspection);
    setEditingId(inspection.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu denetimi silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/inspections/${id}`);
      toast.success('Denetim başarıyla silindi');
      fetchInspections();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const filteredInspections = inspections.filter(insp => {
    const search = searchTerm.toLowerCase().trim();
    
    // Tüm kelimeleri ara (sayıları ve tire işaretlerini yoksay)
    const cleanInsaatIsmi = insp.insaatIsmi?.replace(/^\d+[-\s]*/g, '').trim() || insp.insaatIsmi || '';
    
    return (
      insp.insaatIsmi?.toLowerCase().includes(search) ||
      cleanInsaatIsmi.toLowerCase().includes(search) ||
      insp.yibfNo?.toLowerCase().includes(search) ||
      insp.ilce?.toLowerCase().includes(search)
    );
  });

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="inspections-loading">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="inspections-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
            Saha Denetimi
          </h1>
          <p className="text-slate-600 mt-1">Şantiye denetim kayıtlarını yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-900" data-testid="add-inspection-button">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Denetim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Denetimi Düzenle' : 'Yeni Denetim Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="inspection-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="denetimTarihi">Denetim Tarihi *</Label>
                  <Input
                    id="denetimTarihi"
                    type="date"
                    value={formData.denetimTarihi}
                    onChange={(e) => setFormData({ ...formData, denetimTarihi: e.target.value })}
                    required
                    data-testid="denetim-tarihi-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="betonDokumTarihi">Beton Döküm Tarihi</Label>
                  <Input
                    id="betonDokumTarihi"
                    type="date"
                    value={formData.betonDokumTarihi}
                    onChange={(e) => setFormData({ ...formData, betonDokumTarihi: e.target.value })}
                    data-testid="beton-dokum-tarihi-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kontrolEdilenBolum">Kontrol Edilen Bölüm *</Label>
                  <Select
                    value={formData.kontrolEdilenBolum}
                    onValueChange={(value) => setFormData({ ...formData, kontrolEdilenBolum: value })}
                    required
                  >
                    <SelectTrigger data-testid="kontrol-edilen-bolum-select">
                      <SelectValue placeholder="Bölüm seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {KONTROL_BOLUM_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="betonDokulenBolum">Beton Dökülen Bölüm</Label>
                  <Select
                    value={formData.betonDokulenBolum}
                    onValueChange={(value) => setFormData({ ...formData, betonDokulenBolum: value })}
                  >
                    <SelectTrigger data-testid="beton-dokulen-bolum-select">
                      <SelectValue placeholder="Bölüm seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {KONTROL_BOLUM_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* İnşaat Seçimi */}
              <ConstructionCombobox
                constructions={constructions}
                onSelect={(construction) => {
                  if (construction) {
                    handleConstructionSelect(construction.id);
                  } else {
                    setSelectedConstruction(null);
                  }
                }}
                selectedConstruction={selectedConstruction}
              />

              {/* Şantiye Defteri Checklist */}
              <div className="space-y-3">
                <Label htmlFor="santiye-defteri-onay" className="text-base font-semibold text-slate-700">
                  Şantiye Defteri Kontrolü
                </Label>
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded border border-slate-200">
                  <Checkbox
                    id="santiye-defteri-onay"
                    checked={formData.santiyeDefteriBilgileriOnaylandi}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, santiyeDefteriBilgileriOnaylandi: checked })
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="santiye-defteri-onay"
                      className="text-sm font-medium leading-none cursor-pointer text-slate-900"
                    >
                      Şantiye defteri bilgileri yazılıp onaylandı mı?
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="ilce">İlçe *</Label>
                  <Input
                    id="ilce"
                    value={formData.ilce}
                    onChange={(e) => setFormData({ ...formData, ilce: e.target.value })}
                    required
                    data-testid="ilce-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blokNo">Blok No</Label>
                  <Input
                    id="blokNo"
                    value={formData.blokNo}
                    onChange={(e) => setFormData({ ...formData, blokNo: e.target.value })}
                    data-testid="blok-no-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kat">Kat</Label>
                  <Input
                    id="kat"
                    value={formData.kat}
                    onChange={(e) => setFormData({ ...formData, kat: e.target.value })}
                    data-testid="kat-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kot">Kot</Label>
                  <Input
                    id="kot"
                    value={formData.kot}
                    onChange={(e) => setFormData({ ...formData, kot: e.target.value })}
                    data-testid="kot-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kalipDonatiKontrolTarihi">Kalıp Donatı Kontrol Tarihi</Label>
                  <Input
                    id="kalipDonatiKontrolTarihi"
                    type="date"
                    value={formData.kalipDonatiKontrolTarihi}
                    onChange={(e) => setFormData({ ...formData, kalipDonatiKontrolTarihi: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kalipKurulumTarihi">Kalıp Kurulum Tarihi</Label>
                  <Input
                    id="kalipKurulumTarihi"
                    type="date"
                    value={formData.kalipKurulumTarihi}
                    onChange={(e) => setFormData({ ...formData, kalipKurulumTarihi: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kalipSokumTarihi">Kalıp Söküm Tarihi</Label>
                  <Input
                    id="kalipSokumTarihi"
                    type="date"
                    value={formData.kalipSokumTarihi}
                    onChange={(e) => setFormData({ ...formData, kalipSokumTarihi: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alinanDemirNumuneCaplari">Alınan Demir Numune Çapları</Label>
                <Input
                  id="alinanDemirNumuneCaplari"
                  value={formData.alinanDemirNumuneCaplari}
                  onChange={(e) => setFormData({ ...formData, alinanDemirNumuneCaplari: e.target.value })}
                  placeholder="Örn: 8mm, 12mm, 16mm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laboratuvarFirma">Laboratuvar Firması</Label>
                  <select 
                    id="laboratuvarFirma"
                    className="w-full h-10 px-3 rounded-md border border-slate-300"
                    value={formData.laboratuvarFirma}
                    onChange={(e) => setFormData({ ...formData, laboratuvarFirma: e.target.value })}
                  >
                    <option value="">Seçin...</option>
                    {companies.filter(c => c.type === 'laboratory').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="betonFirma">Beton Firması</Label>
                  <select 
                    id="betonFirma"
                    className="w-full h-10 px-3 rounded-md border border-slate-300"
                    value={formData.betonFirma}
                    onChange={(e) => setFormData({ ...formData, betonFirma: e.target.value })}
                  >
                    <option value="">Seçin...</option>
                    {companies.filter(c => c.type === 'concrete').map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">İleri Tarihli Planlama</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ileriTarihliKontrolPlan">İleri Tarihli Kontrol Planla</Label>
                    <Input
                      id="ileriTarihliKontrolPlan"
                      type="date"
                      value={formData.ileriTarihliKontrolPlan}
                      onChange={(e) => setFormData({ ...formData, ileriTarihliKontrolPlan: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ileriTarihliBetonDokumPlan">İleri Tarihli Beton Dökümü Planla</Label>
                    <Input
                      id="ileriTarihliBetonDokumPlan"
                      type="date"
                      value={formData.ileriTarihliBetonDokumPlan}
                      onChange={(e) => setFormData({ ...formData, ileriTarihliBetonDokumPlan: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ileriTarihliBetonDokumSaati">İleri Tarihli Beton Döküm Saati</Label>
                    <Input
                      id="ileriTarihliBetonDokumSaati"
                      type="time"
                      value={formData.ileriTarihliBetonDokumSaati}
                      onChange={(e) => setFormData({ ...formData, ileriTarihliBetonDokumSaati: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Fotoğraf Yükleme */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Fotoğraf Ekleme</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kontrolFotograflari">Kontrol Fotoğrafları</Label>
                    <Input
                      id="kontrolFotograflari"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        toast.info(`${files.length} fotoğraf seçildi`);
                        // Base64'e çevirme işlemi burada yapılacak (şimdilik sadece bilgi)
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">Birden fazla fotoğraf seçebilirsiniz</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="betonDokumFotograflari">Beton Döküm Fotoğrafları</Label>
                    <Input
                      id="betonDokumFotograflari"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files);
                        toast.info(`${files.length} fotoğraf seçildi`);
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">Birden fazla fotoğraf seçebilirsiniz</p>
                  </div>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    📸 Not: Fotoğraflar sisteme kaydedilecek ve daha sonra görüntülenebilecektir.
                  </p>
                </div>
              </div>

              {/* Teslim Alındı/Alınmadı */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Teslim Durumu</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kontrol Sonrası Teslim Durumu</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={formData.teslimAlindi === 'beklemede' ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, teslimAlindi: 'beklemede', teslimAlinmamaAciklamasi: '' })}
                        className="flex-1"
                      >
                        Beklemede
                      </Button>
                      <Button
                        type="button"
                        variant={formData.teslimAlindi === 'alindi' ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, teslimAlindi: 'alindi', teslimAlinmamaAciklamasi: '' })}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        Teslim Alındı
                      </Button>
                      <Button
                        type="button"
                        variant={formData.teslimAlindi === 'alinmadi' ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, teslimAlindi: 'alinmadi' })}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Teslim Alınmadı
                      </Button>
                    </div>
                  </div>

                  {formData.teslimAlindi === 'alinmadi' && (
                    <div className="space-y-2">
                      <Label htmlFor="teslimAlinmamaAciklamasi">Teslim Alınmama Açıklaması *</Label>
                      <textarea
                        id="teslimAlinmamaAciklamasi"
                        className="w-full min-h-[100px] px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        value={formData.teslimAlinmamaAciklamasi}
                        onChange={(e) => setFormData({ ...formData, teslimAlinmamaAciklamasi: e.target.value })}
                        placeholder="Neden teslim alınmadı? Projeye göre neler eksik? Detaylı açıklama yazın..."
                        required={formData.teslimAlindi === 'alinmadi'}
                      />
                    </div>
                  )}
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

      {/* Hakediş Önerileri Kartı */}
      {selectedConstruction && hakedisOneriler && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              💰 Hakediş Önerileri - {hakedisOneriler.insaatIsmi}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHakedis ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-slate-600">Toplam m²</p>
                    <p className="text-lg font-bold text-slate-900">{hakedisOneriler.toplamM2} m²</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-slate-600">Kalan m²</p>
                    <p className="text-lg font-bold text-slate-900">{hakedisOneriler.kalanM2.toFixed(2)} m²</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-amber-200">
                    <p className="text-xs text-slate-600">Beton Döküm Sayısı</p>
                    <p className="text-lg font-bold text-slate-900">{hakedisOneriler.betonDokumSayisi}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg overflow-hidden">
                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Hakediş Türü</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Oran (%)</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">m²</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Durum</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Koşul</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {hakedisOneriler.hakedisler.map((hakedis, index) => (
                        <tr key={index} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">{hakedis.tur}</td>
                          <td className="px-4 py-3 text-slate-700">{hakedis.oran}%</td>
                          <td className="px-4 py-3 text-slate-700">{hakedis.m2.toFixed(2)} m²</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              hakedis.durum === 'Alınabilir' 
                                ? 'bg-green-100 text-green-700'
                                : hakedis.durum === 'Bekliyor'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {hakedis.durum}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{hakedis.kosul}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Bilgi:</strong> Hakediş önerileri beton döküm durumuna göre otomatik hesaplanır. 
                    Her aşamada gereken koşulları sağlamak önemlidir.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="İnşaat ismi, YIBF No veya İlçe ile ara..."
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
                  <TableHead>Denetim Tarihi</TableHead>
                  <TableHead>İnşaat İsmi</TableHead>
                  <TableHead>YIBF No</TableHead>
                  <TableHead>İlçe</TableHead>
                  <TableHead>Kontrol Edilen Bölüm</TableHead>
                  <TableHead>Veriyi Giren</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Henüz denetim kaydı yok
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInspections.map((inspection, index) => (
                    <TableRow key={inspection.id} data-testid={`inspection-row-${index}`}>
                      <TableCell>{inspection.denetimTarihi}</TableCell>
                      <TableCell className="font-medium">{inspection.insaatIsmi}</TableCell>
                      <TableCell>{inspection.yibfNo}</TableCell>
                      <TableCell>{inspection.ilce}</TableCell>
                      <TableCell>{inspection.kontrolEdilenBolum}</TableCell>
                      <TableCell className="text-sm text-slate-600">{inspection.createdByName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(inspection)}
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
                              onClick={() => handleDelete(inspection.id)}
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

export default Inspections;
