# Etapa 2 — Entrada de Dados, Correções e Exportação

Instruções para a próxima iteração do painel. Baseado nas capturas da versão atual.

---

## 1. Correções na versão atual

Três gráficos estão quebrados pela mesma causa: **barra sem largura máxima em eixo com uma única categoria.** Quando o eixo X tem só `ago. de 26`, o Recharts distribui a largura total do plot entre as barras — daí os blocos gigantes em *Receita vs Despesa*, *Evolução Mensal por Categoria* e *Fixo vs Variável*.

### 1.1 Limitar a largura da barra

```tsx
<ResponsiveContainer width="100%" height={280}>
  <BarChart data={dados} barCategoryGap="35%" barGap={6}>
    <CartesianGrid vertical={false} stroke="#1C2733" />
    <XAxis dataKey="mes" tickLine={false} axisLine={false} />
    <YAxis tickFormatter={abreviar} width={48} tickLine={false} axisLine={false} />
    <Bar dataKey="receita"  maxBarSize={48} radius={[4, 4, 0, 0]} />
    <Bar dataKey="despesa"  maxBarSize={48} radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

`maxBarSize` é obrigatório em **todos** os gráficos de barra do painel. Sem ele, qualquer período curto reproduz o problema.

### 1.2 Preencher meses vazios

O gráfico de evolução precisa sempre receber a série completa do período, mesmo com meses sem lançamento. Zero é dado; ausência é buraco.

```sql
select to_char(m.mes, 'YYYY-MM') as mes,
       c.id as categoria_id, c.nome, c.cor,
       coalesce(sum(l.valor), 0) as total
from generate_series($1::date, $2::date, interval '1 month') m(mes)
cross join categorias c
left join lancamentos l
       on l.categoria_id = c.id
      and date_trunc('month', l.data_competencia) = m.mes
      and l.deleted_at is null
