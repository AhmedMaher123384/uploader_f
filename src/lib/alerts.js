import Swal from "sweetalert2"

function isRtl() {
  try {
    const dir = document?.documentElement?.dir || document?.body?.dir || ''
    if (String(dir).toLowerCase() === 'rtl') return true
  } catch {
    void 0
  }
  try {
    return String(navigator?.language || '').toLowerCase().startsWith('ar')
  } catch {
    return false
  }
}

function escapeHtml(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function normalizeDetails(details) {
  if (!details) return null
  if (Array.isArray(details)) return details
  if (typeof details === 'object') return details
  return { value: String(details) }
}

function clampMessage(s, maxLen = 180) {
  const v = String(s || '').trim()
  if (!v) return ''
  if (v.length <= maxLen) return v
  return `${v.slice(0, Math.max(0, maxLen - 1)).trim()}…`
}

export function friendlyErrorMessage(err) {
  const code = String(err?.code || '').trim()
  const status = Number(err?.status)

  if (code === 'REQUEST_ABORTED') return 'تم إلغاء الطلب.'
  if (code === 'NETWORK_ERROR') return 'مشكلة في الاتصال بالشبكة. جرّب تاني.'
  if (code === 'INVALID_JSON') return 'الرد من السيرفر غير مفهوم. جرّب تاني.'

  if (Number.isFinite(status)) {
    if (status === 401 || status === 403) return 'غير مصرح. سجّل دخولك وحاول تاني.'
    if (status === 404) return 'المورد غير موجود أو اتنقل.'
    if (status >= 500) return 'مشكلة من السيرفر. جرّب بعد شوية.'
  }

  const msg = String(err?.message || '').trim()
  return clampMessage(msg || 'حدث خطأ غير متوقع.')
}

let cachedToast = null

function getToast() {
  if (cachedToast) return cachedToast
  cachedToast = Swal.mixin({
    toast: true,
    position: isRtl() ? 'top-start' : 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      try {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      } catch {
        void 0
      }
    },
  })
  return cachedToast
}

export function toast({ type = 'info', title, message, html, timeoutMs } = {}) {
  const t = getToast()
  return t.fire({
    icon: type,
    title: title || '',
    text: html ? undefined : message || '',
    ...(html ? { html } : {}),
    ...(typeof timeoutMs === 'number' ? { timer: Math.max(0, timeoutMs) } : null),
  })
}

export function toastSuccess(message, title, opts) {
  return toast({ type: 'success', title: title || 'تم', message, ...(opts || {}) })
}

export function toastError(message, title, opts) {
  return toast({ type: 'error', title: title || 'خطأ', message, ...(opts || {}) })
}

export function toastInfo(message, title, opts) {
  return toast({ type: 'info', title: title || 'تنبيه', message, ...(opts || {}) })
}

export function toastWarn(message, title, opts) {
  return toast({ type: 'warning', title: title || 'تنبيه', message, ...(opts || {}) })
}

export async function confirmDanger({ title, message, confirmText, cancelText, html } = {}) {
  const res = await Swal.fire({
    icon: 'warning',
    title: title || 'تأكيد',
    text: html ? undefined : message || '',
    ...(html ? { html } : {}),
    showCancelButton: true,
    confirmButtonText: confirmText || 'تأكيد',
    cancelButtonText: cancelText || 'إلغاء',
    reverseButtons: isRtl(),
    focusCancel: true,
    showCloseButton: true,
    width: 720,
  })
  return Boolean(res?.isConfirmed)
}

export async function showValidationPopup({ title, message, code, details } = {}) {
  const d = normalizeDetails(details)
  const header = message || 'بيانات غير صحيحة'
  const list =
    Array.isArray(d?.details) && d.details.length
      ? d.details
      : Array.isArray(d) && d.length
        ? d
        : null
  const itemsHtml = list
    ? list
        .slice(0, 20)
        .map((x) => {
          const path = Array.isArray(x?.path) ? x.path.join('.') : x?.path ? String(x.path) : ''
          const msg = x?.message ? String(x.message) : String(x || '')
          const left = path ? `<div style="font-weight:700">${escapeHtml(path)}</div>` : ''
          return `<li style="margin:8px 0">${left}<div style="opacity:.9">${escapeHtml(msg)}</div></li>`
        })
        .join('')
    : ''

  const bodyHtml = itemsHtml
    ? `<ul style="margin:0;padding:${isRtl() ? '0 18px 0 0' : '0 0 0 18px'}">${itemsHtml}</ul>`
    : `<div style="opacity:.9">${escapeHtml(header)}</div>`

  const footerHtml =
    code && String(code).trim()
      ? `<div style="margin-top:12px;font-size:12px;opacity:.7">CODE: ${escapeHtml(String(code))}</div>`
      : ''

  return await Swal.fire({
    icon: 'error',
    title: title || 'مشكلة فالديشن',
    html: `<div style="text-align:${isRtl() ? 'right' : 'left'};line-height:1.65">${bodyHtml}${footerHtml}</div>`,
    confirmButtonText: 'تمام',
    showCloseButton: true,
    width: 760,
  })
}

export async function showApiErrorPopup(err, { title } = {}) {
  const status = err?.status
  const code = err?.code
  const message = String(err?.message || 'حدث خطأ')
  const details = normalizeDetails(err?.details)

  if (code === 'VALIDATION_ERROR') {
    return await showValidationPopup({ title: title || 'بيانات غير صحيحة', message, code, details })
  }

  const detailsText =
    details && typeof details === 'object'
      ? JSON.stringify(details, null, 2)
      : details
        ? String(details)
        : ''

  const html = `
    <div style="text-align:${isRtl() ? 'right' : 'left'};line-height:1.65">
      <div style="margin-bottom:10px">${escapeHtml(message)}</div>
      ${status != null ? `<div style="font-size:12px;opacity:.75">HTTP: ${escapeHtml(String(status))}</div>` : ''}
      ${code ? `<div style="font-size:12px;opacity:.75">CODE: ${escapeHtml(String(code))}</div>` : ''}
      ${
        detailsText
          ? `<details style="margin-top:12px;opacity:.9"><summary style="cursor:pointer;font-weight:700">تفاصيل</summary><pre style="white-space:pre-wrap;margin:10px 0 0">${escapeHtml(detailsText)}</pre></details>`
          : ''
      }
    </div>
  `

  return await Swal.fire({
    icon: 'error',
    title: title || 'حصل خطأ',
    html,
    confirmButtonText: 'تمام',
    showCloseButton: true,
    width: 760,
  })
}
