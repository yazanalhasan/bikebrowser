import { useState, useEffect, useRef } from 'react';

/**
 * useLazyImage Hook
 * 
 * Loads image only when element is near viewport using IntersectionObserver.
 * Returns loading state and ref to attach to image container.
 * 
 * @param {string} src - Image source URL
 * @param {Object} options - { threshold, rootMargin }
 * @returns {Object} { imageSrc, isLoading, ref }
 */
export function useLazyImage(src, options = {}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (!src) return;

    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load image immediately
      setImageSrc(src);
      setIsLoading(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element is visible, start loading image
            const img = new Image();
            
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };

            img.onerror = () => {
              console.error('Failed to load image:', src);
              setIsLoading(false);
            };

            img.src = src;

            // Stop observing once we've started loading
            observer.unobserve(element);
          }
        });
      },
      {
        threshold: options.threshold || 0.01,
        rootMargin: options.rootMargin || '50px' // Start loading 50px before visible
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [src, options.threshold, options.rootMargin]);

  return { imageSrc, isLoading, ref };
}

/**
 * LazyImage Component
 * 
 * Optimized image component with lazy loading and skeleton placeholder.
 * 
 * Props:
 * - src: Image source URL
 * - alt: Alt text
 * - className: CSS classes
 * - placeholderClassName: CSS classes for skeleton
 * - threshold: IntersectionObserver threshold (default: 0.01)
 * - rootMargin: IntersectionObserver rootMargin (default: '50px')
 */
export function LazyImage({
  src,
  alt = '',
  className = '',
  placeholderClassName = '',
  threshold,
  rootMargin,
  ...props
}) {
  const { imageSrc, isLoading, ref } = useLazyImage(src, { threshold, rootMargin });

  return (
    <div ref={ref} className="relative">
      {isLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse ${placeholderClassName}`}
          aria-label="Loading image"
        />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * LazyBackgroundImage Component
 * 
 * Lazy loads a background image.
 * 
 * Props:
 * - src: Image source URL
 * - className: CSS classes
 * - children: Content to render over background
 */
export function LazyBackgroundImage({
  src,
  className = '',
  children,
  threshold,
  rootMargin
}) {
  const { imageSrc, isLoading, ref } = useLazyImage(src, { threshold, rootMargin });

  return (
    <div
      ref={ref}
      className={className}
      style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : {}}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {children}
    </div>
  );
}

export default LazyImage;
