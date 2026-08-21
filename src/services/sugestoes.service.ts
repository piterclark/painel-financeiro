import { supabase } from './supabase';

export interface DescricaoSugestao {
  descricao: string;
  frequencia: number;
  categoriaId: string | null;
  metodoId: string | null;
}

export async function fetchSugestoesDescricao(): Promise<DescricaoSugestao[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('descricao, categoria_id, metodo_id, data_competencia')
    .is('deleted_at', null)
    .order('data_competencia', { ascending: false })
    .limit(500);

  if (error || !data) return [];

  // Aggregate: count frequency, keep most-recent categoria/metodo per description
  const map = new Map<string, DescricaoSugestao>();
  for (const r of data) {
    const key = r.descricao?.trim().toLowerCase();
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, {
        descricao: r.descricao,
        frequencia: 1,
        categoriaId: r.categoria_id ?? null,
        metodoId: r.metodo_id ?? null,
      });
    } else {
      map.get(key)!.frequencia += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.frequencia - a.frequencia);
}
