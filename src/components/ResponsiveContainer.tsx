'use client';

import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  breakpoints?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export function ResponsiveContainer({ 
  children, 
  className = '',
  breakpoints = {
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12'
  }
}: ResponsiveContainerProps) {
  const responsiveClasses = [
    'w-full',
    'mx-auto',
    breakpoints.sm || 'px-4',
    breakpoints.md || 'px-6',
    breakpoints.lg || 'px-8',
    breakpoints.xl || 'px-12'
  ].join(' ');

  return (
    <div className={`${responsiveClasses} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'gap-4',
  className = ''
}: ResponsiveGridProps) {
  const gridCols = [
    `grid-cols-${cols.default || 1}`,
    cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    cols.md ? `md:grid-cols-${cols.md}` : '',
    cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    cols.xl ? `xl:grid-cols-${cols.xl}` : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: ReactNode;
  size?: {
    default?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  className?: string;
}

export function ResponsiveText({ 
  children, 
  size = { default: 'text-sm', sm: 'text-base', md: 'text-lg' },
  className = ''
}: ResponsiveTextProps) {
  const textSizes = [
    size.default || 'text-sm',
    size.sm ? `sm:${size.sm}` : '',
    size.md ? `md:${size.md}` : '',
    size.lg ? `lg:${size.lg}` : '',
    size.xl ? `xl:${size.xl}` : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`${textSizes} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: {
    default?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export function ResponsiveImage({ 
  src, 
  alt, 
  className = '',
  sizes = {
    default: 'w-full h-48',
    sm: 'sm:h-56',
    md: 'md:h-64',
    lg: 'lg:h-72'
  }
}: ResponsiveImageProps) {
  const imageSizes = [
    sizes.default || 'w-full h-48',
    sizes.sm ? `sm:${sizes.sm}` : '',
    sizes.md ? `md:${sizes.md}` : '',
    sizes.lg ? `lg:${sizes.lg}` : '',
    sizes.xl ? `xl:${sizes.xl}` : ''
  ].filter(Boolean).join(' ');

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover rounded-lg ${imageSizes} ${className}`}
    />
  );
}

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function ResponsiveTable({ 
  children, 
  className = '',
  scrollable = true
}: ResponsiveTableProps) {
  const tableClasses = scrollable 
    ? 'overflow-x-auto' 
    : '';

  return (
    <div className={tableClasses}>
      <table className={`w-full ${className}`}>
        {children}
      </table>
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  padding?: {
    default?: string;
    sm?: string;
    md?: string;
    lg?: string;
  };
}

export function ResponsiveCard({ 
  children, 
  className = '',
  padding = {
    default: 'p-4',
    sm: 'sm:p-6',
    md: 'md:p-8'
  }
}: ResponsiveCardProps) {
  const cardPadding = [
    padding.default || 'p-4',
    padding.sm ? `sm:${padding.sm}` : '',
    padding.md ? `md:${padding.md}` : '',
    padding.lg ? `lg:${padding.lg}` : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`rounded-lg bg-white/5 ring-1 ring-white/10 ${cardPadding} ${className}`}>
      {children}
    </div>
  );
}


