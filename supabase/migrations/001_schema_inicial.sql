-- =============================================================================
-- PAINEL FINANCEIRO — Migration 001: Schema inicial (CORRIGIDA)
-- Executar no SQL Editor do Supabase. Pode ser rodada mais de uma vez.
-- =============================================================================

-- ===== ENUMS =====
-- CREATE TYPE não aceita IF NOT EXISTS. Bloco DO com tratamento de exceção.
do $$ begin create type tipo_lancamento   as enum ('despesa','receita');
  exception when duplicate_object then null; end $$;
do $$ begin create type natureza_custo    as enum ('fixo','variavel');
  exception when duplicate_object then null; end $$;
do $$ begin create type status_lancamento as enum ('previsto','pago','atrasado','cancelado');
  exception when duplicate_object then null; end $$;
do $$ begin create type frequencia        as enum ('semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual');
  exception when duplicate_object then null; end $$;
do $$ begin create type tipo_metodo       as enum ('dinheiro','debito','credito','pix','boleto','transferencia');
  exception when duplicate_object then null; end $$;

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
  created_at timestamptz not null default now()
);

-- Unicidade: NULL nunca conflita com NULL em UNIQUE comum, então categorias
-- raiz (parent_id null) precisam de índice parcial próprio.
create unique index if not exists uq_categorias_raiz
  on categorias (user_id, nome) where parent_id is null;
create unique index if not exists uq_categorias_filha
  on categorias (user_id, nome, parent_id) where parent_id is not null;

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
  dia_fechamento smallint check (dia_fechamento between 1 and 31),
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
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
  dia_referencia  smallint not null default 1 check (dia_referencia between 1 and 31),
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

-- ===== RLS =====
alter table centros_custo     enable row level security;
alter table categorias        enable row level security;
alter table fornecedores      enable row level security;
alter table metodos_pagamento enable row level security;
alter table recorrencias      enable row level security;
alter table lancamentos       enable row level security;
alter table orcamentos        enable row level security;

-- ===== POLÍTICAS =====
-- CREATE POLICY não aceita IF NOT EXISTS. Derrubar antes torna reexecutável.
drop policy if exists centros_custo_owner on centros_custo;
create policy centros_custo_owner on centros_custo
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists categorias_owner on categorias;
create policy categorias_owner on categorias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists fornecedores_owner on fornecedores;
create policy fornecedores_owner on fornecedores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists metodos_owner on metodos_pagamento;
create policy metodos_owner on metodos_pagamento
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists recorrencias_owner on recorrencias;
create policy recorrencias_owner on recorrencias
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists lancamentos_owner on lancamentos;
create policy lancamentos_owner on lancamentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists orcamentos_owner on orcamentos;
create policy orcamentos_owner on orcamentos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== VIEWS =====
-- security_invoker = on é OBRIGATÓRIO. Sem isso a view roda com as permissões
-- do criador e IGNORA o RLS das tabelas, expondo dados de todos os usuários.
create or replace view vw_lancamentos
with (security_invoker = on) as
select
  l.*,
  c.nome                                        as categoria_nome,
  c.cor                                         as categoria_cor,
  c.natureza,
  coalesce(cp.nome, c.nome)                     as categoria_raiz,
  cc.nome                                       as centro_custo_nome,
  m.nome                                        as metodo_nome,
  m.tipo                                        as metodo_tipo,
  f.nome                                        as fornecedor_nome,
  date_trunc('month', l.data_competencia)::date as mes_competencia
from lancamentos l
left join categorias c        on c.id  = l.categoria_id
left join categorias cp       on cp.id = c.parent_id
left join centros_custo cc    on cc.id = l.centro_custo_id
left join metodos_pagamento m on m.id  = l.metodo_id
left join fornecedores f      on f.id  = l.fornecedor_id
where l.deleted_at is null and l.status <> 'cancelado';

create or replace view vw_mensal_categoria
with (security_invoker = on) as
select user_id, mes_competencia, tipo, categoria_id, categoria_nome,
       categoria_cor, natureza, sum(valor) as total, count(*) as qtd
from vw_lancamentos
group by 1, 2, 3, 4, 5, 6, 7;

create or replace view vw_orcado_realizado
with (security_invoker = on) as
select
  o.user_id, o.mes, o.categoria_id,
  c.nome as categoria_nome, c.cor,
  o.valor_limite,
  coalesce(r.total, 0)                  as realizado,
  o.valor_limite - coalesce(r.total, 0) as saldo,
  case when o.valor_limite > 0
       then round(coalesce(r.total, 0) / o.valor_limite * 100, 1)
       else null end                    as percentual
from orcamentos o
join categorias c on c.id = o.categoria_id
left join vw_mensal_categoria r
       on r.categoria_id   = o.categoria_id
      and r.mes_competencia = o.mes;

create or replace view vw_fluxo_caixa
with (security_invoker = on) as
select user_id,
       data_pagamento as dia,
       sum(case when tipo = 'receita' then valor else -valor end) as movimento
from vw_lancamentos
where status = 'pago' and data_pagamento is not null
group by 1, 2;

-- ===== TRIGGER: updated_at =====
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lancamentos_updated_at on lancamentos;
create trigger trg_lancamentos_updated_at
  before update on lancamentos
  for each row execute function set_updated_at();

-- ===== SEED DE CATEGORIAS PADRÃO =====
-- security definer exige search_path fixo, senão abre brecha de escalonamento.
create or replace function seed_categorias_padrao(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into categorias (user_id, nome, tipo, natureza, cor, icone)
  select p_user_id, v.nome, v.tipo::tipo_lancamento, v.natureza::natureza_custo, v.cor, v.icone
  from (values
    ('Moradia',     'despesa', 'fixo',     '#6366f1', '🏠'),
    ('Alimentação', 'despesa', 'variavel', '#f59e0b', '🍽️'),
    ('Transporte',  'despesa', 'variavel', '#10b981', '🚗'),
    ('Saúde',       'despesa', 'variavel', '#ef4444', '💊'),
    ('Educação',    'despesa', 'fixo',     '#3b82f6', '📚'),
    ('Lazer',       'despesa', 'variavel', '#8b5cf6', '🎮'),
    ('Assinaturas', 'despesa', 'fixo',     '#ec4899', '📱'),
    ('Impostos',    'despesa', 'fixo',     '#f97316', '🏛️'),
    ('Pessoal',     'despesa', 'variavel', '#14b8a6', '👤'),
    ('Serviços',    'despesa', 'variavel', '#a3a3a3', '🔧'),
    ('Outros',      'despesa', 'variavel', '#64748b', '📦'),
    ('Salário',     'receita', 'fixo',     '#22d3ee', '💰'),
    ('Freelance',   'receita', 'variavel', '#2dd4bf', '💼')
  ) as v(nome, tipo, natureza, cor, icone)
  where not exists (
    select 1 from categorias c
    where c.user_id = p_user_id and c.nome = v.nome and c.parent_id is null
  );
end;
$$;

-- =============================================================================
-- FIM DA MIGRATION 001
-- Verificação sugerida após executar:
--   select tablename, rowsecurity from pg_tables where schemaname = 'public';
--   select viewname from pg_views where schemaname = 'public';
-- =============================================================================
