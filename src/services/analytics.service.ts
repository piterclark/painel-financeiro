import {
  LANCAMENTOS_MOCK, getMensalCategoria, getFluxoCaixa,
  getOrcadoRealizado, getKpis, CATEGORIAS_MOCK, CENTROS_CUSTO_MOCK, METODOS_MOCK
} from './mock-data';
import { FiltrosDashboard, Lancamento, MensalCategoria, FluxoCaixa, OrcadoRealizado, Kpis, Categoria, CentroCusto, MetodoPagamento } from '@/types/financeiro';
import { isInPeriod } from '@/lib/date';

function filterLancamentos(filtros: FiltrosDashboard): Lancamento[] {
  const { inicio, fim } = filtros.periodo;
  return LANCAMENTOS_MOCK.filter((l) => {
    const date = filtros.regime === 'caixa' ? (l.dataPagamento || l.dataCompetencia) : l.dataCompetencia;
    if (!isInPeriod(date, inicio, fim)) return false;
    if (filtros.categorias.length && !filtros.categorias.includes(l.categoriaId || '')) return false;
    if (filtros.status.length && !filtros.status.includes(l.status)) return false;
    if (filtros.natureza && l.natureza !== filtros.natureza) return false;
    if (filtros.busca && !l.descricao.toLowerCase().includes(filtros.busca.toLowerCase())) return false;
    return true;
  });
}

export async function fetchLancamentos(filtros: FiltrosDashboard): Promise<Lancamento[]> {
  return filterLancamentos(filtros);
}

export async function fetchKpis(filtros: FiltrosDashboard): Promise<Kpis> {
  const items = filterLancamentos(filtros);
  return getKpis(items);
}

export async function fetchMensalCategoria(filtros: FiltrosDashboard): Promise<MensalCategoria[]> {
  const { inicio, fim } = filtros.periodo;
  return getMensalCategoria().filter((m) => isInPeriod(m.mesCompetencia, inicio, fim));
}

export async function fetchFluxoCaixa(filtros: FiltrosDashboard): Promise<FluxoCaixa[]> {
  const { inicio, fim } = filtros.periodo;
  return getFluxoCaixa().filter((f) => isInPeriod(f.dia, inicio, fim));
}

export async function fetchOrcadoRealizado(): Promise<OrcadoRealizado[]> {
  return getOrcadoRealizado();
}

export async function fetchCategorias(): Promise<Categoria[]> {
  return CATEGORIAS_MOCK;
}

export async function fetchCentrosCusto(): Promise<CentroCusto[]> {
  return CENTROS_CUSTO_MOCK;
}

export async function fetchMetodos(): Promise<MetodoPagamento[]> {
  return METODOS_MOCK;
}

export async function fetchTopGastos(filtros: FiltrosDashboard, limit = 10): Promise<Lancamento[]> {
  return filterLancamentos(filtros)
    .filter((l) => l.tipo === 'despesa')
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limit);
}

export async function fetchPorFornecedor(filtros: FiltrosDashboard) {
  const items = filterLancamentos(filtros).filter((l) => l.tipo === 'despesa');
  const map = new Map<string, number>();
  for (const l of items) {
    const nome = l.fornecedorNome || l.descricao;
    map.set(nome, (map.get(nome) || 0) + l.valor);
  }
  return Array.from(map.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);
}

export async function fetchPorMetodo(filtros: FiltrosDashboard) {
  const items = filterLancamentos(filtros).filter((l) => l.tipo === 'despesa');
  const map = new Map<string, number>();
  for (const l of items) {
    const nome = l.metodoNome || 'Outros';
    map.set(nome, (map.get(nome) || 0) + l.valor);
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  return Array.from(map.entries())
    .map(([nome, valor], i) => ({
      nome,
      valor,
      percentual: total > 0 ? Math.round((valor / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.valor - a.valor);
}
