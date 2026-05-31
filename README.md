# 🌿 EcoScan — Aplikasi Pilah Sampah Cerdas

## Cara Menjalankan (Lokal)

### Prasyarat
- Node.js v18+
- Python 3.9+
- MongoDB (lokal atau Atlas gratis)

### 1. Clone & Install

```bash
# Install semua dependencies sekaligus
npm run install:all
```

### 2. Setup Environment

```bash
# Copy file env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit sesuai kebutuhan
```

### 3. Jalankan Semua Service

```bash
# Jalankan backend + frontend sekaligus
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3001  
AI Service: http://localhost:8000  

---

## Deploy Gratis

| Service | Platform | Domain |
|---------|----------|--------|
| Frontend | Vercel | ecoscan-app.vercel.app |
| Backend | Railway | ecoscan-api.railway.app |
| AI Service | HuggingFace Spaces | user-ecoscan.hf.space |
| Dashboard | Streamlit Cloud | ecoscan.streamlit.app |

Lihat panduan lengkap di bagian bawah dokumen ini.
