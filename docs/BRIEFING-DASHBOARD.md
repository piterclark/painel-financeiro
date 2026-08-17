# Briefing do Dashboard — Controle de Salário e Gastos

Documento de instrução para implementação. Complementa `ESTRUTURA-PAINEL-FINANCEIRO.md` (modelo de dados) e **substitui** o `DESIGN.md` anterior — a referência visual mudou de vidro translúcido para superfície escura chapada com acentos neon.

---

## 1. Leitura da referência

A imagem de referência é um painel de *wealth building* (capital, alavancagem, ativos digitais). O caso real é outro: **uma pessoa assalariada que precisa saber quanto entrou, quanto saiu e quanto ainda pode gastar.** A linguagem visual se aproveita quase inteira; a semântica dos cards precisa ser trocada.

### Descartar

Estes cards da referência exigem dados que o cliente não vai alimentar. Mantidos, viram números decorativos que ninguém confia:

| Card da referência | Motivo do descarte |
|---|---|
| Capital Efficiency (por hora produtiva) | Exigiria registro de horas trabalhadas |
| Leverage Index | Métrica composta sem lastro no caso de uso |
| Digital Assets / Assets Created | Não há ativos a contar |
| Wealth Engine Flywheel | Diagrama estático, não é dado |
| Leverage Score Radar | Radar precisa de 5+ eixos comparáveis; aqui não existem |

### Aproveitar (com nova semântica)

| Card da referência | Vira |
|---|---|
| Capital Growth Progress (real vs. planejado vs. ritmo) | **Gasto acumulado vs. ritmo ideal vs. teto do salário** — encaixe perfeito |
| Income Sources (donut + lista com % e valor) | **Onde o dinheiro foi** — categorias de gasto |
| Capital Allocation (donut) | **Composição do gasto** — fixo, variável, assinaturas |
| Passive Income Trend (área) | **Ritmo de gasto diário** |
| Capital Velocity (gauge) | **Comprometimento do salário** |
| Capital Growth Waterfall | **Salário → categorias → sobra** |
| Monthly Performance Heatmap | **Calendário de gastos por dia** |
| Capital Goal (anel na sidebar) | **Meta de economia do mês** |
| Assets Created (lista com barras) | **Assinaturas e recorrências ativas** |

---

## 2. A métrica central

Todo o painel gira em torno de um número:

```
SALDO DISPONÍVEL = salário líquido do mês
                 − gastos já realizados
                 − compromissos previstos que ainda vão vencer no mês
```

É o número maior da tela, muda de cor conforme o estado, e é o que precisa reagir em tempo real. Todos os outros cards são recortes dele.

Segundo número em importância: **disponível por dia** = saldo ÷ dias restantes até o próximo pagamento. É o que transforma o painel em decisão ("posso gastar isso hoje?") em vez de relatório.

---

## 3. Linha de KPIs (topo, 6 cards)

| # | Card | Fórmula | Cor |
|---|---|---|---|
| 1 | Salário do mês | soma de `receitas` com competência no mês | teal |
| 2 | Gasto até agora | soma de `despesas` pagas no mês | cyan |
| 3 | **Saldo disponível** | salário − gastos − previstos do mês | verde / laranja / vermelho por faixa |
| 4 | Disponível por dia | saldo ÷ dias restantes até o próximo pagamento | roxo |
| 5 | Projeção fim do mês | gasto atual + (média diária × dias restantes) | magenta |
| 6 | Economia do mês | saldo ÷ salário × 100 | teal |

Cada card repete o padrão da referência: ícone em quadrado arredondado com tinta do acento, label pequeno em cima, número grande, variação percentual vs. mês anterior embaixo com seta.

**Regra de cor do saldo (card 3):**

```ts
saldo / salario > 0.30  → verde   (#34D399)
saldo / salario > 0.10  → laranja (#FB923C)
saldo / salario <= 0.10 → vermelho(#F87171)
saldo < 0               → vermelho + borda pulsante
```

---

## 4. Mapa de cards

### Linha 2

**4.1 — Salário vs. Gasto acumulado** (largura 5/12, gráfico de linha)

Três séries, exatamente como a referência trata real/planejado/ritmo:

- **Real** (linha sólida teal): gasto acumulado dia a dia no mês
- **Ritmo ideal** (tracejada roxa): `(salário × meta_de_gasto) ÷ dias_do_mês × dia`
- **Teto** (tracejada cinza): o salário inteiro, linha horizontal

