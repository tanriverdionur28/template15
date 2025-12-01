import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

const SuperAdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/super-admin-reports');
      setReports(response.data);
    } catch (error) {
      console.error('Raporları yüklerken hata:', error);
      toast.error('Raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId) => {
    setResolving(reportId);
    try {
      await api.put(`/super-admin-reports/${reportId}/resolve`);
      toast.success('Rapor çözüldü olarak işaretlendi');
      fetchReports();
    } catch (error) {
      console.error('Rapor çözümlenirken hata:', error);
      toast.error('İşlem başarısız');
    } finally {
      setResolving(null);
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'santiye_defteri':
        return 'Şantiye Defteri';
      case 'belediye_proje_arsiv':
        return 'Belediye Proje Arşivi';
      default:
        return type;
    }
  };

  const getRecordTypeLabel = (type) => {
    switch (type) {
      case 'inspection':
        return 'Saha Denetimi';
      case 'license':
        return 'Ruhsat Kaydı';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const unresolvedReports = reports.filter((r) => !r.isResolved);
  const resolvedReports = reports.filter((r) => r.isResolved);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900" data-testid="reports-title">
          Eksiklik Raporları
        </h1>
        <p className="text-slate-600 mt-2">
          Şantiye defteri ve belediye onaylı proje arşivleme eksiklikleri - Admin & Süper Admin
        </p>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Toplam Rapor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{reports.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-600">
              Bekleyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {unresolvedReports.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">
              Çözümlenen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {resolvedReports.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bekleyen Raporlar */}
      {unresolvedReports.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5" />
              Bekleyen Raporlar ({unresolvedReports.length})
            </CardTitle>
            <CardDescription>
              Aşağıdaki kayıtlarda eksiklikler tespit edildi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {unresolvedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white p-4 rounded-lg border border-amber-300 shadow-sm"
                data-testid={`report-${report.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        {getReportTypeLabel(report.reportType)}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        {getRecordTypeLabel(report.recordType)}
                      </Badge>
                      {report.projeType && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                          {report.projeType}
                        </Badge>
                      )}
                    </div>

                    <p className="font-medium text-slate-900 mb-1">{report.message}</p>

                    <div className="text-sm text-slate-600 space-y-1">
                      {report.insaatIsmi && (
                        <p>
                          <span className="font-medium">İnşaat:</span> {report.insaatIsmi}
                        </p>
                      )}
                      {report.yibfNo && (
                        <p>
                          <span className="font-medium">YİBF No:</span> {report.yibfNo}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Tarih:</span>{' '}
                        {new Date(report.reportedAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleResolve(report.id)}
                    disabled={resolving === report.id}
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    data-testid={`resolve-button-${report.id}`}
                  >
                    {resolving === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Çözüldü
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Çözümlenen Raporlar */}
      {resolvedReports.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              Çözümlenen Raporlar ({resolvedReports.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolvedReports.map((report) => (
              <div
                key={report.id}
                className="bg-white p-3 rounded-lg border border-green-200 opacity-70"
              >
                <div className="flex items-start gap-4">
                  <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{report.message}</p>
                    <div className="text-xs text-slate-500 mt-1">
                      {report.insaatIsmi && <span>{report.insaatIsmi} • </span>}
                      {new Date(report.resolvedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reports.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-slate-900">Harika! Hiç rapor yok.</p>
            <p className="text-sm text-slate-600 mt-1">
              Tüm kayıtlar eksiksiz şekilde tamamlanmış.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuperAdminReports;
