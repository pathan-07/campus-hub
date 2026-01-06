'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

export function Loader({ size = 'md', text, fullScreen = false, className }: LoaderProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        {content}
      </div>
    );
  }

  return content;
}
