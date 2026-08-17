'use client';

import { Lancamento } from '@/types/financeiro';
import { formatBRL, formatDate } from '@/lib/format';
import { ChartContainer } from './ChartContainer';

interface Props {
  data: Lancamento[];
}

export function TopGastos({ data }: Props) {
  const max = data[0]?.valor || 1;

  return (
    <ChartContainer title="Top 10 Maiores Gastos" isEmpty={data.length === 0}>
      <div className="space-y-2">
        {data.map((l, i) => (
          <div key={l.id}>
            <div className="flex items-center justify-between text-xs mb-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-slate-600 w-4 text-right flex-shrink-0">{i + 1}</span>
                <span className="text-slate-300 truncate">{l.descricao}</span>
                {l.categoriaNome && (
                  <span
                    className="px-1.5 py-0.5 rounded text-xs flex-shrink-0"
                    style={{ backgroundColor: (l.categoriaCor || '#94a3b8') + '25', color: l.categoriaCor || '#94a3b8' }}
                  >
                    {l.categoriaNome}
                  </span>
                )}
              </div>
              <span className="text-red-400 font-medium flex-shrink-0 ml-2">{formatBRL(l.valor)}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(l.valor / max) * 100}%`,
                  backgroundColor: l.categoriaCor || '#6366f1',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartContainer>
  );
}
