import { supabase } from './supabase';

function dateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function rnd(base: number, spread: number) {
  return Math.round((base + Math.random() * spread) * 100) / 100;
}

function genMonthRows(
  userId: string,
  year: number,
  month: number,
  curYear: number,
  curMonth: number,
  nowDay: number,
  catId: Map<string, string>,
  metId: Map<string, string>,
  ccId:  Map<string, string>,
) {
  const isPast    = year < curYear || (year === curYear && month < curMonth);
  const isCurrent = year === curYear && month === curMonth;

  function paid(day: number) {
    const isDayPast = !isCurrent || day <= nowDay;
    return isPast || isDayPast;
  }

  function row(
    desc: string, valor: number, tipo: 'despesa' | 'receita',
    cat: string, nat: 'fixo' | 'variavel', metodo: string, centro: string, day: number,
  ) {
    const p = paid(day);
    return {
      user_id: userId,
      tipo,
      descricao: desc,
      valor,
      data_competencia: dateStr(year, month, day),
      data_pagamento:   p ? dateStr(year, month, day) : null,
      status:           p ? 'pago' : 'previsto',
      categoria_id:     catId.get(cat)    ?? null,
      metodo_id:        metId.get(metodo) ?? null,
      centro_custo_id:  ccId.get(centro)  ?? null,
      tags: [],
    };
  }

  return [
    // ── despesas ──────────────────────────────────────────────────────────────
    row('Aluguel',                 2800,              'despesa', 'Moradia',     'fixo',     'Inter PJ', 'Pessoal', 5),
    row('Condomínio',               620,              'despesa', 'Moradia',     'fixo',     'Inter PJ', 'Pessoal', 10),
    row('Supermercado',        rnd(850, 200),          'despesa', 'Alimentação', 'variavel', 'Nubank',   'Pessoal', 8),
    row('Restaurantes',        rnd(380, 120),          'despesa', 'Alimentação', 'variavel', 'Nubank',   'Pessoal', 15),
    row('Uber / 99',           rnd(220, 80),           'despesa', 'Transporte',  'variavel', 'Pix',      'Pessoal', 20),
    row('Combustível',         rnd(310, 60),           'despesa', 'Transporte',  'variavel', 'Nubank',   'Pessoal', 12),
    row('Plano de Saúde',           780,              'despesa', 'Saúde',       'fixo',     'Inter PJ', 'Pessoal', 15),
    row('Farmácia',            rnd(120, 80),           'despesa', 'Saúde',       'variavel', 'Dinheiro', 'Pessoal', 18),
    row('Curso Online',              490,              'despesa', 'Educação',    'fixo',     'Nubank',   'Pessoal', 3),
    row('Cinema / Entretenimento', rnd(180, 100),      'despesa', 'Lazer',       'variavel', 'Nubank',   'Pessoal', 22),
    row('Netflix',                  55.9,             'despesa', 'Assinaturas', 'fixo',     'Nubank',   'Pessoal', 1),
    row('Spotify',                  21.9,             'despesa', 'Assinaturas', 'fixo',     'Nubank',   'Pessoal', 1),
    row('Adobe CC',                  199,             'despesa', 'Assinaturas', 'fixo',     'Nubank',   'Pessoal', 5),
    row('Imposto IPTU',              340,             'despesa', 'Impostos',    'fixo',     'Inter PJ', 'Pessoal', 28),
    row('Conta de Luz',        rnd(210, 50),           'despesa', 'Moradia',     'variavel', 'Pix',      'Pessoal', 20),
    // ── receitas ─────────────────────────────────────────────────────────────
    row('Salário',                  9500,             'receita', 'Salário',     'fixo',     'Inter PJ', 'Pessoal', 5),
    row(`Freelance ${month % 2 === 0 ? 'Design' : 'Dev'}`, rnd(1800, 1200), 'receita', 'Freelance', 'variavel', 'Pix', 'Empresa', 20),
  ];
}

