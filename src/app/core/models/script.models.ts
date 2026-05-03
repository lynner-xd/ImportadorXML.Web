export interface ScriptResultadoResponse {
  type: 'select' | 'dml' | 'ddl';
  columns?: string[];
  rows?: (string | null)[][];
  rowsAffected?: number;
}

export interface ScriptHistoricoResponse {
  id: string;
  script: string;
  dataExecucao: string;
}
