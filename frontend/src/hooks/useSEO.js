import { useEffect } from 'react';

const SITE_URL = 'https://site-afe.vercel.app';

const DEFAULTS = {
  title: "AFE — Association de Fraternité et d'Entraide | Solidarité, événements, adhésion et dons",
  description:
    "AFE, Association de Fraternité et d'Entraide : solidarité, entraide et vie associative. Découvrez nos événements, actualités, adhésions et façons de faire un don.",
  image: 'https://site-afe.vercel.app/logo-afe.jpg',
};

function upsertMeta(attr, key, id, content) {
  if (!content && content !== '') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    el.setAttribute('id', id);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el && rel === 'canonical') {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  if (el && el.getAttribute('rel') === rel) el.setAttribute('href', href);
}

function applySEO({ title, description, path, image, noindex }) {
  const url = `${SITE_URL}${path}`;
  const img = image?.startsWith('http') ? image : `${SITE_URL}${image || '/logo-afe.jpg'}`;

  document.title = title || DEFAULTS.title;

  upsertMeta('name', 'description', 'seo-description', description || DEFAULTS.description);
  upsertMeta('name', 'robots', 'seo-robots', noindex ? 'noindex, nofollow' : 'index, follow');
  upsertLink('canonical', url);

  upsertMeta('property', 'og:title', 'seo-og-title', title || DEFAULTS.title);
  upsertMeta('property', 'og:description', 'seo-og-description', description || DEFAULTS.description);
  upsertMeta('property', 'og:url', 'seo-og-url', url);
  upsertMeta('property', 'og:image', 'seo-og-image', img);

  upsertMeta('name', 'twitter:title', 'seo-twitter-title', title || DEFAULTS.title);
  upsertMeta('name', 'twitter:description', 'seo-twitter-description', description || DEFAULTS.description);
  upsertMeta('name', 'twitter:image', 'seo-twitter-image', img);
}

export function useSEO({ title, description, path = '/', image, noindex = false }) {
  useEffect(() => {
    applySEO({ title, description, path, image, noindex });
    return () => applySEO({ title: DEFAULTS.title, description: DEFAULTS.description, image: DEFAULTS.image, path: '/', noindex: false });
  }, [title, description, path, image, noindex]);
}