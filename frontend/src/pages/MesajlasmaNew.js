import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, Loader2, Search, X, Users, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const MesajlasmaNew = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' veya 'proje'
  const [admins, setAdmins] = useState([]);
  const [constructions, setConstructions] = useState([]);
  const [filteredConstructions, setFilteredConstructions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedProje, setSelectedProje] = useState(null);
  const [mesajlar, setMesajlar] = useState([]);
  const [yeniMesaj, setYeniMesaj] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mesajlar]);

  useEffect(() => {
    // Proje filtreleme
    if (searchQuery.trim() === '') {
      setFilteredConstructions(constructions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = constructions.filter(
        (c) =>
          c.isBaslik?.toLowerCase().includes(query) ||
          c.yibfNo?.toLowerCase().includes(query) ||
          c.ilce?.toLowerCase().includes(query)
      );
      setFilteredConstructions(filtered);
    }
  }, [searchQuery, constructions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchData = async () => {
    try {
      const [adminsRes, constructionsRes] = await Promise.all([
        api.get('/users'),
        api.get('/constructions')
      ]);
      
      // Sadece admin ve super_admin kullanıcıları filtrele
      const adminUsers = adminsRes.data.filter(
        (u) => (u.role === 'admin' || u.role === 'super_admin') && u.id !== user.id
      );
      setAdmins(adminUsers);
      setConstructions(constructionsRes.data);
      setFilteredConstructions(constructionsRes.data);
    } catch (error) {
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchMesajlarByAdmin = async (adminId) => {
    try {
      const response = await api.get(`/mesajlar/user/${adminId}`);
      setMesajlar(response.data);
    } catch (error) {
      toast.error('Mesajlar yüklenemedi');
    }
  };

  const fetchMesajlarByProje = async (projeId) => {
    try {
      const response = await api.get(`/mesajlar/proje/${projeId}`);
      setMesajlar(response.data);
    } catch (error) {
      toast.error('Mesajlar yüklenemedi');
    }
  };

  const handleAdminSelect = (admin) => {
    setSelectedAdmin(admin);
    setSelectedProje(null);
    setActiveTab('admin');
    fetchMesajlarByAdmin(admin.id);
  };

  const handleProjeSelect = (proje) => {
    setSelectedProje(proje);
    setSelectedAdmin(null);
    setActiveTab('proje');
    fetchMesajlarByProje(proje.id);
  };

  const handleSendMesaj = async () => {
    if (!yeniMesaj.trim()) return;

    if (activeTab === 'admin' && !selectedAdmin) {
      toast.error('Lütfen bir admin seçin');
      return;
    }

    if (activeTab === 'proje' && !selectedProje) {
      toast.error('Lütfen bir proje seçin');
      return;
    }

    setSending(true);
    try {
      const payload = {
        mesaj: yeniMesaj
      };

      if (activeTab === 'admin') {
        payload.aliciId = selectedAdmin.id;
      } else {
        payload.projeId = selectedProje.id;
        payload.projeAdi = selectedProje.isBaslik || 'İsimsiz İnşaat';
      }

      await api.post('/mesajlar', payload);
      
      setYeniMesaj('');
      
      if (activeTab === 'admin') {
        fetchMesajlarByAdmin(selectedAdmin.id);
      } else {
        fetchMesajlarByProje(selectedProje.id);
      }
      
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
        <h1 className="text-3xl font-bold text-slate-900">
          Mesajlaşma
        </h1>
        <p className="text-slate-600 mt-1">
          {user.role === 'super_admin' 
            ? 'Adminler ile özel sohbet veya proje bazlı konuşmalar'
            : 'Proje bazlı sohbetler'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Panel - Admin/Proje Listesi */}
        <Card className="lg:col-span-1">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Konuşmalar
            </CardTitle>
            
            {user.role === 'super_admin' && (
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('admin')}
                  className="flex-1"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Adminler
                </Button>
                <Button
                  variant={activeTab === 'proje' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('proje')}
                  className="flex-1"
                >
                  <Building2 className="w-4 h-4 mr-1" />
                  Projeler
                </Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {activeTab === 'admin' && user.role === 'super_admin' && (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {admins.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">Henüz admin yok</p>
                ) : (
                  admins.map((admin) => (
                    <div
                      key={admin.id}
                      onClick={() => handleAdminSelect(admin)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedAdmin?.id === admin.id
                          ? 'bg-black text-white'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      <p className="font-medium text-sm">{admin.name}</p>
                      <p className={`text-xs mt-1 ${
                        selectedAdmin?.id === admin.id ? 'text-gray-300' : 'text-slate-600'
                      }`}>
                        {admin.email}
                      </p>
                      <p className={`text-xs ${
                        selectedAdmin?.id === admin.id ? 'text-gray-400' : 'text-slate-500'
                      }`}>
                        {admin.role === 'super_admin' ? 'Süper Admin' : 'Admin'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {(activeTab === 'proje' || user.role === 'admin') && (
              <div className="space-y-3">
                {/* Arama */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="İnşaat ismi veya YİBF No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Proje Listesi */}
                <div className="space-y-2 max-h-[550px] overflow-y-auto">
                  {filteredConstructions.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      {searchQuery ? 'Sonuç bulunamadı' : 'Henüz proje yok'}
                    </p>
                  ) : (
                    filteredConstructions.map((construction) => (
                      <div
                        key={construction.id}
                        onClick={() => handleProjeSelect(construction)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          selectedProje?.id === construction.id
                            ? 'bg-black text-white'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }`}
                      >
                        <p className="font-medium text-sm">
                          {construction.isBaslik || 'İsimsiz İnşaat'}
                        </p>
                        <p className={`text-xs mt-1 ${
                          selectedProje?.id === construction.id ? 'text-gray-300' : 'text-slate-600'
                        }`}>
                          YİBF: {construction.yibfNo}
                        </p>
                        {construction.ilce && (
                          <p className={`text-xs ${
                            selectedProje?.id === construction.id ? 'text-gray-400' : 'text-slate-500'
                          }`}>
                            {construction.ilce}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sağ Panel - Mesaj Alanı */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {activeTab === 'admin' && selectedAdmin ? (
                <>
                  {selectedAdmin.name}
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({selectedAdmin.role === 'super_admin' ? 'Süper Admin' : 'Admin'})
                  </span>
                </>
              ) : activeTab === 'proje' && selectedProje ? (
                selectedProje.isBaslik || 'İsimsiz İnşaat'
              ) : (
                `${activeTab === 'admin' ? 'Admin' : 'Proje'} Seçiniz`
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {(!selectedAdmin && activeTab === 'admin') || (!selectedProje && activeTab === 'proje') ? (
              <div className="flex items-center justify-center h-[500px] text-slate-500">
                Mesajlaşmaya başlamak için {activeTab === 'admin' ? 'bir admin' : 'bir proje'} seçin
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mesajlar */}
                <div className="bg-slate-50 rounded-lg p-4 h-[420px] overflow-y-auto space-y-3">
                  {mesajlar.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      Henüz mesaj yok. İlk mesajı siz gönderin!
                    </p>
                  ) : (
                    mesajlar.map((mesaj) => {
                      const isMine = mesaj.gonderenId === user.id;
                      return (
                        <div
                          key={mesaj.id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isMine
                                ? 'bg-black text-white'
                                : 'bg-white border border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-xs font-medium ${
                                isMine ? 'text-gray-300' : 'text-slate-700'
                              }`}>
                                {mesaj.gonderenAdi}
                              </p>
                              <p className={`text-xs ${
                                isMine ? 'text-gray-400' : 'text-slate-500'
                              }`}>
                                {formatDate(mesaj.createdAt)}
                              </p>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{mesaj.mesaj}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Mesaj Gönderme */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Mesajınızı yazın..."
                    value={yeniMesaj}
                    onChange={(e) => setYeniMesaj(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMesaj();
                      }
                    }}
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMesaj}
                    disabled={sending || !yeniMesaj.trim()}
                    className="self-end"
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

export default MesajlasmaNew;
