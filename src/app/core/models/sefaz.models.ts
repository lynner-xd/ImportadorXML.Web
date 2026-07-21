export interface ConfiguracaoSefaz {
  certificadoConfigurado: boolean;
  certificadoTitular?: string;
  certificadoValidade?: string;
  uf: string;
  manifestacaoAutomatica: boolean;
  ultimoNsu: number;
  ultimaConsulta?: string;
}

export interface SefazBuscaResultado {
  notasNovas: number;
  completas: number;
  aguardandoXml: number;
  canceladas: number;
  dataConsulta: string;
  mensagem: string;
}

export type StatusNotaSefaz = 'Resumo' | 'Completa' | 'Importada' | 'Ignorada' | 'Cancelada' | 'Erro';

export interface NotaSefazPendente {
  id: string;
  chaveAcesso: string;
  nsu: number;
  modelo?: string;
  status: StatusNotaSefaz;
  cnpjEmitente?: string;
  nomeEmitente?: string;
  dataEmissao?: string;
  valorTotal?: number;
  mensagemErro?: string;
  dataDownload: string;
  dataImportacao?: string;
}

export interface NotasPendentesPaged {
  items: NotaSefazPendente[];
  total: number;
  page: number;
  pageSize: number;
}
