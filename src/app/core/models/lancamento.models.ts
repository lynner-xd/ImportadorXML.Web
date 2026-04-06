export interface LancamentoResponse {
  id: string;
  data: string;
  descricao: string;
  contaDebitoId: string;
  contaDebitoCodigo: string;
  contaDebitoNome: string;
  contaCreditoId: string;
  contaCreditoCodigo: string;
  contaCreditoNome: string;
  valor: number;
  observacaoContador?: string;
  origem: string;
}

export interface CriarLancamentoRequest {
  data: string;
  descricao: string;
  observacao?: string;
  contaDebitoId: string;
  contaCreditoId: string;
  valor: number;
}
