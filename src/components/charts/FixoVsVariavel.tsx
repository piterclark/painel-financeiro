'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { MensalCategoria } from '@/types/financeiro';
import { formatBRL, formatMonthYear } from '@/lib/format';
import { ChartContainer } from './ChartContainer';

interface Props {
  data: MensalCategoria[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  );
}

export function FixoVsVariavel({ data }: Props) {
  const despesas = data.filter((d) => d.tipo === 'despesa');
  const meses = Array.from(new Set(despesas.map((d) => d.mesCompetencia))).sort();

  const chartData = meses.map((mes) => {
    const fixo = despesas.filter((d) => d.mesCompetencia === mes && d.natureza === 'fixo').reduce((s, d) => s + d.total, 0);
    const variavel = despesas.filter((d) => d.mesCompetencia === mes && d.natureza === 'variavel').reduce((s, d) => s + d.total, 0);
    return { periodo: formatMonthYear(mes), fixo, variavel };
  });

  return (
    <ChartContainer title="Fixo vs Variável" isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="fixo" name="Fixo" stackId="a" fill="#6366f1" />
          <Bar dataKey="variavel" name="Variável" stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
