export interface PlanoContaResponse {
  id: string;
  codigo: string;
  codigoReduzido: number;
  nome: string;
  tipo: string;
  empresaId: string;
}

export interface CriarContaRequest {
  codigoPai: string;
  nome: string;
}

export interface AtualizarContaRequest {
  nome: string;
  tipo: string;
}

export interface PlanoContaAdmin {
  id: string;
  codigo: string;
  codigoReduzido: number;
  nome: string;
  tipo: string;
  fixo: boolean;
  nivel: number;
  codigoDominio: string | null;
  dominioRevisar: boolean;
}
