import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SavingsPage from './pages/SavingsPage';
import NetWorthPage from './pages/NetWorthPage';
import RothIRAPage from './pages/RothIRAPage';
import { PasswordGate } from './components/PasswordGate';

function HomeRoute() {
  const navigate = useNavigate();

  return (
    <HomePage
      onNavigate={(page) => {
        if (page === 'networth') navigate('/net-worth');
        if (page === 'savings') navigate('/savings');
        if (page === 'roth') navigate('/roth-ira');
      }}
    />
  );
}

// Add a route handler wrapper for NetWorthPage
function NetWorthRoute() {
  const navigate = useNavigate();

  return (
    <NetWorthPage
      onNavigate={(page) => {
        if (page === 'networth') navigate('/net-worth');
        if (page === 'savings') navigate('/savings');
        if (page === 'roth') navigate('/roth-ira');
      }}
    />
  );
}

export default function App() {
  return (
    <PasswordGate>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900 text-slate-100">
          {/* Main Navigation Bar */}
          <nav className="bg-slate-800/80 border-b border-slate-700 backdrop-blur sticky top-0 z-50 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <NavLink
                to="/"
                className="text-xl font-bold text-white tracking-tight hover:text-emerald-400 transition-colors"
              >
                Finance Hub
              </NavLink>
              <div className="flex gap-2">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  Overview
                </NavLink>
                <NavLink
                  to="/savings"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  Savings
                </NavLink>
                <NavLink
                  to="/roth-ira"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  Roth IRA
                </NavLink>
                <NavLink
                  to="/net-worth"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  Net Worth
                </NavLink>
              </div>
            </div>
          </nav>

          {/* Page Body */}
          <main className="max-w-7xl mx-auto p-6 md:p-10">
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/savings" element={<SavingsPage />} />
              <Route path="/net-worth" element={<NetWorthRoute />} />
              <Route path="/roth-ira" element={<RothIRAPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </PasswordGate>
  );
}