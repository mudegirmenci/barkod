# 📱 EsnafPOS - Barkodlu Hızlı Satış, Fiyat Araştırma ve Stok Yönetimi (PWA)

Küçük esnaflar, bakkallar ve perakende işletmeler için geliştirilmiş, **Progressive Web App (PWA)** standartlarında tam teşekküllü mobil ve masaüstü satış & stok yönetim sistemi.

---

## 🚀 Öne Çıkan Özellikler

1. **🔐 Güvenlik ve Kimlik Doğrulama (NextAuth.js)**
   - Yalnızca **Google ile Giriş** (Google Provider) desteği.
   - Sayfa düzeyinde yetkilendirme: Giriş yapmayan kullanıcılar korumalı sayfalara erişemez.
   - Hassas değişkenler kod tabanında yer almaz, `.env` üzerinden yönetilir.

2. **📲 Mobil Cihazlardan Doğrudan Erişim & PWA**
   - Telefon ve tabletlere mobil uygulama gibi kurulabilir (Android Chrome / iOS Safari).
   - `0.0.0.0` dinleme desteği sayesinde aynı Wi-Fi ağındaki telefonlardan anında açılabilir.
   - Standalone modda tam ekran çalışma, çevrimdışı önbellekleme desteği (`sw.js` ve `manifest.json`).

3. **📷 Telefon Kamerası ile Barkod Okuma & Bip Sesi**
   - Hem telefonun **arka (ana) kamerası** hem de ön kamera desteği (tek tıkla kamera değiştirme).
   - Barkod okunduğunda kasadaki gibi sesli **bip** bildirimi.
   - İster telefon kamerasıyla, ister USB/Bluetooth el tipi barkod tabancasıyla okutma.

4. **💾 İndirilebilir Veritabanı Yedeği & Geri Yükleme (`/yedek`)**
   - **Yedek İndir:** Tüm ürünleri, stokları ve satış fişlerini tek tıkla `.json` dosyası olarak bilgisayar veya telefona indirir.
   - **Yedeği Geri Yükle:** Alınan yedekleri veya **başka bir kullanıcının/cihazın oluşturduğu veritabanını** kolayca sisteme yükler.
   - İki yükleme modu:
     * *Birleştir & Güncelle (Merge):* Mevcut verileri korur, yeni olanları ekler.
     * *Sıfırla & Yükle (Replace):* Veritabanını temizleyip yedekten tertemiz yükler.

5. **⚡ Otomatik %40 Kâr Önerisi**
   - Pazar yerlerinden (Cimri, Trendyol, Akakçe vb.) 5 fiyat çekildiğinde veya bir satış fiyatı seçildiğinde, alış fiyatı **yüzde 40 kâr** sağlayacak şekilde otomatik hesaplanıp önerilir (`Alış = Satış / 1.40`).
   - Esnaf dilediği zaman bu fiyatı elle değiştirebilir veya tek tıkla *"⚡ %40 Kâr Önerisi Uygula"* diyebilir.

6. **📊 PostgreSQL & Prisma ORM Mimarisi**
   - `Product`: Barkod (benzersiz), ürün adı, alış fiyatı, satış fiyatı, stok (varsayılan 500), ürün görseli.
   - `Sale`: Toplam ciro, toplam kâr ve zaman damgası.
   - `SaleItem`: Satış fişindeki her kalemin adedi, satış anındaki satış ve alış fiyatı.

7. **⚡ Hızlı Satış & POS Kasası (`/pos`)**
   - Kasada peş peşe barkod okutma (aynı barkod okutulduğunda adet otomatik artar).
   - Sepet tutarı, kâr oranı ve adetler anlık güncellenir.
   - **Satışı Tamamla:** **Prisma Transaction** güvencesiyle tek hamlede stoktan düşer ve `Sale` / `SaleItem` tablolarına kâr/ciro analitiği ile kaydeder.

8. **📈 Dashboard & Kritik Stok Uyarıları**
   - **Kritik Stok Uyarısı:** Stoğu 10 ve altında kalan ürünler kırmızı uyarı listesinde listelenir.
   - **Metrik Kartları:** Günlük/Haftalık toplam ciro ve net kâr raporu.

---

## 📱 Uygulamayı Cep Telefonundan Açma (Yerel Ağda)

Uygulama `0.0.0.0` üzerinden yayına hazırlandığı için bilgisayarınız ve telefonunuz aynı Wi-Fi ağına bağlıyken:

1. Bilgisayarınızda terminalden projeyi başlatın:
   ```bash
   npm run dev
   ```
2. Telefonunuzun tarayıcısını (Chrome/Safari) açın ve bilgisayarınızın yerel IP adresini girin:
   ```
   http://10.191.26.53:3000
   ```
   *(Kendi yerel IP adresinizi `ipconfig` komutu ile görebilirsiniz).*
3. Tarayıcı menüsünden **"Ana Ekrana Ekle"** veya **"Uygulamayı Yükle"** butonuna basarak telefonunuza uygulama olarak yükleyin.
4. Telefon kamerasını açarak dilediğiniz ürün barkodunu tarayın!

---

## 🛠️ Kurulum Adımları

### 1. Depoyu İndirin ve Bağımlılıkları Yükleyin
```bash
git clone https://github.com/KULLANICI_ADINIZ/barkod.git
cd barkod
npm install
```

### 2. Ortam Değişkenlerini Yapılandırın (`.env`)
Proje kök dizinindeki `.env` dosyasını açın:

```env
# PostgreSQL Veritabanı Bağlantı Adresi
DATABASE_URL="postgresql://postgres:password@localhost:5432/barkod_db?schema=public"

# NextAuth Ayarları
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="guclu-ve-rastgele-bir-secret-anahtar"

# Google Cloud Console OAuth Kimlik Bilgileri
GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
```

### 3. Veritabanını Oluşturun ve Örnek Ürünleri Yükleyin
```bash
# Şemayı PostgreSQL veritabanına uygulayın
npm run db:push

# Örnek ürünleri yükleyin
npm run db:seed
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

---

## ☁️ Vercel & GitHub Dağıtımı

```bash
git add .
git commit -m "feat: EsnafPOS PWA"
git remote add origin https://github.com/KULLANICI_ADINIZ/barkod.git
git push -u origin master
```
Vercel paneline gidip depoyu bağlayın ve `.env` değişkenlerini tanımlayın.
