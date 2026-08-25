export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  role: string;
  razaoSocial?: string;
  primeiroAcesso: boolean;
  telas?: string[] | null;
}

export interface AlterarSenhaRequest {
  senhaAtual: string;
  novaSenha: string;
}
