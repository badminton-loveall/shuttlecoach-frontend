/**
 * Card Component
 * Reusable card component matching the dashboard design system
 * Used across Fee Management, Dashboard, and other pages
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardSubtitleProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

// Main Card Component
export const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
  const baseClasses = 'bg-white border border-[#e5e7eb] rounded-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all overflow-hidden';
  const hoverClasses = hover ? 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

// Card Header (for titles)
export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
};

// Card Title
export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-[16px] font-bold text-[#111827] leading-tight tracking-[-0.02em] m-0 ${className}`}>
      {children}
    </h3>
  );
};

// Card Subtitle
export const CardSubtitle: React.FC<CardSubtitleProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-[13px] font-medium text-[#6b7280] m-0 ${className}`}>
      {children}
    </p>
  );
};

// Card Content (for main content)
export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

// Card Description
export const CardDescription: React.FC<CardDescriptionProps> = ({ children, className = '' }) => {
  return (
    <p className={`text-[13px] text-[#6b7280] m-0 mt-1 ${className}`}>
      {children}
    </p>
  );
};

// Card Footer (for actions)
export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-t border-[#e5e7eb] flex items-center gap-3 ${className}`}>
      {children}
    </div>
  );
};

// Export all components
export default Card;
