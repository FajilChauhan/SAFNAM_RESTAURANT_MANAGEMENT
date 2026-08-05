import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

const KitchenDashboard = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center p-8">
      <div className="text-6xl mb-4">👨‍🍳</div>
      <h1 className="text-3xl font-bold text-white mb-2">
        Kitchen Dashboard
      </h1>
      <p className="text-gray-400">
        SAFNAM Kitchen Panel — Coming Soon
      </p>
    </div>
  </div>
)

const KitchenRoutes = () => (
  <ProtectedRoute allowedRoles={['KITCHEN']}>
    <Routes>
      <Route path="/" element={<KitchenDashboard />} />
      <Route path="/*" element={<KitchenDashboard />} />
    </Routes>
  </ProtectedRoute>
)

export default KitchenRoutes
