export interface ContagemEmpresa {
  contas: number;
  regras: number;
  lancamentos: number;
  contasPagar: number;
}

export interface PreviewReplicacao {
  origem: ContagemEmpresa;
  destino: ContagemEmpresa;
  bloqueiosPlano: string[];
  bloqueiosRegras: string[];
}

export interface ResultadoReplicacao {
  contasCopiadas: number;
  regrasCopiadas: number;
}
