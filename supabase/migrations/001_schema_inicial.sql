-- =============================================================================
-- PAINEL FINANCEIRO — Migration 001: Schema inicial
-- Executar no SQL Editor do Supabase (Settings → SQL Editor → New query)
-- =============================================================================

-- ===== ENUMS =====
create type if not exists tipo_lancamento   as enum ('despesa', 'receita');
create type if not exists natureza_custo    as enum ('fixo', 'variavel');
create type if not exists status_lancamento as enum ('previsto', 'pago', 'atrasado', 'cancelado');
create type if not exists frequencia        as enum ('semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual');
create type if not exists tipo_metodo       as enum ('dinheiro','debito','credito','pix','boleto','transferencia');

-- ===== CENTROS DE CUSTO =====
create table if not exists centros_custo (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nome       text not null,
  cor        text default '#6366f1',
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

-- ===== CATEGORIAS (hierárquicas) =====
create table if not exists categorias (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  parent_id  uuid references categorias(id) on delete set null,
  nome       text not null,
  tipo       tipo_lancamento not null default 'despesa',
  natureza   natureza_custo  not null default 'variavel',
  cor        text not null default '#94a3b8',
  icone      text,
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, nome, parent_id)
);

-- ===== FORNECEDORES / BENEFICIÁRIOS =====
create table if not exists fornecedores (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  nome       text not null,
  documento  text,
  observacao text,
  created_at timestamptz not null default now()
);

