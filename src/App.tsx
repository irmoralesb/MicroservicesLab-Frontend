import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layout/MainLayout'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { LoginPage } from '@/features/login/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { AdminPage } from '@/features/admin/AdminPage'
import { ServiceCatalogPage } from '@/features/admin/ServiceCatalogPage'
import { RoleCatalogPage } from '@/features/admin/RoleCatalogPage'
import { RolePermissionsPage } from '@/features/admin/RolePermissionsPage'

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
        <Route
          path="/admin/services"
          element={
            <ProtectedRoute>
              <ServiceCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute>
              <RoleCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles/:roleId/permissions"
          element={
            <ProtectedRoute>
              <RolePermissionsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
