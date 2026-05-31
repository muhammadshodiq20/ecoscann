# 🚀 Panduan Deploy EcoScan ke Internet (GRATIS)

## Persiapan Awal

### 1. Install yang dibutuhkan
```bash
# Node.js v18+ → https://nodejs.org
# Python 3.9+  → https://python.org
# Git           → https://git-scm.com
# Akun GitHub  → https://github.com (gratis)
```

### 2. Clone & setup lokal dulu
```bash
git clone https://github.com/NAMAKAMU/ecoscan.git
cd ecoscan
npm run install:all

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Edit backend/.env
```
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/ecoscan
JWT_SECRET=BUAT_STRING_PANJANG_64_KARAKTER_DI_SINI
FRONTEND_URL=https://ecoscan-app.vercel.app
```

### 4. Test lokal
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

---

## Deploy MongoDB Atlas (Database Gratis)

1. Buka https://mongodb.com/atlas → Sign Up gratis
2. Buat cluster → Pilih **M0 Free** (512MB gratis selamanya)
3. Database Access → Add user → buat username & password
4. Network Access → Add IP → **Allow from anywhere** (0.0.0.0/0)
5. Connect → Compass → Copy connection string
6. Ganti `<password>` dengan password user yang dibuat
7. Paste ke `MONGO_URI` di .env

---

## Deploy Frontend ke Vercel (GRATIS)

```bash
# Install Vercel CLI
npm i -g vercel

# Di folder ecoscan/frontend
cd frontend
npm run build

# Deploy
vercel

# Ikuti prompt:
# Set up and deploy? Y
# Which scope? pilih akun kamu
# Link to existing project? N
# Project name: ecoscan-app
# Directory: ./
# Override settings? N

# ✅ Dapat domain: https://ecoscan-app.vercel.app
```

### Set Environment Variable di Vercel
1. Buka https://vercel.com/dashboard
2. Klik project ecoscan-app → Settings → Environment Variables
3. Tambahkan: `VITE_API_URL` = `https://ecoscan-api.railway.app`
4. Redeploy

---

## Deploy Backend ke Railway (GRATIS — $5 credit/bulan)

1. Buka https://railway.app → Sign Up dengan GitHub
2. New Project → Deploy from GitHub Repo
3. Pilih folder `backend` sebagai root
4. Railway otomatis deteksi Node.js
5. Add Variables (Settings → Variables):
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=string_panjang_kamu
   FRONTEND_URL=https://ecoscan-app.vercel.app
   NODE_ENV=production
   PORT=3001
   ```
6. Settings → Networking → Generate Domain
7. ✅ Dapat domain: `https://ecoscan-api.railway.app`

---

## Deploy AI Service ke HuggingFace Spaces (GRATIS)

1. Buka https://huggingface.co → Sign Up gratis
2. New Space → Name: ecoscan-ai → SDK: **Docker**
3. Upload isi folder `ai-service/`
4. Buat file `Dockerfile` di ai-service/:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

5. ✅ Dapat domain: `https://NAMAUSER-ecoscan-ai.hf.space`
6. Update `AI_SERVICE_URL` di backend Railway

---

## Deploy Dashboard ke Streamlit Cloud (GRATIS)

1. Buka https://share.streamlit.io → Login dengan GitHub
2. New App → Repo: github.com/NAMAKAMU/ecoscan
3. Branch: main → Main file path: `data-dashboard/app.py`
4. Deploy!
5. ✅ Dapat domain: `https://NAMAUSER-ecoscan.streamlit.app`

---

## Domain Kustom (Opsional, ~Rp150rb/tahun)

1. Beli domain di Niagahoster/Domainesia: misal `ecoscan.id`
2. Di Vercel: Settings → Domains → Add `ecoscan.id`
3. Di Niagahoster: DNS → Tambah CNAME record → `cname.vercel-dns.com`
4. Tunggu propagasi 5-30 menit
5. ✅ Aplikasi bisa diakses di `https://ecoscan.id`

---

## Ringkasan Domain Gratis

| Layanan | Platform | Domain |
|---------|----------|--------|
| Frontend | Vercel | `ecoscan-app.vercel.app` |
| Backend API | Railway | `ecoscan-api.railway.app` |
| AI Service | HuggingFace | `user-ecoscan-ai.hf.space` |
| Dashboard | Streamlit | `user-ecoscan.streamlit.app` |

**Semua HTTPS otomatis, tanpa biaya!** 🎉

---

## Checklist Keamanan Sebelum Go Live

- [ ] JWT_SECRET sudah diganti (minimal 64 karakter random)
- [ ] .env TIDAK ada di GitHub (cek .gitignore)
- [ ] CORS hanya mengizinkan domain frontend yang benar
- [ ] MongoDB Atlas Network Access sudah dikonfigurasi
- [ ] Rate limiting aktif di backend
- [ ] Helmet.js aktif
- [ ] HTTPS aktif (otomatis di semua platform di atas)
