import type { ReactNode } from 'react';
import { Header } from './Header';
import type { HeaderVariant } from './Header';

interface LayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
  headerVariant?: HeaderVariant;
  mobileTitle?: string;
}

export const Layout = ({ children, fullWidth, headerVariant, mobileTitle }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header variant={headerVariant} mobileTitle={mobileTitle} />
      <main className={fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {children}
      </main>
    </div>
  );
};
