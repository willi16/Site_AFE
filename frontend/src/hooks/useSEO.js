import { useEffect } from 'react';
import { SITE_URL, SITE_DEFAULTS, absoluteUrl, absoluteImage } from '../config/seo';

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
  const url = absoluteUrl(path);
  const img = absoluteImage(image || SITE_DEFAULTS.image);

  document.title = title || SITE_DEFAULTS.title;

  upsertMeta('name', 'description', 'seo-description', description || SITE_DEFAULTS.description);
  upsertMeta('name', 'robots', 'seo-robots', noindex ? 'noindex, nofollow' : 'index, follow');
  upsertLink('canonical', url);

  upsertMeta('property', 'og:title', 'seo-og-title', title || SITE_DEFAULTS.title);
  upsertMeta('property', 'og:description', 'seo-og-description', description || SITE_DEFAULTS.description);
  upsertMeta('property', 'og:url', 'seo-og-url', url);
  upsertMeta('property', 'og:image', 'seo-og-image', img);
  upsertMeta('property', 'og:image:alt', 'seo-og-image-alt', "Logo de l'Association de Fraternité et d'Entraide (AFE)");

  upsertMeta('name', 'twitter:title', 'seo-twitter-title', title || SITE_DEFAULTS.title);
  upsertMeta('name', 'twitter:description', 'seo-twitter-description', description || SITE_DEFAULTS.description);
  upsertMeta('name', 'twitter:image', 'seo-twitter-image', img);
}

function injectJsonLd(block, index) {
  const id = `seo-jsonld-${index}`;
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(block);
}

function removeJsonLd(count) {
  for (let i = 0; i < count; i++) {
    document.getElementById(`seo-jsonld-${i}`)?.remove();
  }
}

export function useSEO({ title, description, path = '/', image, noindex = false, jsonLd }) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    applySEO({ title, description, path, image, noindex });
    const blocks = Array.isArray(jsonLd) ? jsonLd : [];
    blocks.forEach((block, i) => injectJsonLd(block, i));
    return () => {
      removeJsonLd(blocks.length);
      applySEO({
        title: SITE_DEFAULTS.title,
        description: SITE_DEFAULTS.description,
        image: SITE_DEFAULTS.image,
        path: '/',
        noindex: false,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, noindex, jsonLdKey]);
}

export function useJsonLd(jsonLd) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const blocks = Array.isArray(jsonLd) ? jsonLd : [];
    blocks.forEach((block, i) => injectJsonLd(block, i));
    return () => removeJsonLd(blocks.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonLdKey]);
}