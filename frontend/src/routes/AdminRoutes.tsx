import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

const AdminDashboard = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center p-8">
      <div className="text-6xl mb-4">⚙️</div>
      <h1 className="text-3xl font-bold text-white mb-2">
        Admin Dashboard
      </h1>
      <p className="text-gray-400">
        SAFNAM Admin Panel — Coming Soon
      </p>
    </div>
  </div>
)

const AdminRoutes = () => (
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/*" element={<AdminDashboard />} />
    </Routes>
  </ProtectedRoute>
)

export default AdminRoutes
