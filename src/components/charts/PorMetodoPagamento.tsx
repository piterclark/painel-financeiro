'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBRL } from '@/lib/format';
import { ChartContainer } from './ChartContainer';
import { colorForIndex } from '@/lib/colors';

interface MetodoItem {
  nome: string;
  valor: number;
  percentual: number;
}

interface Props {
  data: MetodoItem[];
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

export function PorMetodoPagamento({ data }: Props) {
  return (
    <ChartContainer title="Por Método de Pagamento" isEmpty={data.length === 0}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="valor" nameKey="nome" cx="50%" cy="50%" outerRadius={65} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={colorForIndex(i)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5 mt-2">
        {data.map((d, i) => (
          <div key={d.nome} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorForIndex(i) }} />
            <span className="text-slate-400 flex-1 truncate">{d.nome}</span>
            <span className="text-slate-300">{d.percentual.toFixed(0)}%</span>
            <span className="text-slate-500">{formatBRL(d.valor)}</span>
          </div>
        ))}
      </div>
    </ChartContainer>
  );
}
