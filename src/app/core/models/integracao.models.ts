export interface IntegracaoEmpresaResponse {
  empresaId: string;
  razaoSocial: string;
  cnpj: string;
  empresaAtiva: boolean;
  possuiToken: boolean;
  tokenAtivo: boolean;
  prefixo?: string;
  dataCriacao?: string;
  dataUltimoUso?: string;
}

export interface GerarTokenResponse {
  empresaId: string;
  chave: string;
  prefixo: string;
}
