import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

const ManagerDashboard = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center p-8">
      <div className="text-6xl mb-4">📊</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Manager Dashboard
      </h1>
      <p className="text-gray-500">
        SAFNAM Manager Panel — Coming Soon
      </p>
    </div>
  </div>
)

const ManagerRoutes = () => (
  <ProtectedRoute allowedRoles={['MANAGER']}>
    <Routes>
      <Route path="/" element={<ManagerDashboard />} />
      <Route path="/*" element={<ManagerDashboard />} />
    </Routes>
  </ProtectedRoute>
)

export default ManagerRoutes
