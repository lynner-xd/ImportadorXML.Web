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
  socioNome?: string | null;
  socioCpfCnpj?: string | null;
  contadorNome?: string | null;
  contadorCrc?: string | null;
}

export interface CriarUsuarioRequest {
  email: string;
  razaoSocial: string;
  cnpj: string;
  socioNome?: string | null;
  socioCpfCnpj?: string | null;
  contadorNome?: string | null;
  contadorCrc?: string | null;
}

export interface EditarUsuarioRequest {
  email: string;
  razaoSocial: string;
  cnpj: string;
  socioNome?: string | null;
  socioCpfCnpj?: string | null;
  contadorNome?: string | null;
  contadorCrc?: string | null;
}

export interface AlterarStatusRequest {
  ativo: boolean;
}
