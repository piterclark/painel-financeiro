'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MensalCategoria } from '@/types/financeiro';
import { formatBRL } from '@/lib/format';
import { ChartContainer } from './ChartContainer';

interface Props {
  data: MensalCategoria[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-300 font-medium">{name}</p>
      <p className="text-white font-bold">{formatBRL(value)}</p>
    </div>
  );
}

export function DonutCategorias({ data }: Props) {
  const despesas = data.filter((d) => d.tipo === 'despesa');
  const catMap = new Map<string, { nome: string; cor: string; valor: number }>();
  for (const d of despesas) {
    const cur = catMap.get(d.categoriaId) || { nome: d.categoriaNome, cor: d.categoriaCor, valor: 0 };
    cur.valor += d.total;
    catMap.set(d.categoriaId, cur);
  }
  const chartData = Array.from(catMap.values()).sort((a, b) => b.valor - a.valor);
  const total = chartData.reduce((s, c) => s + c.valor, 0);

  return (
    <ChartContainer title="Despesas por Categoria" isEmpty={chartData.length === 0}>
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="valor"
              nameKey="nome"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={entry.nome} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="w-full grid grid-cols-2 gap-1 mt-2">
          {chartData.slice(0, 8).map((c) => (
            <div key={c.nome} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.cor }} />
              <span className="truncate">{c.nome}</span>
              <span className="ml-auto text-slate-300 font-medium">
                {total > 0 ? Math.round((c.valor / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
}
