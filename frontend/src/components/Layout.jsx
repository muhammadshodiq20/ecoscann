import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/scan', label: 'Scan', emoji: '📷' },
  { path: '/dashboard', label: 'Statistik', emoji: '📊' },
  { path: '/food', label: 'Stok', emoji: '🥦' },
  { path: '/tips', label: 'Tips', emoji: '💡' },
  { path: '/profile', label: 'Profil', emoji: '👤' }
]

export default function Layout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 8 10 8 18C8 22.4183 11.5817 26 16 26C20.4183 26 24 22.4183 24 18C24 10 16 4 16 4Z" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-lg">EcoScan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-50 border border-green-100 px-3 py-1 rounded-full flex items-center gap-1">
            <span className="text-xs">⭐</span>
            <span className="text-xs font-semibold text-green-700">{user?.ecoPoints || 0}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 px-2 py-1 z-20">
        <div className="flex items-center justify-around">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`
              }>
              {({ isActive }) => (
                <>
                  <span className="text-lg">{item.emoji}</span>
                  <span className={`text-xs font-medium ${isActive ? 'text-green-600' : 'text-gray-400'}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
