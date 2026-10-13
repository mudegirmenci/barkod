# 📱 EsnafPOS - Barkodlu Hızlı Satış, Fiyat Araştırma ve Stok Yönetimi (PWA)

Küçük esnaflar, bakkallar ve perakende işletmeler için geliştirilmiş, **Progressive Web App (PWA)** standartlarında tam teşekküllü mobil ve masaüstü satış & stok yönetim sistemi.

---

## 🚀 Öne Çıkan Özellikler

1. **🔐 Güvenlik ve Kimlik Doğrulama (NextAuth.js)**
   - Yalnızca **Google ile Giriş** (Google Provider) desteği.
   - Sayfa düzeyinde yetkilendirme: Giriş yapmayan kullanıcılar korumalı sayfalara erişemez.
   - Hassas değişkenler kod tabanında yer almaz, `.env` üzerinden yönetilir.

2. **📲 PWA (Progressive Web App) Desteği**
   - Telefon ve tabletlere mobil uygulama gibi yüklenebilir (Android Chrome / iOS Safari).
   - Standalone modda tam ekran çalışma, çevrimdışı önbellekleme desteği (`sw.js` ve `manifest.json`).

3. **📊 PostgreSQL & Prisma ORM Mimarisi**
   - `Product`: Barkod (benzersiz), ürün adı, alış fiyatı, satış fiyatı, stok (varsayılan 500), ürün görseli.
   - `Sale`: Toplam ciro, toplam kâr ve zaman damgası.
   - `SaleItem`: Satış fişindeki her kalemin adedi, satış anındaki satış ve alış fiyatı.

4. **🔍 Barkodlu Ürün Sorgulama & Türkiye Pazar Yerleri Fiyat Robotu**
   - Kamera (HTML5-QRCode) veya el tipi **barkod okuma tabancası** ile anında tarama.
   - **Veritabanında Varsa:** Mevcut ürün ve stok bilgileri anında gelir.
   - **Veritabanında Yoksa:** Türkiye yerel pazar yerlerinden (**Cimri, Trendyol, Hepsiburada, Akakçe, PttAVM**) güncel 5 fiyat çekilir.
   - Fiyatlar **en yüksekten en düşüğe** sıralanır.
   - Esnaf 5 fiyattan birini tek tıkla seçebilir veya elle belirleyebilir.
   - Net kâr hesabı için **Alış Fiyatı** girilir; stok miktarı varsayılan 500 olarak gelir ve düzenlenebilir.

5. **⚡ Hızlı Satış & Kasa Modülü (POS Ekranı)**
   - Kasada peş peşe barkod okutma (aynı barkod okutulduğunda adet otomatik artar).
   - Sepet tutarı, kâr oranı ve adetler anlık güncellenir.
   - **Satışı Tamamla:** **Prisma Transaction** güvencesiyle tek hamlede stoktan düşer ve `Sale` / `SaleItem` tablolarına kâr/ciro analitiği ile kaydeder.

6. **📈 Dashboard (Kontrol Paneli) & Kritik Stok Uyarıları**
   - **Kritik Stok Uyarısı:** Stoğu 10 ve altında kalan ürünler kırmızı uyarı listesinde listelenir.
   - **Metrik Kartları:** Günlük/Haftalık toplam ciro ve net kâr raporu.
   - Son satış fişleri ve kalem dökümü.

---

## 🛠️ Kurulum Adımları

### 1. Depoyu İndirin ve Bağımlılıkları Yükleyin
```bash
git clone https://github.com/KULLANICI_ADINIZ/barkod.git
cd barkod
npm install
```

### 2. Ortam Değişkenlerini Yapılandırın (`.env`)
Proje kök dizinindeki `.env` dosyasını açın veya `.env.example` dosyasından kopyalayın:

```env
# PostgreSQL Veritabanı Bağlantı Adresi (Örn: Supabase, Neon, Railway veya Yerel PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/barkod_db?schema=public"

# NextAuth Ayarları
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="guclu-ve-rastgele-bir-secret-anahtar-olusturun"

# Google Cloud Console OAuth Kimlik Bilgileri
GOOGLE_CLIENT_ID="xxxx-xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
```

> **Google OAuth Kurulumu:**
> 1. [Google Cloud Console](https://console.cloud.google.com/)'a gidin.
> 2. Yeni proje oluşturun ve **OAuth consent screen** ayarlarını tamamlayın.
> 3. **Credentials > Create Credentials > OAuth client ID** adımlarını izleyin.
> 4. Application type: **Web application** seçin.
> 5. **Authorized redirect URIs** alanına `http://localhost:3000/api/auth/callback/google` (ve canlıya alınca Vercel domaininizi) ekleyin.

### 3. Veritabanı Tablolarını Oluşturun ve Örnek Verileri Yükleyin
```bash
# Prisma şemasını veritabanına uygulayın
npx prisma db push

# (Opsiyonel) Örnek Türkiye perakende ürünlerini veritabanına tohumlayın
npm run db:seed
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

---

## 📱 PWA Olarak Telefona / Tablete Kurulum

1. **Android (Chrome):** Siteye girdiğinizde altta çıkan *"Ana Ekrana Ekle"* veya menüdeki *"Uygulamayı Yükle"* butonuna dokunun.
2. **iOS (Safari):** Paylaş butonuna dokunun ve *"Ana Ekrana Ekle"* seçeneğini seçin.
3. Uygulama, cihazınızda tıpkı yerel bir mobil uygulama gibi simgesiyle açılacaktır.

---

## ☁️ Vercel & GitHub Dağıtımı (Deployment)

1. Projeyi GitHub'a gönderin:
   ```bash
   git init
   git add .
   git commit -m "feat: EsnafPOS PWA ilk sürüm"
   git remote add origin https://github.com/KULLANICI_ADINIZ/barkod.git
   git push -u origin main
   ```
2. [Vercel](https://vercel.com) paneline gidin, GitHub deponuzu seçin.
3. **Environment Variables** bölümüne `.env` içindeki değişkenleri (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) ekleyin.
4. **Deploy** butonuna basın.
