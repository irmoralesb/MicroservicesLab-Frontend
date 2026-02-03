import { Outlet } from 'react-router-dom'
import { Header } from '@/layout/Header'

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
