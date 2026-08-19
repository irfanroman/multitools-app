# Multi-Tool Personal Dashboard — Project Brief

## 1. Ringkasan Proyek

Sebuah **personal dashboard application** untuk mahasiswa Data Science, menggabungkan 4 module utama dalam satu tempat: **Finance Management**, **Study Tools**, **Data Science Practice Corner**, dan **Mood/Journal Board**. Fokus awal: web app (desktop-first, responsive), dengan arsitektur yang disiapkan untuk ekspansi ke aplikasi mobile di kemudian hari.

---

## 2. Design System (berdasarkan referensi)

### Mood & Style
Dark, premium, tech-forward — kombinasi hitam pekat dengan aksen lime-yellow yang tajam. Terasa modern, sedikit "AI-native product", clean tapi tetap punya karakter/personality lewat warna aksen yang berani.

### Color Palette
| Token | Hex (approx) | Penggunaan |
|---|---|---|
| `--bg-base` | `#EDEFEB` / off-white sage | Background utama halaman |
| `--surface-dark` | `#111111` | Sidebar, card gelap, tombol primary |
| `--accent-lime` | `#E4FF6B` | Highlight card, progress bar, badge aktif |
| `--surface-light` | `#FFFFFF` | Card sekunder, pill button, stat card |
| `--text-primary` | `#111111` | Teks utama di atas background terang |
| `--text-inverse` | `#FFFFFF` | Teks di atas surface gelap |
| `--text-muted` | `#8A8F87` | Label, sub-text, angka pendukung |
| `--border-subtle` | `rgba(0,0,0,0.06)` | Pemisah antar card |

### Typography
- **Heading:** Sans-serif bold/grotesque (mis. *Neue Montreal*, *General Sans*, atau *Inter Tight* — besar, tebal, sedikit tight letter-spacing)
- **Body:** Sans-serif reguler yang netral (*Inter*, *Satoshi*)
- Heading utama halaman dibuat ekstra besar (36–48px), dengan inline icon/emoji-badge kecil di antara kata (seperti pada referensi: teks + ikon bulat kecil menyatu dalam satu kalimat)

### Komponen Kunci
- **Rounded everything** — radius besar (16–24px) di semua card, tombol, dan container
- **Pill-shaped progress bar vertikal** (seperti "capsule slider") untuk representasi data statistik/skor — jadi ciri khas visual dashboard ini
- **Stat card kontras**: satu card hitam pekat, satu card lime terang, saling berdampingan untuk menciptakan ritme visual
- **Sidebar ikon-only**, gelap pekat, dengan 1 ikon "active state" berbentuk pil/rounded highlight
- **Badge percentage mengambang** (floating chip) di atas grafik/chart, mis. "82%", "87%"
- **CTA button** hitam pekat dengan ikon plus, rounded-full
- Sedikit **glassmorphism** pada card promosional/banner (blur ringan + overlay gradient di atas gambar)

---

## 3. Fitur per Module

### 💰 Module 1 — Finance
- **Transaction logging** manual + kategori otomatis (uang jajan, transport, kos, kuliah, hiburan, dll)
- **Recurring transactions** — SPP, kos bulanan, langganan (auto-generate entry di tanggal jatuh tempo)
- **Budget per kategori** dengan progress bar (gaya pill/capsule dari design system)
- **Donut chart** — breakdown pengeluaran bulan berjalan per kategori
- **Area chart** — tren saldo/pengeluaran dari waktu ke waktu
- **Insight otomatis** — bandingkan spending minggu ini vs minggu lalu, dijelaskan dalam bahasa edukatif (bukan cuma angka mentah)
- **Streak & badge system** — konsistensi mencatat transaksi harian (7/30/90 hari)

### 📚 Module 2 — Study Tools
- **Note/summarizer** — input catatan kuliah/paper → ringkasan poin-poin otomatis
- **Flashcard/quiz generator** — dari catatan yang sama, generate kartu untuk spaced repetition
- **Study time tracker** — log jam belajar per mata kuliah, reuse streak system dari finance module
- **Deadline/assignment tracker** — kalender tugas dengan reminder

### 📊 Module 3 — Data Science Practice Corner
- **Dataset playground** — upload CSV kecil → auto-generate statistik dasar & chart (tempat latihan EDA)
- **Experiment/model log** — catat eksperimen ML kecil (parameter, hasil, catatan) biar terdokumentasi
- **Snippet/notebook shortcut** — simpan potongan kode yang sering dipakai ulang

### 📓 Module 4 — Mood/Journal Board
- **Daily journal entry** singkat (teks + mood tag/emoji)
- **Mood trend chart** — visualisasi mood dari waktu ke waktu (bisa reuse area chart component)
- **Tema visual cozy** — bisa dikombinasikan dengan aesthetic Ghibli/ambient yang jadi preferensi personal, sebagai "ruang" yang lebih santai dibanding module lain

