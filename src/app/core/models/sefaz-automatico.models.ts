export interface ConfiguracaoBuscaAutomatica {
  ativa: boolean;
  horaInicio: number;
  horaFim: number;
}

export interface FilaBuscaAutomaticaItem {
  empresaId: string;
  razaoSocial: string;
  naFila: boolean;
  posicao: number | null;
  ultimaBuscaAutomatica?: string;
  certificadoValidade?: string;
}

export interface ExecucaoResumo {
  id: string;
  data: string;
  inicio: string;
  fim?: string;
  status: string;
  concluidas: number;
  erros: number;
  canceladas: number;
  naoExecutadas: number;
}

export interface ExecucaoItem {
  empresaId: string;
  razaoSocial: string;
  status: string;
  mensagem?: string;
  notasNovas: number;
  completas: number;
  aguardandoXml: number;
  canceladas: number;
  inicio?: string;
  fim?: string;
}

export interface ExecucaoDetalhe extends ExecucaoResumo {
  itens: ExecucaoItem[];
}
