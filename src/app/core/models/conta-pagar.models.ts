export interface ContaPagarParcelaList {
  id: string;
  contaPagarId: string;
  nomeFornecedor: string;
  cnpjFornecedor: string;
  numeroNF: string;
  numero: number;
  totalParcelas: number;
  valor: number;
  dataVencimento: string;
  paga: boolean;
  dataPagamento?: string | null;
}

export interface ContaPagarParcelaEdicao {
  numero: number;
  valor: number;
  dataVencimento: string;
}

export interface ContaPagarPreviewItem {
  arquivo: string;
  sucesso: boolean;
  erro?: string | null;
  chaveAcesso?: string | null;
  numeroNF?: string | null;
  nomeFornecedor?: string | null;
  cnpjFornecedor?: string | null;
  dataEmissao?: string | null;
  valorTotal?: number | null;
  formaPagamentoSugerida: string;
  parcelasSugeridas: ContaPagarParcelaEdicao[];
}

export interface ConfirmarContaPagarItem {
  chaveAcesso: string;
  numeroNF: string;
  nomeFornecedor: string;
  cnpjFornecedor: string;
  dataEmissao: string;
  valorTotal: number;
  formaPagamento: string;
  numeroParcelas: number;
  parcelas: ContaPagarParcelaEdicao[];
}

export interface CriarContaPagarManual {
  nomeFornecedor: string;
  cnpjFornecedor: string;
  documento: string;
  dataEmissao: string;
  valorTotal: number;
  formaPagamento: string;
  numeroParcelas: number;
  parcelas: ContaPagarParcelaEdicao[];
  contaDebitoId: string;
}

export interface ConfirmarContasPagarResultado {
  totalCriados: number;
  erros: { chaveAcesso: string; mensagem: string }[];
}
