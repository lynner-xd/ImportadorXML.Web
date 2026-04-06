export interface UsuarioResponse {
  id: string;
  email: string;
  role: string;
  ativo: boolean;
  dataCriacao: string;
  empresa?: EmpresaResumo;
}

export interface EmpresaResumo {
  id: string;
  razaoSocial: string;
  cnpj: string;
  ativa: boolean;
}

export interface CriarUsuarioRequest {
  email: string;
  razaoSocial: string;
  cnpj: string;
}

export interface EditarUsuarioRequest {
  email: string;
  razaoSocial: string;
  cnpj: string;
}

export interface AlterarStatusRequest {
  ativo: boolean;
}
