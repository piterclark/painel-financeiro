'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { FluxoCaixa } from '@/types/financeiro';
import { formatBRL, formatDate } from '@/lib/format';
import { ChartContainer } from './ChartContainer';

interface Props {
  data: FluxoCaixa[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-xs">
      <p className="text-slate-400">{label}</p>
      <p className="text-white font-bold">{formatBRL(payload[0]?.value)}</p>
    </div>
  );
}

export function LinhaFluxoCaixa({ data }: Props) {
  let acumulado = 0;
  const chartData = data.map((d) => {
    acumulado += d.movimento;
    return { dia: d.dia.slice(5), acumulado: Math.round(acumulado * 100) / 100 };
  });

  return (
    <ChartContainer title="Fluxo de Caixa Acumulado" isEmpty={chartData.length === 0}>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fluxoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
          <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#64748b' }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#ffffff20" />
          <Area
            dataKey="acumulado"
            stroke="#6366f1"
            fill="url(#fluxoGradient)"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
