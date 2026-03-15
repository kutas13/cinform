# 🇨🇳 CinPanel - Next.js

**Vercel uyumlu Çin vize başvuru yönetim sistemi**

## 🚀 **Özellikler**

- ✅ **Modern Stack:** Next.js 14 + TypeScript + Tailwind CSS
- ✅ **Database:** Supabase (PostgreSQL + Auth)
- ✅ **Authentication:** Supabase Auth
- ✅ **API:** RESTful endpoints
- ✅ **UI:** Responsive admin panel
- ✅ **Security:** Row Level Security (RLS)
- ✅ **Deploy:** Vercel ready

## 📦 **Kurulum**

### 1️⃣ **Proje Kurulumu**
```bash
cd nextjs-visa-panel
npm install
```

### 2️⃣ **Supabase Kurulumu**
1. Supabase projesi oluştur
2. `supabase-schema.sql` dosyasını SQL Editor'de çalıştır
3. Authentication'u etkinleştir

### 3️⃣ **Environment Variables**
`.env.local` dosyası oluştur:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4️⃣ **Development**
```bash
npm run dev
# http://localhost:3000
```

### 5️⃣ **Vercel Deploy**
```bash
vercel --prod
# veya GitHub ile otomatik deploy
```

## 🎯 **Kullanım**

### **📊 Dashboard**
- İstatistik kartları
- 4 ana işlem butonu
- Hızlı erişim linkleri

### **🏢 Şirket Yönetimi**
- **Çinli Şirketler:** Davet eden firma bilgileri
- **Türk Şirketler:** Sponsor firma bilgileri

### **👥 Müşteri Yönetimi**
- Kişisel bilgiler (ad, TC, pasaport)
- İletişim bilgileri
- Aile bilgileri
- Eğitim bilgileri

### **📝 Form Oluşturma**
- Müşteri + şirket eşleştirmesi
- Seyahat tarihleri
- Vize türü
- **Otomatik access token** üretimi

## 🔌 **API Endpoints**

### **GET /api/forms/[token]**

**Request:**
```
GET https://your-domain.vercel.app/api/forms/fv_abc123...
```

**Response:**
```json
{
  "form_id": "uuid",
  "customer": {
    "full_name": "Yusuf Kutas",
    "tc_number": "12345678901",
    "birth_city": "Istanbul",
    "marital_status": "Single",
    "passport_issue_place": "Istanbul"
  },
  "chinese_company": {
    "company_name": "Beijing Trading Co.",
    "inviter_name": "Li Wei"
  },
  "turkish_company": {
    "company_name": "Istanbul Export A.Ş.",
    "sponsor": "Ahmet Yılmaz"
  },
  "form": {
    "travel_start_date": "2024-06-01",
    "travel_end_date": "2024-06-15",
    "visa_type": "Business",
    "access_token": "fv_abc123..."
  }
}
```

## 🗄️ **Database Schema**

### **Tablolar:**
- `profiles` - Kullanıcı profilleri
- `customers` - Müşteri bilgileri
- `chinese_companies` - Çinli şirketler
- `turkish_companies` - Türk şirketler
- `forms` - Vize formları (access token ile)

### **Güvenlik:**
- Row Level Security (RLS) aktif
- Kullanıcılar sadece kendi verilerini görebilir
- API endpoint public (token bazlı erişim)

## 🛡️ **Güvenlik**

- ✅ **Authentication:** Supabase Auth
- ✅ **Authorization:** RLS policies
- ✅ **CORS:** Chrome extension için yapılandırıldı
- ✅ **Input Validation:** Zod + React Hook Form
- ✅ **SQL Injection:** Supabase ORM koruması

## 🎨 **UI/UX**

- ✅ **Modern Design:** Tailwind CSS
- ✅ **Responsive:** Mobile-first
- ✅ **Animations:** Smooth transitions
- ✅ **Toast Notifications:** Real-time feedback
- ✅ **Loading States:** UX friendly

## 📱 **Responsive Tasarım**

- **Desktop:** Full featured admin panel
- **Tablet:** Optimized layouts
- **Mobile:** Touch-friendly interface

## 🔧 **Development**

### **Scripts:**
```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint check
npm run type-check # TypeScript check
```

### **Folder Structure:**
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── customers/         # Customer pages
│   ├── forms/            # Form pages
│   └── login/            # Auth pages
├── components/           # React components
├── lib/                 # Utilities
└── types/              # TypeScript types
```

## 🌐 **Production Deployment**

### **Vercel Deploy:**
1. GitHub'a push yap
2. Vercel'e import et
3. Environment variables ekle
4. Deploy!

### **Environment Variables (Production):**
```env
NEXT_PUBLIC_SUPABASE_URL=your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

## 🎯 **Chrome Extension Entegrasyonu**

1. Form oluştur
2. Access token'ı kopyala
3. Chrome extension'da token'ı kullan
4. API otomatik olarak form verilerini döner

## 🐛 **Troubleshooting**

### **Common Issues:**

**Build Errors:**
```bash
npm run type-check  # TypeScript hatalarını kontrol et
```

**Database Errors:**
- Supabase RLS policy'lerini kontrol et
- API key'lerin doğru olduğunu kontrol et

**API Errors:**
- CORS ayarlarını kontrol et
- Network tab'ında response'u kontrol et

## 📞 **Support**

- Documentation: Bu README
- Logs: Vercel Dashboard
- Database: Supabase Dashboard

---

**🎉 Production-ready Next.js visa management system!**