export async function runSeed(): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: 'Não autenticado.' };

  // 1. seed default categories via RPC
  const { error: rpcErr } = await supabase.rpc('seed_categorias_padrao', { p_user_id: user.id });
  if (rpcErr) return { success: false, message: `Erro ao criar categorias: ${rpcErr.message}` };

  // 2. fetch category IDs by name
  const { data: cats } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('user_id', user.id)
    .eq('ativo', true)
    .is('parent_id', null);
  const catId = new Map((cats ?? []).map((c: any) => [c.nome, c.id]));

  // 3. metodos_pagamento (idempotent — skip if already exists)
  const { data: existingMet } = await supabase
    .from('metodos_pagamento')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  const metId = new Map<string, string>();

  if (!existingMet?.length) {
    const { data: newMet } = await supabase
      .from('metodos_pagamento')
      .insert([
        { user_id: user.id, nome: 'Nubank',   tipo: 'credito',      limite: 5000 },
        { user_id: user.id, nome: 'Inter PJ', tipo: 'debito' },
        { user_id: user.id, nome: 'Dinheiro', tipo: 'dinheiro' },
        { user_id: user.id, nome: 'Pix',      tipo: 'pix' },
        { user_id: user.id, nome: 'Itaú',     tipo: 'credito',      limite: 3000 },
      ])
      .select('id, nome');
    (newMet ?? []).forEach((m: any) => metId.set(m.nome, m.id));
  } else {
    const { data: allMet } = await supabase
      .from('metodos_pagamento')
      .select('id, nome')
      .eq('user_id', user.id);
    (allMet ?? []).forEach((m: any) => metId.set(m.nome, m.id));
  }

  // 4. centros_custo (idempotent)
  const { data: existingCC } = await supabase
    .from('centros_custo')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  const ccId = new Map<string, string>();

  if (!existingCC?.length) {
    const { data: newCC } = await supabase
      .from('centros_custo')
      .insert([
        { user_id: user.id, nome: 'Pessoal',       cor: '#6366f1' },
        { user_id: user.id, nome: 'Empresa',        cor: '#f59e0b' },
        { user_id: user.id, nome: 'Investimentos',  cor: '#10b981' },
      ])
      .select('id, nome');
    (newCC ?? []).forEach((c: any) => ccId.set(c.nome, c.id));
  } else {
    const { data: allCC } = await supabase
      .from('centros_custo')
      .select('id, nome')
      .eq('user_id', user.id);
    (allCC ?? []).forEach((c: any) => ccId.set(c.nome, c.id));
  }

  // 5. lancamentos (skip if already seeded)
  const { data: existingLanc } = await supabase
    .from('lancamentos')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  let insertedCount = 0;

  if (!existingLanc?.length) {
    const now = new Date();
    const curYear  = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const nowDay   = now.getDate();

    const allRows: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      allRows.push(...genMonthRows(
        user.id, d.getFullYear(), d.getMonth() + 1,
        curYear, curMonth, nowDay, catId, metId, ccId,
      ));
    }

    // batch insert 100 at a time
    for (let i = 0; i < allRows.length; i += 100) {
      const { error } = await supabase.from('lancamentos').insert(allRows.slice(i, i + 100));
      if (error) return { success: false, message: `Erro ao inserir lançamentos: ${error.message}` };
    }
    insertedCount = allRows.length;
  }

  // 6. orcamentos for current month
  const mesAtual = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
  const orcamentosData = [
    { cat: 'Moradia',     limite: 3600 },
    { cat: 'Alimentação', limite: 1200 },
    { cat: 'Transporte',  limite: 600  },
    { cat: 'Saúde',       limite: 1000 },
    { cat: 'Educação',    limite: 500  },
    { cat: 'Lazer',       limite: 300  },
    { cat: 'Assinaturas', limite: 350  },
    { cat: 'Impostos',    limite: 400  },
  ]
    .filter(o => catId.has(o.cat))
    .map(o => ({
      user_id: user.id,
      categoria_id: catId.get(o.cat)!,
      mes: mesAtual,
      valor_limite: o.limite,
    }));

  if (orcamentosData.length) {
    // upsert — ignore if already exists
    await supabase.from('orcamentos').upsert(orcamentosData, { onConflict: 'user_id,categoria_id,mes' });
  }

  const msg = insertedCount > 0
    ? `Seed completo: ${insertedCount} lançamentos, ${orcamentosData.length} orçamentos.`
    : `Lançamentos já existem. Orçamentos atualizados.`;

  return { success: true, message: msg };
}
