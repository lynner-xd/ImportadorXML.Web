export interface AtividadeMonitor {
  id: string;
  dataHora: string;
  empresaNome: string | null;
  usuarioEmail: string | null;
  acao: string;
  descricao: string;
  detalhes: string | null;
}

export interface ErroMonitor {
  id: string;
  dataHora: string;
  empresaNome: string | null;
  usuarioEmail: string | null;
  origem: string;
  mensagem: string;
  detalhes: string | null;
}

export interface EmpresaMonitorOption {
  id: string;
  razaoSocial: string;
}
