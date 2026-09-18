export const SITE_URL = 'https://site-afe.vercel.app';

export const SITE_NAME = "AFE — Association de Fraternité et d'Entraide";

export const SITE_DEFAULTS = {
  title: "AFE — Association de Fraternité et d'Entraide | Solidarité, événements, adhésion et dons",
  description:
    "AFE, Association de Fraternité et d'Entraide : solidarité, entraide et vie associative. Découvrez nos événements, actualités, adhésions et façons de faire un don.",
  image: 'logo-afe.jpg',
};

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path}`;
}

export function absoluteImage(path = SITE_DEFAULTS.image) {
  return path && path.startsWith('http') ? path : `${SITE_URL}${path}`;
}