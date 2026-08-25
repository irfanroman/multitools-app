export default function manifest() {
  return {
    name: 'Multi-Tools Dashboard Suite',
    short_name: 'MultiTools',
    description:
      'Personal all-in-one student dashboard for finance, study tools, data science practice, and mindful journal.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D0F12',
    theme_color: '#0D0F12',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Finance Tracker',
        short_name: 'Finance',
        description: 'Kelola keuangan, transaksi, dan dompet',
        url: '/finance',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Study Tools',
        short_name: 'Study',
        description: 'Catatan, flashcard, dan tugas kuliah',
        url: '/study',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Data Science Hub',
        short_name: 'Data Science',
        description: 'Dataset, model ML, dan snippet code',
        url: '/datascience',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'Mindful Journal',
        short_name: 'Journal',
        description: 'Jurnal harian dan mood tracker',
        url: '/journal',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
