import React, { useState } from 'react';
import { DASHBOARD_PASSWORD } from '../utils/constants';

export const PasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hub_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === DASHBOARD_PASSWORD) {
      localStorage.setItem('hub_auth', 'true');
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hub_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4 text-white">
        <form 
          onSubmit={handleSubmit} 
          className="bg-[#161b22] border border-[#30363d] p-8 rounded-xl shadow-2xl w-full max-w-sm flex flex-col gap-4"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-100">Finance Hub</h1>
            <p className="text-sm text-slate-400 mt-1">Enter password to view dashboard</p>
          </div>

          <div>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-white focus:outline-none focus:border-emerald-500 text-sm"
              autoFocus
            />
            {error && (
              <p className="text-rose-400 text-xs mt-2 text-center">
                Incorrect password. Please try again.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Unlock Access
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      {/* Optional Logout Button overlay */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-[#161b22] border border-[#30363d] text-slate-400 hover:text-white px-3 py-1.5 rounded-md text-xs transition-colors"
        >
          Lock Dashboard
        </button>
      </div>
      {children}
    </div>
  );
};
