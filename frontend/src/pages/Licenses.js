import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, Search, Loader2, FileCheck } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import ConstructionCombobox from '@/components/ConstructionCombobox';

const CheckboxField = ({ id, label, checked, onChange }) => (
  <div className="flex items-center space-x-2">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={onChange}
    />
    <label
      htmlFor={id}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
    >
      {label}
    </label>
  </div>
);

const Licenses = () => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState([]);
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
    // Yapı Sahibi Evrakları (YENİ - 7 madde)
    yapiSahibiTapu: false,
    yapiSahibiKimlik: false,
    yapiSahibiImarDurumu: false,
    yapiSahibiResmiAplikasyon: false,
    yapiSahibiYapiAplikasyon: false,
    yapiSahibiPlankote: false,
    yapiSahibiTaahhutname: false,
    // Yapı Müteahhiti
    yapiMuteahhitiSozlesme: false,
    yapiMuteahhitiTaahhutname: false,
    yapiMuteahhitiTicaretOdasi: false,
    yapiMuteahhitiVergiLevhasi: false,
    yapiMuteahhitiImzaSirkuleri: false,
    yapiMuteahhitiKimlik: false,
    yapiMuteahhitiFaaliyetBelgesi: false,
    // Şantiye Şefi
    santiyeSefiIsSozlesmesi: false,
    santiyeSefiTaahhutname: false,
    santiyeSefiKimlik: false,
    santiyeSefiImzaBeyani: false,
    santiyeSefiDiploma: false,
    santiyeSefiOdaKayit: false,
    santiyeSefiIkametgah: false,
    santiyeSefiIsciSagligi: false,
    // Proje Müellifi
    projeMuellifIkametgah: false,
    projeMuellifOdaSicil: false,
    projeMuellifTcKimlik: false,
    projeMuellifTaahhutname: false,
    // Belediye
    belediyeRuhsat: false,
    belediyeIsYeriTeslim: false,
    belediyeTemelVize: false,
    // Yapı Denetim
    yapiDenetimProjeKontrol: false,
    yapiDenetimSeviyeTespit: false,
    yapiDenetimHakedis: false,
    yapiDenetimLabSonuclari: false,
    yapiDenetimCelikCekme: false,
    yapiDenetimYdkTutanak: false,
    yapiDenetimYdkSozlesme: false,
    yapiDenetimYdkTaahhutname: false,
    yapiDenetimYdkIsYeri: false,
    // Proje Takibi - YENİ (Denetlendi/Onaylandı/Red Nedeni)
    mimariDenetlendi: false,
    mimariOnaylandi: false,
    mimariOnaylanmamaNedeni: '',
    mimariDijitalArsiv: false,
    mimariBelediyeOnayliProjeArsivlendi: false,
    statikDenetlendi: false,
    statikOnaylandi: false,
    statikOnaylanmamaNedeni: '',
    statikDijitalArsiv: false,
    statikBelediyeOnayliProjeArsivlendi: false,
    mekanikDenetlendi: false,
    mekanikOnaylandi: false,
    mekanikOnaylanmamaNedeni: '',
    mekanikDijitalArsiv: false,
    mekanikBelediyeOnayliProjeArsivlendi: false,
    elektrikDenetlendi: false,
    elektrikOnaylandi: false,
    elektrikOnaylanmamaNedeni: '',
    elektrikDijitalArsiv: false,
    elektrikBelediyeOnayliProjeArsivlendi: false,
    tasDuvarDenetlendi: false,
    tasDuvarOnaylandi: false,
    tasDuvarOnaylanmamaNedeni: '',
    tasDuvarDijitalArsiv: false,
    tasDuvarBelediyeOnayliProjeArsivlendi: false,
    iskeleDenetlendi: false,
    iskeleOnaylandi: false,
    iskeleOnaylanmamaNedeni: '',
    iskeleDijitalArsiv: false,
    iskeleBelediyeOnayliProjeArsivlendi: false,
    zeminEtutDenetlendi: false,
    zeminEtutOnaylandi: false,
    zeminEtutOnaylanmamaNedeni: '',
    zeminEtutDijitalArsiv: false,
    zeminEtutBelediyeOnayliProjeArsivlendi: false,
    akustikDenetlendi: false,
    akustikOnaylandi: false,
    akustikOnaylanmamaNedeni: '',
    akustikDijitalArsiv: false,
    akustikBelediyeOnayliProjeArsivlendi: false,
    // Tarihler
    dijitalArsivTarihi: '',
    belediyeTeslimTarihi: '',
    ruhsatTarihi: '',
    notlar: ''
  });

  useEffect(() => {
    fetchLicenses();
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
      setFormData({...formData, insaatIsmi: construction.isBaslik || '', yibfNo: construction.yibfNo || ''});
    }
  };

  const fetchLicenses = async () => {
    try {
      const response = await api.get('/licenses');
      setLicenses(response.data);
    } catch (error) {
      toast.error('Ruhsat kayıtları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      insaatIsmi: '',
      yibfNo: '',
      yapiMuteahhitiSozlesme: false,
      yapiMuteahhitiTaahhutname: false,
      yapiMuteahhitiTicaretOdasi: false,
      yapiMuteahhitiVergiLevhasi: false,
      yapiMuteahhitiImzaSirkuleri: false,
      yapiMuteahhitiKimlik: false,
      yapiMuteahhitiFaaliyetBelgesi: false,
      santiyeSefiIsSozlesmesi: false,
      santiyeSefiTaahhutname: false,
      santiyeSefiKimlik: false,
      santiyeSefiImzaBeyani: false,
      santiyeSefiDiploma: false,
      santiyeSefiOdaKayit: false,
      santiyeSefiIkametgah: false,
      santiyeSefiIsciSagligi: false,
      projeMuellifIkametgah: false,
      projeMuellifOdaSicil: false,
      projeMuellifTcKimlik: false,
      projeMuellifTaahhutname: false,
      belediyeRuhsat: false,
      belediyeIsYeriTeslim: false,
      belediyeTemelVize: false,
      yapiDenetimProjeKontrol: false,
      yapiDenetimSeviyeTespit: false,
      yapiDenetimAylikSeviye: false,
      yapiDenetimYilSonuSeviye: false,
      yapiDenetimHakedis: false,
      yapiDenetimLabSonuclari: false,
      yapiDenetimCelikCekme: false,
      yapiDenetimYdkTutanak: false,
      yapiDenetimYdkSozlesme: false,
      yapiDenetimYdkTaahhutname: false,
      yapiDenetimYdkIsYeri: false,
      mimariOnay: false,
      mimariDijitalArsiv: false,
      statikOnay: false,
      statikDijitalArsiv: false,
      mekanikOnay: false,
      mekanikDijitalArsiv: false,
      elektrikOnay: false,
      elektrikDijitalArsiv: false,
      tasDuvarOnay: false,
      tasDuvarDijitalArsiv: false,
      iskeleOnay: false,
      iskeleDijitalArsiv: false,
      zeminEtutOnay: false,
      zeminEtutDijitalArsiv: false,
      akustikOnay: false,
      akustikDijitalArsiv: false,
      dijitalArsivTarihi: '',
      belediyeTeslimTarihi: '',
      ruhsatTarihi: '',
      notlar: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/licenses/${editingId}`, formData);
        toast.success('Ruhsat kaydı başarıyla güncellendi');
      } else {
        await api.post('/licenses', formData);
        toast.success('Ruhsat kaydı başarıyla oluşturuldu');
      }
      setDialogOpen(false);
      resetForm();
      fetchLicenses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (license) => {
    setFormData(license);
    setEditingId(license.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu ruhsat kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/licenses/${id}`);
      toast.success('Ruhsat kaydı başarıyla silindi');
      fetchLicenses();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme işlemi başarısız');
    }
  };

  const filteredLicenses = licenses.filter(license =>
    license.insaatIsmi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.yibfNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';
  const canDelete = user?.role === 'super_admin' || user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="licenses-loading">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="licenses-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
            Ruhsat ve Proje Takibi
          </h1>
          <p className="text-slate-600 mt-1">Ruhsat evrakları ve proje süreçlerini yönetin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-900" data-testid="add-license-button">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Ruhsat Kaydı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Ruhsat Kaydını Düzenle' : 'Yeni Ruhsat Kaydı Ekle'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="license-form">
              {/* İnşaat Seçimi */}
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
                label="İnşaat Listesinden Seç"
              />
              {/* Temel Bilgiler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insaatIsmi">İnşaat İsmi *</Label>
                  <Input
                    id="insaatIsmi"
                    value={formData.insaatIsmi}
                    onChange={(e) => setFormData({ ...formData, insaatIsmi: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yibfNo">YIBF No *</Label>
                  <Input
                    id="yibfNo"
                    value={formData.yibfNo}
                    onChange={(e) => setFormData({ ...formData, yibfNo: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Yapı Sahibi Evrakları - YENİ */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-lg mb-3">Yapı Sahibi Evrakları (7)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckboxField id="yapiSahibiTapu" label="Tapu veya kaydı veya yerine geçen resmî belge" 
                    checked={formData.yapiSahibiTapu} 
                    onChange={(val) => setFormData({...formData, yapiSahibiTapu: val})} />
                  <CheckboxField id="yapiSahibiKimlik" label="Yapı sahibi kimlik fotokopileri (varsa hissedar/vekâletler)" 
                    checked={formData.yapiSahibiKimlik} 
                    onChange={(val) => setFormData({...formData, yapiSahibiKimlik: val})} />
                  <CheckboxField id="yapiSahibiImarDurumu" label="İmar durumu" 
                    checked={formData.yapiSahibiImarDurumu} 
                    onChange={(val) => setFormData({...formData, yapiSahibiImarDurumu: val})} />
                  <CheckboxField id="yapiSahibiResmiAplikasyon" label="Resmî aplikasyon krokisi" 
                    checked={formData.yapiSahibiResmiAplikasyon} 
                    onChange={(val) => setFormData({...formData, yapiSahibiResmiAplikasyon: val})} />
                  <CheckboxField id="yapiSahibiYapiAplikasyon" label="Yapı aplikasyon krokisi" 
                    checked={formData.yapiSahibiYapiAplikasyon} 
                    onChange={(val) => setFormData({...formData, yapiSahibiYapiAplikasyon: val})} />
                  <CheckboxField id="yapiSahibiPlankote" label="Plankote" 
                    checked={formData.yapiSahibiPlankote} 
                    onChange={(val) => setFormData({...formData, yapiSahibiPlankote: val})} />
                  <CheckboxField id="yapiSahibiTaahhutname" label="Taahhütname Örneği" 
                    checked={formData.yapiSahibiTaahhutname} 
                    onChange={(val) => setFormData({...formData, yapiSahibiTaahhutname: val})} />
                </div>
              </div>

              {/* Yapı Müteahhiti Evrakları */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-3">Yapı Müteahhiti Evrakları (7)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckboxField id="yapiMuteahhitiSozlesme" label="Mal sahibi ile yapılan sözleşme" 
                    checked={formData.yapiMuteahhitiSozlesme} 
                    onChange={(val) => setFormData({...formData, yapiMuteahhitiSozlesme: val})} />
                  <CheckboxField id="yapiMuteahhitiTaahhutname" label="Müteahhitlik Taahhütnamesi" 
                    checked={formData.yapiMuteahhitiTaahhutname} 
                    onChange={(val) => setFormData({...formData, yapiMuteahhitiTaahhutname: val})} />
                  <CheckboxField id="yapiMuteahhitiTicaretOdasi" label="Ticaret odası kayıt belgesi" 
                    checked={formData.yapiMuteahhitiTicaretOdasi} 
                    onChange={(val) => setFormData({...formData, yapiMuteahhitiTicaretOdasi: val})} />
                  <CheckboxField id="yapiMuteahhitiVergiLevhasi" label="Vergi levhası" 
                    checked={formData.yapiMuteahhitiVergiLevhasi} 
                    onChange={(val) => setFormData({...formData, yapiMuteahhitiVergiLevhasi: val})} />
                  <CheckboxField id="yapiMuteahhitiImzaSirkuleri" label="İmza sirküleri" 
                    checked={formData.yapiMuteahhitiImzaSirkuleri} 
                    onChange={(val) => setFormData({...formData, yapiMuteahhitiImzaSirkuleri: val})} />
                  <CheckboxField id="yapiMuteahhitiKimlik" label="Kimlik fotokopisi" 
                    checked={formData.yapiMuteahhitiKimlik} 
                    onChange={(val) => setFormData({...formData, yapiMuteahhitiKimlik: val})} />
                  <CheckboxField id="yapiMuteahhitiFaaliyetBelgesi" label="Faaliyet belgesi" 
                    checked={formData.yapiMuteahhitiFaaliyetBelgesi} 
                    onChange={(val) => setFormData({...formData, yapiMuteahhitiFaaliyetBelgesi: val})} />
                </div>
              </div>

              {/* Şantiye Şefi Evrakları */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-3">Şantiye Şefi Evrakları (8)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckboxField id="santiyeSefiIsSozlesmesi" label="Müteahhit ile şantiye şefi iş sözleşmesi" 
                    checked={formData.santiyeSefiIsSozlesmesi} 
                    onChange={(val) => setFormData({...formData, santiyeSefiIsSozlesmesi: val})} />
                  <CheckboxField id="santiyeSefiTaahhutname" label="Şantiye şefi taahhütnamesi" 
                    checked={formData.santiyeSefiTaahhutname} 
                    onChange={(val) => setFormData({...formData, santiyeSefiTaahhutname: val})} />
                  <CheckboxField id="santiyeSefiKimlik" label="Kimlik fotokopisi" 
                    checked={formData.santiyeSefiKimlik} 
                    onChange={(val) => setFormData({...formData, santiyeSefiKimlik: val})} />
                  <CheckboxField id="santiyeSefiImzaBeyani" label="İmza beyanı" 
                    checked={formData.santiyeSefiImzaBeyani} 
                    onChange={(val) => setFormData({...formData, santiyeSefiImzaBeyani: val})} />
                  <CheckboxField id="santiyeSefiDiploma" label="Diploma" 
                    checked={formData.santiyeSefiDiploma} 
                    onChange={(val) => setFormData({...formData, santiyeSefiDiploma: val})} />
                  <CheckboxField id="santiyeSefiOdaKayit" label="Oda kayıt belgesi" 
                    checked={formData.santiyeSefiOdaKayit} 
                    onChange={(val) => setFormData({...formData, santiyeSefiOdaKayit: val})} />
                  <CheckboxField id="santiyeSefiIkametgah" label="İkametgah" 
                    checked={formData.santiyeSefiIkametgah} 
                    onChange={(val) => setFormData({...formData, santiyeSefiIkametgah: val})} />
                  <CheckboxField id="santiyeSefiIsciSagligi" label="İşçi Sağlığı Güvenliği protokolü" 
                    checked={formData.santiyeSefiIsciSagligi} 
                    onChange={(val) => setFormData({...formData, santiyeSefiIsciSagligi: val})} />
                </div>
              </div>

              {/* Proje Müellifi Evrakları */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-3">Proje Müellifi Evrakları (4)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckboxField id="projeMuellifIkametgah" label="İkametgah" 
                    checked={formData.projeMuellifIkametgah} 
                    onChange={(val) => setFormData({...formData, projeMuellifIkametgah: val})} />
                  <CheckboxField id="projeMuellifOdaSicil" label="Oda sicil no" 
                    checked={formData.projeMuellifOdaSicil} 
                    onChange={(val) => setFormData({...formData, projeMuellifOdaSicil: val})} />
                  <CheckboxField id="projeMuellifTcKimlik" label="TC kimlik no" 
                    checked={formData.projeMuellifTcKimlik} 
                    onChange={(val) => setFormData({...formData, projeMuellifTcKimlik: val})} />
                  <CheckboxField id="projeMuellifTaahhutname" label="Müellif Taahhütnamesi" 
                    checked={formData.projeMuellifTaahhutname} 
                    onChange={(val) => setFormData({...formData, projeMuellifTaahhutname: val})} />
                </div>
              </div>

              {/* Belediye Evrakları */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-3">Belediye Evrakları (3)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckboxField id="belediyeRuhsat" label="Ruhsat" 
                    checked={formData.belediyeRuhsat} 
                    onChange={(val) => setFormData({...formData, belediyeRuhsat: val})} />
                  <CheckboxField id="belediyeIsYeriTeslim" label="İş yeri teslim tutanağı" 
                    checked={formData.belediyeIsYeriTeslim} 
                    onChange={(val) => setFormData({...formData, belediyeIsYeriTeslim: val})} />
                  <CheckboxField id="belediyeTemelVize" label="Temel vize" 
                    checked={formData.belediyeTemelVize} 
                    onChange={(val) => setFormData({...formData, belediyeTemelVize: val})} />
                </div>
              </div>

              {/* Yapı Denetim Evrakları */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="font-semibold text-lg mb-3">Yapı Denetim Evrakları (9)</h3>
                <p className="text-sm text-slate-600 mb-3">Not: Aylık ve Yıl Sonu raporları ayrı modülde yönetilmektedir.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <CheckboxField id="yapiDenetimProjeKontrol" label="Proje Kontrol Formları" 
                    checked={formData.yapiDenetimProjeKontrol} 
                    onChange={(val) => setFormData({...formData, yapiDenetimProjeKontrol: val})} />
                  <CheckboxField id="yapiDenetimSeviyeTespit" label="Seviye Tespit Tutanağı" 
                    checked={formData.yapiDenetimSeviyeTespit} 
                    onChange={(val) => setFormData({...formData, yapiDenetimSeviyeTespit: val})} />
                  <CheckboxField id="yapiDenetimHakedis" label="Hakediş evrakları" 
                    checked={formData.yapiDenetimHakedis} 
                    onChange={(val) => setFormData({...formData, yapiDenetimHakedis: val})} />
                  <CheckboxField id="yapiDenetimLabSonuclari" label="Laboratuvar sonuçları" 
                    checked={formData.yapiDenetimLabSonuclari} 
                    onChange={(val) => setFormData({...formData, yapiDenetimLabSonuclari: val})} />
                  <CheckboxField id="yapiDenetimCelikCekme" label="Laboratuvar Çelik Çekme sonuçları" 
                    checked={formData.yapiDenetimCelikCekme} 
                    onChange={(val) => setFormData({...formData, yapiDenetimCelikCekme: val})} />
                  <CheckboxField id="yapiDenetimYdkTutanak" label="YDK tutanakları" 
                    checked={formData.yapiDenetimYdkTutanak} 
                    onChange={(val) => setFormData({...formData, yapiDenetimYdkTutanak: val})} />
                  <CheckboxField id="yapiDenetimYdkSozlesme" label="YDK sözleşmesi" 
                    checked={formData.yapiDenetimYdkSozlesme} 
                    onChange={(val) => setFormData({...formData, yapiDenetimYdkSozlesme: val})} />
                  <CheckboxField id="yapiDenetimYdkTaahhutname" label="YDK taahhütnamesi" 
                    checked={formData.yapiDenetimYdkTaahhutname} 
                    onChange={(val) => setFormData({...formData, yapiDenetimYdkTaahhutname: val})} />
                  <CheckboxField id="yapiDenetimYdkIsYeri" label="YDK iş yeri evrakları" 
                    checked={formData.yapiDenetimYdkIsYeri} 
                    onChange={(val) => setFormData({...formData, yapiDenetimYdkIsYeri: val})} />
                </div>
              </div>

              {/* Proje Takibi - 8 Proje Tipi */}
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-lg mb-3 text-blue-900">Proje Denetim & Onay Takibi (8 Proje Tipi)</h3>
                <p className="text-sm text-slate-600 mb-3">Her proje için: Denetlendi mi? → Onaylandı mı? → Onaylanmama Nedeni</p>
                <div className="space-y-4">
                  {[
                    { key: 'mimari', label: 'Mimari' },
                    { key: 'statik', label: 'Statik' },
                    { key: 'mekanik', label: 'Mekanik' },
                    { key: 'elektrik', label: 'Elektrik' },
                    { key: 'tasDuvar', label: 'Taş Duvar' },
                    { key: 'iskele', label: 'İskele' },
                    { key: 'zeminEtut', label: 'Zemin Etüt' },
                    { key: 'akustik', label: 'Akustik' },
                  ].map(({ key, label }) => (
                    <div key={key} className="p-4 bg-white rounded border border-slate-200">
                      <h4 className="font-medium text-slate-800 mb-3">{label} Proje</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <CheckboxField 
                          id={`${key}Denetlendi`} 
                          label="Denetlendi mi?" 
                          checked={formData[`${key}Denetlendi`]} 
                          onChange={(val) => setFormData({...formData, [`${key}Denetlendi`]: val})} 
                        />
                        <CheckboxField 
                          id={`${key}Onaylandi`} 
                          label="Onaylandı mı?" 
                          checked={formData[`${key}Onaylandi`]} 
                          onChange={(val) => setFormData({...formData, [`${key}Onaylandi`]: val})} 
                        />
                        <CheckboxField 
                          id={`${key}DijitalArsiv`} 
                          label="Dijital Arşiv yapıldı mı?" 
                          checked={formData[`${key}DijitalArsiv`]} 
                          onChange={(val) => setFormData({...formData, [`${key}DijitalArsiv`]: val})} 
                        />
                      </div>
                      
                      {/* Belediye Onaylı Proje Arşivleme */}
                      <div className="mb-3">
                        <CheckboxField 
                          id={`${key}BelediyeOnayliProjeArsivlendi`} 
                          label="Belediye onaylı proje arşivlendi mi?" 
                          checked={formData[`${key}BelediyeOnayliProjeArsivlendi`]} 
                          onChange={(val) => setFormData({...formData, [`${key}BelediyeOnayliProjeArsivlendi`]: val})} 
                        />
                      </div>

                      {!formData[`${key}Onaylandi`] && (
                        <div className="space-y-2">
                          <Label htmlFor={`${key}OnaylanmamaNedeni`}>Onaylanmama Nedeni</Label>
                          <Textarea
                            id={`${key}OnaylanmamaNedeni`}
                            placeholder="Eğer onaylanmadıysa nedeni yazın..."
                            value={formData[`${key}OnaylanmamaNedeni`] || ''}
                            onChange={(e) => setFormData({...formData, [`${key}OnaylanmamaNedeni`]: e.target.value})}
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dijitalArsivTarihi">Dijital Arşiv Tarihi</Label>
                  <Input
                    id="dijitalArsivTarihi"
                    type="date"
                    value={formData.dijitalArsivTarihi}
                    onChange={(e) => setFormData({ ...formData, dijitalArsivTarihi: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="belediyeTeslimTarihi">Belediye Teslim Tarihi</Label>
                  <Input
                    id="belediyeTeslimTarihi"
                    type="date"
                    value={formData.belediyeTeslimTarihi}
                    onChange={(e) => setFormData({ ...formData, belediyeTeslimTarihi: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ruhsatTarihi">Ruhsat Tarihi</Label>
                  <Input
                    id="ruhsatTarihi"
                    type="date"
                    value={formData.ruhsatTarihi}
                    onChange={(e) => setFormData({ ...formData, ruhsatTarihi: e.target.value })}
                  />
                </div>
              </div>

              {/* Notlar */}
              <div className="space-y-2">
                <Label htmlFor="notlar">Notlar</Label>
                <Textarea
                  id="notlar"
                  value={formData.notlar}
                  onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                  rows={3}
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
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900"
                  disabled={saving}
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

      {/* Liste */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="İnşaat ismi veya YIBF No ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLicenses.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Henüz ruhsat kaydı yok</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredLicenses.map((license, index) => (
                <AccordionItem key={license.id} value={license.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{license.insaatIsmi}</h3>
                        <p className="text-sm text-slate-600">YIBF No: {license.yibfNo}</p>
                      </div>
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(license);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(license.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-slate-50 rounded-lg space-y-3 text-sm">
                      <p><strong>Ruhsat Tarihi:</strong> {license.ruhsatTarihi || 'Belirtilmedi'}</p>
                      <p><strong>Notlar:</strong> {license.notlar || 'Yok'}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Licenses;
