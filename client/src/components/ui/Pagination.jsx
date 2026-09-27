import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from './Button';

const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  className 
}) => {
  const pages = totalPages || Math.ceil((totalItems || 0) / itemsPerPage) || 1;

  if (pages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between px-4 py-3 sm:px-6', className)}>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">
            Showing <span className="font-medium text-slate-200">Page {currentPage}</span> of <span className="font-medium text-slate-200">{pages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-l-md rounded-r-none border border-slate-700 hover:bg-slate-800 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous</span>
            </Button>
            
            <div className="flex items-center px-4 border-y border-slate-700 bg-slate-800/50 text-sm font-medium text-slate-200">
              {currentPage} / {pages}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === pages}
              className="rounded-r-md rounded-l-none border border-slate-700 hover:bg-slate-800 px-2"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next</span>
            </Button>
          </nav>
        </div>
      </div>
      
      {/* Mobile pagination */}
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <div className="flex items-center px-4 text-sm font-medium text-slate-300">
          {currentPage} / {pages}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === pages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export { Pagination };
export default Pagination;
