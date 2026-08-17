'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { MensalCategoria } from '@/types/financeiro';
import { formatBRL, formatMonthYear } from '@/lib/format';
import { ChartContainer } from './ChartContainer';

interface Props {
  data: MensalCategoria[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-xs max-w-[200px]">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
          <span className="text-slate-400">{p.dataKey}:</span>
          <span className="text-white">{formatBRL(p.value)}</span>
        </p>
      ))}
      <p className="text-slate-300 font-medium mt-1 pt-1 border-t border-white/10">
        Total: {formatBRL(total)}
      </p>
    </div>
  );
}

export function BarrasEmpilhadasMensal({ data }: Props) {
  const despesas = data.filter((d) => d.tipo === 'despesa');

  const meses = Array.from(new Set(despesas.map((d) => d.mesCompetencia))).sort();
  const cats = Array.from(new Set(despesas.map((d) => d.categoriaNome)));
  const catColors = new Map<string, string>();
  for (const d of despesas) catColors.set(d.categoriaNome, d.categoriaCor);

  const chartData = meses.map((mes) => {
    const row: Record<string, number | string> = { periodo: formatMonthYear(mes) };
    for (const cat of cats) {
      const found = despesas.find((d) => d.mesCompetencia === mes && d.categoriaNome === cat);
      row[cat] = found ? found.total : 0;
    }
    return row;
  });

  return (
    <ChartContainer title="Evolução Mensal por Categoria" isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} barCategoryGap="35%" margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#1C2733" />
          <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} />
          {cats.map((cat, i) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="a"
              fill={catColors.get(cat) || '#6366f1'}
              maxBarSize={48}
              radius={i === cats.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
