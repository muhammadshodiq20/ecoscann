"""
EcoScan AI Service — FastAPI + TensorFlow
Jalankan: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import os

app = FastAPI(title="EcoScan AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Konfigurasi ──────────────────────────────────────────────────
CLASSES = ['plastik', 'organik', 'kertas', 'logam', 'kaca', 'b3', 'elektronik', 'tekstil']
IMG_SIZE = (224, 224)

CARBON_MAP = {
    'plastik': 1.8, 'organik': 0.3, 'kertas': 0.9,
    'logam': 2.1, 'kaca': 0.6, 'b3': 3.5,
    'elektronik': 4.2, 'tekstil': 1.2
}

STEPS_MAP = {
    'plastik': [
        'Cuci bersih dari sisa makanan',
        'Pisahkan tutup botol dan label jika mudah',
        'Kumpulkan di bank sampah atau drop box daur ulang'
    ],
    'organik': [
        'Pisahkan dari sampah anorganik di tempat sampah hijau',
        'Bisa dijadikan kompos rumahan',
        'Campurkan 1:1 dengan daun kering, aduk tiap 3 hari'
    ],
    'kertas': [
        'Pastikan tidak terlalu kotor atau berminyak',
        'Lipat dan kumpulkan menjadi bundel',
        'Setor ke pengepul kertas bekas atau bank sampah'
    ],
    'logam': [
        'Bilas kaleng atau wadah logam dari sisa makanan',
        'Gepengkan untuk menghemat tempat penyimpanan',
        'Setor ke bank sampah atau pengepul besi tua'
    ],
    'kaca': [
        'Cuci bersih botol atau pecahan kaca',
        'Bungkus pecahan kaca dengan beberapa lapis koran',
        'Setor ke bank sampah khusus kaca atau pengepul'
    ],
    'b3': [
        'JANGAN buang ke tempat sampah rumah tangga biasa!',
        'Simpan di wadah tertutup rapat yang aman',
        'Setor ke drop point B3 DLHK setempat atau pabrik produsen'
    ],
    'elektronik': [
        'Jangan dibuang sembarangan karena mengandung logam berat',
        'Bawa ke toko elektronik yang punya program take-back',
        'Atau setor ke bank sampah elektronik terdekat'
    ],
    'tekstil': [
        'Jika masih layak pakai, donasikan ke lembaga sosial',
        'Jika sudah rusak, potong sebagai lap atau bahan kerajinan',
        'Setor ke drop box tekstil daur ulang di pusat perbelanjaan'
    ]
}

TIPS_MAP = {
    'plastik': '♻️ Botol PET bisa jadi serat pakaian daur ulang! 1 kg plastik = hemat 1.5 kg CO₂',
    'organik': '🌱 1 kg sampah organik menghasilkan ~0.5 kg kompos berkualitas tinggi',
    'kertas': '🌳 Mendaur ulang 1 ton kertas menyelamatkan 17 pohon!',
    'logam': '⚡ Aluminium bisa didaur ulang 100% tanpa kehilangan kualitas',
    'kaca': '✨ Kaca bisa didaur ulang tanpa batas dan tanpa kehilangan kemurnian',
    'b3': '⚠️ Satu baterai bekas bisa mencemari 400.000 liter air tanah!',
    'elektronik': '📱 Produksi 1 HP baru = ~70 kg CO₂. Perbaiki dulu sebelum beli baru!',
    'tekstil': '👕 Industri tekstil = 10% emisi CO₂ global. Pakai lebih lama, buang lebih sedikit!'
}

# ─── Load Model ───────────────────────────────────────────────────
model = None

def load_model():
    global model
    model_path = os.getenv('MODEL_PATH', 'model/ecoscan_model.keras')
    if os.path.exists(model_path):
        try:
            import tensorflow as tf
            model = tf.keras.models.load_model(model_path)
            print(f"✅ Model dimuat dari {model_path}")
        except Exception as e:
            print(f"⚠️  Gagal memuat model: {e}")
            print("ℹ️  Menggunakan mode simulasi")
    else:
        print(f"⚠️  Model tidak ditemukan di {model_path}")
        print("ℹ️  Menggunakan mode simulasi (random prediction)")

load_model()

# ─── Preprocessing ────────────────────────────────────────────────
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32) / 255.0
    return np.expand_dims(arr, axis=0)

# ─── Endpoints ────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "EcoScan AI",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "classes": CLASSES
    }

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Validasi file
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")

    image_bytes = await file.read()
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran gambar maksimal 5MB")

    try:
        img_array = preprocess_image(image_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Gagal memproses gambar. Pastikan format valid.")

    if model is not None:
        # Prediksi dengan model TensorFlow
        predictions = model.predict(img_array, verbose=0)
        class_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][class_idx]) * 100
    else:
        # Mode simulasi — acak tapi deterministik berdasarkan hash gambar
        hash_val = sum(image_bytes[:100]) % len(CLASSES)
        class_idx = hash_val
        confidence = float(np.random.uniform(82, 97))

    waste_class = CLASSES[class_idx]

    return {
        "class": waste_class,
        "confidence": round(confidence, 1),
        "carbon_score": CARBON_MAP[waste_class],
        "steps": STEPS_MAP[waste_class],
        "tips": TIPS_MAP[waste_class],
        "all_predictions": {
            CLASSES[i]: round(float(
                predictions[0][i] if model is not None
                else (0.8 if i == class_idx else np.random.uniform(0, 0.1))
            ) * 100, 2)
            for i in range(len(CLASSES))
        } if model is not None else None
    }

@app.post("/predict-batch")
async def predict_batch(files: list[UploadFile] = File(...)):
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maksimal 10 gambar per batch")
    results = []
    for file in files:
        image_bytes = await file.read()
        try:
            img_array = preprocess_image(image_bytes)
            if model is not None:
                preds = model.predict(img_array, verbose=0)
                class_idx = int(np.argmax(preds[0]))
                confidence = float(preds[0][class_idx]) * 100
            else:
                class_idx = sum(image_bytes[:100]) % len(CLASSES)
                confidence = float(np.random.uniform(82, 97))
            waste_class = CLASSES[class_idx]
            results.append({
                "filename": file.filename,
                "class": waste_class,
                "confidence": round(confidence, 1),
                "carbon_score": CARBON_MAP[waste_class]
            })
        except Exception as e:
            results.append({"filename": file.filename, "error": str(e)})
    return {"results": results}
