'use client';

import { Card, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/format';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function ChartContainer({ title, children, className, isEmpty, emptyMessage }: ChartContainerProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardTitle>{title}</CardTitle>
      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-slate-500">{emptyMessage || 'Sem dados para o período'}</p>
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
