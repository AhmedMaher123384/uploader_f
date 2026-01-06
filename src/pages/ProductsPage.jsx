import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { ProductsExplorer } from '../components/products/ProductsExplorer.jsx'

export function ProductsPage() {
  const { token, logout } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">Products</div>
          <div className="mt-1 text-sm text-slate-600">Source of truth is Salla.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <ProductsExplorer
        token={token}
        onUnauthorized={logout}
        refreshKey={refreshKey}
        title="Live Products & Variants"
        subtitle="Expand any product to load its variants live from Salla."
        enableDrag={false}
        showFilters
        initialStatus="all"
      />
    </div>
  )
}
