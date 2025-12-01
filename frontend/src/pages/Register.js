import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { USER_ROLES, ROLE_LABELS } from '@/lib/constants';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.USER
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.name, formData.password, formData.role);
      toast.success('Kayıt başarılı!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4" data-testid="register-page">
      <Card className="w-full max-w-md shadow-2xl" data-testid="register-card">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="flex justify-center mb-6">
            <img src="/batlama-logo.png" alt="Batlama Logo" className="h-20 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800" style={{fontFamily: 'Manrope, sans-serif'}}>Yapı Denetim Yönetim Sistemi</CardTitle>
          <CardDescription className="text-base">Yeni hesap oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                type="text"
                placeholder="Adınız Soyadınız"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="name-input"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="email-input"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
                data-testid="role-select"
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Rol seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(USER_ROLES).map(([key, value]) => (
                    <SelectItem key={value} value={value}>
                      {ROLE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="password-input"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                data-testid="confirm-password-input"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-medium"
              disabled={loading}
              data-testid="register-submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kayıt yapılıyor...
                </>
              ) : (
                'Kayıt Ol'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Zaten hesabınız var mı? </span>
            <Link to="/login" className="text-slate-500 hover:text-slate-600 font-medium" data-testid="login-link">
              Giriş Yap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;