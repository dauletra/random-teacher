import { useRef, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryRowProps {
  title: string;
  children: ReactNode;
  itemCount: number;
}

export const CategoryRow = ({ title, children, itemCount }: CategoryRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <div>
      <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">
        {title}
      </h2>

      <div className="relative group/scroll">
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-2"
        >
          {children}
        </div>

        {itemCount > 3 && (
          <>
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 opacity-0 group-hover/scroll:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-10 h-10 items-center justify-center bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 opacity-0 group-hover/scroll:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
