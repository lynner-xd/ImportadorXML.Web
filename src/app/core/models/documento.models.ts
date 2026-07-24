export interface DocumentoFiscal {
  id: string;
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

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
