import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/scan',      icon: '📷', label: 'Scan' },
  { to: '/dashboard', icon: '📊', label: 'Statistik' },
  { to: '/tips',      icon: '💡', label: 'Tips' },
  { to: '/profile',   icon: '👤', label: 'Profil' },
]

export default function Layout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #085041, #1D9E75)' }}>
            <span className="text-white text-sm">🌿</span>
          </div>
          <span className="font-bold text-eco-700">EcoScan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">
            <span className="text-sm">⭐</span>
            <span className="text-sm font-bold">{user?.ecoPoints || 0}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-100 px-2 py-2 z-30 shadow-lg">
        <div className="flex items-center justify-around">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-eco-600 bg-eco-50' : 'text-gray-400 hover:text-gray-600'
                }`
              }>
              {({ isActive }) => (
                <>
                  <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`}>{n.icon}</span>
                  <span className={`text-xs font-medium ${isActive ? 'text-eco-600' : 'text-gray-400'}`}>
                    {n.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
