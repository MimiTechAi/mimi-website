import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MiMi Tech AI - KI-Beratung & Digitale Zwillinge',
    short_name: 'MiMi Tech AI',
    description: 'Professionelle KI-Beratung und Digitale Zwillinge für Unternehmen im Schwarzwald. Von urbanen digitalen Zwillingen bis Enterprise-Lösungen.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'de',
    categories: ['business', 'productivity', 'technology'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: '/images/mimi_tech_ai_icon_192-Kopie-1760514890080.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/images/mimi_tech_ai_icon_512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/images/hero-neural-network.png',
        sizes: '1024x1024',
        type: 'image/png',
        label: 'MiMi Tech AI Hauptseite mit KI-Beratung'
      }
    ],
    shortcuts: [
      {
        name: 'KI-Beratung',
        short_name: 'KI-Beratung',
        description: 'Direkte KI-Beratung anfordern',
        url: '/ki-beratung',
        icons: [{ src: '/icon.svg', sizes: 'any' }]
      },
      {
        name: 'Digitale Zwillinge',
        short_name: 'Zwillinge',
        description: 'Digitale Zwillinge entdecken',
        url: '/digitale-zwillinge',
        icons: [{ src: '/icon.svg', sizes: 'any' }]
      },
      {
        name: 'Kontakt',
        short_name: 'Kontakt',
        description: 'Mit MiMi Tech AI in Kontakt treten',
        url: '/contact',
        icons: [{ src: '/icon.svg', sizes: 'any' }]
      }
    ]
  }
}
