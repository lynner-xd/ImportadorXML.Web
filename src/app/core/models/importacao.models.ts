export interface ImportacaoResultado {
  totalProcessados: number;
  totalSucesso: number;
  totalErros: number;
  itensProcessados: ItemProcessado[];
  erros: ImportacaoErro[];
}

export interface ItemProcessado {
  arquivo: string;
  tipo: string;
  numero: string;
  valor: number;
}

export interface ImportacaoErro {
  arquivo: string;
  mensagem: string;
}
