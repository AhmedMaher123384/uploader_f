import { Navigate, Route, BrowserRouter, Routes, useParams } from 'react-router-dom'
import { ToastProvider } from './components/ToastProvider.jsx'
import { PublicMediaDashboardPage } from './pages/PublicMediaDashboardPage.jsx'
import { PublicMediaStorePage } from './pages/PublicMediaStorePage.jsx'

function LegacyPublicMediaStoreRedirect() {
  const { storeId } = useParams()
  return <Navigate to={`/stores/${encodeURIComponent(String(storeId || '').trim())}`} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicMediaDashboardPage />} />
      <Route path="/stores/:storeId" element={<PublicMediaStorePage />} />

      <Route path="/public-media" element={<Navigate to="/" replace />} />
      <Route path="/public-media/:storeId" element={<LegacyPublicMediaStoreRedirect />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  )
}
