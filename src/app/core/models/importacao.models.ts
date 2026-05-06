export interface ImportacaoResultado {
  totalProcessados: number;
  totalImportados: number;
  totalDuplicados: number;
  totalErros: number;
  valorTotalImportado: number;
  itensProcessados: ItemProcessado[];
  erros: ImportacaoErro[];
}

export interface ItemProcessado {
  arquivo: string;
  data: string;
  empresa: string;
  valor: number;
  status: string;
}

export interface ImportacaoErro {
  arquivo: string;
  mensagem: string;
}
