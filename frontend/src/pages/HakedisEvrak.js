import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Edit, Trash2, Loader2, FileText } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// CheckboxField component defined outside
const CheckboxField = ({ id, label, checked, onChange }) => (
  <div className="flex items-center space-x-2">
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
    <label htmlFor={id} className="text-sm font-medium leading-none cursor-pointer">{label}</label>
  </div>
);

const HakedisEvrak = () => {
  const { user } = useAuth();
  const [evraklar, setEvraklar] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    hakedisId: '',
    insaatIsmi: '',
    yibfNo: '',
    hakedisNo: '',
    belediyeHakedisDilekcesi: false,
    belediyeHakedisRaporu: false,
    belediyePersonelBildirge: false,
    belediyeParaDekontu: false,
    belediyeFatura: false,
    belediyeVergiBorcu: false,
    belediyeSgkBorcu: false,
    belediyeYapiSahibiTaahhut: false,
    belediyeYapiDenetimTaahhut: false,
    belediyeYapiDenetimSozlesme: false,
    belediyeYibfCikti: false,
    belediyeRuhsat: false,
    belediyeBelediyeHesap: false,
    belediyeCevreHesap: false,
    belediyeYapiDenetimHesap: false,
    ydHakedisRaporu: false,
    ydParaDekontu: false,
    ydRuhsat: false,
    ydFatura: false,
    muhasebeHakedisRaporu: false,
    muhasebePersonelBildirge: false,
    muhasebeParaDekontu: false,
    muhasebeVergiBorcu: false,
    muhasebeSgkBorcu: false,
    muhasebeYapiSahibiTaahhut: false,
    muhasebeYapiDenetimTaahhut: false,
    muhasebeYapiDenetimSozlesme: false,
    muhasebeYibfCikti: false,
    muhasebeRuhsat: false,
    muhasebeBelediyeHesap: false,
    muhasebeCevreHesap: false,
    muhasebeYapiDenetimHesap: false,
    notlar: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [evrakRes, paymentsRes] = await Promise.all([
        api.get('/hakedis-evrak'),
        api.get('/payments')
      ]);
      setEvraklar(evrakRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSelect = (paymentId) => {
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setFormData({
        ...formData,
        hakedisId: payment.id,
        insaatIsmi: payment.insaatIsmi,
        yibfNo: payment.yibfNo,
        hakedisNo: payment.hakedisNo
      });
    }
  };

  const resetForm = () => {
    setFormData({
      hakedisId: '', insaatIsmi: '', yibfNo: '', hakedisNo: '',
      belediyeHakedisDilekcesi: false, belediyeHakedisRaporu: false, belediyePersonelBildirge: false,
      belediyeParaDekontu: false, belediyeFatura: false, belediyeVergiBorcu: false, belediyeSgkBorcu: false,
      belediyeYapiSahibiTaahhut: false, belediyeYapiDenetimTaahhut: false, belediyeYapiDenetimSozlesme: false,
      belediyeYibfCikti: false, belediyeRuhsat: false, belediyeBelediyeHesap: false, belediyeCevreHesap: false,
      belediyeYapiDenetimHesap: false, ydHakedisRaporu: false, ydParaDekontu: false, ydRuhsat: false,
      ydFatura: false, muhasebeHakedisRaporu: false, muhasebePersonelBildirge: false, muhasebeParaDekontu: false,
      muhasebeVergiBorcu: false, muhasebeSgkBorcu: false, muhasebeYapiSahibiTaahhut: false,
      muhasebeYapiDenetimTaahhut: false, muhasebeYapiDenetimSozlesme: false, muhasebeYibfCikti: false,
      muhasebeRuhsat: false, muhasebeBelediyeHesap: false, muhasebeCevreHesap: false, muhasebeYapiDenetimHesap: false,
      notlar: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/hakedis-evrak/${editingId}`, formData);
        toast.success('Hakediş evrak kaydı güncellendi');
      } else {
        await api.post('/hakedis-evrak', formData);
        toast.success('Hakediş evrak kaydı oluşturuldu');
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (evrak) => {
    setFormData(evrak);
    setEditingId(evrak.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu evrak kaydını silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/hakedis-evrak/${id}`);
      toast.success('Evrak kaydı silindi');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Silme başarısız');
    }
  };

  const canEdit = user?.role === 'super_admin' || user?.role === 'admin';

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-slate-700" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>Hakediş Hazırlama Evrakları</h1>
          <p className="text-slate-600 mt-1">Hakediş için gerekli evrak kontrolü</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-slate-800 hover:bg-slate-900"><Plus className="w-4 h-4 mr-2" />Yeni Evrak Kaydı</Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? 'Evrak Düzenle' : 'Yeni Evrak Kaydı'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Label>Hakediş Seç</Label>
                <select className="w-full h-10 px-3 rounded-md border border-slate-300" onChange={(e) => handlePaymentSelect(e.target.value)}>
                  <option value="">Hakediş seçin...</option>
                  {payments.map(p => (<option key={p.id} value={p.id}>{p.hakedisNo} - {p.insaatIsmi}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>İnşaat İsmi</Label><Input value={formData.insaatIsmi} readOnly className="bg-slate-100" /></div>
                <div><Label>Hakediş No</Label><Input value={formData.hakedisNo} readOnly className="bg-slate-100" /></div>
              </div>
              
              <div className="border rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-lg mb-3">Belediye Dosyası (15)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <CheckboxField id="bHakedisDilekcesi" label="1. Hakediş Dilekçesi" checked={formData.belediyeHakedisDilekcesi} onChange={(v) => setFormData({...formData, belediyeHakedisDilekcesi: v})} />
                  <CheckboxField id="bHakedisRaporu" label="2. Hakediş Raporu" checked={formData.belediyeHakedisRaporu} onChange={(v) => setFormData({...formData, belediyeHakedisRaporu: v})} />
                  <CheckboxField id="bPersonelBildirge" label="3. Personel Bildirge" checked={formData.belediyePersonelBildirge} onChange={(v) => setFormData({...formData, belediyePersonelBildirge: v})} />
                  <CheckboxField id="bParaDekontu" label="4. Para Dekontu" checked={formData.belediyeParaDekontu} onChange={(v) => setFormData({...formData, belediyeParaDekontu: v})} />
                  <CheckboxField id="bFatura" label="5. Fatura" checked={formData.belediyeFatura} onChange={(v) => setFormData({...formData, belediyeFatura: v})} />
                  <CheckboxField id="bVergiBorcu" label="6. Vergi Borcu Yoktur Yazısı" checked={formData.belediyeVergiBorcu} onChange={(v) => setFormData({...formData, belediyeVergiBorcu: v})} />
                  <CheckboxField id="bSgkBorcu" label="7. SGK Borcu Yoktur Yazısı" checked={formData.belediyeSgkBorcu} onChange={(v) => setFormData({...formData, belediyeSgkBorcu: v})} />
                  <CheckboxField id="bYapiSahibi" label="8. Yapı Sahibi Taahhütname" checked={formData.belediyeYapiSahibiTaahhut} onChange={(v) => setFormData({...formData, belediyeYapiSahibiTaahhut: v})} />
                  <CheckboxField id="bYapiDenetimT" label="9. Yapı Denetim Taahhütname" checked={formData.belediyeYapiDenetimTaahhut} onChange={(v) => setFormData({...formData, belediyeYapiDenetimTaahhut: v})} />
                  <CheckboxField id="bYapiDenetimS" label="10. Yapı Denetim Sözleşme" checked={formData.belediyeYapiDenetimSozlesme} onChange={(v) => setFormData({...formData, belediyeYapiDenetimSozlesme: v})} />
                  <CheckboxField id="bYibf" label="11. YİBF Çıktısı" checked={formData.belediyeYibfCikti} onChange={(v) => setFormData({...formData, belediyeYibfCikti: v})} />
                  <CheckboxField id="bRuhsat" label="12. Ruhsat" checked={formData.belediyeRuhsat} onChange={(v) => setFormData({...formData, belediyeRuhsat: v})} />
                  <CheckboxField id="bBelediyeH" label="13. Belediye Hesap Yazısı" checked={formData.belediyeBelediyeHesap} onChange={(v) => setFormData({...formData, belediyeBelediyeHesap: v})} />
                  <CheckboxField id="bCevre" label="14. Çevre Şehircilik Hesap" checked={formData.belediyeCevreHesap} onChange={(v) => setFormData({...formData, belediyeCevreHesap: v})} />
                  <CheckboxField id="bYdHesap" label="15. YD Hesap (Tahakkuka Esas)" checked={formData.belediyeYapiDenetimHesap} onChange={(v) => setFormData({...formData, belediyeYapiDenetimHesap: v})} />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-lg mb-3">Yapı Denetim Dosyası (4)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <CheckboxField id="ydRapor" label="1. Hakediş Raporu" checked={formData.ydHakedisRaporu} onChange={(v) => setFormData({...formData, ydHakedisRaporu: v})} />
                  <CheckboxField id="ydDekont" label="2. Para Dekontu" checked={formData.ydParaDekontu} onChange={(v) => setFormData({...formData, ydParaDekontu: v})} />
                  <CheckboxField id="ydRuhsat" label="3. Ruhsat" checked={formData.ydRuhsat} onChange={(v) => setFormData({...formData, ydRuhsat: v})} />
                  <CheckboxField id="ydFatura" label="4. Fatura" checked={formData.ydFatura} onChange={(v) => setFormData({...formData, ydFatura: v})} />
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-lg mb-3">Muhasebe Müdürlüğü Dosyası (13)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <CheckboxField id="mRapor" label="1. Hakediş Raporu" checked={formData.muhasebeHakedisRaporu} onChange={(v) => setFormData({...formData, muhasebeHakedisRaporu: v})} />
                  <CheckboxField id="mPersonel" label="2. Personel Bildirge" checked={formData.muhasebePersonelBildirge} onChange={(v) => setFormData({...formData, muhasebePersonelBildirge: v})} />
                  <CheckboxField id="mDekont" label="3. Para Dekontu" checked={formData.muhasebeParaDekontu} onChange={(v) => setFormData({...formData, muhasebeParaDekontu: v})} />
                  <CheckboxField id="mVergi" label="4. Vergi Borcu Yoktur" checked={formData.muhasebeVergiBorcu} onChange={(v) => setFormData({...formData, muhasebeVergiBorcu: v})} />
                  <CheckboxField id="mSgk" label="5. SGK Borcu Yoktur" checked={formData.muhasebeSgkBorcu} onChange={(v) => setFormData({...formData, muhasebeSgkBorcu: v})} />
                  <CheckboxField id="mYapiSahibi" label="6. Yapı Sahibi Taahhütname" checked={formData.muhasebeYapiSahibiTaahhut} onChange={(v) => setFormData({...formData, muhasebeYapiSahibiTaahhut: v})} />
                  <CheckboxField id="mYdTaahhut" label="7. YD Taahhütname" checked={formData.muhasebeYapiDenetimTaahhut} onChange={(v) => setFormData({...formData, muhasebeYapiDenetimTaahhut: v})} />
                  <CheckboxField id="mYdSozlesme" label="8. YD Sözleşme" checked={formData.muhasebeYapiDenetimSozlesme} onChange={(v) => setFormData({...formData, muhasebeYapiDenetimSozlesme: v})} />
                  <CheckboxField id="mYibf" label="9. YİBF Çıktısı" checked={formData.muhasebeYibfCikti} onChange={(v) => setFormData({...formData, muhasebeYibfCikti: v})} />
                  <CheckboxField id="mRuhsat" label="10. Ruhsat" checked={formData.muhasebeRuhsat} onChange={(v) => setFormData({...formData, muhasebeRuhsat: v})} />
                  <CheckboxField id="mBelediye" label="11. Belediye Hesap" checked={formData.muhasebeBelediyeHesap} onChange={(v) => setFormData({...formData, muhasebeBelediyeHesap: v})} />
                  <CheckboxField id="mCevre" label="12. Çevre Şehircilik Hesap" checked={formData.muhasebeCevreHesap} onChange={(v) => setFormData({...formData, muhasebeCevreHesap: v})} />
                  <CheckboxField id="mYdHesap" label="13. YD Hesap (Tahakkuka Esas)" checked={formData.muhasebeYapiDenetimHesap} onChange={(v) => setFormData({...formData, muhasebeYapiDenetimHesap: v})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notlar">Notlar</Label>
                <Textarea id="notlar" value={formData.notlar} onChange={(e) => setFormData({...formData, notlar: e.target.value})} rows={3} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>İptal</Button>
                <Button type="submit" className="bg-slate-800 hover:bg-slate-900" disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Kaydediliyor...</> : editingId ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Evrak Kayıtları ({evraklar.length})</CardTitle></CardHeader>
        <CardContent>
          {evraklar.length === 0 ? (
            <div className="text-center py-12 text-slate-500"><FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" /><p>Henüz evrak kaydı yok</p></div>
          ) : (
            <Accordion type="single" collapsible>
              {evraklar.map((evrak) => (
                <AccordionItem key={evrak.id} value={evrak.id}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{evrak.insaatIsmi}</h3>
                        <p className="text-sm text-slate-600">Hakediş No: {evrak.hakedisNo}</p>
                      </div>
                      {canEdit && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(evrak); }}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(evrak.id); }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-slate-50 rounded-lg text-sm">
                      <p><strong>Belediye:</strong> {Object.values(formData).filter((v, i) => i < 15 && v === true).length}/15</p>
                      <p><strong>YD:</strong> {[evrak.ydHakedisRaporu, evrak.ydParaDekontu, evrak.ydRuhsat, evrak.ydFatura].filter(Boolean).length}/4</p>
                      <p><strong>Muhasebe:</strong> {Object.values(formData).filter((v, i) => i >= 19 && i < 32 && v === true).length}/13</p>
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

export default HakedisEvrak;
