export type CondicaoRegra = 'IniciaCom' | 'Contem' | 'EmBranco' | 'Todos';

export interface PreviewLinha {
  indice: number;
  data: string;
  valor: number;
  historico: string;
  contaDebitoId?: string;
  contaDebitoLabel?: string;
  contaCreditoId?: string;
  contaCreditoLabel?: string;
  fitId?: string;
  duplicada: boolean;
  ok: boolean;
}

export interface BancoOpcao {
  codigo: string;
  nome: string;
}

export interface ImportarPreview {
  bancoDetectado: string;
  bancoCodigo: string;
  confianca: number;
  bancos: BancoOpcao[];
  linhas: PreviewLinha[];
}

export interface RegraImportacao {
  id: string;
  condicao: CondicaoRegra;
  texto?: string;
  contaDebitoId: string;
  contaDebitoLabel?: string;
  ordem: number;
}

// Payload de criação/edição — sem `id` (o backend rejeita Guid vazio e usa o id da rota no PUT)
export interface RegraImportacaoRequest {
  condicao: CondicaoRegra;
  texto?: string;
  contaDebitoId: string;
  ordem: number;
}

export interface ConfiguracaoImportacao {
  contaDebitoPositivoId?: string;
  contaCreditoPositivoId?: string;
  contaCreditoNegativoId?: string;
  regras: RegraImportacao[];
}

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
  tipoExcecao?: string | null;
  mensagemCompleta?: string | null;
  stackTrace?: string | null;
}
