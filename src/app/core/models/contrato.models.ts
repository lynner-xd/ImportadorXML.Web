export interface ContratoRequest {
  empresaId?: string;
  nome: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  rg: string;
  cpfCnpj: string;
  endereco: string;
  valor: number;
  valorPorExtenso: string;
  diaVencimento: number;
  cidadeUf: string;
  dataContrato: string;
}

export interface DadosEmpresaContrato {
  nome: string;
  cpfCnpj: string;
}
