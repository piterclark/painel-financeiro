export const PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
  '#06b6d4', '#a855f7', '#e11d48', '#0ea5e9', '#22c55e',
];

export const CATEGORY_COLORS: Record<string, string> = {
  moradia: '#6366f1',
  alimentacao: '#f59e0b',
  transporte: '#3b82f6',
  saude: '#10b981',
  educacao: '#8b5cf6',
  lazer: '#ec4899',
  assinaturas: '#06b6d4',
  impostos: '#ef4444',
  pessoal: '#f97316',
  servicos: '#14b8a6',
  outros: '#94a3b8',
  salario: '#22c55e',
  freelance: '#84cc16',
  investimentos: '#0ea5e9',
};

export function colorForIndex(i: number): string {
  return PALETTE[i % PALETTE.length];
}

export const STATUS_COLORS = {
  pago: '#10b981',
  previsto: '#6366f1',
  atrasado: '#ef4444',
  cancelado: '#94a3b8',
} as const;

export const TIPO_COLORS = {
  despesa: '#ef4444',
  receita: '#10b981',
} as const;
