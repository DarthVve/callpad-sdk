import { useEffect } from 'react';
import './PaginationControls.css';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  hasNextPage,
  hasPreviousPage,
}: PaginationControlsProps) {
  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && hasPreviousPage) {
        onPreviousPage();
      } else if (event.key === 'ArrowRight' && hasNextPage) {
        onNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasNextPage, hasPreviousPage, onNextPage, onPreviousPage]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-controls">
      <button
        className="pagination-button prev"
        onClick={onPreviousPage}
        disabled={!hasPreviousPage}
        title="Previous page (←)"
      >
        ◀
      </button>
      
      <span className="page-indicator">
        {currentPage}/{totalPages}
      </span>
      
      <button
        className="pagination-button next"
        onClick={onNextPage}
        disabled={!hasNextPage}
        title="Next page (→)"
      >
        ▶
      </button>
    </div>
  );
}