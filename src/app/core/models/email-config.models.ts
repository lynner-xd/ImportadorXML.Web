export interface ConfiguracaoEmailRequest {
  servidorSmtp: string;
  porta: number;
  usarSsl: boolean;
  emailRemetente: string;
  senhaRemetente: string;
  nomeRemetente: string;
}

export interface ConfiguracaoEmailResponse {
  id: string;
  servidorSmtp: string;
  porta: number;
  usarSsl: boolean;
  emailRemetente: string;
  nomeRemetente: string;
  dataAtualizacao: string;
  configurado: boolean;
}
