import { Badge } from '../components/ui/Badge.jsx'
import { useNavigate } from 'react-router-dom'

function QuickCard({ title, description, onClick, tone = 'slate' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:bg-slate-50"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <Badge tone={tone}>Open</Badge>
      </div>
      <div className="mt-2 text-sm text-slate-600">{description}</div>
    </button>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">Overview</div>
          <div className="mt-1 text-sm text-slate-600">
            Uses only live Salla data for any pricing/stock decisions.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="slate">Bearer Auth</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickCard
          title="منصة الرفع"
          description="Upload and manage media assets."
          onClick={() => navigate('/media-platform')}
          tone="sky"
        />
        <QuickCard title="Products" description="Browse live products & variants from Salla." onClick={() => navigate('/products')} tone="slate" />
        <QuickCard title="Public Media" description="Public listing of stores and their media." onClick={() => navigate('/public-media')} tone="green" />
      </div>
    </div>
  )
}
