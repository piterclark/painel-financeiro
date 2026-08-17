'use client';

import { useState, useEffect } from 'react';
import { useFiltros } from '@/hooks/useFiltros';
import {
  fetchKpis, fetchLancamentos, fetchMensalCategoria,
  fetchFluxoCaixa, fetchOrcadoRealizado, fetchTopGastos, fetchPorMetodo
} from '@/services/analytics.service';
import { Kpis, Lancamento, MensalCategoria, FluxoCaixa, OrcadoRealizado } from '@/types/financeiro';

import { KpiRow } from '@/components/kpi/KpiRow';
import { BarraFiltros } from '@/components/filters/BarraFiltros';
import { DonutCategorias } from '@/components/charts/DonutCategorias';
import { BarrasEmpilhadasMensal } from '@/components/charts/BarrasEmpilhadasMensal';
import { ReceitaVsDespesa } from '@/components/charts/ReceitaVsDespesa';
import { FixoVsVariavel } from '@/components/charts/FixoVsVariavel';
import { OrcadoVsRealizado } from '@/components/charts/OrcadoVsRealizado';
import { LinhaFluxoCaixa } from '@/components/charts/LinhaFluxoCaixa';
import { TopGastos } from '@/components/charts/TopGastos';
import { PorMetodoPagamento } from '@/components/charts/PorMetodoPagamento';
import { TabelaLancamentos } from '@/components/tables/TabelaLancamentos';

export default function DashboardPage() {
  const { filtros, setPreset, setRegime, setBusca, setNatureza, resetFiltros } = useFiltros();

  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [mensal, setMensal] = useState<MensalCategoria[]>([]);
  const [fluxo, setFluxo] = useState<FluxoCaixa[]>([]);
  const [orcado, setOrcado] = useState<OrcadoRealizado[]>([]);
  const [topGastos, setTopGastos] = useState<Lancamento[]>([]);
  const [porMetodo, setPorMetodo] = useState<{ nome: string; valor: number; percentual: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchKpis(filtros),
      fetchLancamentos(filtros),
      fetchMensalCategoria(filtros),
      fetchFluxoCaixa(filtros),
      fetchOrcadoRealizado(),
      fetchTopGastos(filtros),
      fetchPorMetodo(filtros),
    ]).then(([k, l, m, f, o, t, p]) => {
      setKpis(k);
      setLancamentos(l);
      setMensal(m);
      setFluxo(f);
      setOrcado(o);
      setTopGastos(t);
      setPorMetodo(p);
      setLoading(false);
    });
  }, [filtros]);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 z-10 bg-[#0f1117]/95 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Painel Financeiro</h1>
            <p className="text-xs text-slate-500">
              {filtros.periodo.inicio} até {filtros.periodo.fim}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-xs text-slate-500">{loading ? 'Carregando...' : 'Atualizado'}</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-5">
        {/* Filtros */}
        <BarraFiltros
          filtros={filtros}
          onPreset={setPreset}
          onRegime={setRegime}
          onBusca={setBusca}
          onNatureza={setNatureza}
          onReset={resetFiltros}
        />

        {/* KPIs */}
        {kpis && <KpiRow kpis={kpis} />}

        {/* Row 1: Donut + Receita vs Despesa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <DonutCategorias data={mensal} />
          <div className="lg:col-span-2">
            <ReceitaVsDespesa data={mensal} />
          </div>
        </div>

        {/* Row 2: Evolução Mensal (full) */}
        <BarrasEmpilhadasMensal data={mensal} />

        {/* Row 3: Fixo vs Variável + Orçado vs Realizado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <FixoVsVariavel data={mensal} />
          <OrcadoVsRealizado data={orcado} />
        </div>

        {/* Row 4: Fluxo de caixa + Top Gastos + Por Método */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <LinhaFluxoCaixa data={fluxo} />
          </div>
          <PorMetodoPagamento data={porMetodo} />
        </div>

        {/* Row 5: Top Gastos */}
        <TopGastos data={topGastos} />

        {/* Tabela */}
        <TabelaLancamentos data={lancamentos} />
      </main>
    </div>
  );
}
