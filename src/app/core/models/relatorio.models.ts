export interface RelatorioRequest {
  dataInicio: string;
  dataFim: string;
}

export interface BalanceteItem {
  codigo: string;
  nome: string;
  saldoAnterior: number;
  debito: number;
  credito: number;
  saldoAtual: number;
}

export interface AnaliticoItem {
  data: string;
  descricao: string;
  contrapartida: string;
  saldoAnterior: number;
  debito: number;
  credito: number;
  saldoAtual: number;
}

export interface EmpresaOption {
  id: string;
  razaoSocial: string;
  cnpj: string;
}

export interface DreContaItem {
  codigo: string;
  nome: string;
  nivel: number;
  valor: number;
}

export type DreSecaoTipo =
  | 'ReceitaBruta'
  | 'Deducoes'
  | 'ReceitaLiquida'
  | 'Custos'
  | 'LucroBruto'
  | 'DespesasOperacionais'
  | 'DespesasNaoOperacionais'
  | 'LucroPrejuizo';

export interface DreSecao {
  tipo: DreSecaoTipo;
  titulo: string;
  sinal: '+' | '-' | '=';
  contas: DreContaItem[];
  total: number;
  ehSubtotal: boolean;
}

export interface DreResponse {
  dataInicio: string;
  dataFim: string;
  niveisExibidos: number[];
  secoes: DreSecao[];
}

export interface BalancoContaItem {
  codigo: string;
  nome: string;
  saldoAnterior: number;
  valor: number;
  isCalculado: boolean;
  nivel: number;
}

export interface BalancoPatrimonialResponse {
  dataInicio: string;
  dataFim: string;
  modo: 'sintetico' | 'analitico';
  ativo: BalancoContaItem[];
  passivoPL: BalancoContaItem[];
  totalAtivoAnterior: number;
  totalAtivo: number;
  totalPassivoPLAnterior: number;
  totalPassivoPL: number;
  resultadoExercicioAnterior: number;
  resultadoExercicio: number;
}
