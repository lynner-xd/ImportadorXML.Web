export interface DocumentoFiscal {
  id: string;
  numero: string | null;
  serie: string | null;
  modelo: string | null;
  tipo: string;
  dataEmissao: string;
  cnpjEmitente: string | null;
  nomeEmitente: string | null;
  cnpjDestinatario: string | null;
  nomeDestinatario: string | null;
  valorTotal: number;
  dataImportacao: string;
}
