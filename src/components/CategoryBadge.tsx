'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Cpu, 
  Trophy, 
  Music, 
  GraduationCap, 
  Users, 
  MoreHorizontal,
  type LucideIcon 
} from 'lucide-react';

type EventCategory = 'Tech' | 'Sports' | 'Music' | 'Workshop' | 'Social' | 'Other';

interface CategoryBadgeProps {
  category: EventCategory;
  size?: 'sm' | 'default';
  showIcon?: boolean;
  className?: string;
}

const categoryConfig: Record<EventCategory, { 
  icon: LucideIcon; 
  bgColor: string; 
  textColor: string;
  borderColor: string;
}> = {
  Tech: {
    icon: Cpu,
    bgColor: 'bg-blue-100 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  Sports: {
    icon: Trophy,
    bgColor: 'bg-orange-100 dark:bg-orange-950',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-200 dark:border-orange-800',
  },
  Music: {
    icon: Music,
    bgColor: 'bg-purple-100 dark:bg-purple-950',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  Workshop: {
    icon: GraduationCap,
    bgColor: 'bg-green-100 dark:bg-green-950',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  Social: {
    icon: Users,
    bgColor: 'bg-pink-100 dark:bg-pink-950',
    textColor: 'text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-200 dark:border-pink-800',
  },
  Other: {
    icon: MoreHorizontal,
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
};

export function CategoryBadge({ 
  category, 
  size = 'default', 
  showIcon = true,
  className 
}: CategoryBadgeProps) {
  const config = categoryConfig[category] || categoryConfig.Other;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.bgColor,
        config.textColor,
        config.borderColor,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-0.5',
        className
      )}
    >
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />}
      {category}
    </Badge>
  );
}

export { categoryConfig };
