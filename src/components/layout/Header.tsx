import { useAuth } from '../../hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import { SITE_NAME } from '../../config/constants';
import { isAdmin } from '../../config/adminEmails';

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <svg
                className="w-10 h-10"
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
                {isDashboard ? SITE_NAME : 'Все классы'}
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  to="/"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Витрина
                </Link>

                {isAdmin(user.email) && (
                  <Link
                    to="/admin"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Админ
                  </Link>
                )}

                <div className="flex items-center space-x-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.displayName || 'Пользователь'}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                >
                  Выход
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
