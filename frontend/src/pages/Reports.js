import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, FileText, Download, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [rapor, setRapor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eksikRaporlar, setEksikRaporlar] = useState({ aylik: [], yilsonu: [] });

  useEffect(() => {
    fetchRapor();
    fetchEksikRaporlar();
  }, []);

  const fetchRapor = async () => {
    try {
      const response = await api.get('/reports/eksiklik');
      setRapor(response.data);
    } catch (error) {
      toast.error('Rapor yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchEksikRaporlar = async () => {
    try {
      // Tüm lisansları ve raporları çek
      const [licensesRes, aylikRes, yilsonuRes] = await Promise.all([
        api.get('/licenses'),
        api.get('/aylik-rapor'),
        api.get('/yilsonu-rapor')
      ]);

      const licenses = licensesRes.data;
      const aylikRaporlar = aylikRes.data;
      const yilsonuRaporlar = yilsonuRes.data;

      // Bugünün tarihi
      const bugun = new Date();
      const suAnkiAy = `${bugun.getFullYear()}-${String(bugun.getMonth() + 1).padStart(2, '0')}`;
      const suAnkiYil = bugun.getFullYear().toString();

      // Aylık rapor eksikleri
      const aylikEksik = licenses.filter(license => {
        const mevcutRapor = aylikRaporlar.find(r => 
          r.yibfNo === license.yibfNo && r.ay === suAnkiAy
        );
        return !mevcutRapor || !mevcutRapor.raporVarMi;
      });

      // Yıl sonu rapor eksikleri (geçen yıl için)
      const gecenYil = (bugun.getFullYear() - 1).toString();
      const yilsonuEksik = licenses.filter(license => {
        const mevcutRapor = yilsonuRaporlar.find(r => 
          r.yibfNo === license.yibfNo && r.yil === gecenYil
        );
        return !mevcutRapor || !mevcutRapor.raporVarMi;
      });

      setEksikRaporlar({ aylik: aylikEksik, yilsonu: yilsonuEksik });
    } catch (error) {
      console.error('Eksik raporlar yüklenemedi:', error);
    }
  };

  const exportToPDF = () => {
    const printContent = document.getElementById('rapor-content');
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
      </div>
    );
  }

  const toplamSorun = 
    rapor.teslim_alinmayanlar.length +
    rapor.beton_dokulmeyen.length +
    rapor.hakedis_yapilmayan.length +
    rapor.evrak_eksikleri.length;

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
            Eksiklik Raporu
          </h1>
          <p className="text-slate-600 mt-1">Tüm inşaatların eksiklikleri ve uyarıları</p>
        </div>
        <Button 
          onClick={exportToPDF}
          className="bg-slate-800 hover:bg-slate-900"
        >
          <Download className="w-4 h-4 mr-2" />
          PDF İndir
        </Button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Teslim Alınmayan</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {rapor.teslim_alinmayanlar.length}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Beton Dökülmeyen</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {rapor.beton_dokulmeyen.length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Hakediş Yapılmayan</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {rapor.hakedis_yapilmayan.length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Evrak Eksikleri</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {rapor.evrak_eksikleri.length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Eksik Aylık Rapor</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {eksikRaporlar.aylik.length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-pink-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Eksik Yıl Sonu Rapor</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {eksikRaporlar.yilsonu.length}
                </p>
              </div>
              <FileText className="w-10 h-10 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Hakediş İhtiyacı</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {rapor.hakedis_ihtiyaci.length}
                </p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {toplamSorun === 0 && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Harika! Hiç eksiklik yok. Tüm işler planlandığı gibi ilerliyor.
          </AlertDescription>
        </Alert>
      )}

      {/* Rapor İçeriği - PDF için */}
      <div id="rapor-content" className="space-y-6 print:p-8">
        <div className="print:block hidden">
          <h1 className="text-2xl font-bold mb-2">Batlama Yapı Denetim YDYS</h1>
          <h2 className="text-xl font-semibold mb-4">Eksiklik Raporu</h2>
          <p className="text-sm text-slate-600 mb-6">
            Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}
          </p>
        </div>

        {/* 1. Teslim Alınmayanlar */}
        {rapor.teslim_alinmayanlar.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                Teslim Alınmayan İnşaatlar ({rapor.teslim_alinmayanlar.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İnşaat İsmi</TableHead>
                    <TableHead>YIBF No</TableHead>
                    <TableHead>Denetim Tarihi</TableHead>
                    <TableHead>Bölüm</TableHead>
                    <TableHead>Açıklama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapor.teslim_alinmayanlar.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.insaatIsmi}</TableCell>
                      <TableCell>{item.yibfNo}</TableCell>
                      <TableCell>{item.denetimTarihi}</TableCell>
                      <TableCell>{item.kontrolEdilenBolum}</TableCell>
                      <TableCell className="text-sm">{item.aciklama}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* 2. Beton Dökülmeyen */}
        {rapor.beton_dokulmeyen.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <FileText className="w-5 h-5" />
                Beton Dökülmeyen İnşaatlar ({rapor.beton_dokulmeyen.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Plan Tarihi</TableHead>
                    <TableHead>Açıklama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapor.beton_dokulmeyen.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.baslik}</TableCell>
                      <TableCell>{item.planTarihi}</TableCell>
                      <TableCell className="text-sm">{item.aciklama}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* 3. Hakediş Yapılmayan */}
        {rapor.hakedis_yapilmayan.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <FileText className="w-5 h-5" />
                Hakediş Yapılmayan İnşaatlar ({rapor.hakedis_yapilmayan.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Plan Tarihi</TableHead>
                    <TableHead>Açıklama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapor.hakedis_yapilmayan.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.baslik}</TableCell>
                      <TableCell>{item.planTarihi}</TableCell>
                      <TableCell className="text-sm">{item.aciklama}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* 4. Evrak Eksikleri */}
        {rapor.evrak_eksikleri.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <FileText className="w-5 h-5" />
                Evrak Eksikleri ({rapor.evrak_eksikleri.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İnşaat İsmi</TableHead>
                    <TableHead>YIBF No</TableHead>
                    <TableHead>Eksik Evraklar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapor.evrak_eksikleri.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.insaatIsmi}</TableCell>
                      <TableCell>{item.yibfNo}</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-sm">
                          {item.eksikler.map((eksik, j) => (
                            <li key={j}>{eksik}</li>
                          ))}
                        </ul>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* 5. Hakediş İhtiyacı */}
        {rapor.hakedis_ihtiyaci.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Hakediş İhtiyacı Olan İnşaatlar (%5+) ({rapor.hakedis_ihtiyaci.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İnşaat İsmi</TableHead>
                    <TableHead>YIBF No</TableHead>
                    <TableHead>İlerleme</TableHead>
                    <TableHead>Son Hakediş</TableHead>
                    <TableHead>Denetim Sayısı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rapor.hakedis_ihtiyaci.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.insaatIsmi}</TableCell>
                      <TableCell>{item.yibfNo}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                          %{item.ilerlemeYuzdesi}
                        </span>
                      </TableCell>
                      <TableCell>%{item.sonHakedisYuzdesi}</TableCell>
                      <TableCell>{item.denetimSayisi}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Eksik Aylık Raporlar */}
      {eksikRaporlar.aylik.length > 0 && (
        <Card className="border-l-4 border-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Eksik Aylık Seviye Raporları ({eksikRaporlar.aylik.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İnşaat İsmi</TableHead>
                  <TableHead>YIBF No</TableHead>
                  <TableHead>İlçe</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eksikRaporlar.aylik.map((license, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{license.insaatIsmi}</TableCell>
                    <TableCell>{license.yibfNo}</TableCell>
                    <TableCell>{license.ilce || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                        Bu ay rapor yok
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Eksik Yıl Sonu Raporları */}
      {eksikRaporlar.yilsonu.length > 0 && (
        <Card className="border-l-4 border-pink-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              Eksik Yıl Sonu Seviye Raporları ({eksikRaporlar.yilsonu.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>İnşaat İsmi</TableHead>
                  <TableHead>YIBF No</TableHead>
                  <TableHead>İlçe</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eksikRaporlar.yilsonu.map((license, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{license.insaatIsmi}</TableCell>
                    <TableCell>{license.yibfNo}</TableCell>
                    <TableCell>{license.ilce || '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-sm">
                        Geçen yıl rapor yok
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="print:hidden">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Bu rapor süper admin tarafından görüntülenmektedir. PDF indirmek için yukarıdaki butona tıklayın.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Reports;
