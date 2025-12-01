#!/usr/bin/env python3
"""
Comprehensive Test Suite - Tüm Düzeltmelerin Testi
"""
import requests
import json
from datetime import datetime

class ComprehensiveTest:
    def __init__(self):
        self.base_url = "http://localhost:8001/api"
        self.token = None
        self.passed = 0
        self.failed = 0
        self.tests = []
        
    def log(self, test_name, passed, message=""):
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
        if message:
            print(f"    {message}")
        
        self.tests.append({
            "name": test_name,
            "passed": passed,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def test_1_login(self):
        """Test 1: Login functionality"""
        print("\n🔐 TEST 1: Authentication")
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"email": "test@batlama.com", "password": "test123"},
                timeout=10
            )
            
            if response.status_code == 200 and 'access_token' in response.json():
                self.token = response.json()['access_token']
                self.log("Login başarılı", True, f"Token alındı")
                return True
            else:
                self.log("Login başarısız", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log("Login hatası", False, str(e))
            return False
    
    def test_2_dashboard_stats(self):
        """Test 2: Dashboard stats endpoint"""
        print("\n📊 TEST 2: Dashboard Stats")
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = requests.get(f"{self.base_url}/dashboard/stats", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                required_keys = ['total_inspections', 'total_payments', 'total_licenses']
                has_all_keys = all(key in data for key in required_keys)
                self.log("Dashboard stats", has_all_keys, f"Gerekli tüm alanlar mevcut")
            else:
                self.log("Dashboard stats", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log("Dashboard stats hatası", False, str(e))
    
    def test_3_inspections_crud(self):
        """Test 3: Inspections CRUD operations"""
        print("\n🔍 TEST 3: Inspections CRUD")
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        # Create
        try:
            response = requests.post(
                f"{self.base_url}/inspections",
                headers=headers,
                json={
                    "denetimTarihi": "2025-12-01",
                    "kontrolEdilenBolum": "Test Kontrolü",
                    "insaatIsmi": "Test İnşaat",
                    "yibfNo": "TEST-001",
                    "ilce": "Test İlçe"
                },
                timeout=10
            )
            
            if response.status_code == 200 and 'id' in response.json():
                inspection_id = response.json()['id']
                self.log("Inspection Create", True, f"ID: {inspection_id}")
                
                # Read
                response = requests.get(f"{self.base_url}/inspections/{inspection_id}", headers=headers, timeout=10)
                if response.status_code == 200:
                    self.log("Inspection Read", True, "Kayıt okundu")
                else:
                    self.log("Inspection Read", False, f"Status: {response.status_code}")
                
                # Delete
                response = requests.delete(f"{self.base_url}/inspections/{inspection_id}", headers=headers, timeout=10)
                if response.status_code == 200:
                    self.log("Inspection Delete", True, "Kayıt silindi")
                else:
                    self.log("Inspection Delete", False, f"Status: {response.status_code}")
            else:
                self.log("Inspection Create", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log("Inspections CRUD hatası", False, str(e))
    
    def test_4_hakedis_hesaplama(self):
        """Test 4: Hakediş hesaplama endpoint (düzeltilen)"""
        print("\n💰 TEST 4: Hakediş Hesaplama (Düzeltilen)")
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Construction ID'yi veritabanından al
        from pymongo import MongoClient
        try:
            client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=5000)
            db = client['yapidenetim']
            construction = db.constructions.find_one({"yibfNo": "TEST-2025-001"})
            
            if construction:
                construction_id = construction['id']
                response = requests.get(
                    f"{self.base_url}/hakedis/hesapla/{construction_id}",
                    headers=headers,
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    # yapiInsaatAlani field'ından gelen değeri kontrol et
                    if 'toplamM2' in data and data['toplamM2'] == 1500.5:
                        self.log("Hakediş Hesaplama", True, f"Toplam M²: {data['toplamM2']} (yapiInsaatAlani field'ından)")
                    else:
                        self.log("Hakediş Hesaplama", False, f"Beklenen: 1500.5, Gelen: {data.get('toplamM2')}")
                else:
                    self.log("Hakediş Hesaplama", False, f"Status: {response.status_code}")
            else:
                self.log("Hakediş Hesaplama", False, "Construction bulunamadı")
            
            client.close()
        except Exception as e:
            self.log("Hakediş Hesaplama hatası", False, str(e))
    
    def test_5_companies(self):
        """Test 5: Companies endpoint"""
        print("\n🏢 TEST 5: Companies")
        headers = {'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}
        
        try:
            # List companies
            response = requests.get(f"{self.base_url}/companies", headers=headers, timeout=10)
            if response.status_code == 200:
                companies = response.json()
                self.log("Companies List", True, f"{len(companies)} firma bulundu")
                
                # Get by type
                response = requests.get(f"{self.base_url}/companies/type/laboratory", headers=headers, timeout=10)
                if response.status_code == 200:
                    self.log("Companies by Type", True, "Laboratuvar firmaları listelendi")
                else:
                    self.log("Companies by Type", False, f"Status: {response.status_code}")
            else:
                self.log("Companies List", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log("Companies hatası", False, str(e))
    
    def test_6_environment_variables(self):
        """Test 6: Environment variables kontrolü"""
        print("\n⚙️  TEST 6: Environment Variables")
        import os
        from pathlib import Path
        
        # Backend .env
        backend_env = Path("/app/backend/.env")
        if backend_env.exists():
            with open(backend_env) as f:
                content = f.read()
                has_mongo = "MONGO_URL" in content
                has_jwt = "JWT_SECRET_KEY" in content
                has_cors = "CORS_ORIGINS" in content
                
                if has_mongo and has_jwt and has_cors:
                    self.log("Backend .env", True, "Tüm gerekli değişkenler mevcut")
                else:
                    self.log("Backend .env", False, "Eksik değişkenler var")
        else:
            self.log("Backend .env", False, "Dosya bulunamadı")
        
        # Frontend .env
        frontend_env = Path("/app/frontend/.env")
        if frontend_env.exists():
            with open(frontend_env) as f:
                content = f.read()
                if "REACT_APP_BACKEND_URL" in content:
                    self.log("Frontend .env", True, "REACT_APP_BACKEND_URL mevcut")
                else:
                    self.log("Frontend .env", False, "REACT_APP_BACKEND_URL eksik")
        else:
            self.log("Frontend .env", False, "Dosya bulunamadı")
    
    def test_7_shutdown_function(self):
        """Test 7: Shutdown fonksiyonu kontrolü"""
        print("\n🔌 TEST 7: Shutdown Function")
        try:
            with open("/app/backend/server.py") as f:
                content = f.read()
                
            # Shutdown fonksiyonunu kontrol et
            has_shutdown = "@app.on_event(\"shutdown\")" in content
            has_body = "client.close()" in content
            has_logger = "logger.info" in content and "MongoDB connection closed" in content
            
            if has_shutdown and has_body and has_logger:
                self.log("Shutdown Function", True, "Fonksiyon tamamlandı ve logger eklendi")
            else:
                self.log("Shutdown Function", False, "Fonksiyon eksik veya hatalı")
        except Exception as e:
            self.log("Shutdown Function kontrolü", False, str(e))
    
    def test_8_authcontext_cleanup(self):
        """Test 8: AuthContext duplicate kod kontrolü"""
        print("\n🔄 TEST 8: AuthContext Cleanup")
        try:
            with open("/app/frontend/src/contexts/AuthContext.js") as f:
                content = f.read()
            
            # checkAuth fonksiyonunun sadece useEffect içinde olduğunu kontrol et
            checkauth_count = content.count("const checkAuth = async () =>")
            initauth_count = content.count("const initAuth = async () =>")
            
            if checkauth_count == 1 and initauth_count == 0:
                self.log("AuthContext Cleanup", True, "Duplicate kod temizlendi")
            else:
                self.log("AuthContext Cleanup", False, f"checkAuth: {checkauth_count}, initAuth: {initauth_count}")
        except Exception as e:
            self.log("AuthContext kontrolü", False, str(e))
    
    def test_9_register_route(self):
        """Test 9: Register route kontrolü"""
        print("\n📝 TEST 9: Register Route")
        try:
            with open("/app/frontend/src/App.js") as f:
                content = f.read()
            
            has_import = "import Register from" in content
            has_route = '/register' in content and '<Register />' in content
            
            if has_import and has_route:
                self.log("Register Route", True, "Route eklendi")
            else:
                self.log("Register Route", False, "Import var ama route eksik")
        except Exception as e:
            self.log("Register Route kontrolü", False, str(e))
    
    def print_summary(self):
        """Test özeti yazdır"""
        print("\n" + "="*60)
        print("📊 TEST ÖZET RAPORU")
        print("="*60)
        print(f"Toplam Test: {self.passed + self.failed}")
        print(f"✅ Başarılı: {self.passed}")
        print(f"❌ Başarısız: {self.failed}")
        success_rate = (self.passed / (self.passed + self.failed) * 100) if (self.passed + self.failed) > 0 else 0
        print(f"📈 Başarı Oranı: {success_rate:.1f}%")
        
        if self.failed > 0:
            print(f"\n❌ Başarısız Testler:")
            for test in self.tests:
                if not test['passed']:
                    print(f"  - {test['name']}: {test['message']}")
        
        # JSON rapor kaydet
        with open('/app/test_summary.json', 'w') as f:
            json.dump({
                'summary': {
                    'total': self.passed + self.failed,
                    'passed': self.passed,
                    'failed': self.failed,
                    'success_rate': success_rate
                },
                'tests': self.tests,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print("\n📄 Detaylı rapor: /app/test_summary.json")
        print("="*60)
        
        return self.failed == 0

def main():
    print("🚀 KAPSAMLI TEST SÜRECİ BAŞLIYOR")
    print("="*60)
    
    tester = ComprehensiveTest()
    
    # Testleri sırayla çalıştır
    if not tester.test_1_login():
        print("\n⚠️  Login başarısız - diğer testler atlanıyor")
        tester.print_summary()
        return False
    
    tester.test_2_dashboard_stats()
    tester.test_3_inspections_crud()
    tester.test_4_hakedis_hesaplama()
    tester.test_5_companies()
    tester.test_6_environment_variables()
    tester.test_7_shutdown_function()
    tester.test_8_authcontext_cleanup()
    tester.test_9_register_route()
    
    return tester.print_summary()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
