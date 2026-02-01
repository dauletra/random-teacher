import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Артефакты', exact: true },
    { path: '/admin/subjects', label: 'Предметы' },
    { path: '/admin/tags', label: 'Теги' },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-xl font-bold text-gray-900">
                Random Teacher
              </Link>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Админ-панель
              </span>
            </div>
            <Link
              to="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Вернуться в приложение
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex gap-4 mb-8 border-b border-gray-200">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`pb-3 px-1 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive(item.path, item.exact)
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
};
