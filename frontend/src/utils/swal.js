import Swal from 'sweetalert2';

const base = {
  confirmButtonColor: '#4f46e5',
  cancelButtonColor: '#6b7280',
  buttonsStyling: true,
  customClass: {
    popup: 'rounded-2xl',
    confirmButton: 'btn-primary',
    cancelButton: 'btn-outline',
  },
};

export function confirmAction(title, text, { icon = 'warning', confirmText = 'Oui, continuer', cancelText = 'Annuler' } = {}) {
  return Swal.fire({
    ...base,
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
}

export function confirmDelete(entity, dangerText) {
  return confirmAction(
    `Supprimer ${entity} ?`,
    dangerText || 'Cette action est irréversible.',
    { icon: 'warning', confirmText: 'Oui, supprimer' }
  );
}

export function showSuccess(title, text = '') {
  return Swal.fire({ ...base, icon: 'success', title, text, timer: 2500, showConfirmButton: false });
}

export function showError(title, text = '') {
  return Swal.fire({ ...base, icon: 'error', title, text, confirmButtonText: 'OK' });
}

export function showInfo(title, text = '') {
  return Swal.fire({ ...base, icon: 'info', title, text });
}

export function showLoading(title = 'Traitement en cours...') {
  Swal.fire({ ...base, title, didOpen: () => Swal.showLoading() });
}

export function closeLoading() {
  Swal.close();
}

export function extractError(err, fallback = 'Une erreur est survenue.') {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.non_field_errors) return Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
  if (data.deleted === false) return data.message || 'Cette action n\'est pas autorisée.';
  if (data.relation_error) return data.relation_error;
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0];
  if (typeof first === 'string') return first;
  return fallback;
}
