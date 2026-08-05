import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import AppRouter from './routes/AppRouter'

function App() {
  const { isAuthenticated } = useAuthStore()
  
  return <AppRouter />
}

export default App
