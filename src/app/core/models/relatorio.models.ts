export interface RelatorioRequest {
  dataInicio: string;
  dataFim: string;
}

export interface BalanceteItem {
  codigo: string;
  nome: string;
  saldoAnterior: number;
  debitos: number;
  creditos: number;
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
