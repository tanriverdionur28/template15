from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import pandas as pd
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
if SECRET_KEY == 'your-secret-key-change-in-production':
    logger.warning("⚠️  WARNING: Using default JWT_SECRET_KEY! Change this in production!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class UserRole:
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    USER = "user"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = UserRole.USER
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: Optional[str] = UserRole.USER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class SiteInspection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    denetimTarihi: str
    betonDokumTarihi: Optional[str] = None
    kontrolEdilenBolum: str
    betonDokulenBolum: Optional[str] = None
    insaatIsmi: str
    yibfNo: str
    ilce: str
    blokNo: Optional[str] = None
    kat: Optional[str] = None
    kalipDonatiKontrolTarihi: Optional[str] = None
    alinanDemirNumuneCaplari: Optional[str] = None
    kot: Optional[str] = None
    kalipKurulumTarihi: Optional[str] = None
    kalipSokumTarihi: Optional[str] = None
    ileriTarihliKontrolPlan: Optional[str] = None
    ileriTarihliBetonDokumPlan: Optional[str] = None
    laboratuvarFirma: Optional[str] = None
    betonFirma: Optional[str] = None
    ileriTarihliBetonDokumSaati: Optional[str] = None
    teslimAlindi: Optional[str] = "beklemede"  # beklemede, alindi, alinmadi
    teslimAlinmamaAciklamasi: Optional[str] = None
    kontrolFotograflari: Optional[str] = None  # JSON string of URLs
    betonDokumFotograflari: Optional[str] = None  # JSON string of URLs
    santiyeDefteriBilgileriOnaylandi: Optional[bool] = False
    createdBy: str
    createdByName: str
    updatedBy: Optional[str] = None
    updatedByName: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: Optional[datetime] = None

class SiteInspectionCreate(BaseModel):
    denetimTarihi: str
    betonDokumTarihi: Optional[str] = None
    kontrolEdilenBolum: str
    betonDokulenBolum: Optional[str] = None
    insaatIsmi: str
    yibfNo: str
    ilce: str
    blokNo: Optional[str] = None
    kat: Optional[str] = None
    kalipDonatiKontrolTarihi: Optional[str] = None
    alinanDemirNumuneCaplari: Optional[str] = None
    kot: Optional[str] = None
    kalipKurulumTarihi: Optional[str] = None
    kalipSokumTarihi: Optional[str] = None
    ileriTarihliKontrolPlan: Optional[str] = None
    ileriTarihliBetonDokumPlan: Optional[str] = None
    laboratuvarFirma: Optional[str] = None
    betonFirma: Optional[str] = None
    ileriTarihliBetonDokumSaati: Optional[str] = None
    teslimAlindi: Optional[str] = "beklemede"
    teslimAlinmamaAciklamasi: Optional[str] = None
    kontrolFotograflari: Optional[str] = None
    betonDokumFotograflari: Optional[str] = None
    santiyeDefteriBilgileriOnaylandi: Optional[bool] = False

class ProgressPayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    insaatIsmi: str
    yibfNo: str
    adaParsel: Optional[str] = None
    hakedisNo: str
    hakedisTipi: str
    hakedisYuzdesi: Optional[float] = None
    belediye: Optional[str] = None
    hakedisDurumu: str
    eksik: str
    hakedisHazirlamaTarihi: Optional[str] = None
    belediyeyeGirisTarihi: Optional[str] = None
    malMudurlugneGirisTarihi: Optional[str] = None
    ileriTarihliHakedisHazirlamaTarihi: Optional[str] = None
    createdBy: str
    createdByName: str
    updatedBy: Optional[str] = None
    updatedByName: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: Optional[datetime] = None

class ProgressPaymentCreate(BaseModel):
    insaatIsmi: str
    yibfNo: str
    adaParsel: Optional[str] = None
    hakedisNo: str
    hakedisTipi: str
    hakedisYuzdesi: Optional[float] = None
    belediye: Optional[str] = None
    hakedisDurumu: str
    eksik: str
    hakedisHazirlamaTarihi: Optional[str] = None
    belediyeyeGirisTarihi: Optional[str] = None
    malMudurlugneGirisTarihi: Optional[str] = None
    ileriTarihliHakedisHazirlamaTarihi: Optional[str] = None

class WorkPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    baslik: str
    aciklama: Optional[str] = None
    planTarihi: str
    planSaati: Optional[str] = None
    tip: str  # 'saha_denetim', 'hakedis', 'ruhsat', 'proje', 'evrak', 'ofis', 'diger'
    referansId: Optional[str] = None  # İlişkili kayıt ID'si
    durum: str = "beklemede"  # 'beklemede', 'tamamlandi', 'iptal'
    createdBy: str
    createdByName: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkPlanCreate(BaseModel):
    baslik: str
    aciklama: Optional[str] = None
    planTarihi: str
    planSaati: Optional[str] = None
    tip: str
    referansId: Optional[str] = None

class LicenseProject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    insaatIsmi: str
    yibfNo: str
    # Yapı Sahibi Evrakları (YENİ - 7 madde)
    yapiSahibiTapu: bool = False
    yapiSahibiKimlik: bool = False
    yapiSahibiImarDurumu: bool = False
    yapiSahibiResmiAplikasyon: bool = False
    yapiSahibiYapiAplikasyon: bool = False
    yapiSahibiPlankote: bool = False
    yapiSahibiTaahhutname: bool = False
    # Yapı Müteahhiti Evrakları
    yapiMuteahhitiSozlesme: bool = False
    yapiMuteahhitiTaahhutname: bool = False
    yapiMuteahhitiTicaretOdasi: bool = False
    yapiMuteahhitiVergiLevhasi: bool = False
    yapiMuteahhitiImzaSirkuleri: bool = False
    yapiMuteahhitiKimlik: bool = False
    yapiMuteahhitiFaaliyetBelgesi: bool = False
    # Şantiye Şefi Evrakları
    santiyeSefiIsSozlesmesi: bool = False
    santiyeSefiTaahhutname: bool = False
    santiyeSefiKimlik: bool = False
    santiyeSefiImzaBeyani: bool = False
    santiyeSefiDiploma: bool = False
    santiyeSefiOdaKayit: bool = False
    santiyeSefiIkametgah: bool = False
    santiyeSefiIsciSagligi: bool = False
    # Proje Müellifi Evrakları
    projeMuellifIkametgah: bool = False
    projeMuellifOdaSicil: bool = False
    projeMuellifTcKimlik: bool = False
    projeMuellifTaahhutname: bool = False
    # Belediye Evrakları
    belediyeRuhsat: bool = False
    belediyeIsYeriTeslim: bool = False
    belediyeTemelVize: bool = False
    # Yapı Denetim Evrakları
    yapiDenetimProjeKontrol: bool = False
    yapiDenetimSeviyeTespit: bool = False
    yapiDenetimHakedis: bool = False
    yapiDenetimLabSonuclari: bool = False
    yapiDenetimCelikCekme: bool = False
    yapiDenetimYdkTutanak: bool = False
    yapiDenetimYdkSozlesme: bool = False
    yapiDenetimYdkTaahhutname: bool = False
    yapiDenetimYdkIsYeri: bool = False
    # Proje Takibi (8 proje tipi) - Denetlendi mi, Onaylandı mı, Onaylanmama Nedeni
    mimariDenetlendi: bool = False
    mimariOnaylandi: bool = False
    mimariOnaylanmamaNedeni: Optional[str] = None
    mimariDijitalArsiv: bool = False
    mimariBelediyeOnayliProjeArsivlendi: bool = False
    statikDenetlendi: bool = False
    statikOnaylandi: bool = False
    statikOnaylanmamaNedeni: Optional[str] = None
    statikDijitalArsiv: bool = False
    statikBelediyeOnayliProjeArsivlendi: bool = False
    mekanikDenetlendi: bool = False
    mekanikOnaylandi: bool = False
    mekanikOnaylanmamaNedeni: Optional[str] = None
    mekanikDijitalArsiv: bool = False
    mekanikBelediyeOnayliProjeArsivlendi: bool = False
    elektrikDenetlendi: bool = False
    elektrikOnaylandi: bool = False
    elektrikOnaylanmamaNedeni: Optional[str] = None
    elektrikDijitalArsiv: bool = False
    elektrikBelediyeOnayliProjeArsivlendi: bool = False
    tasDuvarDenetlendi: bool = False
    tasDuvarOnaylandi: bool = False
    tasDuvarOnaylanmamaNedeni: Optional[str] = None
    tasDuvarDijitalArsiv: bool = False
    tasDuvarBelediyeOnayliProjeArsivlendi: bool = False
    iskeleDenetlendi: bool = False
    iskeleOnaylandi: bool = False
    iskeleOnaylanmamaNedeni: Optional[str] = None
    iskeleDijitalArsiv: bool = False
    iskeleBelediyeOnayliProjeArsivlendi: bool = False
    zeminEtutDenetlendi: bool = False
    zeminEtutOnaylandi: bool = False
    zeminEtutOnaylanmamaNedeni: Optional[str] = None
    zeminEtutDijitalArsiv: bool = False
    zeminEtutBelediyeOnayliProjeArsivlendi: bool = False
    akustikDenetlendi: bool = False
    akustikOnaylandi: bool = False
    akustikOnaylanmamaNedeni: Optional[str] = None
    akustikDijitalArsiv: bool = False
    akustikBelediyeOnayliProjeArsivlendi: bool = False
    # Diğer bilgiler
    dijitalArsivTarihi: Optional[str] = None
    belediyeTeslimTarihi: Optional[str] = None
    ruhsatTarihi: Optional[str] = None
    notlar: Optional[str] = None
    createdBy: str
    createdByName: str
    updatedBy: Optional[str] = None
    updatedByName: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: Optional[datetime] = None

class LicenseProjectCreate(BaseModel):
    insaatIsmi: str
    yibfNo: str
    # Yapı Sahibi (7) - YENİ
    yapiSahibiTapu: bool = False
    yapiSahibiKimlik: bool = False
    yapiSahibiImarDurumu: bool = False
    yapiSahibiResmiAplikasyon: bool = False
    yapiSahibiYapiAplikasyon: bool = False
    yapiSahibiPlankote: bool = False
    yapiSahibiTaahhutname: bool = False
    # Yapı Müteahhiti (7)
    yapiMuteahhitiSozlesme: bool = False
    yapiMuteahhitiTaahhutname: bool = False
    yapiMuteahhitiTicaretOdasi: bool = False
    yapiMuteahhitiVergiLevhasi: bool = False
    yapiMuteahhitiImzaSirkuleri: bool = False
    yapiMuteahhitiKimlik: bool = False
    yapiMuteahhitiFaaliyetBelgesi: bool = False
    # Şantiye Şefi (8)
    santiyeSefiIsSozlesmesi: bool = False
    santiyeSefiTaahhutname: bool = False
    santiyeSefiKimlik: bool = False
    santiyeSefiImzaBeyani: bool = False
    santiyeSefiDiploma: bool = False
    santiyeSefiOdaKayit: bool = False
    santiyeSefiIkametgah: bool = False
    santiyeSefiIsciSagligi: bool = False
    # Proje Müellifi (4)
    projeMuellifIkametgah: bool = False
    projeMuellifOdaSicil: bool = False
    projeMuellifTcKimlik: bool = False
    projeMuellifTaahhutname: bool = False
    # Belediye (3)
    belediyeRuhsat: bool = False
    belediyeIsYeriTeslim: bool = False
    belediyeTemelVize: bool = False
    # Yapı Denetim (9)
    yapiDenetimProjeKontrol: bool = False
    yapiDenetimSeviyeTespit: bool = False
    yapiDenetimHakedis: bool = False
    yapiDenetimLabSonuclari: bool = False
    yapiDenetimCelikCekme: bool = False
    yapiDenetimYdkTutanak: bool = False
    yapiDenetimYdkSozlesme: bool = False
    yapiDenetimYdkTaahhutname: bool = False
    yapiDenetimYdkIsYeri: bool = False
    # Proje Takibi (8 proje x 4 = denetlendi, onaylandı, red nedeni, dijital arşiv)
    mimariDenetlendi: bool = False
    mimariOnaylandi: bool = False
    mimariOnaylanmamaNedeni: Optional[str] = None
    mimariDijitalArsiv: bool = False
    mimariBelediyeOnayliProjeArsivlendi: bool = False
    statikDenetlendi: bool = False
    statikOnaylandi: bool = False
    statikOnaylanmamaNedeni: Optional[str] = None
    statikDijitalArsiv: bool = False
    statikBelediyeOnayliProjeArsivlendi: bool = False
    mekanikDenetlendi: bool = False
    mekanikOnaylandi: bool = False
    mekanikOnaylanmamaNedeni: Optional[str] = None
    mekanikDijitalArsiv: bool = False
    mekanikBelediyeOnayliProjeArsivlendi: bool = False
    elektrikDenetlendi: bool = False
    elektrikOnaylandi: bool = False
    elektrikOnaylanmamaNedeni: Optional[str] = None
    elektrikDijitalArsiv: bool = False
    elektrikBelediyeOnayliProjeArsivlendi: bool = False
    tasDuvarDenetlendi: bool = False
    tasDuvarOnaylandi: bool = False
    tasDuvarOnaylanmamaNedeni: Optional[str] = None
    tasDuvarDijitalArsiv: bool = False
    tasDuvarBelediyeOnayliProjeArsivlendi: bool = False
    iskeleDenetlendi: bool = False
    iskeleOnaylandi: bool = False
    iskeleOnaylanmamaNedeni: Optional[str] = None
    iskeleDijitalArsiv: bool = False
    iskeleBelediyeOnayliProjeArsivlendi: bool = False
    zeminEtutDenetlendi: bool = False
    zeminEtutOnaylandi: bool = False
    zeminEtutOnaylanmamaNedeni: Optional[str] = None
    zeminEtutDijitalArsiv: bool = False
    zeminEtutBelediyeOnayliProjeArsivlendi: bool = False
    akustikDenetlendi: bool = False
    akustikOnaylandi: bool = False
    akustikOnaylanmamaNedeni: Optional[str] = None
    akustikDijitalArsiv: bool = False
    akustikBelediyeOnayliProjeArsivlendi: bool = False
    # Diğer
    dijitalArsivTarihi: Optional[str] = None
    belediyeTeslimTarihi: Optional[str] = None
    ruhsatTarihi: Optional[str] = None
    notlar: Optional[str] = None

class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tip: str  # 'saha_denetim', 'hakedis', 'ruhsat', 'workplan', 'login'
    aksiyon: str  # 'create', 'update', 'delete', 'login'
    aciklama: str
    userId: str
    userName: str
    referansId: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # 'laboratory' or 'concrete'
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    createdBy: str
    createdByName: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    name: str
    type: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class HakedisEvrak(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    hakedisId: str
    insaatIsmi: str
    yibfNo: str
    hakedisNo: str
    # Belediye Dosyası (15)
    belediyeHakedisDilekcesi: bool = False
    belediyeHakedisRaporu: bool = False
    belediyePersonelBildirge: bool = False
    belediyeParaDekontu: bool = False
    belediyeFatura: bool = False
    belediyeVergiBorcu: bool = False
    belediyeSgkBorcu: bool = False
    belediyeYapiSahibiTaahhut: bool = False
    belediyeYapiDenetimTaahhut: bool = False
    belediyeYapiDenetimSozlesme: bool = False
    belediyeYibfCikti: bool = False
    belediyeRuhsat: bool = False
    belediyeBelediyeHesap: bool = False
    belediyeCevreHesap: bool = False
    belediyeYapiDenetimHesap: bool = False
    # YD Dosyası (4)
    ydHakedisRaporu: bool = False
    ydParaDekontu: bool = False
    ydRuhsat: bool = False
    ydFatura: bool = False
    # Muhasebe Müdürlüğü (13)
    muhasebeHakedisRaporu: bool = False
    muhasebePersonelBildirge: bool = False
    muhasebeParaDekontu: bool = False
    muhasebeVergiBorcu: bool = False
    muhasebeSgkBorcu: bool = False
    muhasebeYapiSahibiTaahhut: bool = False
    muhasebeYapiDenetimTaahhut: bool = False
    muhasebeYapiDenetimSozlesme: bool = False
    muhasebeYibfCikti: bool = False
    muhasebeRuhsat: bool = False
    muhasebeBelediyeHesap: bool = False
    muhasebeCevreHesap: bool = False
    muhasebeYapiDenetimHesap: bool = False
    # Diğer
    notlar: Optional[str] = None
    createdBy: str
    createdByName: str
    updatedBy: Optional[str] = None
    updatedByName: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updatedAt: Optional[datetime] = None

class HakedisEvrakCreate(BaseModel):
    hakedisId: str
    insaatIsmi: str
    yibfNo: str
    hakedisNo: str
    belediyeHakedisDilekcesi: bool = False
    belediyeHakedisRaporu: bool = False
    belediyePersonelBildirge: bool = False
    belediyeParaDekontu: bool = False
    belediyeFatura: bool = False
    belediyeVergiBorcu: bool = False
    belediyeSgkBorcu: bool = False
    belediyeYapiSahibiTaahhut: bool = False
    belediyeYapiDenetimTaahhut: bool = False
    belediyeYapiDenetimSozlesme: bool = False
    belediyeYibfCikti: bool = False
    belediyeRuhsat: bool = False
    belediyeBelediyeHesap: bool = False
    belediyeCevreHesap: bool = False
    belediyeYapiDenetimHesap: bool = False
    ydHakedisRaporu: bool = False
    ydParaDekontu: bool = False
    ydRuhsat: bool = False
    ydFatura: bool = False
    muhasebeHakedisRaporu: bool = False
    muhasebePersonelBildirge: bool = False
    muhasebeParaDekontu: bool = False
    muhasebeVergiBorcu: bool = False
    muhasebeSgkBorcu: bool = False
    muhasebeYapiSahibiTaahhut: bool = False
    muhasebeYapiDenetimTaahhut: bool = False
    muhasebeYapiDenetimSozlesme: bool = False
    muhasebeYibfCikti: bool = False
    muhasebeRuhsat: bool = False
    muhasebeBelediyeHesap: bool = False
    muhasebeCevreHesap: bool = False
    muhasebeYapiDenetimHesap: bool = False
    notlar: Optional[str] = None

# ==================== AYLIK SEVİYE RAPORLARI ====================
class AylikSeviyeRaporu(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    licenseId: str  # İlişkili license_projects kaydı
    yibfNo: str
    insaatIsmi: str
    ay: str  # Format: "2025-01"
    raporTarihi: str
    raporVarMi: bool = False
    notlar: Optional[str] = None
    createdBy: str
    createdByName: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AylikSeviyeRaporuCreate(BaseModel):
    licenseId: str
    yibfNo: str
    insaatIsmi: str
    ay: str
    raporTarihi: str
    raporVarMi: bool = False
    notlar: Optional[str] = None

# ==================== YIL SONU SEVİYE TESPİT TUTANAKLARI ====================
class YilSonuSeviyeRaporu(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    licenseId: str
    yibfNo: str
    insaatIsmi: str
    yil: str  # Format: "2025"
    raporTarihi: str
    raporVarMi: bool = False
    notlar: Optional[str] = None
    createdBy: str
    createdByName: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class YilSonuSeviyeRaporuCreate(BaseModel):
    licenseId: str
    yibfNo: str
    insaatIsmi: str
    yil: str
    raporTarihi: str
    raporVarMi: bool = False
    notlar: Optional[str] = None

# ==================== MESAJLAŞMA (ADMIN - SUPERADMIN) ====================
class Mesaj(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    projeId: Optional[str] = None  # İlişkili inşaat ID (opsiyonel)
    projeAdi: Optional[str] = None
    gonderenId: str
    gonderenAdi: str
    gonderenRol: str
    aliciId: Optional[str] = None  # Özel mesaj için alıcı ID
    aliciAdi: Optional[str] = None
    mesaj: str
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MesajCreate(BaseModel):
    projeId: Optional[str] = None
    projeAdi: Optional[str] = None
    aliciId: Optional[str] = None  # Özel mesaj için
    mesaj: str

class ConstructionCreate(BaseModel):
    yibfNo: str
    il: Optional[str] = None
    ilgiliIdare: Optional[str] = None
    ada: Optional[str] = None
    parsel: Optional[str] = None
    isBaslik: Optional[str] = None
    isinDurumu: Optional[str] = None
    kismi: Optional[str] = None
    seviye: Optional[str] = None
    sozlesmeTarihi: Optional[str] = None
    kalanAlan: Optional[str] = None
    yapiInsaatAlani: Optional[str] = None
    ilce: Optional[str] = None
    mahalleKoy: Optional[str] = None
    birimFiyat: Optional[str] = None
    bksReferansNo: Optional[str] = None
    yapiKimlikNo: Optional[str] = None
    ruhsatTarihi: Optional[str] = None
    yapiSinifi: Optional[str] = None
    yapiToplamAlani: Optional[str] = None
    kumeYapiMi: Optional[str] = None
    eklenti: Optional[str] = None
    sanayiSitesi: Optional[str] = None
    guclendirme: Optional[str] = None
    guclendirmeRuhsat: Optional[str] = None
    ykeZorunluMu: Optional[str] = None

class SuperAdminReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    reportType: str  # 'santiye_defteri' or 'belediye_proje_arsiv'
    recordType: str  # 'inspection' or 'license'
    recordId: str
    yibfNo: Optional[str] = None
    insaatIsmi: Optional[str] = None
    projeType: Optional[str] = None  # mimari, statik, etc
    message: str
    isResolved: bool = False
    reportedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolvedAt: Optional[datetime] = None

class Construction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    yibfNo: str
    il: Optional[str] = None
    ilgiliIdare: Optional[str] = None
    ada: Optional[str] = None
    parsel: Optional[str] = None
    isBaslik: Optional[str] = None
    isinDurumu: Optional[str] = None
    kismi: Optional[str] = None
    seviye: Optional[str] = None
    sozlesmeTarihi: Optional[str] = None
    kalanAlan: Optional[str] = None
    yapiInsaatAlani: Optional[str] = None
    ilce: Optional[str] = None
    mahalleKoy: Optional[str] = None
    birimFiyat: Optional[str] = None
    bksReferansNo: Optional[str] = None
    yapiKimlikNo: Optional[str] = None
    ruhsatTarihi: Optional[str] = None
    yapiSinifi: Optional[str] = None
    yapiToplamAlani: Optional[str] = None
    kumeYapiMi: Optional[str] = None
    eklenti: Optional[str] = None
    sanayiSitesi: Optional[str] = None
    guclendirme: Optional[str] = None
    guclendirmeRuhsat: Optional[str] = None
    ykeZorunluMu: Optional[str] = None
    createdBy: Optional[str] = None
    createdByName: Optional[str] = None
    importDate: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH UTILITIES ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user_doc is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def log_activity(tip: str, aksiyon: str, aciklama: str, user: User, referansId: Optional[str] = None):
    log = ActivityLog(
        tip=tip,
        aksiyon=aksiyon,
        aciklama=aciklama,
        userId=user.id,
        userName=user.name,
        referansId=referansId
    )
    doc = log.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.activity_logs.insert_one(doc)

async def create_super_admin_report(
    report_type: str,
    record_type: str,
    record_id: str,
    message: str,
    yibf_no: Optional[str] = None,
    insaat_ismi: Optional[str] = None,
    proje_type: Optional[str] = None
):
    report = SuperAdminReport(
        reportType=report_type,
        recordType=record_type,
        recordId=record_id,
        yibfNo=yibf_no,
        insaatIsmi=insaat_ismi,
        projeType=proje_type,
        message=message
    )
    doc = report.model_dump()
    doc['reportedAt'] = doc['reportedAt'].isoformat()
    if doc['resolvedAt']:
        doc['resolvedAt'] = doc['resolvedAt'].isoformat()
    await db.super_admin_reports.insert_one(doc)
    return report

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=Token)
async def register(input: UserCreate):
    existing = await db.users.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = input.model_dump(exclude={"password"})
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    doc['password'] = hash_password(input.password)
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_access_token({"sub": user_obj.id})
    return Token(access_token=token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(input: UserLogin):
    user_doc = await db.users.find_one({"email": input.email})
    if not user_doc or not verify_password(input.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop('password', None)
    user_doc.pop('_id', None)
    if isinstance(user_doc.get('createdAt'), str):
        user_doc['createdAt'] = datetime.fromisoformat(user_doc['createdAt'])
    
    user = User(**user_doc)
    token = create_access_token({"sub": user.id})
    
    # Log login activity
    log = ActivityLog(
        tip="login",
        aksiyon="login",
        aciklama=f"{user.name} sisteme giriş yaptı",
        userId=user.id,
        userName=user.name
    )
    log_doc = log.model_dump()
    log_doc['createdAt'] = log_doc['createdAt'].isoformat()
    await db.activity_logs.insert_one(log_doc)
    
    return Token(access_token=token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/users", response_model=User)
async def create_user_by_admin(input: UserCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için süper admin yetkisi gerekli")
    
    existing = await db.users.find_one({"email": input.email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu email adresi zaten kayıtlı")
    
    user_dict = input.model_dump(exclude={"password"})
    user_obj = User(**user_dict)
    
    doc = user_obj.model_dump()
    doc['password'] = hash_password(input.password)
    doc['createdAt'] = doc['createdAt'].isoformat()
    
    await db.users.insert_one(doc)
    await log_activity("user", "create", f"Yeni kullanıcı oluşturuldu: {user_obj.name} ({user_obj.role})", current_user)
    
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için süper admin yetkisi gerekli")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).sort("createdAt", -1).to_list(1000)
    for user in users:
        if isinstance(user.get('createdAt'), str):
            user['createdAt'] = datetime.fromisoformat(user['createdAt'])
    return users

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için süper admin yetkisi gerekli")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    await log_activity("user", "delete", "Kullanıcı silindi", current_user, user_id)
    
    return {"message": "Başarıyla silindi"}

# ==================== SITE INSPECTIONS ====================

@api_router.post("/inspections", response_model=SiteInspection)
async def create_inspection(input: SiteInspectionCreate, current_user: User = Depends(get_current_user)):
    inspection_dict = input.model_dump()
    inspection_obj = SiteInspection(
        **inspection_dict,
        createdBy=current_user.id,
        createdByName=current_user.name
    )
    
    doc = inspection_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.site_inspections.insert_one(doc)
    
    # İleri tarihli planları work_plans'a ekle
    if input.ileriTarihliKontrolPlan:
        work_plan = WorkPlan(
            baslik=f"Kalıp Donatı Kontrolü - {input.insaatIsmi}",
            aciklama=f"Blok: {input.blokNo or 'Belirtilmedi'}, Kat: {input.kat or 'Belirtilmedi'}",
            planTarihi=input.ileriTarihliKontrolPlan,
            tip="saha_denetim",
            referansId=inspection_obj.id,
            durum="beklemede",
            createdBy=current_user.id,
            createdByName=current_user.name
        )
        wp_doc = work_plan.model_dump()
        wp_doc['createdAt'] = wp_doc['createdAt'].isoformat()
        await db.work_plans.insert_one(wp_doc)
    
    if input.ileriTarihliBetonDokumPlan:
        work_plan = WorkPlan(
            baslik=f"Beton Dökümü - {input.insaatIsmi}",
            aciklama=f"{input.betonDokulenBolum or 'Belirtilmedi'} - Saat: {input.ileriTarihliBetonDokumSaati or 'Belirtilmedi'}",
            planTarihi=input.ileriTarihliBetonDokumPlan,
            planSaati=input.ileriTarihliBetonDokumSaati,
            tip="saha_denetim",
            referansId=inspection_obj.id,
            durum="beklemede",
            createdBy=current_user.id,
            createdByName=current_user.name
        )
        wp_doc = work_plan.model_dump()
        wp_doc['createdAt'] = wp_doc['createdAt'].isoformat()
        await db.work_plans.insert_one(wp_doc)
    
    await log_activity("saha_denetim", "create", f"Yeni saha denetimi oluşturuldu: {input.insaatIsmi}", current_user, inspection_obj.id)
    
    # Şantiye defteri raporu
    if not inspection_dict.get('santiyeDefteriBilgileriOnaylandi', False):
        await create_super_admin_report(
            report_type="santiye_defteri",
            record_type="inspection",
            record_id=inspection_obj.id,
            message=f"Şantiye defteri bilgileri onaylanmadı",
            yibf_no=input.yibfNo,
            insaat_ismi=input.insaatIsmi
        )
    
    return inspection_obj

@api_router.get("/inspections", response_model=List[SiteInspection])
async def get_inspections(current_user: User = Depends(get_current_user)):
    inspections = await db.site_inspections.find({}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    for insp in inspections:
        if isinstance(insp.get('createdAt'), str):
            insp['createdAt'] = datetime.fromisoformat(insp['createdAt'])
        if insp.get('updatedAt') and isinstance(insp['updatedAt'], str):
            insp['updatedAt'] = datetime.fromisoformat(insp['updatedAt'])
    return inspections

@api_router.get("/inspections/{inspection_id}", response_model=SiteInspection)
async def get_inspection(inspection_id: str, current_user: User = Depends(get_current_user)):
    inspection = await db.site_inspections.find_one({"id": inspection_id}, {"_id": 0})
    if not inspection:
        raise HTTPException(status_code=404, detail="Denetim kaydı bulunamadı")
    if isinstance(inspection.get('createdAt'), str):
        inspection['createdAt'] = datetime.fromisoformat(inspection['createdAt'])
    if inspection.get('updatedAt') and isinstance(inspection['updatedAt'], str):
        inspection['updatedAt'] = datetime.fromisoformat(inspection['updatedAt'])
    return SiteInspection(**inspection)

@api_router.put("/inspections/{inspection_id}", response_model=SiteInspection)
async def update_inspection(inspection_id: str, input: SiteInspectionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.site_inspections.find_one({"id": inspection_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Denetim kaydı bulunamadı")
    
    update_data = input.model_dump()
    update_data['updatedBy'] = current_user.id
    update_data['updatedByName'] = current_user.name
    update_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
    
    await db.site_inspections.update_one({"id": inspection_id}, {"$set": update_data})
    
    updated = await db.site_inspections.find_one({"id": inspection_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    if updated.get('updatedAt') and isinstance(updated['updatedAt'], str):
        updated['updatedAt'] = datetime.fromisoformat(updated['updatedAt'])
    
    await log_activity("saha_denetim", "update", f"Saha denetimi güncellendi: {input.insaatIsmi}", current_user, inspection_id)
    
    return SiteInspection(**updated)

@api_router.delete("/inspections/{inspection_id}")
async def delete_inspection(inspection_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.site_inspections.delete_one({"id": inspection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Denetim kaydı bulunamadı")
    
    await log_activity("saha_denetim", "delete", "Saha denetimi silindi", current_user, inspection_id)
    
    return {"message": "Başarıyla silindi"}

# ==================== PROGRESS PAYMENTS ====================

@api_router.post("/payments", response_model=ProgressPayment)
async def create_payment(input: ProgressPaymentCreate, current_user: User = Depends(get_current_user)):
    payment_dict = input.model_dump()
    payment_obj = ProgressPayment(
        **payment_dict,
        createdBy=current_user.id,
        createdByName=current_user.name
    )
    
    doc = payment_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.progress_payments.insert_one(doc)
    
    # İleri tarihli hakediş planı
    if input.ileriTarihliHakedisHazirlamaTarihi:
        work_plan = WorkPlan(
            baslik=f"Hakediş Hazırlama - {input.insaatIsmi}",
            aciklama=f"Hakediş No: {input.hakedisNo} - {input.hakedisTipi}",
            planTarihi=input.ileriTarihliHakedisHazirlamaTarihi,
            tip="hakedis",
            referansId=payment_obj.id,
            durum="beklemede",
            createdBy=current_user.id,
            createdByName=current_user.name
        )
        wp_doc = work_plan.model_dump()
        wp_doc['createdAt'] = wp_doc['createdAt'].isoformat()
        await db.work_plans.insert_one(wp_doc)
    
    await log_activity("hakedis", "create", f"Yeni hakediş oluşturuldu: {input.insaatIsmi} - Hakediş No: {input.hakedisNo}", current_user, payment_obj.id)
    
    return payment_obj

@api_router.get("/payments", response_model=List[ProgressPayment])
async def get_payments(current_user: User = Depends(get_current_user)):
    payments = await db.progress_payments.find({}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    for payment in payments:
        if isinstance(payment.get('createdAt'), str):
            payment['createdAt'] = datetime.fromisoformat(payment['createdAt'])
        if payment.get('updatedAt') and isinstance(payment['updatedAt'], str):
            payment['updatedAt'] = datetime.fromisoformat(payment['updatedAt'])
    return payments

@api_router.get("/payments/{payment_id}", response_model=ProgressPayment)
async def get_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    payment = await db.progress_payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Hakediş kaydı bulunamadı")
    if isinstance(payment.get('createdAt'), str):
        payment['createdAt'] = datetime.fromisoformat(payment['createdAt'])
    if payment.get('updatedAt') and isinstance(payment['updatedAt'], str):
        payment['updatedAt'] = datetime.fromisoformat(payment['updatedAt'])
    return ProgressPayment(**payment)

@api_router.put("/payments/{payment_id}", response_model=ProgressPayment)
async def update_payment(payment_id: str, input: ProgressPaymentCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.progress_payments.find_one({"id": payment_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Hakediş kaydı bulunamadı")
    
    update_data = input.model_dump()
    update_data['updatedBy'] = current_user.id
    update_data['updatedByName'] = current_user.name
    update_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
    
    await db.progress_payments.update_one({"id": payment_id}, {"$set": update_data})
    
    updated = await db.progress_payments.find_one({"id": payment_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    if updated.get('updatedAt') and isinstance(updated['updatedAt'], str):
        updated['updatedAt'] = datetime.fromisoformat(updated['updatedAt'])
    
    await log_activity("hakedis", "update", f"Hakediş güncellendi: {input.insaatIsmi} - Hakediş No: {input.hakedisNo}", current_user, payment_id)
    
    return ProgressPayment(**updated)

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.progress_payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hakediş kaydı bulunamadı")
    
    await log_activity("hakedis", "delete", "Hakediş silindi", current_user, payment_id)
    
    return {"message": "Başarıyla silindi"}

# ==================== WORK PLANS ====================

@api_router.post("/workplans", response_model=WorkPlan)
async def create_workplan(input: WorkPlanCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    workplan_dict = input.model_dump()
    workplan_obj = WorkPlan(
        **workplan_dict,
        createdBy=current_user.id,
        createdByName=current_user.name,
        durum="beklemede"
    )
    
    doc = workplan_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.work_plans.insert_one(doc)
    
    await log_activity("workplan", "create", f"Yeni iş planı oluşturuldu: {input.baslik}", current_user, workplan_obj.id)
    
    return workplan_obj

@api_router.get("/workplans", response_model=List[WorkPlan])
async def get_workplans(current_user: User = Depends(get_current_user)):
    workplans = await db.work_plans.find({}, {"_id": 0}).sort("planTarihi", 1).to_list(1000)
    for wp in workplans:
        if isinstance(wp.get('createdAt'), str):
            wp['createdAt'] = datetime.fromisoformat(wp['createdAt'])
    return workplans

@api_router.put("/workplans/{workplan_id}", response_model=WorkPlan)
async def update_workplan_status(workplan_id: str, durum: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    await db.work_plans.update_one({"id": workplan_id}, {"$set": {"durum": durum}})
    
    updated = await db.work_plans.find_one({"id": workplan_id}, {"_id": 0})
    if not updated:
        raise HTTPException(status_code=404, detail="İş planı bulunamadı")
    
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    
    await log_activity("workplan", "update", f"İş planı durumu güncellendi: {durum}", current_user, workplan_id)
    
    return WorkPlan(**updated)

@api_router.delete("/workplans/{workplan_id}")
async def delete_workplan(workplan_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.work_plans.delete_one({"id": workplan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="İş planı bulunamadı")
    
    await log_activity("workplan", "delete", "İş planı silindi", current_user, workplan_id)
    
    return {"message": "Başarıyla silindi"}

# ==================== LICENSE & PROJECTS ====================

@api_router.post("/licenses", response_model=LicenseProject)
async def create_license(input: LicenseProjectCreate, current_user: User = Depends(get_current_user)):
    license_dict = input.model_dump()
    license_obj = LicenseProject(
        **license_dict,
        createdBy=current_user.id,
        createdByName=current_user.name
    )
    
    doc = license_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.license_projects.insert_one(doc)
    
    await log_activity("ruhsat", "create", f"Yeni ruhsat kaydı oluşturuldu: {input.insaatIsmi}", current_user, license_obj.id)
    
    # Belediye onaylı proje arşivleme raporları
    proje_types = [
        ('mimari', 'Mimari'),
        ('statik', 'Statik'),
        ('mekanik', 'Mekanik'),
        ('elektrik', 'Elektrik'),
        ('tasDuvar', 'Taş Duvar'),
        ('iskele', 'İskele'),
        ('zeminEtut', 'Zemin Etüt'),
        ('akustik', 'Akustik')
    ]
    
    for key, label in proje_types:
        field_name = f'{key}BelediyeOnayliProjeArsivlendi'
        if not license_dict.get(field_name, False):
            await create_super_admin_report(
                report_type="belediye_proje_arsiv",
                record_type="license",
                record_id=license_obj.id,
                message=f"{label} projesi için belediye onaylı proje arşivlenmedi",
                yibf_no=input.yibfNo,
                insaat_ismi=input.insaatIsmi,
                proje_type=label
            )
    
    return license_obj

@api_router.get("/licenses", response_model=List[LicenseProject])
async def get_licenses(current_user: User = Depends(get_current_user)):
    licenses = await db.license_projects.find({}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    for lic in licenses:
        if isinstance(lic.get('createdAt'), str):
            lic['createdAt'] = datetime.fromisoformat(lic['createdAt'])
        if lic.get('updatedAt') and isinstance(lic['updatedAt'], str):
            lic['updatedAt'] = datetime.fromisoformat(lic['updatedAt'])
    return licenses

@api_router.get("/licenses/{license_id}", response_model=LicenseProject)
async def get_license(license_id: str, current_user: User = Depends(get_current_user)):
    license = await db.license_projects.find_one({"id": license_id}, {"_id": 0})
    if not license:
        raise HTTPException(status_code=404, detail="Ruhsat kaydı bulunamadı")
    if isinstance(license.get('createdAt'), str):
        license['createdAt'] = datetime.fromisoformat(license['createdAt'])
    if license.get('updatedAt') and isinstance(license['updatedAt'], str):
        license['updatedAt'] = datetime.fromisoformat(license['updatedAt'])
    return LicenseProject(**license)

@api_router.put("/licenses/{license_id}", response_model=LicenseProject)
async def update_license(license_id: str, input: LicenseProjectCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.license_projects.find_one({"id": license_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Ruhsat kaydı bulunamadı")
    
    update_data = input.model_dump()
    update_data['updatedBy'] = current_user.id
    update_data['updatedByName'] = current_user.name
    update_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
    
    await db.license_projects.update_one({"id": license_id}, {"$set": update_data})
    
    updated = await db.license_projects.find_one({"id": license_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    if updated.get('updatedAt') and isinstance(updated['updatedAt'], str):
        updated['updatedAt'] = datetime.fromisoformat(updated['updatedAt'])
    
    await log_activity("ruhsat", "update", f"Ruhsat kaydı güncellendi: {input.insaatIsmi}", current_user, license_id)
    
    return LicenseProject(**updated)

@api_router.delete("/licenses/{license_id}")
async def delete_license(license_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.license_projects.delete_one({"id": license_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ruhsat kaydı bulunamadı")
    
    await log_activity("ruhsat", "delete", "Ruhsat kaydı silindi", current_user, license_id)
    
    return {"message": "Başarıyla silindi"}

# ==================== SUPER ADMIN REPORTS ====================

@api_router.get("/super-admin-reports", response_model=List[SuperAdminReport])
async def get_super_admin_reports(current_user: User = Depends(get_current_user)):
    # Admin ve SuperAdmin erişebilir
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Bu raporları görmek için admin veya süper admin yetkisi gerekli")
    
    reports = await db.super_admin_reports.find({}, {"_id": 0}).sort("reportedAt", -1).to_list(1000)
    for report in reports:
        if isinstance(report.get('reportedAt'), str):
            report['reportedAt'] = datetime.fromisoformat(report['reportedAt'])
        if report.get('resolvedAt') and isinstance(report['resolvedAt'], str):
            report['resolvedAt'] = datetime.fromisoformat(report['resolvedAt'])
    return reports

@api_router.put("/super-admin-reports/{report_id}/resolve")
async def resolve_report(report_id: str, current_user: User = Depends(get_current_user)):
    # Admin ve SuperAdmin çözümleyebilir
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için admin veya süper admin yetkisi gerekli")
    
    result = await db.super_admin_reports.update_one(
        {"id": report_id},
        {"$set": {"isResolved": True, "resolvedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    
    return {"message": "Rapor çözüldü olarak işaretlendi"}

# ==================== ACTIVITY LOGS ====================

@api_router.get("/activities", response_model=List[ActivityLog])
async def get_activities(current_user: User = Depends(get_current_user)):
    activities = await db.activity_logs.find({}, {"_id": 0}).sort("createdAt", -1).limit(500).to_list(500)
    for activity in activities:
        if isinstance(activity.get('createdAt'), str):
            activity['createdAt'] = datetime.fromisoformat(activity['createdAt'])
    return activities

# ==================== CONSTRUCTIONS (İNŞAAT LİSTESİ) ====================

@api_router.post("/constructions/upload")
async def upload_constructions(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için süper admin yetkisi gerekli")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Sadece Excel dosyaları (.xlsx, .xls) yüklenebilir")
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Column mapping from Excel to our model
        column_mapping = {
            'YİBF No': 'yibfNo',
            'İl': 'il',
            'İlgili İdare': 'ilgiliIdare',
            'Ada': 'ada',
            'Parsel': 'parsel',
            'İş Başlık': 'isBaslik',
            'İşin Durumu': 'isinDurumu',
            'Kısmi': 'kismi',
            'Seviye': 'seviye',
            'Sözleşme Tarihi': 'sozlesmeTarihi',
            'Kalan Alan': 'kalanAlan',
            'Yapı İnşaat Alanı (m2)': 'yapiInsaatAlani',
            'İlçe': 'ilce',
            'Mahalle/Köy': 'mahalleKoy',
            'Birim Fiyat': 'birimFiyat',
            'BKS Referans No': 'bksReferansNo',
            'Yapı Kimlik No': 'yapiKimlikNo',
            'Ruhsat Tarihi': 'ruhsatTarihi',
            'Yapı Sınıfı': 'yapiSinifi',
            'Yapı Toplam Alanı (m2)': 'yapiToplamAlani',
            'Küme Yapı Mı?': 'kumeYapiMi',
            'Eklenti': 'eklenti',
            'Sanayi Sitesi': 'sanayiSitesi',
            'Güçlendirme': 'guclendirme',
            'Güçlendirme (Ruhsat)': 'guclendirmeRuhsat',
            'YKE Zorunlu mu?': 'ykeZorunluMu'
        }
        
        # Replace NaN with None
        df = df.where(pd.notnull(df), None)
        
        imported_count = 0
        updated_count = 0
        skipped_count = 0
        
        for _, row in df.iterrows():
            if pd.isna(row.get('YİBF No')) or row.get('YİBF No') is None:
                skipped_count += 1
                continue
            
            yibf_no = str(row['YİBF No']).strip()
            
            # Check if construction already exists
            existing = await db.constructions.find_one({"yibfNo": yibf_no})
            
            # Prepare construction data
            construction_data = {
                "yibfNo": yibf_no,
                "createdBy": current_user.id,
                "createdByName": current_user.name,
                "importDate": datetime.now(timezone.utc).isoformat()
            }
            
            # Map Excel columns to model fields
            for excel_col, model_field in column_mapping.items():
                if excel_col in row and row[excel_col] is not None:
                    value = row[excel_col]
                    # Convert to string and handle special types
                    if pd.isna(value):
                        construction_data[model_field] = None
                    elif isinstance(value, (int, float)):
                        construction_data[model_field] = str(value)
                    elif isinstance(value, pd.Timestamp):
                        construction_data[model_field] = value.strftime('%Y-%m-%d')
                    else:
                        construction_data[model_field] = str(value)
            
            if existing:
                # Update existing construction
                construction_data['createdAt'] = existing.get('createdAt')
                await db.constructions.update_one(
                    {"yibfNo": yibf_no},
                    {"$set": construction_data}
                )
                updated_count += 1
            else:
                # Insert new construction
                construction_data['id'] = str(uuid.uuid4())
                construction_data['createdAt'] = datetime.now(timezone.utc).isoformat()
                await db.constructions.insert_one(construction_data)
                imported_count += 1
        
        await log_activity(
            "construction",
            "upload",
            f"Excel dosyası yüklendi: {imported_count} yeni, {updated_count} güncellendi, {skipped_count} atlandı",
            current_user
        )
        
        return {
            "message": "Excel dosyası başarıyla işlendi",
            "imported": imported_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total": imported_count + updated_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Excel işleme hatası: {str(e)}")

@api_router.get("/constructions", response_model=List[Construction])
async def get_constructions(current_user: User = Depends(get_current_user)):
    constructions = await db.constructions.find({}, {"_id": 0}).sort("createdAt", -1).to_list(5000)
    for const in constructions:
        if isinstance(const.get('createdAt'), str):
            const['createdAt'] = datetime.fromisoformat(const['createdAt'])
        if const.get('importDate') and isinstance(const['importDate'], str):
            const['importDate'] = datetime.fromisoformat(const['importDate'])
    return constructions

@api_router.get("/constructions/search")
async def search_constructions(q: str, current_user: User = Depends(get_current_user)):
    """Search constructions by YIBF No or İş Başlık"""
    query = {
        "$or": [
            {"yibfNo": {"$regex": q, "$options": "i"}},
            {"isBaslik": {"$regex": q, "$options": "i"}}
        ]
    }
    constructions = await db.constructions.find(query, {"_id": 0}).limit(20).to_list(20)
    return constructions

@api_router.delete("/constructions/{construction_id}")
async def delete_construction(construction_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için süper admin yetkisi gerekli")
    
    result = await db.constructions.delete_one({"id": construction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="İnşaat kaydı bulunamadı")
    
    await log_activity("construction", "delete", "İnşaat kaydı silindi", current_user, construction_id)
    
    return {"message": "Başarıyla silindi"}

@api_router.delete("/constructions")
async def delete_all_constructions(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Bu işlem için süper admin yetkisi gerekli")
    
    result = await db.constructions.delete_many({})
    
    await log_activity("construction", "delete", f"Tüm inşaat kayıtları silindi ({result.deleted_count} kayıt)", current_user)
    
    return {"message": f"{result.deleted_count} kayıt silindi"}

# ==================== COMPANIES ====================

@api_router.post("/companies", response_model=Company)
async def create_company(input: CompanyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    company_dict = input.model_dump()
    company_obj = Company(
        **company_dict,
        createdBy=current_user.id,
        createdByName=current_user.name
    )
    
    doc = company_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.companies.insert_one(doc)
    
    await log_activity("company", "create", f"Yeni firma oluşturuldu: {input.name} ({input.type})", current_user, company_obj.id)
    
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def get_companies(current_user: User = Depends(get_current_user)):
    companies = await db.companies.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    for company in companies:
        if isinstance(company.get('createdAt'), str):
            company['createdAt'] = datetime.fromisoformat(company['createdAt'])
    return companies

@api_router.get("/companies/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user: User = Depends(get_current_user)):
    company = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    if isinstance(company.get('createdAt'), str):
        company['createdAt'] = datetime.fromisoformat(company['createdAt'])
    return Company(**company)

@api_router.put("/companies/{company_id}", response_model=Company)
async def update_company(company_id: str, input: CompanyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    existing = await db.companies.find_one({"id": company_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    
    update_data = input.model_dump()
    await db.companies.update_one({"id": company_id}, {"$set": update_data})
    
    updated = await db.companies.find_one({"id": company_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    
    await log_activity("company", "update", f"Firma güncellendi: {input.name}", current_user, company_id)
    
    return Company(**updated)

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    
    result = await db.companies.delete_one({"id": company_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Firma bulunamadı")
    
    await log_activity("company", "delete", "Firma silindi", current_user, company_id)
    
    return {"message": "Başarıyla silindi"}

@api_router.get("/companies/type/{company_type}", response_model=List[Company])
async def get_companies_by_type(company_type: str, current_user: User = Depends(get_current_user)):
    """Get companies by type (laboratory or concrete)"""
    if company_type not in ['laboratory', 'concrete']:
        raise HTTPException(status_code=400, detail="Geçersiz firma tipi. 'laboratory' veya 'concrete' olmalı")
    
    companies = await db.companies.find({"type": company_type}, {"_id": 0}).sort("name", 1).to_list(1000)
    for company in companies:
        if isinstance(company.get('createdAt'), str):
            company['createdAt'] = datetime.fromisoformat(company['createdAt'])
    return companies

# ==================== HAKEDİŞ EVRAKLARI ====================

@api_router.post("/hakedis-evrak", response_model=HakedisEvrak)
async def create_hakedis_evrak(input: HakedisEvrakCreate, current_user: User = Depends(get_current_user)):
    evrak_dict = input.model_dump()
    evrak_obj = HakedisEvrak(**evrak_dict, createdBy=current_user.id, createdByName=current_user.name)
    doc = evrak_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.hakedis_evrak.insert_one(doc)
    await log_activity("hakedis_evrak", "create", f"Hakediş evrak kaydı oluşturuldu: {input.insaatIsmi}", current_user)
    return evrak_obj

@api_router.get("/hakedis-evrak", response_model=List[HakedisEvrak])
async def get_hakedis_evrak(current_user: User = Depends(get_current_user)):
    evraklar = await db.hakedis_evrak.find({}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    for evrak in evraklar:
        if isinstance(evrak.get('createdAt'), str):
            evrak['createdAt'] = datetime.fromisoformat(evrak['createdAt'])
        if evrak.get('updatedAt') and isinstance(evrak['updatedAt'], str):
            evrak['updatedAt'] = datetime.fromisoformat(evrak['updatedAt'])
    return evraklar

@api_router.get("/hakedis-evrak/by-hakedis/{hakedis_id}")
async def get_hakedis_evrak_by_hakedis(hakedis_id: str, current_user: User = Depends(get_current_user)):
    evrak = await db.hakedis_evrak.find_one({"hakedisId": hakedis_id}, {"_id": 0})
    if not evrak:
        return None
    if isinstance(evrak.get('createdAt'), str):
        evrak['createdAt'] = datetime.fromisoformat(evrak['createdAt'])
    if evrak.get('updatedAt') and isinstance(evrak['updatedAt'], str):
        evrak['updatedAt'] = datetime.fromisoformat(evrak['updatedAt'])
    return evrak

@api_router.put("/hakedis-evrak/{evrak_id}", response_model=HakedisEvrak)
async def update_hakedis_evrak(evrak_id: str, input: HakedisEvrakCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    existing = await db.hakedis_evrak.find_one({"id": evrak_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Evrak kaydı bulunamadı")
    update_data = input.model_dump()
    update_data['updatedBy'] = current_user.id
    update_data['updatedByName'] = current_user.name
    update_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
    await db.hakedis_evrak.update_one({"id": evrak_id}, {"$set": update_data})
    updated = await db.hakedis_evrak.find_one({"id": evrak_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    if updated.get('updatedAt') and isinstance(updated['updatedAt'], str):
        updated['updatedAt'] = datetime.fromisoformat(updated['updatedAt'])
    await log_activity("hakedis_evrak", "update", "Hakediş evrak güncellendi", current_user, evrak_id)
    return HakedisEvrak(**updated)

@api_router.delete("/hakedis-evrak/{evrak_id}")
async def delete_hakedis_evrak(evrak_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    result = await db.hakedis_evrak.delete_one({"id": evrak_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evrak kaydı bulunamadı")
    await log_activity("hakedis_evrak", "delete", "Hakediş evrak silindi", current_user, evrak_id)
    return {"message": "Başarıyla silindi"}

# ==================== HAKEDİŞ HESAPLAMA (Beton Dökümü Bazlı) ====================

@api_router.get("/hakedis/hesapla/{construction_id}")
async def hesapla_hakedis(construction_id: str, current_user: User = Depends(get_current_user)):
    """
    İnşaat için hakediş önerisi hesaplar
    %10 - Proje inceleme
    %10 - Temel betonu (28 gün + lab)
    %40 - Taşıyıcı sistem (kat kat)
    %10 - Tuğla duvar + PVC
    %10 - Sıva hazırlık
    %15 - Mekanik/Elektrik
    %5 - İş bitirme
    """
    construction = await db.constructions.find_one({"id": construction_id})
    if not construction:
        raise HTTPException(status_code=404, detail="İnşaat bulunamadı")
    
    # yapiInsaatAlani field'ını kullan (toplamM2 değil)
    yapi_alani = construction.get('yapiInsaatAlani', '500')
    try:
        toplam_m2 = float(yapi_alani) if yapi_alani else 500.0
    except (ValueError, TypeError):
        toplam_m2 = 500.0
    
    # Denetim kayıtlarını al (site_inspections collection'ından)
    inspections = await db.site_inspections.find({"yibfNo": construction.get('yibfNo')}).to_list(1000)
    
    # Beton dökümleri
    beton_dokumleri = [i for i in inspections if i.get('betonDokumTarihi')]
    
    hakedisler = []
    kalan_m2 = toplam_m2
    
    # %10 Proje inceleme (hemen alınabilir)
    proje_m2 = toplam_m2 * 0.10
    hakedisler.append({
        "tur": "Proje İnceleme",
        "oran": 10,
        "m2": proje_m2,
        "durum": "Alınabilir",
        "kosul": "Ruhsat alındıktan sonra direk alınabilir"
    })
    kalan_m2 -= proje_m2
    
    # %10 Temel betonu
    temel_m2 = toplam_m2 * 0.10
    temel_dokumu = any('temel' in i.get('betonDokulenBolum', '').lower() for i in beton_dokumleri)
    hakedisler.append({
        "tur": "Temel Betonu",
        "oran": 10,
        "m2": temel_m2,
        "durum": "Alınabilir" if temel_dokumu else "Bekliyor",
        "kosul": "Temel betonu döküldü ve 28 günlük lab raporu olumlu"
    })
    if temel_dokumu:
        kalan_m2 -= temel_m2
    
    # %40 Taşıyıcı sistem (kat kat)
    tasiyici_m2 = toplam_m2 * 0.40
    kat_sayisi = len([i for i in beton_dokumleri if 'kat' in i.get('betonDokulenBolum', '').lower()])
    hakedisler.append({
        "tur": "Taşıyıcı Sistem",
        "oran": 40,
        "m2": tasiyici_m2,
        "durum": f"{kat_sayisi} kat dökümü yapıldı",
        "kosul": "Her kat döküm sonrası 28 günlük lab raporları olumlu ise alınabilir"
    })
    
    # %10 Tuğla duvar + PVC
    hakedisler.append({
        "tur": "Tuğla Duvar + PVC Doğrama",
        "oran": 10,
        "m2": toplam_m2 * 0.10,
        "durum": "Bekliyor",
        "kosul": "Duvar örümü ve PVC doğramalar tamamlandıktan sonra"
    })
    
    # %10 Sıva hazırlık
    hakedisler.append({
        "tur": "Sıva Hazırlık",
        "oran": 10,
        "m2": toplam_m2 * 0.10,
        "durum": "Bekliyor",
        "kosul": "Sıvaya hazır duruma geldikten sonra"
    })
    
    # %15 Mekanik/Elektrik
    hakedisler.append({
        "tur": "Mekanik/Elektrik Tesisatı",
        "oran": 15,
        "m2": toplam_m2 * 0.15,
        "durum": "Bekliyor",
        "kosul": "Mekanik ve elektrik tesisatları tamamlandıktan sonra"
    })
    
    # %5 İş bitirme
    hakedisler.append({
        "tur": "İş Bitirme",
        "oran": 5,
        "m2": toplam_m2 * 0.05,
        "durum": "Bekliyor",
        "kosul": "Yapı kullanım izni alındıktan sonra"
    })
    
    return {
        "insaatIsmi": construction.get('insaatIsmi'),
        "toplamM2": toplam_m2,
        "kalanM2": kalan_m2,
        "hakedisler": hakedisler,
        "betonDokumSayisi": len(beton_dokumleri)
    }

# ==================== AYLIK SEVİYE RAPORLARI ====================

@api_router.post("/aylik-rapor", response_model=AylikSeviyeRaporu)
async def create_aylik_rapor(input: AylikSeviyeRaporuCreate, current_user: User = Depends(get_current_user)):
    rapor_obj = AylikSeviyeRaporu(**input.model_dump(), createdBy=current_user.id, createdByName=current_user.name)
    doc = rapor_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.aylik_seviye_raporlari.insert_one(doc)
    await log_activity("aylik_rapor", "create", f"Aylık seviye raporu oluşturuldu: {input.insaatIsmi} - {input.ay}", current_user)
    return rapor_obj

@api_router.get("/aylik-rapor", response_model=List[AylikSeviyeRaporu])
async def get_aylik_raporlar(current_user: User = Depends(get_current_user)):
    raporlar = await db.aylik_seviye_raporlari.find({}, {"_id": 0}).sort("ay", -1).to_list(1000)
    for r in raporlar:
        if isinstance(r.get('createdAt'), str):
            r['createdAt'] = datetime.fromisoformat(r['createdAt'])
    return raporlar

@api_router.get("/aylik-rapor/license/{license_id}")
async def get_aylik_raporlar_by_license(license_id: str, current_user: User = Depends(get_current_user)):
    raporlar = await db.aylik_seviye_raporlari.find({"licenseId": license_id}, {"_id": 0}).sort("ay", -1).to_list(100)
    for r in raporlar:
        if isinstance(r.get('createdAt'), str):
            r['createdAt'] = datetime.fromisoformat(r['createdAt'])
    return raporlar

@api_router.put("/aylik-rapor/{rapor_id}", response_model=AylikSeviyeRaporu)
async def update_aylik_rapor(rapor_id: str, input: AylikSeviyeRaporuCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    existing = await db.aylik_seviye_raporlari.find_one({"id": rapor_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    update_data = input.model_dump()
    await db.aylik_seviye_raporlari.update_one({"id": rapor_id}, {"$set": update_data})
    updated = await db.aylik_seviye_raporlari.find_one({"id": rapor_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    await log_activity("aylik_rapor", "update", "Aylık rapor güncellendi", current_user, rapor_id)
    return AylikSeviyeRaporu(**updated)

@api_router.delete("/aylik-rapor/{rapor_id}")
async def delete_aylik_rapor(rapor_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    result = await db.aylik_seviye_raporlari.delete_one({"id": rapor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    await log_activity("aylik_rapor", "delete", "Aylık rapor silindi", current_user, rapor_id)
    return {"message": "Başarıyla silindi"}

# ==================== YIL SONU SEVİYE RAPORLARI ====================

@api_router.post("/yilsonu-rapor", response_model=YilSonuSeviyeRaporu)
async def create_yilsonu_rapor(input: YilSonuSeviyeRaporuCreate, current_user: User = Depends(get_current_user)):
    rapor_obj = YilSonuSeviyeRaporu(**input.model_dump(), createdBy=current_user.id, createdByName=current_user.name)
    doc = rapor_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.yilsonu_seviye_raporlari.insert_one(doc)
    await log_activity("yilsonu_rapor", "create", f"Yıl sonu raporu oluşturuldu: {input.insaatIsmi} - {input.yil}", current_user)
    return rapor_obj

@api_router.get("/yilsonu-rapor", response_model=List[YilSonuSeviyeRaporu])
async def get_yilsonu_raporlar(current_user: User = Depends(get_current_user)):
    raporlar = await db.yilsonu_seviye_raporlari.find({}, {"_id": 0}).sort("yil", -1).to_list(1000)
    for r in raporlar:
        if isinstance(r.get('createdAt'), str):
            r['createdAt'] = datetime.fromisoformat(r['createdAt'])
    return raporlar

@api_router.get("/yilsonu-rapor/license/{license_id}")
async def get_yilsonu_raporlar_by_license(license_id: str, current_user: User = Depends(get_current_user)):
    raporlar = await db.yilsonu_seviye_raporlari.find({"licenseId": license_id}, {"_id": 0}).sort("yil", -1).to_list(100)
    for r in raporlar:
        if isinstance(r.get('createdAt'), str):
            r['createdAt'] = datetime.fromisoformat(r['createdAt'])
    return raporlar

@api_router.put("/yilsonu-rapor/{rapor_id}", response_model=YilSonuSeviyeRaporu)
async def update_yilsonu_rapor(rapor_id: str, input: YilSonuSeviyeRaporuCreate, current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.USER:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    existing = await db.yilsonu_seviye_raporlari.find_one({"id": rapor_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    update_data = input.model_dump()
    await db.yilsonu_seviye_raporlari.update_one({"id": rapor_id}, {"$set": update_data})
    updated = await db.yilsonu_seviye_raporlari.find_one({"id": rapor_id}, {"_id": 0})
    if isinstance(updated.get('createdAt'), str):
        updated['createdAt'] = datetime.fromisoformat(updated['createdAt'])
    await log_activity("yilsonu_rapor", "update", "Yıl sonu raporu güncellendi", current_user, rapor_id)
    return YilSonuSeviyeRaporu(**updated)

@api_router.delete("/yilsonu-rapor/{rapor_id}")
async def delete_yilsonu_rapor(rapor_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    result = await db.yilsonu_seviye_raporlari.delete_one({"id": rapor_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı")
    await log_activity("yilsonu_rapor", "delete", "Yıl sonu raporu silindi", current_user, rapor_id)
    return {"message": "Başarıyla silindi"}

# ==================== MESAJLAŞMA (ADMIN-SUPERADMIN) ====================

@api_router.post("/mesajlar", response_model=Mesaj)
async def create_mesaj(input: MesajCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Mesajlaşma sadece Admin ve SuperAdmin için")
    
    # Eğer alıcı ID varsa, alıcı bilgilerini getir
    alici_adi = None
    if input.aliciId:
        alici = await db.users.find_one({"id": input.aliciId}, {"_id": 0})
        if alici:
            alici_adi = alici.get('name')
    
    mesaj_obj = Mesaj(
        **input.model_dump(),
        gonderenId=current_user.id,
        gonderenAdi=current_user.name,
        gonderenRol=current_user.role,
        aliciAdi=alici_adi
    )
    doc = mesaj_obj.model_dump()
    doc['createdAt'] = doc['createdAt'].isoformat()
    await db.mesajlar.insert_one(doc)
    return mesaj_obj

@api_router.get("/mesajlar/proje/{proje_id}", response_model=List[Mesaj])
async def get_mesajlar_by_proje(proje_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Mesajlar sadece Admin ve SuperAdmin tarafından görüntülenebilir")
    
    mesajlar = await db.mesajlar.find({"projeId": proje_id}, {"_id": 0}).sort("createdAt", 1).to_list(1000)
    for m in mesajlar:
        if isinstance(m.get('createdAt'), str):
            m['createdAt'] = datetime.fromisoformat(m['createdAt'])
    return mesajlar

@api_router.get("/mesajlar", response_model=List[Mesaj])
async def get_all_mesajlar(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Tüm mesajlar sadece SuperAdmin tarafından görüntülenebilir")
    
    mesajlar = await db.mesajlar.find({}, {"_id": 0}).sort("createdAt", -1).to_list(1000)
    for m in mesajlar:
        if isinstance(m.get('createdAt'), str):
            m['createdAt'] = datetime.fromisoformat(m['createdAt'])
    return mesajlar

@api_router.get("/mesajlar/user/{user_id}", response_model=List[Mesaj])
async def get_mesajlar_by_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Erişim reddedildi")
    
    # Kullanıcı ile olan tüm mesajları getir (gönderen veya alıcı olarak)
    mesajlar = await db.mesajlar.find({
        "$or": [
            {"gonderenId": current_user.id, "aliciId": user_id},
            {"gonderenId": user_id, "aliciId": current_user.id}
        ]
    }, {"_id": 0}).sort("createdAt", 1).to_list(1000)
    
    for m in mesajlar:
        if isinstance(m.get('createdAt'), str):
            m['createdAt'] = datetime.fromisoformat(m['createdAt'])
    return mesajlar

@api_router.delete("/mesajlar/{mesaj_id}")
async def delete_mesaj(mesaj_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Mesaj silme sadece SuperAdmin için")
    result = await db.mesajlar.delete_one({"id": mesaj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mesaj bulunamadı")
    return {"message": "Mesaj başarıyla silindi"}

# ==================== REPORTS (RAPORLAR) ====================

@api_router.get("/reports/eksiklik")
async def get_eksiklik_raporu(current_user: User = Depends(get_current_user)):
    """
    OPTIMIZE EDİLDİ: MongoDB aggregation pipeline kullanarak performans iyileştirmesi yapıldı.
    Önceki: 1000 kayıt x 100 kontrol = 100K işlem
    Yeni: Sadece eksik olan kayıtları MongoDB seviyesinde filtreleme
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Bu rapor sadece süper admin tarafından görüntülenebilir")
    
    rapor = {
        "teslim_alinmayanlar": [],
        "beton_dokulmeyen": [],
        "hakedis_yapilmayan": [],
        "evrak_eksikleri": [],
        "hakedis_ihtiyaci": []
    }
    
    # 1. Teslim Alınmayanlar (Optimized: Sadece alinmadi olanlar)
    pipeline = [
        {"$match": {"teslimAlindi": "alinmadi"}},
        {"$project": {
            "_id": 0,
            "insaatIsmi": 1,
            "yibfNo": 1,
            "denetimTarihi": 1,
            "aciklama": "$teslimAlinmamaAciklamasi",
            "kontrolEdilenBolum": 1
        }}
    ]
    rapor["teslim_alinmayanlar"] = await db.site_inspections.aggregate(pipeline).to_list(1000)
    
    # 2. Beton Dökülmeyen (Optimized: Sadece geçmiş ve bekleyen)
    from datetime import date
    bugun = date.today().isoformat()
    pipeline = [
        {"$match": {
            "tip": "saha_denetim",
            "planTarihi": {"$lt": bugun},
            "durum": "beklemede",
            "baslik": {"$regex": "Beton Dökümü", "$options": "i"}
        }},
        {"$project": {
            "_id": 0,
            "baslik": 1,
            "planTarihi": 1,
            "aciklama": 1
        }}
    ]
    rapor["beton_dokulmeyen"] = await db.work_plans.aggregate(pipeline).to_list(1000)
    
    # 3. Hakediş Yapılmayan (Optimized)
    pipeline = [
        {"$match": {
            "tip": "hakedis",
            "planTarihi": {"$lt": bugun},
            "durum": "beklemede"
        }},
        {"$project": {
            "_id": 0,
            "baslik": 1,
            "planTarihi": 1,
            "aciklama": 1
        }}
    ]
    rapor["hakedis_yapilmayan"] = await db.work_plans.aggregate(pipeline).to_list(1000)
    
    # 4. Evrak Eksikleri (Optimized: MongoDB aggregation ile eksikleri hesaplama)
    # Tüm boolean field'ları tek seferde kontrol ediyoruz
    evrak_field_names = {
        "yapiSahibiTapu": "Yapı Sahibi: Tapu veya kaydı",
        "yapiSahibiKimlik": "Yapı Sahibi: Kimlik fotokopileri",
        "yapiSahibiImarDurumu": "Yapı Sahibi: İmar durumu",
        "yapiSahibiResmiAplikasyon": "Yapı Sahibi: Resmî aplikasyon krokisi",
        "yapiSahibiYapiAplikasyon": "Yapı Sahibi: Yapı aplikasyon krokisi",
        "yapiSahibiPlankote": "Yapı Sahibi: Plankote",
        "yapiSahibiTaahhutname": "Yapı Sahibi: Taahhütname Örneği",
        "yapiMuteahhitiSozlesme": "Yapı Müteahhiti: Mal sahibi sözleşmesi",
        "yapiMuteahhitiTaahhutname": "Yapı Müteahhiti: Taahhütname",
        "yapiMuteahhitiTicaretOdasi": "Yapı Müteahhiti: Ticaret odası kayıt belgesi",
        "yapiMuteahhitiVergiLevhasi": "Yapı Müteahhiti: Vergi levhası",
        "yapiMuteahhitiImzaSirkuleri": "Yapı Müteahhiti: İmza sirküleri",
        "yapiMuteahhitiKimlik": "Yapı Müteahhiti: Kimlik fotokopisi",
        "yapiMuteahhitiFaaliyetBelgesi": "Yapı Müteahhiti: Faaliyet belgesi",
        "santiyeSefiIsSozlesmesi": "Şantiye Şefi: İş sözleşmesi",
        "santiyeSefiTaahhutname": "Şantiye Şefi: Taahhütname",
        "santiyeSefiKimlik": "Şantiye Şefi: Kimlik",
        "santiyeSefiImzaBeyani": "Şantiye Şefi: İmza beyani",
        "santiyeSefiDiploma": "Şantiye Şefi: Diploma",
        "santiyeSefiOdaKayit": "Şantiye Şefi: Oda kayıt belgesi",
        "santiyeSefiIkametgah": "Şantiye Şefi: İkametgâh",
        "santiyeSefiIsciSagligi": "Şantiye Şefi: İşçi sağlığı",
        "projeMuellifIkametgah": "Proje Müellifi: İkametgâh",
        "projeMuellifOdaSicil": "Proje Müellifi: Oda sicil belgesi",
        "projeMuellifTcKimlik": "Proje Müellifi: TC Kimlik",
        "projeMuellifTaahhutname": "Proje Müellifi: Taahhütname",
        "belediyeRuhsat": "Belediye: Ruhsat",
        "belediyeIsYeriTeslim": "Belediye: İş yeri teslim tutanağı",
        "belediyeTemelVize": "Belediye: Temel vize",
        "yapiDenetimProjeKontrol": "Yapı Denetim: Proje kontrol raporu",
        "yapiDenetimSeviyeTespit": "Yapı Denetim: Seviye tespit tutanağı",
        "yapiDenetimHakedis": "Yapı Denetim: Hakediş raporu",
        "yapiDenetimLabSonuclari": "Yapı Denetim: Lab sonuçları",
        "yapiDenetimCelikCekme": "Yapı Denetim: Çelik çekme deneyleri",
        "yapiDenetimYdkTutanak": "Yapı Denetim: YDK toplantı tutanağı",
        "yapiDenetimYdkSozlesme": "Yapı Denetim: YDK sözleşmesi",
        "yapiDenetimYdkTaahhutname": "Yapı Denetim: YDK taahhütnamesi",
        "yapiDenetimYdkIsYeri": "Yapı Denetim: YDK iş yeri belgesi",
        "mimariDenetlendi": "Mimari proje denetlenmedi",
        "mimariDijitalArsiv": "Mimari: Dijital arşive girilmedi",
        "statikDenetlendi": "Statik proje denetlenmedi",
        "statikDijitalArsiv": "Statik: Dijital arşive girilmedi",
        "mekanikDenetlendi": "Mekanik proje denetlenmedi",
        "mekanikDijitalArsiv": "Mekanik: Dijital arşive girilmedi",
        "elektrikDenetlendi": "Elektrik proje denetlenmedi",
        "elektrikDijitalArsiv": "Elektrik: Dijital arşive girilmedi",
        "tasDuvarDenetlendi": "Taş duvar proje denetlenmedi",
        "tasDuvarDijitalArsiv": "Taş duvar: Dijital arşive girilmedi",
        "iskeleDenetlendi": "İskele proje denetlenmedi",
        "iskeleDijitalArsiv": "İskele: Dijital arşive girilmedi",
        "zeminEtutDenetlendi": "Zemin etüt proje denetlenmedi",
        "zeminEtutDijitalArsiv": "Zemin etüt: Dijital arşive girilmedi",
        "akustikDenetlendi": "Akustik proje denetlenmedi",
        "akustikDijitalArsiv": "Akustik: Dijital arşive girilmedi"
    }
    
    # Sadece en az bir eksik olan kayıtları çek
    or_conditions = [{"$or": [{field: {"$ne": True}}, {field: {"$exists": False}}]} for field in evrak_field_names.keys()]
    licenses = await db.license_projects.find(
        {"$or": or_conditions},
        {"_id": 0}
    ).to_list(1000)
    
    for license in licenses:
        eksikler = []
        
        # Hızlı eksik kontrolü
        for field, label in evrak_field_names.items():
            if not license.get(field):
                # Onaylanmama nedeni kontrolü (Denetlendi ama Onaylanmadı durumu)
                if field.endswith("Denetlendi") and license.get(field):
                    base_name = field.replace("Denetlendi", "")
                    if not license.get(f"{base_name}Onaylandi"):
                        neden = license.get(f"{base_name}OnaylanmamaNedeni", "Belirtilmemiş")
                        proje_adi = base_name.replace("mimari", "Mimari").replace("statik", "Statik").replace("mekanik", "Mekanik").replace("elektrik", "Elektrik").replace("tasDuvar", "Taş duvar").replace("iskele", "İskele").replace("zeminEtut", "Zemin etüt").replace("akustik", "Akustik")
                        eksikler.append(f"{proje_adi} proje onaylanmadı: {neden}")
                else:
                    eksikler.append(label)
        
        if eksikler:
            rapor["evrak_eksikleri"].append({
                "insaatIsmi": license.get("insaatIsmi"),
                "yibfNo": license.get("yibfNo"),
                "eksikler": eksikler
            })
    
    # 5. Hakediş İhtiyacı (Optimized: Aggregation ile denetim sayısı)
    pipeline = [
        {"$match": {"yapiInsaatAlani": {"$exists": True, "$ne": None}}},
        {"$project": {
            "_id": 0,
            "yibfNo": 1,
            "isBaslik": 1,
            "yapiInsaatAlani": 1
        }}
    ]
    constructions = await db.constructions.aggregate(pipeline).to_list(1000)
    
    for construction in constructions:
        yibf = construction.get("yibfNo")
        m2 = construction.get("yapiInsaatAlani")
        
        if m2:
            try:
                # Saha denetimlerini say (Optimized)
                denetim_sayisi = await db.site_inspections.count_documents({"yibfNo": yibf})
                # Basit ilerleme hesabı (her denetim %2 kabul edelim)
                ilerleme = min(denetim_sayisi * 2, 100)
                
                if ilerleme >= 5:
                    # Son hakediş kontrolü
                    son_hakedis = await db.progress_payments.find_one(
                        {"yibfNo": yibf},
                        sort=[("createdAt", -1)]
                    )
                    
                    if not son_hakedis or ilerleme >= (son_hakedis.get("hakedisYuzdesi", 0) + 5):
                        rapor["hakedis_ihtiyaci"].append({
                            "insaatIsmi": construction.get("isBaslik"),
                            "yibfNo": yibf,
                            "ilerlemeYuzdesi": ilerleme,
                            "sonHakedisYuzdesi": son_hakedis.get("hakedisYuzdesi") if son_hakedis else 0,
                            "denetimSayisi": denetim_sayisi
                        })
            except Exception:
                pass
    
    return rapor

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    inspections_count = await db.site_inspections.count_documents({})
    payments_count = await db.progress_payments.count_documents({})
    licenses_count = await db.license_projects.count_documents({})
    workplans_pending = await db.work_plans.count_documents({"durum": "beklemede"})
    constructions_count = await db.constructions.count_documents({})
    companies_count = await db.companies.count_documents({})
    laboratory_companies = await db.companies.count_documents({"type": "laboratory"})
    concrete_companies = await db.companies.count_documents({"type": "concrete"})
    
    # Son 7 günün denetimleri
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_inspections = await db.site_inspections.count_documents({
        "createdAt": {"$gte": seven_days_ago}
    })
    
    return {
        "total_inspections": inspections_count,
        "total_payments": payments_count,
        "total_licenses": licenses_count,
        "pending_workplans": workplans_pending,
        "recent_inspections": recent_inspections,
        "total_constructions": constructions_count,
        "total_companies": companies_count,
        "laboratory_companies": laboratory_companies,
        "concrete_companies": concrete_companies
    }

# Include router
app.include_router(api_router)

cors_origins = os.environ.get('CORS_ORIGINS', '*').split(',')
if '*' in cors_origins:
    logger.warning("⚠️  WARNING: CORS is open to all origins! Restrict this in production!")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown"""
    client.close()
    logger.info("MongoDB connection closed")