O valor de hoje aparece como ponto destacado com balão, igual ao `$31,620` da referência. Se a linha real cruzar a tracejada roxa, o card ganha borda de alerta.

**4.2 — Onde o dinheiro foi** (3/12, donut + lista)

Donut com gradiente teal→roxo, total no centro. Lista lateral com bolinha colorida, nome da categoria, percentual e valor — layout idêntico ao *Income Sources*.

**4.3 — Composição do gasto** (4/12, donut)

Fixo / variável / assinaturas. É o card que responde "quanto do meu gasto eu consigo cortar se precisar".

### Linha 3

**4.4 — Onde mais gastou** (4/12) — *pedido explícito do cliente*

Barras horizontais rankeadas, com seletor de período em pílulas no header:

```
[ 7 dias ] [ 30 dias ] [ 60 dias ] [ 90 dias ] [ 120 dias ]
```

Cada barra mostra: categoria, valor, e **variação vs. o período anterior de mesmo tamanho**. Essa variação é o que gera insight — saber que gastou R$ 800 em alimentação é dado; saber que subiu 34% contra os 30 dias anteriores é informação.

```sql
-- ranking com comparação de período
with atual as (
  select categoria_id, categoria_nome, categoria_cor, sum(valor) total
  from vw_lancamentos
  where tipo='despesa' and data_competencia >= current_date - ($1::int)
  group by 1,2,3
),
anterior as (
  select categoria_id, sum(valor) total
  from vw_lancamentos
  where tipo='despesa'
    and data_competencia >= current_date - ($1::int * 2)
    and data_competencia <  current_date - ($1::int)
  group by 1
)
select a.*, coalesce(p.total,0) as total_anterior,
       case when coalesce(p.total,0) > 0
            then round((a.total - p.total) / p.total * 100, 1) end as variacao
from atual a left join anterior p using (categoria_id)
order by a.total desc limit 8;
```

**4.5 — Assinaturas e recorrências** (3/12, lista com barras)

Layout do *Assets Created*: ícone, nome, valor mensal, mini-barra proporcional. Header mostra o total mensal comprometido. É o card que revela vazamento — a soma de assinaturas costuma surpreender.

**4.6 — Ritmo de gasto diário** (3/12, área com gradiente)

Gasto por dia nos últimos 30 dias, com linha de média. O pico do mês fica anotado, como o `$1,263 / This Month` da referência.

**4.7 — Comprometimento do salário** (2/12, gauge semicircular)

Arco de 0 a 100% com gradiente teal→roxo, percentual grande no centro. Marcação de meta em 70%.

### Linha 4

**4.8 — Cascata do mês** (5/12, waterfall)

`Salário → −Moradia → −Alimentação → −Transporte → −Outros → Sobra`. Barras de entrada em teal, saídas em magenta, sobra final em roxo. É a explicação visual mais direta de para onde o salário foi, e vale mais que qualquer donut para quem não tem intimidade com dados.

**4.9 — Calendário de gastos** (4/12, heatmap)

Grade de dias por mês, intensidade proporcional ao gasto. Revela padrão de comportamento — fim de semana, dia de pagamento, dia da fatura.

**4.10 — Compromissos futuros** (3/12, barras dos próximos 6 meses)

Parcelas em aberto + recorrências ativas. Responde "quanto do meu salário dos próximos meses já está vendido".

### Sidebar

Anel de progresso ao pé do menu, como o *Capital Goal*: **meta de economia do mês**, com valor-alvo, percentual atingido e valor atual.

---

## 5. Sugestões adicionais

Por ordem de retorno sobre esforço:

1. **Registro rápido flutuante.** Botão fixo no canto que abre um campo único: valor, categoria, confirmar. Três toques no máximo. Painel de gastos morre quando registrar dá trabalho — é o maior risco do projeto, acima de qualquer gráfico.
2. **Alertas automáticos.** Faixa acima dos KPIs com no máximo três avisos: categoria que subiu mais de 30% no período, orçamento estourado, conta prevista vencendo em 3 dias, ritmo acima do ideal.
3. **Renda extra separada do salário.** Se o cliente tiver freelas ou bônus, misturar com o salário distorce todo o cálculo de comprometimento. Manter `tipo=receita` com categoria distinta e mostrar separado no card 1.
4. **Comparativo mês a mês na mesma categoria.** Clicar em qualquer categoria abre painel lateral com a série histórica dela e a lista de lançamentos. É o drill-down que sustenta a confiança nos números.
5. **Fechamento do mês.** No dia do pagamento, um resumo: quanto sobrou, qual categoria mais cresceu, quanto foi economizado. Transforma o painel em hábito.
6. **Modo mobile de entrada.** O consumo dos gráficos é desktop; o registro é celular, no momento da compra. Priorizar a tela de registro no mobile, não a réplica do painel.
7. **Importação de extrato (CSV/OFX).** Depois que o hábito estiver formado. Antes disso, é complexidade prematura.

