import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const SITE_URL = 'https://site-afe.vercel.app'
const IMAGE = `${SITE_URL}/logo-afe.jpg`

export const publicRoutes = [
  {
    path: 'association',
    title: "L'Association — AFE, Association de Fraternité et d'Entraide",
    description:
      "Découvrez l'histoire, les valeurs (fraternité, entraide, communauté, engagement, transparence, excellence) et la mission de l'Association de Fraternité et d'Entraide (AFE).",
  },
  {
    path: 'association/bureau',
    title: "Le Bureau — AFE, Association de Fraternité et d'Entraide",
    description:
      "Découvrez les membres du bureau de l'AFE : président, vice-président, trésorier, secrétaire et conseillers.",
  },
  {
    path: 'association/membres',
    title: "Nos Membres — AFE",
    description:
      "Rencontrez les membres actifs et engagés de l'Association de Fraternité et d'Entraide.",
  },
  {
    path: 'association/documents',
    title: "Textes Officiels — AFE",
    description:
      "Consultez les statuts, règlement intérieur et textes officiels de l'Association de Fraternité et d'Entraide.",
  },
  {
    path: 'evenements',
    title: 'Événements et agenda — AFE',
    description:
      "Retrouvez l'agenda de l'AFE : événements solidaires, assemblées mensuelles, galas et activités de l'Association de Fraternité et d'Entraide.",
  },
  {
    path: 'evenements/archives',
    title: 'Galerie et Archives — AFE',
    description:
      "Revivez les moments forts de l'AFE : photos et vidéos de nos événements et actions solidaires.",
  },
  {
    path: 'actualites',
    title: 'Actualités — AFE',
    description:
      "Suivez l'actualité de l'Association de Fraternité et d'Entraide : projets, collectes, assemblées générales.",
  },
  {
    path: 'adhesion',
    title: "Adhésion — Rejoindre l'AFE, Association de Fraternité et d'Entraide",
    description:
      "Candidature d'adhésion à l'AFE : avantages, cotisations, soutien financier aux membres (mariage, décès, naissance, hospitalisation). Rejoignez notre communauté.",
  },
  {
    path: 'don',
    title: "Faire un don — Soutenir l'AFE, Association de Fraternité et d'Entraide",
    description:
      "Soutenez l'Association de Fraternité et d'Entraide (AFE) par un don Mobile Money ou en espèces. Chaque geste compte pour nos actions solidaires.",
  },
  {
    path: 'contact',
    title: "Contact — AFE, Association de Fraternité et d'Entraide",
    description:
      "Contactez l'Association de Fraternité et d'Entraide (AFE) : adhésion, partenariat ou demande d'information. Écrivez-nous à associationfe@gmail.com.",
  },
]

const orgJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: "Association de Fraternité et d'Entraide (AFE)",
  alternateName: 'AFE',
  url: `${SITE_URL}/`,
  logo: { '@type': 'ImageObject', url: IMAGE },
  description:
    "Association de Fraternité et d'Entraide : solidarité, entraide et vie associative au Togo.",
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Agodékè, Lomé',
    addressCountry: 'TG',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+228-92-07-59-13',
      contactType: 'Président',
      areaServed: 'TG',
      availableLanguage: 'French',
    },
    {
      '@type': 'ContactPoint',
      telephone: '+228-91-08-90-82',
      contactType: 'Secrétaire',
      areaServed: 'TG',
      availableLanguage: 'French',
    },
  ],
  sameAs: [],
})

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function htmlForRoute(indexHtml, route) {
  const url = route.path ? `${SITE_URL}/${route.path}` : `${SITE_URL}/`
  let html = indexHtml

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${escapeHtml(route.description)}$2`,
  )
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${url}$2`,
  )
  html = html.replace(
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${url}$2`,
  )
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${escapeHtml(route.title)}$2`,
  )
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${escapeHtml(route.description)}$2`,
  )
  html = html.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${escapeHtml(route.title)}$2`,
  )
  html = html.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${escapeHtml(route.description)}$2`,
  )

  const orgScript = `<script type="application/ld+json">${orgJsonLd}</script>`
  if (!html.includes('"@type": "Organization"')) {
    html = html.replace('</head>', `${orgScript}\n</head>`)
  }

  // Contenu minimal <noscript> pour les robots sans JavaScript
  html = html.replace(
    '</body>',
    `\n<noscript><p>${escapeHtml(route.description)}</p></noscript>\n</body>`,
  )

  return html
}

function prerenderPublicRoutes() {
  return {
    name: 'prerender-public-routes',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const indexHtml = bundle['index.html']
      if (!indexHtml || indexHtml.type !== 'asset') return
      for (const route of publicRoutes) {
        if (!route.path) continue
        this.emitFile({
          type: 'asset',
          fileName: `${route.path}/index.html`,
          source: htmlForRoute(indexHtml.source, route),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderPublicRoutes()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})