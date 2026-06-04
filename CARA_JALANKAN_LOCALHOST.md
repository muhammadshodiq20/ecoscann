# 🌿 EcoScan — Cara Menjalankan di Localhost

## Syarat yang Harus Ada di Laptop
- Node.js v18+ → download di nodejs.org
- Git → download di git-scm.com

---

## LANGKAH 1 — Siapkan file .env Backend

Buka folder `backend/` → buat file baru bernama `.env` → isi:

```
MONGO_URI=mongodb://cliperdalamshirath_db_user:12344321@ac-nm46npr-shard-00-00.nfxaivt.mongodb.net:27017,ac-nm46npr-shard-00-01.nfxaivt.mongodb.net:27017,ac-nm46npr-shard-00-02.nfxaivt.mongodb.net:27017/ecoscan?ssl=true&replicaSet=atlas-hanz6w-shard-0&authSource=admin
JWT_SECRET=p8K2mN9xQ4vL7wR1jY6uT3sA5dF0gH8iB
AI_SERVICE_URL=https://byuuuu-ecoscan-api.hf.space
FRONTEND_URL=http://localhost:5173
PORT=3002
NODE_ENV=development
```

---

## LANGKAH 2 — Jalankan Backend

Buka **Terminal/CMD pertama** → masuk ke folder backend:

```bash
cd ecoscan-main/backend
npm install
node server.js
```

Harus muncul:
```
🚀 EcoScan backend berjalan di http://localhost:3002
✅ MongoDB terhubung
```

---

## LANGKAH 3 — Siapkan file .env Frontend

Buka folder `frontend/` → buat file baru bernama `.env` → isi:

```
VITE_API_URL=http://localhost:3002
```

---

## LANGKAH 4 — Jalankan Frontend

Buka **Terminal/CMD kedua** (jangan tutup yang pertama) → masuk ke folder frontend:

```bash
cd ecoscan-main/frontend
npm install
npm run dev
```

Harus muncul:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## LANGKAH 5 — Buka di Browser

Buka browser → ketik: **http://localhost:5173**

Harus muncul halaman Landing Page EcoScan 🌿

---

## Troubleshooting

| Error | Solusi |
|---|---|
| `EADDRINUSE port 3002` | Port sudah dipakai — jalankan: `npx kill-port 3002` |
| `MongoDB connection failed` | Cek MONGO_URI di .env backend, pastikan tidak ada spasi |
| `Cannot find module` | Jalankan `npm install` dulu di folder yang error |
| Halaman putih / blank | Buka DevTools (F12) → Console → screenshot error ke Claude |
| Login gagal network error | Pastikan backend sudah jalan di port 3002 |

---

## Struktur Terminal yang Benar

```
Terminal 1 (backend):          Terminal 2 (frontend):
cd backend                     cd frontend
npm install                    npm install
node server.js                 npm run dev
                               
🚀 Running on :3002  ←——→  http://localhost:5173
✅ MongoDB terhubung
```

---

Kalau tampilan sudah bagus di localhost → push ke GitHub dengan:
```bash
git add .
git commit -m "feat: landing page, leaderboard, tips, badge"
git push
```
