'use client';

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
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
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  );
}

export function ReceitaVsDespesa({ data }: Props) {
  const meses = Array.from(new Set(data.map((d) => d.mesCompetencia))).sort();

  const chartData = meses.map((mes) => {
    const receita = data.filter((d) => d.mesCompetencia === mes && d.tipo === 'receita').reduce((s, d) => s + d.total, 0);
    const despesa = data.filter((d) => d.mesCompetencia === mes && d.tipo === 'despesa').reduce((s, d) => s + d.total, 0);
    return { periodo: formatMonthYear(mes), receita, despesa, saldo: receita - despesa };
  });

  return (
    <ChartContainer title="Receita vs Despesa" isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData} margin={{ top: 0, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#64748b' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="receita" name="Receita" fill="#10b981" opacity={0.85} radius={[3, 3, 0, 0]} />
          <Bar dataKey="despesa" name="Despesa" fill="#ef4444" opacity={0.85} radius={[3, 3, 0, 0]} />
          <Line dataKey="saldo" name="Saldo" stroke="#6366f1" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
