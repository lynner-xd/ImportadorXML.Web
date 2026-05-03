import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { UsuarioResponse, CriarUsuarioRequest, EditarUsuarioRequest } from '../../core/models/usuario.models';

type DialogMode = 'novo-contador' | 'novo-empresa' | 'editar';

@Component({
  selector: 'app-dev-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dev-usuarios.html',
  styleUrl: './dev-usuarios.scss'
})
export class DevUsuariosComponent implements OnInit {
  usuarios = signal<UsuarioResponse[]>([]);
  loading = signal(false);
  showDialog = signal(false);
  dialogMode = signal<DialogMode>('novo-empresa');
  editando = signal<UsuarioResponse | null>(null);
  error = signal('');
  successMsg = signal('');

  form: { email: string; razaoSocial: string; cnpj: string } = { email: '', razaoSocial: '', cnpj: '' };

  isEmpresaForm = computed(() =>
    this.dialogMode() === 'novo-empresa' ||
    (this.dialogMode() === 'editar' && this.editando()?.empresa != null)
  );

  dialogTitle = computed(() => {
    switch (this.dialogMode()) {
      case 'novo-contador': return 'Novo Contador';
      case 'novo-empresa': return 'Nova Empresa';
      case 'editar': return 'Editar Usuário';
    }
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.api.devListarUsuarios().subscribe({
      next: (data) => { this.usuarios.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  abrirNovoContador(): void {
    this.form = { email: '', razaoSocial: '', cnpj: '' };
    this.editando.set(null);
    this.dialogMode.set('novo-contador');
    this.error.set('');
    this.showDialog.set(true);
  }

  abrirNovaEmpresa(): void {
    this.form = { email: '', razaoSocial: '', cnpj: '' };
    this.editando.set(null);
    this.dialogMode.set('novo-empresa');
    this.error.set('');
    this.showDialog.set(true);
  }

  abrirEditar(u: UsuarioResponse): void {
    this.form = {
      email: u.email,
      razaoSocial: u.empresa?.razaoSocial ?? '',
      cnpj: u.empresa?.cnpj ?? ''
    };
    this.editando.set(u);
    this.dialogMode.set('editar');
    this.error.set('');
    this.showDialog.set(true);
  }

  salvar(): void {
    const mode = this.dialogMode();

    if (mode === 'novo-contador') {
      if (!this.form.email) { this.error.set('Preencha o email.'); return; }
      this.api.devCriarContador({ email: this.form.email }).subscribe({
        next: () => { this.showDialog.set(false); this.carregar(); this.showSuccess('Contador criado. Credenciais enviadas por email.'); },
        error: (err) => this.error.set(err.error?.message || 'Erro ao criar contador.')
      });
      return;
    }

    if (mode === 'novo-empresa') {
      if (!this.form.email || !this.form.razaoSocial || !this.form.cnpj) {
        this.error.set('Preencha todos os campos.'); return;
      }
      const req: CriarUsuarioRequest = { email: this.form.email, razaoSocial: this.form.razaoSocial, cnpj: this.form.cnpj };
      this.api.devCriarEmpresa(req).subscribe({
        next: () => { this.showDialog.set(false); this.carregar(); this.showSuccess('Empresa criada. Credenciais enviadas por email.'); },
        error: (err) => this.error.set(err.error?.message || 'Erro ao criar empresa.')
      });
      return;
    }

    const edit = this.editando()!;
    if (!this.form.email) { this.error.set('Preencha o email.'); return; }
    const req: EditarUsuarioRequest = { email: this.form.email, razaoSocial: this.form.razaoSocial, cnpj: this.form.cnpj };
    this.api.devEditarUsuario(edit.id, req).subscribe({
      next: () => { this.showDialog.set(false); this.carregar(); this.showSuccess('Usuário atualizado com sucesso.'); },
      error: (err) => this.error.set(err.error?.message || 'Erro ao atualizar.')
    });
  }

  alterarStatus(u: UsuarioResponse): void {
    const novoStatus = !u.ativo;
    const acao = novoStatus ? 'ativar' : 'inativar';
    if (confirm(`Deseja ${acao} o usuário ${u.email}?`)) {
      this.api.devAlterarStatus(u.id, novoStatus).subscribe({
        next: () => { this.carregar(); this.showSuccess(`Usuário ${novoStatus ? 'ativado' : 'inativado'} com sucesso.`); }
      });
    }
  }

  resetSenha(u: UsuarioResponse): void {
    if (confirm(`Deseja resetar a senha de ${u.email}? Uma nova senha será enviada por email.`)) {
      this.api.devResetSenha(u.id).subscribe({
        next: () => this.showSuccess('Nova senha enviada por email.'),
        error: (err) => this.error.set(err.error?.message || 'Erro ao resetar senha.')
      });
    }
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