---

## 6. Tempo real

Duas camadas, e as duas são necessárias:

```ts
// 1. Atualização otimista — número muda antes da resposta do servidor
queryClient.setQueryData(['kpis', filtros], old => ({
  ...old,
  totalDespesas: old.totalDespesas + novoValor,
  saldo: old.saldo - novoValor,
}));

// 2. Sincronia entre dispositivos
supabase.channel('lancamentos-live')
  .on('postgres_changes',
      { event: '*', schema: 'public', table: 'lancamentos', filter: `user_id=eq.${userId}` },
      () => queryClient.invalidateQueries({ queryKey: ['kpis'] }))
  .subscribe();
```

Animar a transição do número (contagem de ~400ms) reforça a percepção de tempo real. Aplicar apenas no saldo disponível — em todos os cards vira ruído.

---

## 7. Tokens visuais (referência atual)

```css
:root {
  /* Fundo e superfícies — chapado, sem blur */
  --bg:            #070B14;
  --bg-sidebar:    #0A0F1A;
  --surface:       #0F1620;
  --surface-hover: #141C28;
  --border:        #1C2733;
  --border-accent: rgba(45, 212, 191, 0.22);

  /* Acentos */
  --teal:    #2DD4BF;
  --cyan:    #22D3EE;
  --purple:  #A855F7;
  --magenta: #E879F9;
  --grad-primary: linear-gradient(135deg, #2DD4BF 0%, #A855F7 100%);

  /* Semântica */
  --positivo: #34D399;
  --atencao:  #FB923C;
  --negativo: #F87171;

  /* Texto */
  --text:      #F1F5F9;
  --text-sec:  #94A3B8;
  --text-mute: #64748B;

  /* Geometria */
  --radius:    12px;
  --radius-sm: 8px;
  --glow:      0 0 24px rgba(45, 212, 191, 0.10);
  --gap:       16px;
}
```

**Tipografia:** `Space Grotesk` para números e títulos, `Inter` para corpo e tabelas. Números de KPI em 30px/600. Todo valor monetário com `font-variant-numeric: tabular-nums`.

**Card:** fundo `--surface`, borda 1px `--border`, raio `--radius`, sem sombra difusa. O brilho vem do conteúdo (gradientes dos gráficos), não do container.

**Item ativo da sidebar:** pílula com fundo `rgba(45,212,191,0.10)`, borda esquerda 2px teal, texto teal, ícone teal.

**Gráficos:** linhas 2px com gradiente teal→roxo; área com o mesmo gradiente a 30% → 0%; grade horizontal em `#1C2733`; eixos em `--text-mute` 11px com valores abreviados (`R$ 25k`); tooltip com fundo `#0F1620` sólido e borda `--border`.

---

## 8. Prompt para o Claude Code

> Construa o painel seguindo `BRIEFING-DASHBOARD.md` para funcionalidade, `ESTRUTURA-PAINEL-FINANCEIRO.md` para modelo de dados e a imagem `referencia.png` para proporção e hierarquia visual. Cores, raios e espaçamentos vêm da seção 7 do briefing, não da imagem.
>
> Ordem de execução, com validação a cada etapa:
> 1. `tokens.css` + componente `Card` + shell (sidebar, topbar, grid de 12 colunas)
> 2. Linha de KPIs com as 6 métricas da seção 3, alimentada por dados de exemplo
> 3. Formulário de registro rápido e atualização otimista do saldo
> 4. Cards 4.1, 4.2 e 4.4 (o ranking com seletor de período é requisito do cliente)
> 5. Demais cards
>
> Restrições: nenhuma cor fora da paleta; nenhum card sem estado vazio; nenhuma métrica que dependa de dado que o usuário não informa; todo valor monetário formatado em `pt-BR` com `tabular-nums`.
