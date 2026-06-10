import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ContratoRequest } from '../../core/models/contrato.models';
import { EmpresaOption } from '../../core/models/relatorio.models';

@Component({
  selector: 'app-admin-contratos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-contratos.html',
  styleUrl: './admin-contratos.scss'
})
export class AdminContratosComponent implements OnInit {
  empresas = signal<EmpresaOption[]>([]);
  loading = signal(false);
  error = signal('');

  empresaSelecionadaId = '';

  form: ContratoRequest = {
    empresaId: undefined,
    nome: '',
    cpfCnpj: '',
    nomeSocio: '',
    cpfSocio: '',
    nacionalidade: '',
    estadoCivil: '',
    profissao: '',
    rg: '',
    endereco: '',
    valor: 0,
    valorPorExtenso: '',
    diaVencimento: 5,
    cidadeUf: '',
    dataContrato: new Date().toISOString().split('T')[0]
  };

  valorFormatado = '';
  cpfCnpjFormatado = '';
  cpfSocioFormatado = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.listarEmpresas().subscribe({
      next: (data) => this.empresas.set(data)
    });
  }

  aoMudarEmpresa(): void {
    const id = this.empresaSelecionadaId;
    if (!id) {
      this.form.empresaId = undefined;
      return;
    }
    this.form.empresaId = id;
    this.api.obterDadosEmpresaContrato(id).subscribe({
      next: (d) => {
        this.form.nome = d.nome;
        this.form.cpfCnpj = d.cpfCnpj;
        this.cpfCnpjFormatado = this.formatarCpfCnpj(d.cpfCnpj);
      },
      error: () => {
        // se a empresa não tiver dados, mantém em branco
      }
    });
  }

  onValorInput(value: string): void {
    const apenasNumeros = value.replace(/\D/g, '');
    const centavos = parseInt(apenasNumeros || '0', 10);
    this.form.valor = centavos / 100;
    this.valorFormatado = this.formatarMoeda(centavos);
  }

  private formatarMoeda(centavos: number): string {
    if (centavos === 0) return '';
    const reais = Math.floor(centavos / 100);
    const cents = centavos % 100;
    const reaisStr = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${reaisStr},${cents.toString().padStart(2, '0')}`;
  }

  onCpfCnpjInput(value: string): void {
    const digitos = value.replace(/\D/g, '').slice(0, 14);
    this.form.cpfCnpj = digitos;
    this.cpfCnpjFormatado = this.formatarCpfCnpj(digitos);
  }

  onCpfSocioInput(value: string): void {
    const digitos = value.replace(/\D/g, '').slice(0, 11);
    this.form.cpfSocio = digitos;
    this.cpfSocioFormatado = this.formatarCpfCnpj(digitos);
  }

  private formatarCpfCnpj(digitos: string): string {
    const d = digitos.replace(/\D/g, '');
    if (d.length <= 11) {
      return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return d
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  private validar(): string | null {
    const f = this.form;
    if (!f.nome.trim()) return 'Nome é obrigatório.';
    const digitos = f.cpfCnpj.replace(/\D/g, '');
    if (digitos.length !== 11 && digitos.length !== 14) return 'CPF/CNPJ inválido (11 ou 14 dígitos).';
    if (!f.nomeSocio.trim()) return 'Nome do sócio é obrigatório.';
    const digitosSocio = f.cpfSocio.replace(/\D/g, '');
    if (digitosSocio.length !== 11) return 'CPF do sócio inválido (11 dígitos).';
    if (!f.nacionalidade.trim()) return 'Nacionalidade é obrigatória.';
    if (!f.estadoCivil.trim()) return 'Estado civil é obrigatório.';
    if (!f.profissao.trim()) return 'Profissão é obrigatória.';
    if (!f.rg.trim()) return 'RG é obrigatório.';
    if (!f.endereco.trim()) return 'Endereço é obrigatório.';
    if (f.valor <= 0) return 'Valor deve ser maior que zero.';
    if (!f.valorPorExtenso.trim()) return 'Valor por extenso é obrigatório.';
    if (f.diaVencimento < 1 || f.diaVencimento > 31) return 'Dia de vencimento deve estar entre 1 e 31.';
    if (!f.cidadeUf.trim()) return 'Cidade – UF é obrigatório.';
    if (!f.dataContrato) return 'Data do contrato é obrigatória.';
    return null;
  }

  gerar(): void {
    const erro = this.validar();
    if (erro) {
      this.error.set(erro);
      return;
    }

    this.error.set('');
    this.loading.set(true);

    this.api.gerarContratoPdf(this.form).subscribe({
      next: (blob) => {
        this.loading.set(false);
        const slug = this.slugify(this.form.nome);
        const nomeArquivo = `contrato-${slug}-${this.form.dataContrato}.pdf`;
        this.downloadBlob(blob, nomeArquivo);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Erro ao gerar contrato.');
      }
    });
  }

  private slugify(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private downloadBlob(blob: Blob, nome: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}
