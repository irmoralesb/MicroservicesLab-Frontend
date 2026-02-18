import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/layout/MainLayout'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { LoginPage } from '@/features/login/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { ServiceCatalogPage } from '@/features/admin/ServiceCatalogPage'
import { RoleCatalogPage } from '@/features/admin/RoleCatalogPage'
import { RolePermissionsPage } from '@/features/admin/RolePermissionsPage'
import { UsersPage } from '@/features/admin/UsersPage'
import { UserServicesPage } from '@/features/admin/UserServicesPage'

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
        {/* Administration — Sites */}
        <Route
          path="/admin/sites"
          element={
            <ProtectedRoute>
              <ServiceCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sites/:serviceId/roles"
          element={
            <ProtectedRoute>
              <RoleCatalogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sites/:serviceId/roles/:roleId/permissions"
          element={
            <ProtectedRoute>
              <RolePermissionsPage />
            </ProtectedRoute>
          }
        />
        {/* Administration — Users */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users/:userId/services"
          element={
            <ProtectedRoute>
              <UserServicesPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
