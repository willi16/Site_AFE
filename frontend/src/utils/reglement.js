const REGULATION_COTISATIONS = [
  {
    type: 'mensuelle',
    label: 'Cotisation mensuelle',
    amount: 2000,
    keywords: ['assemblée mensuelle', 'réunion mensuelle', 'réunion ordinaire'],
  },
  {
    type: 'mariage',
    label: 'Cotisation mariage',
    amount: 5000,
    keywords: ['mariage'],
  },
  {
    type: 'naissance',
    label: 'Cotisation nouvelle naissance',
    amount: 3000,
    keywords: ['naissance'],
  },
  {
    type: 'hospitalisation',
    label: 'Cotisation hospitalisation',
    amount: 5000,
    keywords: ['hospitalisation'],
  },
  {
    type: 'deces',
    label: 'Cotisation décès',
    amount: 10000,
    keywords: ['décès', 'deuil'],
  },
  {
    type: 'liberation',
    label: 'Cotisation libération',
    amount: 3000,
    keywords: ['libération'],
  },
];

export function getRegulationCotisation(title = '', isMonthlyAssembly = false) {
  if (isMonthlyAssembly) return REGULATION_COTISATIONS[0];
  const t = (title || '').toLowerCase();
  for (const c of REGULATION_COTISATIONS) {
    if (c.keywords.some((k) => t.includes(k))) return c;
  }
  return null;
}

export { REGULATION_COTISATIONS };
