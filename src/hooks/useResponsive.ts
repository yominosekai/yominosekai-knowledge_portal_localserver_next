'use client';

import { useState, useEffect } from 'react';

interface BreakpointConfig {
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

const defaultBreakpoints: BreakpointConfig = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
};

export function useResponsive(breakpoints: BreakpointConfig = defaultBreakpoints) {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0
  });

  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('xs');

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });

      // ブレークポイントを判定
      if (window.innerWidth >= breakpoints.xl) {
        setBreakpoint('xl');
      } else if (window.innerWidth >= breakpoints.lg) {
        setBreakpoint('lg');
      } else if (window.innerWidth >= breakpoints.md) {
        setBreakpoint('md');
      } else if (window.innerWidth >= breakpoints.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    }

    // 初期化
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]);

  const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
  const isTablet = breakpoint === 'md';
  const isDesktop = breakpoint === 'lg' || breakpoint === 'xl';
  const isLargeScreen = breakpoint === 'xl';

  return {
    windowSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    width: windowSize.width,
    height: windowSize.height
  };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

export function useBreakpoint(breakpoint: keyof BreakpointConfig): boolean {
  const query = `(min-width: ${defaultBreakpoints[breakpoint]}px)`;
  return useMediaQuery(query);
}

export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    function handleOrientationChange() {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    }

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
}

export function useViewportSize() {
  const { width, height } = useResponsive();
  
  return {
    width,
    height,
    aspectRatio: width / height,
    isWide: width > height,
    isTall: height > width
  };
}


