import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layout/MainLayout'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { LoginPage } from '@/features/login/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { AdminPage } from '@/features/admin/AdminPage'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