-- ===== MÉTODOS DE PAGAMENTO / CONTAS =====
create table if not exists metodos_pagamento (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  nome           text not null,
  tipo           tipo_metodo not null,
  limite         numeric(14,2),
  dia_fechamento smallint,
  dia_vencimento smallint,
  ativo          boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ===== RECORRÊNCIAS =====
create table if not exists recorrencias (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  descricao       text not null,
  valor           numeric(14,2) not null,
  tipo            tipo_lancamento not null default 'despesa',
  categoria_id    uuid references categorias(id) on delete set null,
  metodo_id       uuid references metodos_pagamento(id) on delete set null,
  centro_custo_id uuid references centros_custo(id) on delete set null,
  frequencia      frequencia not null default 'mensal',
  dia_referencia  smallint not null default 1,
  data_inicio     date not null,
  data_fim        date,
  ativo           boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ===== LANÇAMENTOS (tabela central) =====
create table if not exists lancamentos (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  tipo                  tipo_lancamento not null default 'despesa',
  descricao             text not null,
  valor                 numeric(14,2) not null check (valor >= 0),
  data_competencia      date not null,
  data_pagamento        date,
  status                status_lancamento not null default 'previsto',
  categoria_id          uuid references categorias(id) on delete set null,
  fornecedor_id         uuid references fornecedores(id) on delete set null,
  metodo_id             uuid references metodos_pagamento(id) on delete set null,
  centro_custo_id       uuid references centros_custo(id) on delete set null,
  recorrencia_id        uuid references recorrencias(id) on delete set null,
  grupo_parcelamento_id uuid,
  parcela_numero        smallint,
  parcela_total         smallint,
  tags                  text[] default '{}',
  observacao            text,
  anexo_url             text,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ===== ORÇAMENTOS =====
create table if not exists orcamentos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  mes          date not null,
  valor_limite numeric(14,2) not null,
  created_at   timestamptz not null default now(),
  unique (user_id, categoria_id, mes)
);

-- ===== ÍNDICES =====
create index if not exists idx_lanc_user_comp on lancamentos (user_id, data_competencia desc) where deleted_at is null;
create index if not exists idx_lanc_user_pgto on lancamentos (user_id, data_pagamento desc)   where deleted_at is null;
create index if not exists idx_lanc_categoria on lancamentos (categoria_id);
create index if not exists idx_lanc_centro    on lancamentos (centro_custo_id);
create index if not exists idx_lanc_status    on lancamentos (user_id, status);
create index if not exists idx_lanc_grupo     on lancamentos (grupo_parcelamento_id);
create index if not exists idx_orc_user_mes   on orcamentos  (user_id, mes);

-- ===== RLS — habilitar em todas as tabelas =====
alter table centros_custo    enable row level security;
alter table categorias       enable row level security;
alter table fornecedores     enable row level security;
alter table metodos_pagamento enable row level security;
alter table recorrencias     enable row level security;
alter table lancamentos      enable row level security;
alter table orcamentos       enable row level security;

-- ===== POLÍTICAS RLS — padrão "dono vê e escreve apenas o seu" =====
-- centros_custo
create policy "centros_custo_owner" on centros_custo
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- categorias
create policy "categorias_owner" on categorias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- fornecedores
create policy "fornecedores_owner" on fornecedores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- metodos_pagamento
create policy "metodos_owner" on metodos_pagamento
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- recorrencias
create policy "recorrencias_owner" on recorrencias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- lancamentos
create policy "lancamentos_owner" on lancamentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orcamentos
create policy "orcamentos_owner" on orcamentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== VIEWS DE AGREGAÇÃO =====

-- Base normalizada (usada por quase todos os gráficos)
create or replace view vw_lancamentos as
select
  l.*,
  c.nome                                     as categoria_nome,
  c.cor                                      as categoria_cor,
  c.natureza,
  coalesce(cp.nome, c.nome)                  as categoria_raiz,
  cc.nome                                    as centro_custo_nome,
  m.nome                                     as metodo_nome,
  m.tipo                                     as metodo_tipo,
  f.nome                                     as fornecedor_nome,
  date_trunc('month', l.data_competencia)::date as mes_competencia
from lancamentos l
left join categorias c         on c.id = l.categoria_id
left join categorias cp        on cp.id = c.parent_id
left join centros_custo cc     on cc.id = l.centro_custo_id
left join metodos_pagamento m  on m.id = l.metodo_id
left join fornecedores f       on f.id = l.fornecedor_id
where l.deleted_at is null and l.status <> 'cancelado';

-- Série mensal por categoria
create or replace view vw_mensal_categoria as
select
  user_id,
  mes_competencia,
  tipo,
  categoria_id,
  categoria_nome,
  categoria_cor,
  natureza,
  sum(valor) as total,
  count(*)   as qtd
from vw_lancamentos
group by 1, 2, 3, 4, 5, 6, 7;

-- Orçado vs. realizado
create or replace view vw_orcado_realizado as
select
  o.user_id,
  o.mes,
  o.categoria_id,
  c.nome                                          as categoria_nome,
  c.cor,
  o.valor_limite,
  coalesce(r.total, 0)                            as realizado,
  o.valor_limite - coalesce(r.total, 0)           as saldo,
  case when o.valor_limite > 0
       then round(coalesce(r.total, 0) / o.valor_limite * 100, 1)
       else null end                               as percentual
from orcamentos o
join categorias c on c.id = o.categoria_id
left join vw_mensal_categoria r
       on r.categoria_id = o.categoria_id
      and r.mes_competencia = o.mes;

-- Fluxo de caixa diário (regime de caixa)
create or replace view vw_fluxo_caixa as
select
  user_id,
  data_pagamento                                               as dia,
  sum(case when tipo = 'receita' then valor else -valor end)   as movimento
from vw_lancamentos
where status = 'pago' and data_pagamento is not null
group by 1, 2;

-- ===== FUNÇÃO: atualizar updated_at automaticamente =====
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_lancamentos_updated_at
  before update on lancamentos
  for each row execute function set_updated_at();

-- ===== FUNÇÃO: seed de categorias padrão para novo usuário =====
-- Chamada pela Edge Function ou pelo front após signup
create or replace function seed_categorias_padrao(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into categorias (user_id, nome, tipo, natureza, cor, icone) values
    (p_user_id, 'Moradia',      'despesa', 'fixo',     '#6366f1', '🏠'),
    (p_user_id, 'Alimentação',  'despesa', 'variavel', '#f59e0b', '🍽️'),
    (p_user_id, 'Transporte',   'despesa', 'variavel', '#10b981', '🚗'),
    (p_user_id, 'Saúde',        'despesa', 'variavel', '#ef4444', '💊'),
    (p_user_id, 'Educação',     'despesa', 'fixo',     '#3b82f6', '📚'),
    (p_user_id, 'Lazer',        'despesa', 'variavel', '#8b5cf6', '🎮'),
    (p_user_id, 'Assinaturas',  'despesa', 'fixo',     '#ec4899', '📱'),
    (p_user_id, 'Impostos',     'despesa', 'fixo',     '#f97316', '🏛️'),
    (p_user_id, 'Pessoal',      'despesa', 'variavel', '#14b8a6', '👤'),
    (p_user_id, 'Serviços',     'despesa', 'variavel', '#a3a3a3', '🔧'),
    (p_user_id, 'Outros',       'despesa', 'variavel', '#64748b', '📦'),
    (p_user_id, 'Salário',      'receita', 'fixo',     '#22d3ee', '💰'),
    (p_user_id, 'Freelance',    'receita', 'variavel', '#2dd4bf', '💼')
  on conflict (user_id, nome, parent_id) do nothing;
end;
$$;

-- =============================================================================
-- FIM DA MIGRATION 001
-- Próximo passo: executar seed_categorias_padrao(auth.uid()) após o primeiro login
-- =============================================================================
