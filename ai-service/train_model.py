"""
EcoScan — Training Model TensorFlow
Jalankan: python train_model.py

Dataset yang direkomendasikan:
- TrashNet: https://github.com/garythung/trashnet
- Kaggle Garbage Classification: https://www.kaggle.com/asdasdasasdas/garbage-classification
"""
import tensorflow as tf
from tensorflow.keras import layers, Model, callbacks
import numpy as np
import os

# ─── Konfigurasi ──────────────────────────────────────────────────
CLASSES = ['plastik', 'organik', 'kertas', 'logam', 'kaca', 'b3', 'elektronik', 'tekstil']
NUM_CLASSES = len(CLASSES)
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 1e-4
DATA_DIR = 'dataset'        # Letakkan dataset di sini
MODEL_SAVE_PATH = 'model/ecoscan_model.keras'

os.makedirs('model', exist_ok=True)
os.makedirs('logs', exist_ok=True)

# ─── Custom Layer (memenuhi syarat Side Quest AI) ──────────────────
class ChannelAttention(layers.Layer):
    """Custom channel attention layer untuk meningkatkan fitur penting"""
    def __init__(self, ratio=8, **kwargs):
        super().__init__(**kwargs)
        self.ratio = ratio

    def build(self, input_shape):
        channels = input_shape[-1]
        self.avg_pool = layers.GlobalAveragePooling2D()
        self.max_pool = layers.GlobalMaxPooling2D()
        self.fc1 = layers.Dense(channels // self.ratio, activation='relu')
        self.fc2 = layers.Dense(channels, activation='sigmoid')

    def call(self, inputs):
        avg = self.fc2(self.fc1(self.avg_pool(inputs)))
        mx = self.fc2(self.fc1(self.max_pool(inputs)))
        attention = layers.Add()([avg, mx])
        return inputs * tf.reshape(attention, (-1, 1, 1, attention.shape[-1]))

    def get_config(self):
        config = super().get_config()
        config.update({'ratio': self.ratio})
        return config

# ─── Custom Loss Function (memenuhi syarat Main Quest AI) ─────────
class FocalLoss(tf.keras.losses.Loss):
    """Focal loss untuk menangani class imbalance"""
    def __init__(self, gamma=2.0, alpha=0.25, **kwargs):
        super().__init__(**kwargs)
        self.gamma = gamma
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_pred = tf.clip_by_value(y_pred, 1e-7, 1 - 1e-7)
        ce = -y_true * tf.math.log(y_pred)
        p_t = tf.reduce_sum(y_true * y_pred, axis=-1, keepdims=True)
        focal_weight = self.alpha * tf.pow(1 - p_t, self.gamma)
        return tf.reduce_mean(focal_weight * tf.reduce_sum(ce, axis=-1))

    def get_config(self):
        config = super().get_config()
        config.update({'gamma': self.gamma, 'alpha': self.alpha})
        return config

# ─── Custom Callback (memenuhi syarat Main Quest AI) ──────────────
class EcoScanCallback(callbacks.Callback):
    """Callback kustom: simpan model terbaik + notifikasi"""
    def __init__(self, target_accuracy=0.85):
        super().__init__()
        self.target_accuracy = target_accuracy
        self.best_acc = 0

    def on_epoch_end(self, epoch, logs=None):
        val_acc = logs.get('val_accuracy', 0)
        if val_acc > self.best_acc:
            self.best_acc = val_acc
            print(f"\n✅ Model terbaik baru! Akurasi validasi: {val_acc:.4f}")
        if val_acc >= self.target_accuracy:
            print(f"\n🎯 Target akurasi {self.target_accuracy} tercapai di epoch {epoch+1}!")

# ─── Build Model (Functional API) ─────────────────────────────────
def build_model():
    base = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=(*IMG_SIZE, 3)
    )
    # Freeze base layers awal
    for layer in base.layers[:-30]:
        layer.trainable = False

    inputs = layers.Input(shape=(*IMG_SIZE, 3))
    x = tf.keras.applications.efficientnet.preprocess_input(inputs)
    x = base(x, training=False)

    # Custom attention
    x = ChannelAttention(ratio=8)(x)

    x = layers.GlobalAveragePooling2D()(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dense(512, activation='relu')(x)
    x = layers.Dropout(0.4)(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)

    return Model(inputs=inputs, outputs=outputs, name='EcoScan_Classifier')

# ─── Data Pipeline ────────────────────────────────────────────────
def build_dataset():
    train_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(DATA_DIR, 'train'),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='categorical',
        class_names=CLASSES,
        shuffle=True,
        seed=42
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        os.path.join(DATA_DIR, 'val'),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='categorical',
        class_names=CLASSES,
        shuffle=False
    )

    # Augmentasi data
    augmentation = tf.keras.Sequential([
        layers.RandomFlip('horizontal'),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.1),
        layers.RandomBrightness(0.1),
        layers.RandomContrast(0.1)
    ])

    train_ds = train_ds.map(
        lambda x, y: (augmentation(x, training=True), y),
        num_parallel_calls=tf.data.AUTOTUNE
    ).prefetch(tf.data.AUTOTUNE)

    val_ds = val_ds.prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds

# ─── Training ─────────────────────────────────────────────────────
def train():
    print("🚀 Memulai training EcoScan model...")
    print(f"   Classes: {CLASSES}")
    print(f"   Epochs: {EPOCHS}, Batch: {BATCH_SIZE}")

    model = build_model()
    model.summary()

    train_ds, val_ds = build_dataset()

    model.compile(
        optimizer=tf.keras.optimizers.Adam(LEARNING_RATE),
        loss=FocalLoss(gamma=2.0),
        metrics=['accuracy', tf.keras.metrics.TopKCategoricalAccuracy(k=3, name='top3_acc')]
    )

    training_callbacks = [
        EcoScanCallback(target_accuracy=0.85),
        callbacks.ModelCheckpoint(
            MODEL_SAVE_PATH,
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        callbacks.EarlyStopping(
            monitor='val_accuracy',
            patience=10,
            restore_best_weights=True,
            verbose=1
        ),
        callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        ),
        callbacks.TensorBoard(
            log_dir='logs',
            histogram_freq=1,
            write_images=True
        )
    ]

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        callbacks=training_callbacks
    )

    # Evaluasi final
    val_loss, val_acc, val_top3 = model.evaluate(val_ds)
    print(f"\n📊 Hasil Akhir:")
    print(f"   Val Accuracy: {val_acc:.4f} ({val_acc*100:.1f}%)")
    print(f"   Val Top-3 Accuracy: {val_top3:.4f}")
    print(f"   Val Loss: {val_loss:.4f}")

    if val_acc >= 0.85:
        print("✅ Model memenuhi target akurasi minimum 85%!")
    else:
        print("⚠️  Akurasi belum 85%. Pertimbangkan lebih banyak data atau fine-tuning.")

    return model, history

if __name__ == '__main__':
    train()
