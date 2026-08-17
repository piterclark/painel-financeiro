'use client';

import { OrcadoRealizado } from '@/types/financeiro';
import { formatBRL } from '@/lib/format';
import { ChartContainer } from './ChartContainer';

interface Props {
  data: OrcadoRealizado[];
}

export function OrcadoVsRealizado({ data }: Props) {
  const sorted = [...data].sort((a, b) => b.percentual - a.percentual);

  return (
    <ChartContainer title="Orçado vs Realizado" isEmpty={data.length === 0}>
      <div className="space-y-3">
        {sorted.map((item) => {
          const over = item.percentual > 100;
          const pct = Math.min(item.percentual, 100);
          return (
            <div key={item.categoriaId}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.cor }} />
                  <span className="text-slate-300">{item.categoriaNome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={over ? 'text-red-400 font-medium' : 'text-slate-400'}>
                    {formatBRL(item.realizado)}
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-500">{formatBRL(item.valorLimite)}</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: over ? '#ef4444' : item.percentual > 80 ? '#f59e0b' : item.cor,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-0.5">
                <span className={over ? 'text-red-400' : 'text-slate-500'}>
                  {item.percentual.toFixed(0)}%
                </span>
                <span className={item.saldo >= 0 ? 'text-slate-500' : 'text-red-400'}>
                  {item.saldo >= 0 ? `sobram ${formatBRL(item.saldo)}` : `excedeu ${formatBRL(-item.saldo)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ChartContainer>
  );
}
