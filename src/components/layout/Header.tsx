import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SITE_NAME } from '../../config/constants';
import { isAdmin } from '../../config/adminEmails';

export type HeaderVariant = 'default' | 'back' | 'hidden-mobile';

interface HeaderProps {
  variant?: HeaderVariant;
  mobileTitle?: string;
}

export const Header = ({ variant = 'default', mobileTitle }: HeaderProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDashboard = location.pathname === '/dashboard';

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuOpen]);

  // Avatar rendered as JSX (not a component to avoid remounting on re-render)
  const avatarSmall = user ? (
    user.photoURL ? (
      <img
        src={user.photoURL}
        alt={user.displayName || 'User'}
        className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
      </div>
    )
  ) : null;

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${variant === 'hidden-mobile' ? 'hidden md:block' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">

          {/* === LEFT SIDE === */}

          {/* Desktop left: always logo + text */}
          <div className="hidden md:flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <svg
                className="w-10 h-10 flex-shrink-0"
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="64" height="64" rx="12" fill="#4f46e5" />
                <polygon points="32,14 48,24 32,34 16,24" fill="#a5b4fc" />
                <polygon points="16,24 32,34 32,50 16,40" fill="#818cf8" />
                <polygon points="32,34 48,24 48,40 32,50" fill="#6366f1" />
                <polygon
                  points="50,12 52,16 56,16 53,19 54,23 50,20 46,23 47,19 44,16 48,16"
                  fill="white"
                />
              </svg>
              <span className="text-xl font-bold text-gray-900">
                {isDashboard ? SITE_NAME : 'Барлық сыныптар'}
              </span>
            </Link>
          </div>

          {/* Mobile left: depends on variant */}
          <div className="md:hidden flex items-center gap-2 min-w-0">
            {variant === 'back' ? (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-base font-semibold text-gray-900 truncate">
                  {mobileTitle || 'Артқа'}
                </span>
              </>
            ) : (
              <Link to="/dashboard" className="flex items-center">
                <svg
                  className="w-8 h-8 flex-shrink-0"
                  viewBox="0 0 64 64"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="64" height="64" rx="12" fill="#4f46e5" />
                  <polygon points="32,14 48,24 32,34 16,24" fill="#a5b4fc" />
                  <polygon points="16,24 32,34 32,50 16,40" fill="#818cf8" />
                  <polygon points="32,34 48,24 48,40 32,50" fill="#6366f1" />
                  <polygon
                    points="50,12 52,16 56,16 53,19 54,23 50,20 46,23 47,19 44,16 48,16"
                    fill="white"
                  />
                </svg>
              </Link>
            )}
          </div>

          {/* === RIGHT SIDE === */}

          {/* Desktop right: nav links + avatar + logout */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/"
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Витрина
                </Link>

                <Link
                  to="/my-artifacts"
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Артефакттарым
                </Link>

                {isAdmin(user.email) && (
                  <Link
                    to="/admin"
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Әкімші
                  </Link>
                )}

                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || 'Қолданушы'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Шығу
                </button>
              </>
            )}
          </div>

          {/* Mobile right: avatar dropdown */}
          <div className="md:hidden">
            {user && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {avatarSmall}
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || 'Қолданушы'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      Менің сыныптарым
                    </Link>
                    <Link
                      to="/"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      Витрина
                    </Link>
                    <Link
                      to="/my-artifacts"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    >
                      Артефакттарым
                    </Link>

                    {isAdmin(user.email) && (
                      <Link
                        to="/admin"
                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                      >
                        Әкімші
                      </Link>
                    )}

                    <div className="border-t border-gray-100">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100"
                      >
                        Шығу
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
