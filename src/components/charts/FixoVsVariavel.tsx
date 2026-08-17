'use client';

import { MensalCategoria } from '@/types/financeiro';
import { formatBRL } from '@/lib/format';
import { ChartContainer } from './ChartContainer';

interface Props {
  data: MensalCategoria[];
}

export function FixoVsVariavel({ data }: Props) {
  const despesas = data.filter((d) => d.tipo === 'despesa');

  const fixoTotal    = despesas.filter((d) => d.natureza === 'fixo').reduce((s, d) => s + d.total, 0);
  const variavelTotal = despesas.filter((d) => d.natureza === 'variavel').reduce((s, d) => s + d.total, 0);
  const total        = fixoTotal + variavelTotal;

  const isEmpty = total === 0;
  const fixoPct   = isEmpty ? 50 : Math.round((fixoTotal / total) * 100);
  const variavelPct = 100 - fixoPct;

  return (
    <ChartContainer title="Fixo vs Variável" isEmpty={isEmpty}>
      <div className="flex flex-col gap-5 py-2 h-[260px] justify-center">
        {/* Barra 100% empilhada horizontal */}
        <div className="flex rounded-lg overflow-hidden h-12 text-xs font-semibold">
          <div
            className="flex items-center justify-center text-white transition-all"
            style={{ width: `${fixoPct}%`, background: '#6366f1' }}
          >
            {fixoPct > 12 && `${fixoPct}%`}
          </div>
          <div
            className="flex items-center justify-center text-white transition-all"
            style={{ width: `${variavelPct}%`, background: '#f59e0b' }}
          >
            {variavelPct > 12 && `${variavelPct}%`}
          </div>
        </div>

        {/* Legenda */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#6366f1]" />
              <span className="text-xs text-slate-400">Fixo</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{formatBRL(fixoTotal)}</span>
            <span className="text-xs text-slate-500">{fixoPct}% do total</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
              <span className="text-xs text-slate-400">Variável</span>
            </div>
            <span className="text-lg font-bold text-white tabular-nums">{formatBRL(variavelTotal)}</span>
            <span className="text-xs text-slate-500">{variavelPct}% do total</span>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Total no período: <span className="text-slate-300 font-medium tabular-nums">{formatBRL(total)}</span>
        </p>
      </div>
    </ChartContainer>
  );
}
