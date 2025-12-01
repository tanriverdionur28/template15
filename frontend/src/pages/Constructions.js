import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Search, Loader2, Building2, Trash2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Constructions = () => {
  const { user } = useAuth();
  const [constructions, setConstructions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);

  const getErrorMessage = (error) => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      if (typeof detail === 'object') return JSON.stringify(detail);
    }
    return error.message || 'İşlem başarısız';
  };

  useEffect(() => {
    fetchConstructions();
  }, []);

  const fetchConstructions = async () => {
    try {
      const response = await api.get('/constructions');
      setConstructions(response.data);
    } catch (error) {
      toast.error('İnşaat listesi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Sadece Excel dosyaları (.xlsx, .xls) yüklenebilir');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/constructions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(
        `Excel yüklendi: ${response.data.imported} yeni, ${response.data.updated} güncellendi`
      );
      fetchConstructions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('TÜM inşaat kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) return;
    
    try {
      const response = await api.delete('/constructions');
      toast.success(response.data.message);
      fetchConstructions();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const filteredConstructions = constructions.filter(construction => {
    const search = searchTerm.toLowerCase().trim();
    
    // Tüm kelimeleri ara (sayıları ve tire işaretlerini yoksay)
    const cleanIsBaslik = construction.isBaslik?.replace(/^\d+[-\s]*/g, '').trim() || construction.isBaslik || '';
    
    return (
      construction.yibfNo?.toLowerCase().includes(search) ||
      construction.isBaslik?.toLowerCase().includes(search) ||
      cleanIsBaslik.toLowerCase().includes(search) ||
      construction.ilce?.toLowerCase().includes(search) ||
      construction.ilgiliIdare?.toLowerCase().includes(search)
    );
  });

  const isSuperAdmin = user?.role === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="constructions-loading">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="constructions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
            İnşaat Listesi
          </h1>
          <p className="text-slate-600 mt-1">YDS.CSB.GOV.TR&apos;den indirilen inşaat kayıtlarını yönetin</p>
        </div>
        {isSuperAdmin && (
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              data-testid="file-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-600 hover:bg-green-700"
              disabled={uploading}
              data-testid="upload-button"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Excel Yükle
                </>
              )}
            </Button>
            {constructions.length > 0 && (
              <Button
                onClick={handleDeleteAll}
                variant="destructive"
                data-testid="delete-all-button"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tümünü Sil
              </Button>
            )}
          </div>
        )}
      </div>

      {!isSuperAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Excel yükleme işlemi sadece Süper Admin kullanıcıları tarafından yapılabilir.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="YIBF No, İş Başlık, İlçe veya İlgili İdare ile ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">{filteredConstructions.length} kayıt</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredConstructions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="mb-2">Henüz inşaat kaydı yok</p>
              {isSuperAdmin && (
                <p className="text-sm">Excel dosyası yükleyerek inşaat kayıtlarını sisteme aktarabilirsiniz</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>YIBF No</TableHead>
                    <TableHead>İş Başlık</TableHead>
                    <TableHead>İl</TableHead>
                    <TableHead>İlçe</TableHead>
                    <TableHead>İlgili İdare</TableHead>
                    <TableHead>Ada/Parsel</TableHead>
                    <TableHead>İşin Durumu</TableHead>
                    <TableHead>Yapı İnşaat Alanı</TableHead>
                    <TableHead>Seviye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConstructions.map((construction, index) => (
                    <TableRow key={construction.id} data-testid={`construction-row-${index}`}>
                      <TableCell className="font-medium">{construction.yibfNo}</TableCell>
                      <TableCell className="max-w-xs truncate" title={construction.isBaslik}>
                        {construction.isBaslik || '-'}
                      </TableCell>
                      <TableCell>{construction.il || '-'}</TableCell>
                      <TableCell>{construction.ilce || '-'}</TableCell>
                      <TableCell>{construction.ilgiliIdare || '-'}</TableCell>
                      <TableCell>
                        {construction.ada && construction.parsel 
                          ? `${construction.ada}/${construction.parsel}` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          construction.isinDurumu?.includes('Fesihli') 
                            ? 'bg-red-100 text-red-700'
                            : construction.isinDurumu?.includes('Bekleyen')
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {construction.isinDurumu || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {construction.yapiInsaatAlani 
                          ? `${construction.yapiInsaatAlani} m²` 
                          : '-'}
                      </TableCell>
                      <TableCell>{construction.seviye || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isSuperAdmin && constructions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <h3 className="text-lg font-semibold text-blue-900">💡 Kullanım İpucu</h3>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>• YDS.CSB.GOV.TR adresinden DataGrid Excel dosyanızı indirin</p>
            <p>• &quot;Excel Yükle&quot; butonuna tıklayarak dosyayı sisteme yükleyin</p>
            <p>• Sistem otomatik olarak yeni kayıtları ekler ve mevcut kayıtları günceller</p>
            <p>• Yüklenen inşaat bilgileri, diğer modüllerde (Saha Denetimi, Hakediş, vb.) otomatik olarak kullanılabilir</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Constructions;