where c.user_id = auth.uid() and c.tipo = 'despesa'
group by 1, 2, 3, 4
order by 1;
```

### 1.3 Ajustes menores

| Item | Correção |
|---|---|
| KPI *Em Atraso* com R$ 0,00 em branco forte | Valor zero usa `--text-mute`. Só ganha cor quando existe atraso real. |
| Largura do conteúdo | `max-width: 1600px; margin-inline: auto;` — hoje sobra faixa preta à direita em telas largas. |
| Card *Fixo vs Variável* | Com uma barra só, o card fica vazio. Trocar por barra 100% empilhada horizontal única, com percentual escrito dentro. |
| Altura dos cards | Fixar altura do gráfico (`height={260}`) em vez de deixar o container esticar. |
| Cores das categorias | Vêm de `categorias.cor`, nunca de índice do array — senão a cor muda quando o usuário cria uma categoria nova. |

---

## 2. Camada de entrada de dados

É a parte que falta e a que decide se o painel sobrevive. Quatro superfícies:

### 2.1 Lançamento rápido (principal)

Botão fixo no canto inferior direito, atalho `N`. Abre modal com foco já no campo de valor.

**Campos visíveis por padrão** (o resto fica atrás de "Mais opções"):

```
[ Despesa | Receita ]        ← alternador
Valor          R$ ______     ← foco automático, teclado numérico no mobile
Descrição      ___________
Categoria      [select com cor]
Data           [hoje]        ← pré-preenchido
Status         [ Pago | Previsto ]
```

**Mais opções:** método de pagamento, centro de custo, data de pagamento separada da competência, parcelamento, recorrência, fornecedor, observação, anexo.

Ao salvar: modal fecha, saldo atualiza otimista, *toast* com ação "Desfazer" por 5 segundos.

### 2.2 Parcelamento e recorrência dentro do formulário

```
[ ] Repetir todo mês        → cria registro em `recorrencias`
[ ] Parcelar em [ 12 ] x    → gera 12 lançamentos com grupo_parcelamento_id
```

Ao marcar parcelamento, mostrar em tempo real: `12x de R$ 291,66 — de set/2026 a ago/2027`. A última parcela absorve o arredondamento.

### 2.3 Tabela de lançamentos editável

A tabela da versão atual já existe. Precisa ganhar:

- Ação de editar e excluir por linha (excluir é `deleted_at`, nunca `delete`)
- Marcar como pago direto na linha (um clique no *badge* `previsto`)
- Seleção múltipla para ações em lote: marcar pagos, trocar categoria, excluir
- Botão "Novo lançamento" no header do card

### 2.4 Telas de cadastro

Rotas próprias, fora do painel:

| Rota | Conteúdo |
|---|---|
| `/categorias` | CRUD com nome, tipo, natureza (fixo/variável), cor, ícone, categoria-pai |
| `/metodos` | Contas e cartões: nome, tipo, limite, dia de fechamento, dia de vencimento |
| `/recorrencias` | Assinaturas e contas fixas, com ativar/desativar e data de término |
| `/orcamento` | Grade categoria × mês com valor-limite editável inline; botão "copiar do mês anterior" |
| `/configuracoes` | Renda: valor do salário, dia do pagamento, meta de economia mensal |

### 2.5 Primeira execução

Assistente de quatro passos, obrigatório antes do painel:

1. **Renda** — salário líquido e dia do pagamento. Gera a recorrência de receita automaticamente.
2. **Categorias** — lista padrão pré-marcada, com opção de desmarcar e adicionar.
3. **Contas** — pelo menos um método de pagamento.
4. **Orçamento** *(pulável)* — teto por categoria. Sem isso o card *Orçado vs Realizado* nasce vazio.

Sem esse assistente, o painel abre zerado e o cliente não sabe por onde começar.

### 2.6 Validação

```ts
const lancamentoSchema = z.object({
  tipo: z.enum(['despesa', 'receita']),
  descricao: z.string().min(2, 'Descreva o lançamento').max(120),
  valor: z.number().positive('O valor deve ser maior que zero'),
  dataCompetencia: z.string().date(),
  dataPagamento: z.string().date().nullable(),
  status: z.enum(['previsto', 'pago', 'atrasado', 'cancelado']),
  categoriaId: z.string().uuid('Selecione uma categoria'),
  metodoId: z.string().uuid().nullable(),
  parcelaTotal: z.number().int().min(1).max(60).nullable(),
}).refine(d => d.status !== 'pago' || d.dataPagamento, {
  message: 'Lançamento pago precisa de data de pagamento',
  path: ['dataPagamento'],
});
```

Máscara de moeda no campo de valor: aceitar `1234,56` e `1.234,56`, guardar `1234.56`.

---

## 3. Exportação

Item de menu próprio (`/relatorios`) e botão no header do painel. Abre modal:

```
Formato      ( ) PDF   ( ) Planilha (.xlsx)   ( ) CSV
Período      [ usar filtros atuais | escolher outro ]
Incluir      [x] Resumo e indicadores
             [x] Gráficos            (apenas PDF)
             [x] Despesas por categoria
             [x] Orçado vs realizado
             [x] Lançamentos detalhados
                                        [ Cancelar ]  [ Gerar ]
```

### 3.1 Planilha (.xlsx) — SheetJS

Uma aba por seção. É o formato que o cliente vai realmente usar para trabalhar os números.

| Aba | Conteúdo |
|---|---|
| Resumo | Período, receitas, despesas, saldo, comprometimento, a pagar, em atraso |
| Lançamentos | Data, descrição, valor, tipo, status, categoria, método, centro de custo, parcela, observação |
| Por Categoria | Categoria, natureza, total, percentual, quantidade |
| Orçado vs Realizado | Categoria, orçado, realizado, saldo, percentual |
| Evolução Mensal | Meses em coluna, categorias em linha |

```ts
import * as XLSX from 'xlsx';

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(lancamentos.map(l => ({
  Data: formatarData(l.dataCompetencia),
  Descrição: l.descricao,
  Valor: l.tipo === 'despesa' ? -l.valor : l.valor,   // número, não texto
  Status: l.status,
  Categoria: l.categoriaNome,
  Método: l.metodoNome,
})));

ws['!cols'] = [{wch:12},{wch:38},{wch:14},{wch:12},{wch:18},{wch:16}];
ws['!freeze'] = { xSplit: 0, ySplit: 1 };

