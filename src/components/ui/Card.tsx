import React from 'react';
import { cn } from '@/lib/format';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-[#1a1f2e] border border-white/5 rounded-xl p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-medium text-slate-400 mb-4', className)}>
      {children}
    </h3>
  );
}
