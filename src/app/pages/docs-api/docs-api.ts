import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

interface DocParam {
  nome: string;
  tipo: string;
  obrigatorio: boolean;
  descricao: string;
}

interface DocEndpoint {
  id: string;
  metodo: 'GET' | 'POST';
  rota: string;
  titulo: string;
  descricao: string;
  params: DocParam[];
  exemploRequest: string;
  exemploResposta?: string;
}

@Component({
  selector: 'app-docs-api',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs-api.html',
  styleUrl: './docs-api.scss'
})
export class DocsApiComponent {
  readonly baseUrl = environment.apiUrl.startsWith('/')
    ? window.location.origin + environment.apiUrl
    : environment.apiUrl;

  readonly endpoints: DocEndpoint[] = [
    {
      id: 'plano-contas',
      metodo: 'GET',
      rota: '/public/v1/plano-contas',
      titulo: 'Listar plano de contas',
      descricao: 'Retorna as contas analíticas (nível 5) da empresa. Use os códigos retornados para criar lançamentos e consultar o relatório analítico.',
      params: [],
      exemploRequest: `curl -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  "${this.baseUrl}/public/v1/plano-contas"`,
      exemploResposta: `[
  { "codigo": "1.1.1.1.001", "nome": "Caixa Geral", "tipo": "Ativo" },
  { "codigo": "4.1.2.1.001", "nome": "Prestacao de Servicos", "tipo": "Receita" }
]`
    },
    {
      id: 'importacao',
      metodo: 'POST',
      rota: '/public/v1/importacao',
      titulo: 'Importar XMLs fiscais',
      descricao: 'Envia um ou mais arquivos XML (NFe, NFCe, NFSe) via multipart/form-data. Limite total de 50MB por requisição. Documentos duplicados são detectados e ignorados automaticamente.',
      params: [
        { nome: 'arquivos', tipo: 'arquivo (multipart)', obrigatorio: true, descricao: 'Um ou mais arquivos .xml' },
        { nome: 'tipo', tipo: 'texto (multipart)', obrigatorio: true, descricao: '"Entrada" ou "Saida"' }
      ],
      exemploRequest: `curl -X POST -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  -F "arquivos=@nota1.xml" \\
  -F "arquivos=@nota2.xml" \\
  -F "tipo=Entrada" \\
  "${this.baseUrl}/public/v1/importacao"`,
      exemploResposta: `{
  "totalProcessados": 2,
  "totalImportados": 1,
  "totalDuplicados": 1,
  "totalErros": 0,
  "valorTotalImportado": 1500.00,
  "arquivosDuplicados": ["nota2.xml"],
  "erros": [],
  "itensProcessados": [ ... ]
}`
    },
    {
      id: 'criar-lancamento',
      metodo: 'POST',
      rota: '/public/v1/lancamentos',
      titulo: 'Criar lançamento contábil',
      descricao: 'Cria um lançamento manual. As contas de débito e crédito são identificadas pelo código contábil (contas analíticas, nível 5 — consulte o plano de contas).',
      params: [
        { nome: 'codigoContaDebito', tipo: 'string', obrigatorio: true, descricao: 'Código da conta de débito, ex.: "1.1.1.1.001"' },
        { nome: 'codigoContaCredito', tipo: 'string', obrigatorio: true, descricao: 'Código da conta de crédito' },
        { nome: 'data', tipo: 'string (ISO 8601)', obrigatorio: true, descricao: 'Data do lançamento, ex.: "2026-07-01"' },
        { nome: 'valor', tipo: 'decimal', obrigatorio: true, descricao: 'Valor do lançamento (maior que zero)' },
        { nome: 'descricao', tipo: 'string', obrigatorio: true, descricao: 'Descrição do lançamento' },
        { nome: 'observacao', tipo: 'string', obrigatorio: false, descricao: 'Observação complementar' }
      ],
      exemploRequest: `curl -X POST -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "codigoContaDebito": "1.1.1.1.001",
    "codigoContaCredito": "4.1.2.1.001",
    "data": "2026-07-01",
    "valor": 250.00,
    "descricao": "Recebimento de servico"
  }' \\
  "${this.baseUrl}/public/v1/lancamentos"`,
      exemploResposta: `{
  "id": "6f9c2e1a-...",
  "data": "2026-07-01T00:00:00Z",
  "contaDebito": "1.1.1.1.001 - Caixa Geral",
  "contaCredito": "4.1.2.1.001 - Prestacao de Servicos",
  "valor": 250.00,
  "descricao": "Recebimento de servico",
  "importado": false,
  "viaIntegracao": true
}`
    },
    {
      id: 'listar-lancamentos',
      metodo: 'GET',
      rota: '/public/v1/lancamentos',
      titulo: 'Consultar lançamentos',
      descricao: 'Lista os lançamentos manuais da empresa de forma paginada. Lançamentos gerados automaticamente pela importação de XML não são retornados por este endpoint. O campo viaIntegracao indica os lançamentos criados por esta API (o campo origem retorna "Manual" também para eles — use viaIntegracao para distingui-los).',
      params: [
        { nome: 'page', tipo: 'int (query)', obrigatorio: false, descricao: 'Página, padrão 1' },
        { nome: 'pageSize', tipo: 'int (query)', obrigatorio: false, descricao: 'Itens por página, padrão 50, máximo 100' },
        { nome: 'dataInicio', tipo: 'data (query)', obrigatorio: false, descricao: 'Filtro de data inicial, ex.: 2026-07-01' },
        { nome: 'dataFim', tipo: 'data (query)', obrigatorio: false, descricao: 'Filtro de data final' }
      ],
      exemploRequest: `curl -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  "${this.baseUrl}/public/v1/lancamentos?page=1&pageSize=50&dataInicio=2026-07-01&dataFim=2026-07-31"`,
      exemploResposta: `{
  "items": [ ... ],
  "total": 132,
  "page": 1,
  "pageSize": 50,
  "totalPages": 3
}`
    },
    {
      id: 'balancete',
      metodo: 'GET',
      rota: '/public/v1/relatorios/balancete',
      titulo: 'Relatório: Balancete',
      descricao: 'Saldos por conta com saldo anterior, débitos, créditos e saldo atual no período. Para PDF, acrescente /pdf à rota (retorna application/pdf).',
      params: [
        { nome: 'dataInicio', tipo: 'data (query)', obrigatorio: true, descricao: 'Início do período' },
        { nome: 'dataFim', tipo: 'data (query)', obrigatorio: true, descricao: 'Fim do período' }
      ],
      exemploRequest: `curl -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  "${this.baseUrl}/public/v1/relatorios/balancete?dataInicio=2026-07-01&dataFim=2026-07-31"

# Versao PDF:
curl -H "X-Api-Key: sk_live_SUA_CHAVE" -o balancete.pdf \\
  "${this.baseUrl}/public/v1/relatorios/balancete/pdf?dataInicio=2026-07-01&dataFim=2026-07-31"`
    },
    {
      id: 'analitico',
      metodo: 'GET',
      rota: '/public/v1/relatorios/analitico',
      titulo: 'Relatório: Analítico',
      descricao: 'Extrato detalhado de uma conta no período. A conta é identificada pelo código contábil. Para PDF, acrescente /pdf à rota.',
      params: [
        { nome: 'dataInicio', tipo: 'data (query)', obrigatorio: true, descricao: 'Início do período' },
        { nome: 'dataFim', tipo: 'data (query)', obrigatorio: true, descricao: 'Fim do período' },
        { nome: 'codigoConta', tipo: 'string (query)', obrigatorio: true, descricao: 'Código da conta, ex.: "1.1.1.1.001"' }
      ],
      exemploRequest: `curl -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  "${this.baseUrl}/public/v1/relatorios/analitico?dataInicio=2026-07-01&dataFim=2026-07-31&codigoConta=1.1.1.1.001"`
    },
    {
      id: 'sintetico',
      metodo: 'GET',
      rota: '/public/v1/relatorios/sintetico',
      titulo: 'Relatório: Sintético',
      descricao: 'Variação do balancete agrupada por prefixo de código. Para PDF, acrescente /pdf à rota.',
      params: [
        { nome: 'dataInicio', tipo: 'data (query)', obrigatorio: true, descricao: 'Início do período' },
        { nome: 'dataFim', tipo: 'data (query)', obrigatorio: true, descricao: 'Fim do período' },
        { nome: 'codigoPrefixo', tipo: 'string (query)', obrigatorio: false, descricao: 'Prefixo de agrupamento, ex.: "1.1"' }
      ],
      exemploRequest: `curl -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  "${this.baseUrl}/public/v1/relatorios/sintetico?dataInicio=2026-07-01&dataFim=2026-07-31&codigoPrefixo=1.1"`
    },
    {
      id: 'dre',
      metodo: 'GET',
      rota: '/public/v1/relatorios/dre',
      titulo: 'Relatório: DRE',
      descricao: 'Demonstração do Resultado do Exercício. Para PDF, acrescente /pdf à rota (parâmetros extras do PDF: assinaturas e classificacao, booleanos, padrão true).',
      params: [
        { nome: 'dataInicio', tipo: 'data (query)', obrigatorio: true, descricao: 'Início do período' },
        { nome: 'dataFim', tipo: 'data (query)', obrigatorio: true, descricao: 'Fim do período' },
        { nome: 'niveis', tipo: 'string (query)', obrigatorio: false, descricao: 'Níveis exibidos, separados por vírgula, ex.: "1,2,3"' }
      ],
      exemploRequest: `curl -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  "${this.baseUrl}/public/v1/relatorios/dre?dataInicio=2026-01-01&dataFim=2026-07-31&niveis=1,2,3"`
    },
    {
      id: 'balanco-patrimonial',
      metodo: 'GET',
      rota: '/public/v1/relatorios/balanco-patrimonial',
      titulo: 'Relatório: Balanço Patrimonial',
      descricao: 'Ativo vs Passivo + Patrimônio Líquido, com Resultado do Exercício injetado em PL. Para PDF, acrescente /pdf à rota (parâmetros extras do PDF: assinaturas, saldoAnterior, classificacao — booleanos, padrão true — e orientacao: "paisagem" ou "retrato").',
      params: [
        { nome: 'dataInicio', tipo: 'data (query)', obrigatorio: true, descricao: 'Início do período' },
        { nome: 'dataFim', tipo: 'data (query)', obrigatorio: true, descricao: 'Data base do balanço' },
        { nome: 'modo', tipo: 'string (query)', obrigatorio: false, descricao: '"sintetico" (padrão) ou "analitico"' },
        { nome: 'exibir', tipo: 'string (query)', obrigatorio: false, descricao: '"todos" (padrão) ou "com-valor" (oculta contas sem saldo)' }
      ],
      exemploRequest: `curl -H "X-Api-Key: sk_live_SUA_CHAVE" \\
  "${this.baseUrl}/public/v1/relatorios/balanco-patrimonial?dataInicio=2026-01-01&dataFim=2026-07-31&modo=sintetico"`
    }
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
}
