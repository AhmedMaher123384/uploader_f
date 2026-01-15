import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx'
import { Loading } from '../components/ui/Loading.jsx'
import { useToasts } from '../components/useToasts.js'
import { requestBlob, requestJson } from '../lib/http.js'

function formatBytes(n) {
  const b = Number(n)
  if (!Number.isFinite(b) || b < 0) return '—'
  if (b < 1024) return `${b} B`
  const kb = b / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function mediaLabel(rt) {
  const t = String(rt || '')
  if (t === 'video') return 'فيديو'
  if (t === 'image') return 'صورة'
  if (t === 'raw') return 'ملف'
  return '—'
}

function initialsFromName(name) {
  const s = String(name || '').trim()
  if (!s) return '—'
  const parts = s.split(/\s+/g).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const second = parts.length > 1 ? parts[1]?.[0] || '' : parts[0]?.[1] || ''
  const out = `${first}${second}`.trim().toUpperCase()
  return out || '—'
}

function cleanUrl(v) {
  const s = String(v || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  return `https://${s}`
}

function StoreLogo({ name, logoUrl }) {
  const src = String(logoUrl || '').trim()
  return (
    <div className="relative">
      <div className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-2xl border border-[#18b5d5]/25 bg-[#292929]">
        {src ? (
          <img className="h-full w-full object-cover" alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" src={src} />
        ) : (
          <div className="text-2xl font-bold tracking-wide text-white">{initialsFromName(name)}</div>
        )}
      </div>
      <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full border-4 border-[#292929] bg-[#18b5d5]" />
    </div>
  )
}

const mediaBlobUrlCache = new Map()

function AdminMediaImage({ assetId, fallbackSrc, adminKey }) {
  const id = String(assetId || '').trim()
  const key = String(adminKey || '').trim()
  const fallback = String(fallbackSrc || '')

  const [blobUrl, setBlobUrl] = useState(() => {
    if (id && mediaBlobUrlCache.has(id)) return mediaBlobUrlCache.get(id)
    return ''
  })

  useEffect(() => {
    let cancelled = false
    if (!id || !key) return () => {}

    if (mediaBlobUrlCache.has(id)) {
      return () => {}
    }

    const controller = new AbortController()
    ;(async () => {
      try {
        const blob = await requestBlob(`/api/public/media/assets/${encodeURIComponent(id)}/blob`, {
          headers: { 'x-media-admin-key': key },
          signal: controller.signal,
        })
        const objUrl = URL.createObjectURL(blob)
        mediaBlobUrlCache.set(id, objUrl)
        if (!cancelled) setBlobUrl(objUrl)
      } catch {
        void 0
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [id, key])

  return <img className="h-full w-full object-cover" alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" src={blobUrl || fallback} />
}

function MediaCard({ item, canDelete, deleting, breaking, mediaAdminKey, onRequestDelete, onRequestBreak }) {
  const rt = String(item?.resourceType || '')
  const isVideo = rt === 'video'
  const isImage = rt === 'image'
  const src = item?.secureUrl || item?.url || null
  const typeClasses = 'bg-transparent text-white border-[#18b5d5]/25'

  return (
    <div className="overflow-hidden rounded-xl border border-[#18b5d5]/25 bg-[#292929]">
      <div className="h-28 w-full bg-[#292929] sm:h-32">
        {src ? (
          isVideo ? (
            <video className="h-full w-full object-cover" controls preload="metadata" playsInline src={src} />
          ) : (
            isImage ? (
              <AdminMediaImage key={String(item?.id || '')} assetId={item?.id} fallbackSrc={src} adminKey={mediaAdminKey} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            )
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-12 w-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-white">{item?.originalFilename || item?.publicId || '—'}</div>
            <div className="mt-1 truncate font-mono text-xs text-white opacity-90">{item?.publicId || '—'}</div>
          </div>
          <div className={['shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold', typeClasses].join(' ')}>
            {mediaLabel(item?.resourceType)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[#18b5d5]/20 bg-[#292929] p-2.5">
            <div className="text-[10px] font-bold text-[#18b5d5]">الحجم</div>
            <div className="mt-1 text-xs font-bold text-white">{formatBytes(item?.bytes)}</div>
          </div>
          <div className="rounded-lg border border-[#18b5d5]/20 bg-[#292929] p-2.5">
            <div className="text-[10px] font-bold text-[#18b5d5]">الأبعاد</div>
            <div className="mt-1 text-xs font-bold text-white">
              {item?.width && item?.height ? `${item.width}×${item.height}` : '—'}
            </div>
          </div>
        </div>

        {item?.duration != null && (
          <div className="rounded-lg border border-[#18b5d5]/20 bg-[#292929] p-2.5">
            <div className="text-[10px] font-bold text-[#18b5d5]">المدة</div>
            <div className="mt-1 text-xs font-bold text-white">{Number(item.duration).toFixed(2)} ثانية</div>
          </div>
        )}

        <div className="space-y-1.5 rounded-lg border border-[#18b5d5]/20 bg-[#292929] p-2.5 text-[11px] text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="opacity-90">المجلد</span>
            <span className="truncate font-mono">{item?.folder || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="opacity-90">تاريخ الرفع</span>
            <span>{formatDate(item?.cloudinaryCreatedAt || item?.createdAt)}</span>
          </div>
          {src && (
            <div className="flex items-center justify-between gap-2">
              <span className="opacity-90">الرابط</span>
              <a className="font-bold underline underline-offset-2" href={src} target="_blank" rel="noopener noreferrer">
                فتح
              </a>
            </div>
          )}
        </div>

        {canDelete ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={deleting || breaking}
              onClick={() => onRequestBreak && onRequestBreak(item)}
              className="rounded-lg border border-[#18b5d5]/25 bg-transparent px-3 py-2 text-xs font-extrabold text-white disabled:opacity-40"
            >
              {breaking ? 'جاري التعطيل...' : 'تعطيل الرابط'}
            </button>
            <button
              type="button"
              disabled={deleting || breaking}
              onClick={() => onRequestDelete && onRequestDelete(item)}
              className="rounded-lg bg-[#ef4444] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-40"
            >
              {deleting ? 'جاري الحذف...' : 'حذف'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function PublicMediaStorePage() {
  const { storeId: rawStoreId } = useParams()
  const storeId = String(rawStoreId || '').trim()
  const toasts = useToasts()

  const [searchParams, setSearchParams] = useSearchParams()
  const rtParam = String(searchParams.get('type') || '')
  const qParam = String(searchParams.get('q') || '')
  const pageParam = Math.max(1, Number(searchParams.get('page') || 1) || 1)

  const [resourceType, setResourceType] = useState(rtParam)
  const [q, setQ] = useState(qParam)
  const [page, setPage] = useState(pageParam)
  const [limit, setLimit] = useState(24)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ total: 0, items: [], store: null, summary: null })
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)

  const mediaAdminKey = String(import.meta.env.VITE_MEDIA_ADMIN_KEY || '').trim()
  const canDelete = Boolean(mediaAdminKey)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMode, setConfirmMode] = useState('delete')
  const [confirmTarget, setConfirmTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [breaking, setBreaking] = useState(false)
  const [breakingId, setBreakingId] = useState('')

  useEffect(() => setResourceType(rtParam), [rtParam])
  useEffect(() => setQ(qParam), [qParam])
  useEffect(() => setPage(pageParam), [pageParam])

  useEffect(() => {
    const t = globalThis.setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        const nType = String(resourceType || '').trim()
        const nq = String(q || '').trim()

        if (nType) next.set('type', nType)
        else next.delete('type')

        if (nq) next.set('q', nq)
        else next.delete('q')

        if (page > 1) next.set('page', String(page))
        else next.delete('page')

        if (prev.toString() === next.toString()) return prev
        return next
      })
    }, 150)
    return () => globalThis.clearTimeout(t)
  }, [page, q, resourceType, setSearchParams])

  useEffect(() => {
    const controller = new AbortController()
    async function run() {
      if (!storeId) return
      setLoading(true)
      setError('')
      try {
        const res = await requestJson(`/api/public/media/stores/${encodeURIComponent(storeId)}/assets`, {
          query: { resourceType, q, page, limit },
          signal: controller.signal,
        })
        setData({
          total: Number(res?.total || 0) || 0,
          items: Array.isArray(res?.items) ? res.items : [],
          store: res?.store || null,
          summary: res?.summary || null,
        })
      } catch (e) {
        if (e?.code === 'REQUEST_ABORTED') return
        setError(String(e?.message || 'Failed to load assets.'))
        setData({ total: 0, items: [], store: null, summary: null })
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    run()
    return () => controller.abort()
  }, [limit, page, q, refresh, resourceType, storeId])

  async function deleteAssetById(assetId) {
    if (!assetId) return
    if (!canDelete) {
      toasts.error('ميزة الحذف غير مفعّلة على هذا الداشبورد.', 'غير متاح')
      return
    }
    setDeletingId(String(assetId))
    setDeleting(true)
    try {
      await requestJson(`/api/public/media/assets/${encodeURIComponent(String(assetId))}`, {
        method: 'DELETE',
        headers: { 'x-media-admin-key': mediaAdminKey },
      })
      toasts.success('تم حذف الملف بنجاح.', 'تم')
      setRefresh((x) => x + 1)
    } catch (e) {
      toasts.error(String(e?.message || 'فشل حذف الملف.'), 'خطأ')
    } finally {
      setDeleting(false)
      setDeletingId('')
    }
  }

  async function breakAssetLinkById(assetId) {
    if (!assetId) return
    if (!canDelete) {
      toasts.error('ميزة تعطيل الرابط غير مفعّلة على هذا الداشبورد.', 'غير متاح')
      return
    }
    setBreakingId(String(assetId))
    setBreaking(true)
    try {
      toasts.error('ميزة تعطيل الرابط غير متاحة حاليًا.', 'غير مدعوم')
    } finally {
      setBreaking(false)
      setBreakingId('')
    }
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil((Number(data.total || 0) || 0) / limit)), [data.total, limit])
  const items = Array.isArray(data.items) ? data.items : []
  const storeName = String(data?.store?.name || '').trim() || storeId || '—'
  const storeDomain = String(data?.store?.domain || '').trim()
  const storeUrl = String(data?.store?.url || '').trim()
  const storeLogoUrl = String(data?.store?.logoUrl || '').trim()
  const summaryTotal = Number(data?.summary?.total || 0) || 0
  const summaryImages = Number(data?.summary?.images || 0) || 0
  const summaryVideos = Number(data?.summary?.videos || 0) || 0
  const summaryRaws = Number(data?.summary?.raws || 0) || 0
  const summaryLastAt = data?.summary?.lastAt || null

  return (
    <div className="min-h-screen bg-[#292929]" dir="rtl">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-[#18b5d5]/25 bg-[#292929]">
          <div className="px-6 py-7">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-5">
                <StoreLogo name={storeName} logoUrl={storeLogoUrl} />
                
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#18b5d5]">منصة الرفع</div>
                  <h1 className="mt-2 text-2xl font-extrabold text-white">{storeName}</h1>
                  <p className="mt-2 font-mono text-sm text-white opacity-90">{storeId}</p>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {storeDomain && (
                      <a
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#18b5d5]/25 bg-transparent px-3 py-1.5 text-xs font-bold text-white"
                        href={cleanUrl(storeDomain)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        {storeDomain}
                      </a>
                    )}
                    {!storeDomain && storeUrl && (
                      <a
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#18b5d5]/25 bg-transparent px-3 py-1.5 text-xs font-bold text-white"
                        href={cleanUrl(storeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        {storeUrl}
                      </a>
                    )}
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#18b5d5]/25 bg-transparent px-3 py-1.5 text-xs font-bold text-white">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      آخر نشاط: {formatDate(summaryLastAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  to="/stores"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#18b5d5]/25 bg-transparent px-4 py-2.5 text-sm font-extrabold text-white"
                >
                  المتاجر
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#18b5d5]/25 bg-transparent px-4 py-2.5 text-sm font-extrabold text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  رجوع
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#18b5d5]/15 p-6 sm:grid-cols-4">
            <div className="rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-[#18b5d5]/25 bg-transparent">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18b5d5]">إجمالي الملفات</div>
                  <div className="text-xl font-extrabold text-white">{summaryTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-[#18b5d5]/25 bg-transparent">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18b5d5]">الصور</div>
                  <div className="text-xl font-extrabold text-white">{summaryImages.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-[#18b5d5]/25 bg-transparent">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18b5d5]">الفيديوهات</div>
                  <div className="text-xl font-extrabold text-white">{summaryVideos.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-[#18b5d5]/25 bg-transparent">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#18b5d5]">الملفات الخام</div>
                  <div className="text-xl font-extrabold text-white">{summaryRaws.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-[#18b5d5]/25 bg-[#292929] px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-[#18b5d5]/60"
            >
              <option value="">جميع الأنواع</option>
              <option value="image">صور فقط</option>
              <option value="video">فيديو فقط</option>
              <option value="raw">ملفات فقط</option>
            </select>

            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#18b5d5]/25 bg-[#292929] px-3 py-2.5 focus-within:border-[#18b5d5]/60">
              <svg className="h-4 w-4 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1) 
                }}
                placeholder="ابحث باسم الملف أو Public ID..."
                className="flex-1 bg-transparent text-sm font-bold text-white placeholder:text-white placeholder:opacity-70 outline-none"
                spellCheck={false}
              />
            </div>

            <select
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="rounded-lg border border-[#18b5d5]/25 bg-[#292929] px-3 py-2.5 text-sm font-bold text-white outline-none focus:border-[#18b5d5]/60"
            >
              <option value="12">12 عنصر</option>
              <option value="24">24 عنصر</option>
              <option value="36">36 عنصر</option>
              <option value="60">60 عنصر</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs font-bold text-[#18b5d5]">النتائج المعروضة</div>
              <div className="text-lg font-extrabold text-white">{Number(data.total || 0).toLocaleString()}</div>
            </div>
            <div className="h-8 w-px bg-[#18b5d5]/20" />
            <div>
              <div className="text-xs font-bold text-[#18b5d5]">الصفحة</div>
              <div className="text-lg font-extrabold text-white">{page} / {totalPages}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[#18b5d5]/25 bg-transparent px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-[#18b5d5] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>

        <div className="mt-6">
          <ConfirmDialog
            open={confirmOpen}
            title={confirmMode === 'break' ? 'تأكيد تعطيل الرابط' : 'تأكيد الحذف'}
            message={
              confirmMode === 'break'
                ? `هل تريد تعطيل رابط هذا الملف؟ (اللينك القديم هيتكسر)${confirmTarget?.publicId ? ` (${String(confirmTarget.publicId)})` : ''}`
                : `هل أنت متأكد أنك تريد حذف هذا الملف من Cloudinary؟${confirmTarget?.publicId ? ` (${String(confirmTarget.publicId)})` : ''}`
            }
            confirmText={confirmMode === 'break' ? 'تعطيل' : 'حذف'}
            cancelText="إلغاء"
            onCancel={() => {
              if (deleting || breaking) return
              setConfirmOpen(false)
              setConfirmTarget(null)
            }}
            onConfirm={async () => {
              if (deleting || breaking) return
              const id = String(confirmTarget?.id || '').trim()
              const mode = String(confirmMode)
              setConfirmOpen(false)
              setConfirmTarget(null)
              if (mode === 'break') await breakAssetLinkById(id)
              else await deleteAssetById(id)
            }}
          />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loading label="جاري تحميل الملفات..." />
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-6 text-center text-white">
              <svg className="mx-auto mb-3 h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm font-extrabold">{error}</div>
            </div>
          ) : null}

          {!loading && !error ? (
            items.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {items.map((it) => (
                  <MediaCard
                    key={String(it?.id)}
                    item={it}
                    canDelete={canDelete}
                    deleting={deleting && String(deletingId || '') === String(it?.id || '')}
                    breaking={breaking && String(breakingId || '') === String(it?.id || '')}
                    mediaAdminKey={mediaAdminKey}
                    onRequestBreak={(target) => {
                      if (deleting || breaking) return
                      setConfirmMode('break')
                      setConfirmTarget(target)
                      setConfirmOpen(true)
                    }}
                    onRequestDelete={(target) => {
                      if (deleting || breaking) return
                      setConfirmMode('delete')
                      setConfirmTarget(target)
                      setConfirmOpen(true)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#18b5d5]/25 bg-[#292929] p-12 text-center text-white">
                <svg className="mx-auto mb-4 h-16 w-16 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div className="text-sm font-extrabold">لا توجد ملفات مطابقة</div>
                <p className="mt-2 text-xs opacity-90">جرب تغيير الفلتر أو البحث</p>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
