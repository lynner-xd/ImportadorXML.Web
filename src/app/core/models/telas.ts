export interface TelaCatalogoItem {
  chave: string;
  label: string;
  padrao: boolean;
}

// Fonte única do catálogo de telas controláveis (usada pela sidebar e pela tela de usuários).
export const TELAS_CATALOGO: TelaCatalogoItem[] = [
  { chave: 'importacao', label: 'Importar XML', padrao: true },
  { chave: 'lancamentos', label: 'Lançamentos (com importação de extrato)', padrao: true },
  { chave: 'plano-contas', label: 'Plano de Contas', padrao: true },
  { chave: 'relatorios-balancete', label: 'Relatório Balancete', padrao: true },
  { chave: 'relatorios-analitico', label: 'Relatório Analítico', padrao: true },
  { chave: 'relatorios-sintetico', label: 'Relatório Sintético', padrao: true },
  { chave: 'relatorios-dre', label: 'Relatório DRE', padrao: false },
  { chave: 'relatorios-balanco-patrimonial', label: 'Relatório Balanço Patrimonial', padrao: false },
  { chave: 'relatorios-contas-pagar', label: 'Relatório Contas a Pagar', padrao: false },
  { chave: 'contas-pagar', label: 'Contas a Pagar', padrao: false },
  { chave: 'sefaz', label: 'Integração SEFAZ', padrao: false },
];
