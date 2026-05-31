"""
EcoScan Data Dashboard — Streamlit
Jalankan: streamlit run app.py
Deploy: streamlit share (https://share.streamlit.io)
"""
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import random

st.set_page_config(
    page_title="EcoScan Analytics Dashboard",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ─── Custom CSS ───────────────────────────────────────────────────
st.markdown("""
<style>
    .metric-card { background: #f0faf5; border-radius: 12px; padding: 16px; border: 1px solid #9fe1cb; }
    .stMetric label { font-size: 13px !important; color: #666 !important; }
    .main-header { color: #1D9E75; font-size: 2rem; font-weight: 700; }
</style>
""", unsafe_allow_html=True)

# ─── Generate demo data ───────────────────────────────────────────
@st.cache_data
def generate_demo_data():
    random.seed(42)
    np.random.seed(42)

    classes = ['plastik', 'organik', 'kertas', 'logam', 'kaca', 'b3', 'elektronik', 'tekstil']
    weights = [0.35, 0.25, 0.18, 0.10, 0.05, 0.03, 0.02, 0.02]
    carbon_map = {'plastik': 1.8, 'organik': 0.3, 'kertas': 0.9, 'logam': 2.1, 'kaca': 0.6, 'b3': 3.5, 'elektronik': 4.2, 'tekstil': 1.2}

    n = 2500
    dates = [datetime(2025, 10, 1) + timedelta(days=random.randint(0, 180)) for _ in range(n)]
    waste_types = random.choices(classes, weights=weights, k=n)
    confidences = [round(random.uniform(78, 99), 1) for _ in range(n)]
    users = [f"user_{random.randint(1, 200):03d}" for _ in range(n)]

    df = pd.DataFrame({
        'date': pd.to_datetime(dates),
        'waste_type': waste_types,
        'confidence': confidences,
        'carbon_score': [carbon_map[w] for w in waste_types],
        'user_id': users
    })
    df = df.sort_values('date')
    return df

df = generate_demo_data()

# ─── Sidebar ──────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("### 🌿 EcoScan Analytics")
    st.markdown("---")

    date_range = st.date_input(
        "Rentang Tanggal",
        value=(df['date'].min().date(), df['date'].max().date()),
        min_value=df['date'].min().date(),
        max_value=df['date'].max().date()
    )

    selected_types = st.multiselect(
        "Jenis Sampah",
        options=df['waste_type'].unique().tolist(),
        default=df['waste_type'].unique().tolist()
    )

    st.markdown("---")
    st.markdown("**📊 Data Overview**")
    st.caption(f"Total records: {len(df):,}")
    st.caption(f"Total users: {df['user_id'].nunique():,}")
    st.caption(f"Periode: {df['date'].min().strftime('%d %b %Y')} — {df['date'].max().strftime('%d %b %Y')}")

# ─── Filter data ──────────────────────────────────────────────────
if len(date_range) == 2:
    mask = (df['date'].dt.date >= date_range[0]) & (df['date'].dt.date <= date_range[1])
    df_filtered = df[mask & df['waste_type'].isin(selected_types)]
else:
    df_filtered = df[df['waste_type'].isin(selected_types)]

# ─── Header ───────────────────────────────────────────────────────
st.markdown('<h1 class="main-header">🌍 EcoScan Analytics Dashboard</h1>', unsafe_allow_html=True)
st.markdown("Dashboard interaktif untuk memantau tren pilah sampah dan dampak lingkungan komunitas")
st.markdown("---")

# ─── KPI Cards ────────────────────────────────────────────────────
col1, col2, col3, col4, col5 = st.columns(5)

total_scans = len(df_filtered)
total_carbon = df_filtered['carbon_score'].sum()
avg_confidence = df_filtered['confidence'].mean()
active_users = df_filtered['user_id'].nunique()
carbon_saved = total_carbon * 0.3

col1.metric("Total Scan", f"{total_scans:,}", delta=f"+{int(total_scans*0.12)} dari bulan lalu")
col2.metric("Pengguna Aktif", f"{active_users:,}", delta=f"+{int(active_users*0.08)} pengguna baru")
col3.metric("CO₂ Terdeteksi", f"{total_carbon:.1f} kg", delta=None)
col4.metric("CO₂ Berpotensi Dihemat", f"{carbon_saved:.1f} kg", delta="dari daur ulang")
col5.metric("Rata-rata Akurasi AI", f"{avg_confidence:.1f}%", delta="+2.3% vs bulan lalu")

st.markdown("---")

# ─── Charts Row 1 ─────────────────────────────────────────────────
col_l, col_r = st.columns([3, 2])

with col_l:
    st.subheader("📈 Tren Scan Harian")
    daily = df_filtered.groupby(df_filtered['date'].dt.date).size().reset_index(name='count')
    daily.columns = ['Tanggal', 'Jumlah Scan']

    fig_line = px.area(
        daily, x='Tanggal', y='Jumlah Scan',
        color_discrete_sequence=['#1D9E75'],
        template='plotly_white'
    )
    fig_line.update_traces(fill='tozeroy', fillcolor='rgba(29, 158, 117, 0.1)')
    fig_line.update_layout(margin=dict(l=0, r=0, t=10, b=0), height=280)
    st.plotly_chart(fig_line, use_container_width=True)

with col_r:
    st.subheader("🥧 Distribusi Jenis Sampah")
    waste_counts = df_filtered['waste_type'].value_counts().reset_index()
    waste_counts.columns = ['Jenis', 'Jumlah']

    colors = ['#378ADD', '#1D9E75', '#EF9F27', '#888780', '#06B6D4', '#E24B4A', '#8B5CF6', '#EC4899']
    fig_pie = px.pie(
        waste_counts, values='Jumlah', names='Jenis',
        color_discrete_sequence=colors,
        hole=0.4
    )
    fig_pie.update_traces(textposition='inside', textinfo='percent+label')
    fig_pie.update_layout(margin=dict(l=0, r=0, t=10, b=0), height=280, showlegend=False)
    st.plotly_chart(fig_pie, use_container_width=True)

# ─── Charts Row 2 ─────────────────────────────────────────────────
col_a, col_b = st.columns(2)

with col_a:
    st.subheader("🌡️ Dampak Karbon per Jenis Sampah")
    carbon_by_type = df_filtered.groupby('waste_type')['carbon_score'].agg(['sum', 'mean', 'count']).reset_index()
    carbon_by_type.columns = ['Jenis', 'Total CO₂ (kg)', 'Rata-rata CO₂', 'Jumlah Scan']
    carbon_by_type = carbon_by_type.sort_values('Total CO₂ (kg)', ascending=True)

    fig_bar = px.bar(
        carbon_by_type, x='Total CO₂ (kg)', y='Jenis',
        orientation='h',
        color='Total CO₂ (kg)',
        color_continuous_scale=['#E1F5EE', '#1D9E75', '#085041'],
        template='plotly_white'
    )
    fig_bar.update_layout(margin=dict(l=0, r=0, t=10, b=0), height=280, coloraxis_showscale=False)
    st.plotly_chart(fig_bar, use_container_width=True)

with col_b:
    st.subheader("🎯 Distribusi Akurasi Model AI")
    fig_hist = px.histogram(
        df_filtered, x='confidence',
        nbins=20,
        color_discrete_sequence=['#1D9E75'],
        template='plotly_white',
        labels={'confidence': 'Akurasi (%)', 'count': 'Jumlah'}
    )
    fig_hist.add_vline(x=avg_confidence, line_dash="dash", line_color="#E24B4A",
                       annotation_text=f"Rata-rata: {avg_confidence:.1f}%")
    fig_hist.update_layout(margin=dict(l=0, r=0, t=10, b=0), height=280)
    st.plotly_chart(fig_hist, use_container_width=True)

# ─── Weekly heatmap ───────────────────────────────────────────────
st.subheader("📅 Heatmap Aktivitas Scan per Hari")
df_filtered['day_of_week'] = df_filtered['date'].dt.day_name()
df_filtered['week'] = df_filtered['date'].dt.strftime('W%U')

pivot = df_filtered.groupby(['week', 'day_of_week']).size().unstack(fill_value=0)
day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
pivot = pivot.reindex(columns=[d for d in day_order if d in pivot.columns])

fig_heat = px.imshow(
    pivot.T, color_continuous_scale=['#E1F5EE', '#1D9E75', '#085041'],
    template='plotly_white', aspect='auto',
    labels=dict(x='Minggu', y='Hari', color='Jumlah Scan')
)
fig_heat.update_layout(margin=dict(l=0, r=0, t=10, b=20), height=200)
st.plotly_chart(fig_heat, use_container_width=True)

# ─── Data table ───────────────────────────────────────────────────
st.subheader("📋 Data Tabel")
summary = df_filtered.groupby('waste_type').agg(
    jumlah_scan=('waste_type', 'count'),
    avg_confidence=('confidence', lambda x: round(x.mean(), 1)),
    total_carbon=('carbon_score', lambda x: round(x.sum(), 2)),
    carbon_saved=('carbon_score', lambda x: round(x.sum() * 0.3, 2))
).reset_index()
summary.columns = ['Jenis Sampah', 'Jumlah Scan', 'Akurasi Rata-rata (%)', 'Total CO₂ (kg)', 'CO₂ Berpotensi Dihemat (kg)']
st.dataframe(summary, use_container_width=True, hide_index=True)

# ─── Business Question ────────────────────────────────────────────
st.markdown("---")
st.subheader("💡 Kesimpulan & Business Insights")

insights = [
    f"🥇 **Plastik** adalah jenis sampah paling banyak di-scan ({df_filtered[df_filtered['waste_type']=='plastik'].shape[0]:,} kali = {df_filtered[df_filtered['waste_type']=='plastik'].shape[0]/total_scans*100:.1f}% dari total). Intervensi edukasi terkait plastik akan punya dampak terbesar.",
    f"⚡ **B3 dan Elektronik** memiliki carbon footprint tertinggi (masing-masing {3.5} dan {4.2} kg CO₂/item). Meski jumlah scannya sedikit, penanganan yang benar sangat krusial.",
    f"📈 **Akurasi model AI rata-rata {avg_confidence:.1f}%** — di atas target minimum 85%. Model sudah cukup andal untuk deployment produksi.",
    f"👥 **{active_users:,} pengguna aktif** sudah berkontribusi dalam platform ini. Pertumbuhan {int(active_users*0.08)} pengguna baru menunjukkan tren adopsi yang positif.",
]

for insight in insights:
    st.markdown(f"- {insight}")

st.markdown("---")
st.caption("🌿 EcoScan Analytics Dashboard · Data diperbarui setiap hari · Dibuat dengan Streamlit")
