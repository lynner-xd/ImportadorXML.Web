import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { UsuarioResponse, CriarUsuarioRequest, EditarUsuarioRequest } from '../../core/models/usuario.models';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-usuarios.html',
  styleUrl: './admin-usuarios.scss'
})
export class AdminUsuariosComponent implements OnInit {
  usuarios = signal<UsuarioResponse[]>([]);
  loading = signal(false);
  showDialog = signal(false);
  editando = signal<UsuarioResponse | null>(null);
  error = signal('');
  successMsg = signal('');

  form: CriarUsuarioRequest = {
    email: '',
    razaoSocial: '',
    cnpj: '',
    socioNome: '',
    socioCpfCnpj: '',
    contadorNome: '',
    contadorCrc: ''
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.api.listarUsuarios().subscribe({
      next: (data) => { this.usuarios.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  abrirNovo(): void {
    this.form = {
      email: '',
      razaoSocial: '',
      cnpj: '',
      socioNome: '',
      socioCpfCnpj: '',
      contadorNome: '',
      contadorCrc: ''
    };
    this.editando.set(null);
    this.error.set('');
    this.showDialog.set(true);
  }

  abrirEditar(u: UsuarioResponse): void {
    this.form = {
      email: u.email,
      razaoSocial: u.empresa?.razaoSocial ?? '',
      cnpj: u.empresa?.cnpj ?? '',
      socioNome: u.empresa?.socioNome ?? '',
      socioCpfCnpj: u.empresa?.socioCpfCnpj ?? '',
      contadorNome: u.empresa?.contadorNome ?? '',
      contadorCrc: u.empresa?.contadorCrc ?? ''
    };
    this.editando.set(u);
    this.error.set('');
    this.showDialog.set(true);
  }

  salvar(): void {
    if (!this.form.email || !this.form.razaoSocial || !this.form.cnpj) {
      this.error.set('Preencha email, razão social e CNPJ.');
      return;
    }

    const payload: CriarUsuarioRequest = {
      email: this.form.email,
      razaoSocial: this.form.razaoSocial,
      cnpj: this.form.cnpj,
      socioNome: this.form.socioNome || null,
      socioCpfCnpj: this.form.socioCpfCnpj || null,
      contadorNome: this.form.contadorNome || null,
      contadorCrc: this.form.contadorCrc || null
    };

    const edit = this.editando();
    if (edit) {
      this.api.editarUsuario(edit.id, payload as EditarUsuarioRequest).subscribe({
        next: () => { this.showDialog.set(false); this.carregar(); this.showSuccess('Usuário atualizado com sucesso.'); },
        error: (err) => this.error.set(err.error?.message || 'Erro ao atualizar.')
      });
    } else {
      this.api.criarUsuario(payload).subscribe({
        next: () => { this.showDialog.set(false); this.carregar(); this.showSuccess('Usuário criado. Credenciais enviadas por email.'); },
        error: (err) => this.error.set(err.error?.message || 'Erro ao criar usuário.')
      });
    }
  }

  alterarStatus(u: UsuarioResponse): void {
    const novoStatus = !u.ativo;
    const acao = novoStatus ? 'ativar' : 'inativar';
    if (confirm(`Deseja ${acao} o usuário ${u.email}?`)) {
      this.api.alterarStatusUsuario(u.id, novoStatus).subscribe({
        next: () => { this.carregar(); this.showSuccess(`Usuário ${novoStatus ? 'ativado' : 'inativado'} com sucesso.`); }
      });
    }
  }

  resetSenha(u: UsuarioResponse): void {
    if (confirm(`Deseja resetar a senha de ${u.email}? Uma nova senha será enviada por email.`)) {
      this.api.resetSenhaUsuario(u.id).subscribe({
        next: () => this.showSuccess('Nova senha enviada por email.'),
        error: (err) => this.showSuccess(err.error?.message || 'Erro ao resetar senha.')
      });
    }
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
