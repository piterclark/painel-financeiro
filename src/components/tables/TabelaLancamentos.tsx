'use client';

import { useState } from 'react';
import { Lancamento } from '@/types/financeiro';
import { formatBRL, formatDate } from '@/lib/format';
import { STATUS_COLORS } from '@/lib/colors';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  data: Lancamento[];
}

type SortKey = 'dataCompetencia' | 'valor' | 'descricao' | 'status';

export function TabelaLancamentos({ data }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('dataCompetencia');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const PER_PAGE = 15;

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  }

  const sorted = [...data].sort((a, b) => {
    let va: string | number = a[sortKey] ?? '';
    let vb: string | number = b[sortKey] ?? '';
    if (typeof va === 'string' && typeof vb === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated = sorted.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp size={12} className="text-slate-600" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="text-violet-400" />
    ) : (
      <ChevronDown size={12} className="text-violet-400" />
    );
  }

  return (
    <div className="bg-[#1a1f2e] border border-white/5 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-sm font-medium text-slate-400">
          Lançamentos <span className="text-slate-600">({data.length})</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              {([
                ['dataCompetencia', 'Data'],
                ['descricao', 'Descrição'],
                ['valor', 'Valor'],
                ['status', 'Status'],
              ] as [SortKey, string][]).map(([key, label]) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-slate-500 font-medium cursor-pointer hover:text-slate-300 select-none"
                  onClick={() => handleSort(key)}
                >
                  <span className="flex items-center gap-1">
                    {label} <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Categoria</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">Método</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((l) => (
              <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(l.dataCompetencia)}</td>
                <td className="px-4 py-3 text-slate-200 max-w-[200px] truncate">
                  {l.descricao}
                  {l.parcelaNumero && (
                    <span className="ml-1 text-slate-500">
                      ({l.parcelaNumero}/{l.parcelaTotal})
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-medium tabular-nums"
                  style={{ color: l.tipo === 'receita' ? '#10b981' : '#ef4444' }}>
                  {l.tipo === 'receita' ? '+' : '-'}{formatBRL(l.valor)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: STATUS_COLORS[l.status] + '20',
                      color: STATUS_COLORS[l.status],
                    }}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {l.categoriaNome && (
                    <span
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: (l.categoriaCor || '#94a3b8') + '20',
                        color: l.categoriaCor || '#94a3b8',
                      }}
                    >
                      {l.categoriaNome}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{l.metodoNome || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
          <span className="text-xs text-slate-500">
            {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, sorted.length)} de {sorted.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="text-xs px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300"
            >
              Anterior
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="text-xs px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