// formato de moeda na coluna C
const range = XLSX.utils.decode_range(ws['!ref']!);
for (let r = 1; r <= range.e.r; r++) {
  const cell = ws[XLSX.utils.encode_cell({ r, c: 2 })];
  if (cell) cell.z = 'R$ #,##0.00;[Red]-R$ #,##0.00';
}

XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos');
XLSX.writeFile(wb, `financeiro_${periodo}.xlsx`);
```

**Regra:** valor sai como número, nunca como string formatada. Planilha com texto no lugar de número é inútil para quem vai somar.

### 3.2 PDF — jsPDF + autoTable

Duas abordagens possíveis. **Não usar** captura de tela da página inteira (`html2canvas` no `body`): gera PDF pesado, texto não selecionável e cortes de página aleatórios.

O caminho correto é montar o documento:

```ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

// Cabeçalho
doc.setFontSize(18); doc.text('Relatório Financeiro', 14, 20);
doc.setFontSize(10); doc.setTextColor(120);
doc.text(`Período: ${inicio} a ${fim}`, 14, 27);

// Bloco de indicadores
autoTable(doc, {
  startY: 36,
  head: [['Receitas', 'Despesas', 'Saldo', 'Comprometimento']],
  body: [[brl(receitas), brl(despesas), brl(saldo), `${comprometimento}%`]],
  theme: 'grid',
  headStyles: { fillColor: [15, 22, 32] },
});

// Gráficos: converter o SVG do Recharts em PNG
const png = await svgParaPng(chartRef.current!.querySelector('svg')!, 2);
doc.addImage(png, 'PNG', 14, doc.lastAutoTable.finalY + 10, 182, 80);

// Tabela de lançamentos
autoTable(doc, {
  startY: doc.lastAutoTable.finalY + 100,
  head: [['Data', 'Descrição', 'Categoria', 'Status', 'Valor']],
  body: lancamentos.map(l => [...]),
  columnStyles: { 4: { halign: 'right' } },
  didDrawPage: () => rodape(doc),   // paginação e data de geração
});

doc.save(`relatorio_${periodo}.pdf`);
```

Função auxiliar de conversão:

```ts
async function svgParaPng(svg: SVGElement, escala = 2): Promise<string> {
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = svg.clientWidth * escala;
  canvas.height = svg.clientHeight * escala;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0F1620';                    // fundo, senão sai transparente
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}
```

**Cuidado:** fontes externas dentro do SVG não são renderizadas na conversão. Ou embutir a fonte em base64 no SVG, ou aceitar a fonte padrão nos rótulos dos gráficos do PDF.

### 3.3 CSV

Só a tabela de lançamentos. Separador `;` e codificação UTF-8 com BOM — sem o BOM, o Excel brasileiro quebra os acentos.

```ts
const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
```

---

## 4. Ordem de execução

1. Correções dos gráficos (itens 1.1 a 1.3) — rápido e destrava a leitura do painel
2. Modal de lançamento rápido com atualização otimista
3. Edição e exclusão na tabela
4. Telas de categorias e métodos de pagamento
5. Assistente de primeira execução
6. Tela de orçamento
7. Recorrências e parcelamento
8. Exportação: primeiro XLSX e CSV (simples), depois PDF

---

## 5. Prompt para o Claude Code

> Continue o painel financeiro. Fase 1: corrija os gráficos conforme a seção 1 de `ETAPA-2.md` — todos os gráficos de barra precisam de `maxBarSize` e a série mensal precisa vir com meses vazios preenchidos por zero. Fase 2: implemente a camada de entrada de dados da seção 2, começando pelo modal de lançamento rápido com atualização otimista e desfazer. Fase 3: exportação da seção 3, na ordem XLSX → CSV → PDF.
>
> Restrições: validação com zod em todo formulário; exclusão sempre por `deleted_at`; valor monetário armazenado como número e exportado como número; nenhuma cor fora dos tokens; todo formulário precisa funcionar com teclado.
>
> Pare ao fim de cada fase para eu validar antes de seguir.
