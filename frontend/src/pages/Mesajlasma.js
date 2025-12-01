import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Mesajlasma = () => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState([]);
  const [selectedProje, setSelectedProje] = useState(null);
  const [mesajlar, setMesajlar] = useState([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  useEffect(() => {
    if (selectedProje) {
      fetchMesajlar(selectedProje.id);
    }
  }, [selectedProje]);

  const fetchLicenses = async () => {
    try {
      const response = await api.get('/constructions');
      setLicenses(response.data);
    } catch (error) {
      toast.error('Projeler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchMesajlar = async (projeId) => {
    try {
      const response = await api.get(`/mesajlar/proje/${projeId}`);
      setMesajlar(response.data);
    } catch (error) {
      toast.error('Mesajlar yüklenemedi');
    }
  };

  const handleSendMesaj = async () => {
    if (!yeniMesaj.trim() || !selectedProje) return;

    setSending(true);
    try {
      await api.post('/mesajlar', {
        projeId: selectedProje.id,
        projeAdi: selectedProje.isBaslik || selectedProje.insaatIsmi || 'İsimsiz İnşaat',
        mesaj: yeniMesaj
      });
      
      setYeniMesaj('');
      fetchMesajlar(selectedProje.id);
      toast.success('Mesaj gönderildi');
    } catch (error) {
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user?.role === 'user') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Bu sayfa sadece Admin ve SuperAdmin için erişilebilir.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="mesajlasma-page">
      <div>
        <h1 className="text-3xl font-bold text-slate-900" style={{fontFamily: 'Manrope, sans-serif'}}>
          Mesajlaşma
        </h1>
        <p className="text-slate-600 mt-1">Admin & SuperAdmin arası proje bazlı sohbet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proje Listesi */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Projeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {licenses.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Henüz proje yok</p>
              ) : (
                licenses.map((construction) => (
                  <div
                    key={construction.id}
                    onClick={() => setSelectedProje(construction)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedProje?.id === construction.id
                        ? 'bg-black text-white'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    <p className="font-medium text-sm">{construction.isBaslik || construction.insaatIsmi || 'İsimsiz İnşaat'}</p>
                    <p className={`text-xs mt-1 ${
                      selectedProje?.id === construction.id ? 'text-gray-300' : 'text-slate-600'
                    }`}>
                      YIBF: {construction.yibfNo}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mesaj Alanı */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedProje ? (selectedProje.isBaslik || selectedProje.insaatIsmi || 'İsimsiz İnşaat') : 'Proje Seçiniz'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedProje ? (
              <div className="flex items-center justify-center h-64 text-slate-500">
                Mesajlaşmaya başlamak için bir proje seçin
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mesajlar */}
                <div className="bg-slate-50 rounded-lg p-4 h-[400px] overflow-y-auto space-y-3">
                  {mesajlar.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      Henüz mesaj yok. İlk mesajı siz gönderin!
                    </p>
                  ) : (
                    mesajlar.map((mesaj) => (
                      <div
                        key={mesaj.id}
                        className={`flex ${
                          mesaj.gonderenId === user.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            mesaj.gonderenId === user.id
                              ? 'bg-black text-white'
                              : 'bg-white border border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${
                              mesaj.gonderenId === user.id ? 'text-gray-300' : 'text-slate-600'
                            }`}>
                              {mesaj.gonderenAdi}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              mesaj.gonderenRol === 'super_admin'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {mesaj.gonderenRol === 'super_admin' ? 'SuperAdmin' : 'Admin'}
                            </span>
                          </div>
                          <p className="text-sm">{mesaj.mesaj}</p>
                          <p className={`text-xs mt-1 ${
                            mesaj.gonderenId === user.id ? 'text-gray-400' : 'text-slate-500'
                          }`}>
                            {formatDate(mesaj.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Mesaj Gönder */}
                <div className="flex gap-2">
                  <Textarea
                    value={yeniMesaj}
                    onChange={(e) => setYeniMesaj(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMesaj();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMesaj}
                    disabled={!yeniMesaj.trim() || sending}
                    className="bg-black hover:bg-gray-800"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Mesajlasma;