### 🧭 Shared/Cross-Module
- **Unified sidebar navigation** (ikon-only, gelap, sesuai referensi)
- **Home/overview dashboard** — ringkasan singkat dari 4 module (mini widget masing-masing)
- **Shared streak & badge engine** — dipakai finance, study, dan bisa diperluas ke habit lain
- **Shared chart component library** — donut, area, pill-progress dipakai ulang di semua module

---

## 4. Rekomendasi Tech Stack

### Frontend (Web — fokus sekarang)
- **Framework:** React + **Next.js** (App Router) — mendukung SSR/SSG, baik untuk performance dan SEO kalau nanti mau landing page publik
- **Styling:** **Tailwind CSS** — cocok untuk implementasi design system custom (warna, radius besar, spacing konsisten) secara cepat dan konsisten
- **Component base:** **shadcn/ui** — headless component yang gampang di-restyle sesuai tema gelap/lime kamu, tanpa dev experience yang berat
- **Chart library:** **Recharts** atau **Tremor** (Tremor lebih cocok untuk dashboard analytics-style, punya banyak preset chart)
- **Icon:** **Lucide Icons** — gaya minimal, cocok dengan sidebar ikon-only di referensi
- **State management:** **Zustand** — ringan, cukup untuk state antar module tanpa boilerplate Redux
- **Form handling:** **React Hook Form + Zod** — untuk validasi input transaksi, catatan, dll

### Backend & Database
- **Backend:** **Next.js API Routes** (atau **tRPC** kalau mau full type-safety end-to-end antara frontend-backend) — cukup untuk skala personal app, tidak perlu server terpisah dulu
- **Database:** **PostgreSQL** via **Supabase** — sekaligus dapat Auth, Storage (untuk upload CSV di data science module), dan realtime subscription kalau dibutuhkan
- **ORM:** **Prisma** — schema management yang rapi, terutama karena kamu punya banyak entity (transactions, notes, flashcards, datasets, journal entries)
- **Auth:** Supabase Auth (email/password + OAuth Google) — simpel dan langsung terintegrasi dengan database

### Data Science Module (khusus)
- **CSV parsing di client:** **PapaParse**
- **Statistik dasar & chart generation:** kombinasi **Danfo.js** (mirip pandas tapi di JS) atau proses ringan di backend pakai **Python microservice** (FastAPI) kalau butuh analisis lebih berat — opsional, bisa nyusul di fase 2

### AI Features (summarizer, insight otomatis, quiz generator)
- **Anthropic API (Claude)** — untuk summarization catatan, generate insight finance dalam bahasa natural, dan generate flashcard/quiz dari teks

### Deployment
- **Vercel** — native buat Next.js, auto-preview per branch, gampang untuk iterasi cepat
- **Supabase Cloud** — hosting database & auth, free tier cukup untuk tahap awal

### Persiapan Mobile (fase selanjutnya)
- **React Native + Expo** — reuse logic bisnis (hooks, API calls, Zustand store) semaksimal mungkin dari codebase web
- Struktur project disarankan **monorepo** (pakai **Turborepo**) sejak awal: `apps/web`, `apps/mobile` (nanti), `packages/ui` (design tokens & komponen shared), `packages/api` (tipe & schema shared) — supaya saat mobile mulai dikerjakan, tidak perlu rombak arsitektur dari nol
- Design tokens (warna, radius, spacing dari design system di atas) disimpan terpisah di `packages/ui/tokens` sejak awal, biar bisa dipakai baik di Tailwind config (web) maupun di styling React Native (mobile)

---

## 5. Struktur Data Awal (high-level)

```
users
transactions        (userId, amount, category, date, isRecurring, recurrenceRule)
budgets             (userId, category, limitAmount, period)
streaks             (userId, module, currentStreak, longestStreak, lastLoggedDate)
notes               (userId, title, rawContent, summary, subject)
flashcards          (userId, noteId, question, answer, nextReviewDate)
assignments         (userId, title, dueDate, subject, status)
datasets            (userId, fileName, uploadedAt, rowCount, metadata)
experiments         (userId, name, params, results, notes, createdAt)
journal_entries     (userId, content, mood, date)
```

---

## 6. Urutan Pengerjaan yang Disarankan

1. Setup project (Next.js + Tailwind + shadcn/ui) & implementasi design system dasar (warna, komponen card, sidebar)
2. Module **Finance** (paling matang speknya, jadi fondasi pattern untuk module lain)
3. Module **Study Tools** (reuse streak & chart component dari finance)
4. Module **Mood/Journal** (relatif ringan, bagus untuk validasi UX cozy-nya)
5. Module **Data Science Practice Corner** (paling kompleks teknis, dikerjakan setelah pattern lain solid)
6. Setup monorepo & mulai porting ke React Native (Expo) untuk mobile
