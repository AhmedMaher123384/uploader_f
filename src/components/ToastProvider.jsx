import { useMemo } from 'react'
import { ToastContext } from './toastContext.js'
import { confirmDanger, friendlyErrorMessage, showApiErrorPopup, toastError, toastInfo, toastSuccess, toastWarn } from '../lib/alerts.js'

export function ToastProvider({ children }) {
  const api = useMemo(() => {
    return {
      push: (t) => {
        const type = String(t?.type || 'info')
        const title = t?.title || undefined
        const message = t?.message || ''
        const timeoutMs = typeof t?.timeoutMs === 'number' ? t.timeoutMs : undefined
        if (type === 'success') return toastSuccess(message, title, { timeoutMs })
        if (type === 'error') return toastError(message, title, { timeoutMs })
        if (type === 'warning' || type === 'warn') return toastWarn(message, title, { timeoutMs })
        return toastInfo(message, title, { timeoutMs })
      },
      success: (message, title, opts) => toastSuccess(message, title, opts),
      error: (message, title, opts) => toastError(message, title, opts),
      info: (message, title, opts) => toastInfo(message, title, opts),
      warn: (message, title, opts) => toastWarn(message, title, opts),
      apiError: async (err, title) => {
        const msg = friendlyErrorMessage(err)
        toastError(msg, title || 'خطأ')
        if (String(err?.code || '') === 'VALIDATION_ERROR') {
          await showApiErrorPopup(err, { title: title || 'خطأ' })
        }
      },
      confirmDanger: async (opts) => await confirmDanger(opts),
    }
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {children}
    </ToastContext.Provider>
  )
}
