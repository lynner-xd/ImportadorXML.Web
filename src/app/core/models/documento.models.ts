export interface DocumentoFiscal {
  id: string;
  chaveAcesso: string;
  numero: string | null;
  serie: string | null;
  modelo: string | null;
  tipo: string;
  origem: 'Manual' | 'Sefaz';
  dataEmissao: string;
  cnpjEmitente: string | null;
  nomeEmitente: string | null;
  cnpjDestinatario: string | null;
  nomeDestinatario: string | null;
  valorTotal: number;
  dataImportacao: string;
}

export interface LancamentoContas {
  id: string;
  valor: number;
  descricao: string | null;
  contaDebitoId: string;
  contaCreditoId: string;
}

export interface DocumentoDetalhe {
  documento: DocumentoFiscal;
  lancamentos: LancamentoContas[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
