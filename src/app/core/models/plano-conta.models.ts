export interface PlanoContaResponse {
  id: string;
  codigo: string;
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
