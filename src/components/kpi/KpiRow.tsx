'use client';

import { Kpis } from '@/types/financeiro';
import { KpiCard } from './KpiCard';
import { formatBRL, formatPercent } from '@/lib/format';
import { Wallet, TrendingDown, TrendingUp, AlertCircle, Clock, Target } from 'lucide-react';

interface KpiRowProps {
  kpis: Kpis;
}

export function KpiRow({ kpis }: KpiRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard
        title="Receitas"
        value={formatBRL(kpis.totalReceitas)}
        trend={kpis.variacaoPercentual}
        color="green"
        icon={<TrendingUp size={16} />}
      />
      <KpiCard
        title="Despesas"
        value={formatBRL(kpis.totalDespesas)}
        trend={-kpis.variacaoPercentual}
        color="red"
        icon={<TrendingDown size={16} />}
      />
      <KpiCard
        title="Saldo"
        value={formatBRL(kpis.saldo)}
        color={kpis.saldo >= 0 ? 'green' : 'red'}
        icon={<Wallet size={16} />}
      />
      <KpiCard
        title="A Pagar"
        value={formatBRL(kpis.aPagar)}
        subtitle="previsto"
        color="yellow"
        icon={<Clock size={16} />}
      />
      <KpiCard
        title="Em Atraso"
        value={formatBRL(kpis.emAtraso)}
        color={kpis.emAtraso > 0 ? 'red' : 'default'}
        icon={<AlertCircle size={16} />}
      />
      <KpiCard
        title="Comprometimento"
        value={formatPercent(kpis.comprometimentoRenda)}
        subtitle="renda comprometida"
        color={kpis.comprometimentoRenda > 90 ? 'red' : kpis.comprometimentoRenda > 70 ? 'yellow' : 'green'}
        icon={<Target size={16} />}
      />
    </div>
  );
}
