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
  modo: 'sintetico' | 'analitico';
  secoes: DreSecao[];
}

export interface BalancoContaItem {
  codigo: string;
  nome: string;
  valor: number;
  isCalculado: boolean;
  nivel: number;
}

export interface BalancoPatrimonialResponse {
  dataBase: string;
  modo: 'sintetico' | 'analitico';
  ativo: BalancoContaItem[];
  passivoPL: BalancoContaItem[];
  totalAtivo: number;
  totalPassivoPL: number;
  resultadoExercicio: number;
}
