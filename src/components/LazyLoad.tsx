'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyLoad({ 
  children, 
  fallback = <div className="animate-pulse bg-white/10 rounded h-32" />,
  threshold = 0.1,
  rootMargin = '50px',
  className = ''
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true);
          setHasLoaded(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={elementRef} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({ 
  src, 
  alt, 
  className = '',
  placeholder,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <LazyLoad
      fallback={
        <div className={`bg-white/10 rounded animate-pulse ${className}`}>
          {placeholder && (
            <div className="flex items-center justify-center h-full text-white/50">
              {placeholder}
            </div>
          )}
        </div>
      }
    >
      <div className="relative">
        {!isLoaded && !hasError && (
          <div className={`absolute inset-0 bg-white/10 rounded animate-pulse ${className}`}>
            {placeholder && (
              <div className="flex items-center justify-center h-full text-white/50">
                {placeholder}
              </div>
            )}
          </div>
        )}
        
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
        />
        
        {hasError && (
          <div className={`absolute inset-0 bg-red-500/10 rounded flex items-center justify-center ${className}`}>
            <div className="text-red-400 text-sm">画像の読み込みに失敗しました</div>
          </div>
        )}
      </div>
    </LazyLoad>
  );
}

interface LazyComponentProps {
  component: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: ReactNode;
  props?: any;
  className?: string;
}

export function LazyComponent({ 
  component, 
  fallback = <div className="animate-pulse bg-white/10 rounded h-32" />,
  props = {},
  className = ''
}: LazyComponentProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        const module = await component();
        if (isMounted) {
          setComponent(() => module.default);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err as Error);
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [component]);

  if (error) {
    return (
      <div className={`bg-red-500/10 rounded p-4 text-red-400 ${className}`}>
        コンポーネントの読み込みに失敗しました: {error.message}
      </div>
    );
  }

  if (isLoading || !Component) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div className={className}>
      <Component {...props} />
    </div>
  );
}


