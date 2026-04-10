import { memo, useRef, useEffect, useState, useCallback } from 'react';

/**
 * Virtual Grid Component
 * 
 * Renders only visible items in a grid layout to optimize performance
 * for large lists (e.g., 50+ video cards).
 * 
 * Features:
 * - Only renders items in viewport + buffer
 * - Smooth scrolling with scroll anchoring
 * - Configurable item size and columns
 * - Automatic resize handling
 * 
 * Props:
 * - items: Array of items to render
 * - renderItem: Function (item, index) => ReactNode
 * - itemHeight: Estimated height of each item in pixels
 * - columns: Number of columns in grid (default: 3)
 * - gap: Gap between items in pixels (default: 24)
 * - overscan: Number of items to render outside viewport (default: 3)
 */
const VirtualGrid = memo(function VirtualGrid({
  items = [],
  renderItem,
  itemHeight = 400,
  columns = 3,
  gap = 24,
  overscan = 3,
  className = ''
}) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  // Calculate which rows are visible
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  // Calculate which items to render
  const startIndex = startRow * columns;
  const endIndex = Math.min(items.length, endRow * columns);
  const visibleItems = items.slice(startIndex, endIndex);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    setContainerHeight(container.clientHeight);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      {/* Spacer for scroll height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            position: 'absolute',
            top: startRow * rowHeight,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`
          }}
        >
          {visibleItems.map((item, localIndex) => {
            const actualIndex = startIndex + localIndex;
            return (
              <div key={item.id || item.videoId || actualIndex}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/**
 * Simple Virtual List (single column)
 * 
 * Simpler version for single-column lists.
 */
const VirtualList = memo(function VirtualList({
  items = [],
  renderItem,
  itemHeight = 100,
  overscan = 5,
  className = ''
}) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const totalHeight = items.length * itemHeight;

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    setContainerHeight(container.clientHeight);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIndex * itemHeight, left: 0, right: 0 }}>
          {visibleItems.map((item, localIndex) => {
            const actualIndex = startIndex + localIndex;
            return (
              <div key={item.id || actualIndex} style={{ height: itemHeight }}>
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export { VirtualGrid, VirtualList };
export default VirtualGrid;
