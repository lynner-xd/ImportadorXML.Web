export interface LancamentoResponse {
  id: string;
  data: string;
  descricao: string;
  contaDebitoId: string;
  contaCreditoId: string;
  contaDebito: string;
  contaCredito: string;
  valor: number;
  observacao?: string;
  observacaoContador?: string;
  origem: string;
  dataCriacao: string;
  importado: boolean;
  viaIntegracao: boolean;
}

export interface CriarLancamentoRequest {
  data: string;
  descricao: string;
  observacao?: string;
  contaDebitoId: string;
  contaCreditoId: string;
  valor: number;
}

export interface AtualizarLancamentoRequest {
  data: string;
  descricao: string;
  observacao?: string;
  contaDebitoId: string;
  contaCreditoId: string;
  valor: number;
}
