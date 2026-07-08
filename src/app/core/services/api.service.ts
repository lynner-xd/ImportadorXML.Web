import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UsuarioResponse, CriarUsuarioRequest, EditarUsuarioRequest } from '../models/usuario.models';
import { PlanoContaResponse, CriarContaRequest, AtualizarContaRequest } from '../models/plano-conta.models';
import { LancamentoResponse, CriarLancamentoRequest, AtualizarLancamentoRequest } from '../models/lancamento.models';
import { BalanceteItem, AnaliticoItem, EmpresaOption, DreResponse, BalancoPatrimonialResponse } from '../models/relatorio.models';
import { ConfiguracaoEmailRequest, ConfiguracaoEmailResponse } from '../models/email-config.models';
import { ImportacaoResultado, ConfiguracaoImportacao, RegraImportacao, RegraImportacaoRequest, ImportarPreview } from '../models/importacao.models';
import { ScriptResultadoResponse, ScriptHistoricoResponse } from '../models/script.models';
import { DocumentoFiscal, PagedResult } from '../models/documento.models';
import { ContratoRequest, DadosEmpresaContrato } from '../models/contrato.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ===== Importação =====
  obterConfiguracaoImportacao(): Observable<ConfiguracaoImportacao> {
    return this.http.get<ConfiguracaoImportacao>(`${this.api}/importacao/configuracao`);
  }

  salvarConfiguracaoImportacao(dto: ConfiguracaoImportacao): Observable<void> {
    return this.http.put<void>(`${this.api}/importacao/configuracao`, dto);
  }

  criarRegraImportacao(dto: RegraImportacaoRequest): Observable<RegraImportacao> {
    return this.http.post<RegraImportacao>(`${this.api}/importacao/regras`, dto);
  }

  atualizarRegraImportacao(id: string, dto: RegraImportacaoRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/importacao/regras/${id}`, dto);
  }

  excluirRegraImportacao(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/importacao/regras/${id}`);
  }

  reordenarRegrasImportacao(ids: string[]): Observable<void> {
    return this.http.put<void>(`${this.api}/importacao/regras/ordem`, { ids });
  }

  previewImportacao(arquivo: File, bancoOverride?: string): Observable<ImportarPreview> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    if (bancoOverride) form.append('bancoOverride', bancoOverride);
    return this.http.post<ImportarPreview>(`${this.api}/importacao/preview`, form);
  }

  reprocessarImportacao(req: { bancoCodigo: string; transacoes: any[] }): Observable<ImportarPreview> {
    return this.http.post<ImportarPreview>(`${this.api}/importacao/reprocessar`, req);
  }

  confirmarImportacao(req: { linhas: any[] }): Observable<{ criados: number }> {
    return this.http.post<{ criados: number }>(`${this.api}/importacao/confirmar`, req);
  }

  importarXml(formData: FormData): Observable<ImportacaoResultado> {
    return this.http.post<ImportacaoResultado>(`${this.api}/importacao`, formData);
  }

  importarChunk(formData: FormData): Observable<ImportacaoResultado | null> {
    return this.http.post<ImportacaoResultado>(
      `${this.api}/importacao/chunk`,
      formData,
      { observe: 'response' }
    ).pipe(map((res: HttpResponse<ImportacaoResultado>) => res.status === 200 ? res.body : null));
  }

  // ===== Documentos =====
  listarDocumentos(tipo?: string, dataInicio?: string, dataFim?: string, page = 1, pageSize = 50): Observable<PagedResult<DocumentoFiscal>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (tipo) params = params.set('tipo', tipo);
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    return this.http.get<PagedResult<DocumentoFiscal>>(`${this.api}/documentos`, { params });
  }

  excluirDocumento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/documentos/${id}`);
  }

  excluirDocumentos(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.api}/documentos`, { body: { ids } });
  }

  // ===== Lançamentos =====
  listarLancamentos(params: {
    page: number;
    pageSize: number;
    dataInicio?: string;
    dataFim?: string;
    debito?: string;
    credito?: string;
    importado?: boolean;
  }): Observable<PagedResult<LancamentoResponse>> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('pageSize', params.pageSize.toString());
    if (params.dataInicio) httpParams = httpParams.set('dataInicio', params.dataInicio);
    if (params.dataFim) httpParams = httpParams.set('dataFim', params.dataFim);
    if (params.debito) httpParams = httpParams.set('debito', params.debito);
    if (params.credito) httpParams = httpParams.set('credito', params.credito);
    if (params.importado !== undefined && params.importado !== null) {
      httpParams = httpParams.set('importado', String(params.importado));
    }
    return this.http.get<PagedResult<LancamentoResponse>>(
      `${this.api}/lancamentos`, { params: httpParams });
  }

  listarDescricoes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/lancamentos/descricoes`);
  }

  criarLancamento(req: CriarLancamentoRequest): Observable<LancamentoResponse> {
    return this.http.post<LancamentoResponse>(`${this.api}/lancamentos`, req);
  }

  atualizarLancamento(id: string, req: AtualizarLancamentoRequest): Observable<LancamentoResponse> {
    return this.http.put<LancamentoResponse>(`${this.api}/lancamentos/${id}`, req);
  }

  excluirLancamento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/lancamentos/${id}`);
  }

  // ===== Plano de Contas =====
  listarPlanoContas(): Observable<PlanoContaResponse[]> {
    return this.http.get<PlanoContaResponse[]>(`${this.api}/plano-contas`);
  }

  listarGrupos(): Observable<PlanoContaResponse[]> {
    return this.http.get<PlanoContaResponse[]>(`${this.api}/plano-contas/grupos`);
  }

  criarConta(req: CriarContaRequest): Observable<PlanoContaResponse> {
    return this.http.post<PlanoContaResponse>(`${this.api}/plano-contas`, req);
  }

  atualizarConta(id: string, req: AtualizarContaRequest): Observable<void> {
    return this.http.put<void>(`${this.api}/plano-contas/${id}`, req);
  }

  excluirConta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/plano-contas/${id}`);
  }

  // ===== Relatórios (Empresa) =====
  getBalancete(dataInicio: string, dataFim: string): Observable<BalanceteItem[]> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim);
    return this.http.get<BalanceteItem[]>(`${this.api}/relatorios/balancete`, { params });
  }

  getAnalitico(dataInicio: string, dataFim: string, contaId: string): Observable<AnaliticoItem[]> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim).set('contaId', contaId);
    return this.http.get<AnaliticoItem[]>(`${this.api}/relatorios/analitico`, { params });
  }

  getSintetico(dataInicio: string, dataFim: string, codigoPrefixo?: string): Observable<BalanceteItem[]> {
    let params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim);
    if (codigoPrefixo) params = params.set('codigoPrefixo', codigoPrefixo);
    return this.http.get<BalanceteItem[]>(`${this.api}/relatorios/sintetico`, { params });
  }

  getDre(dataInicio: string, dataFim: string, niveis: number[]): Observable<DreResponse> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim).set('niveis', niveis.join(','));
    return this.http.get<DreResponse>(`${this.api}/relatorios/dre`, { params });
  }

  getBalancoPatrimonial(dataInicio: string, dataFim: string, modo: string, exibir: string): Observable<BalancoPatrimonialResponse> {
    const params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim).set('modo', modo).set('exibir', exibir);
    return this.http.get<BalancoPatrimonialResponse>(`${this.api}/relatorios/balanco-patrimonial`, { params });
  }

  downloadBalancoPdf(dataInicio: string, dataFim: string, modo: string, exibir: string, extra?: Record<string, string>): Observable<Blob> {
    let params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim).set('modo', modo).set('exibir', exibir);
    if (extra) Object.entries(extra).forEach(([k, v]) => params = params.set(k, v));
    return this.http.get(`${this.api}/relatorios/balanco-patrimonial/pdf`, { params, responseType: 'blob' });
  }

  downloadRelatorioPdf(tipo: string, dataInicio: string, dataFim: string, extra?: Record<string, string>): Observable<Blob> {
    let params = new HttpParams().set('dataInicio', dataInicio).set('dataFim', dataFim);
    if (extra) Object.entries(extra).forEach(([k, v]) => params = params.set(k, v));
    return this.http.get(`${this.api}/relatorios/${tipo}/pdf`, { params, responseType: 'blob' });
  }

  // ===== Admin - Relatórios =====
  getAdminBalancete(empresaId: string, dataInicio: string, dataFim: string): Observable<BalanceteItem[]> {
    const params = new HttpParams().set('empresaId', empresaId).set('dataInicio', dataInicio).set('dataFim', dataFim);
    return this.http.get<BalanceteItem[]>(`${this.api}/admin/relatorios/balancete`, { params });
  }

  getAdminAnalitico(empresaId: string, dataInicio: string, dataFim: string, contaId: string): Observable<AnaliticoItem[]> {
    const params = new HttpParams().set('empresaId', empresaId).set('dataInicio', dataInicio).set('dataFim', dataFim).set('contaId', contaId);
    return this.http.get<AnaliticoItem[]>(`${this.api}/admin/relatorios/analitico`, { params });
  }

  getAdminSintetico(empresaId: string, dataInicio: string, dataFim: string, codigoPrefixo?: string): Observable<BalanceteItem[]> {
    let params = new HttpParams().set('empresaId', empresaId).set('dataInicio', dataInicio).set('dataFim', dataFim);
    if (codigoPrefixo) params = params.set('codigoPrefixo', codigoPrefixo);
    return this.http.get<BalanceteItem[]>(`${this.api}/admin/relatorios/sintetico`, { params });
  }

  getAdminDre(empresaId: string, dataInicio: string, dataFim: string, niveis: number[]): Observable<DreResponse> {
    const params = new HttpParams().set('empresaId', empresaId).set('dataInicio', dataInicio).set('dataFim', dataFim).set('niveis', niveis.join(','));
    return this.http.get<DreResponse>(`${this.api}/admin/relatorios/dre`, { params });
  }

  getAdminBalancoPatrimonial(empresaId: string, dataInicio: string, dataFim: string, modo: string, exibir: string): Observable<BalancoPatrimonialResponse> {
    const params = new HttpParams().set('empresaId', empresaId).set('dataInicio', dataInicio).set('dataFim', dataFim).set('modo', modo).set('exibir', exibir);
    return this.http.get<BalancoPatrimonialResponse>(`${this.api}/admin/relatorios/balanco-patrimonial`, { params });
  }

  downloadAdminBalancoPdf(empresaId: string, dataInicio: string, dataFim: string, modo: string, exibir: string, extra?: Record<string, string>): Observable<Blob> {
    let params = new HttpParams().set('empresaId', empresaId).set('dataInicio', dataInicio).set('dataFim', dataFim).set('modo', modo).set('exibir', exibir);
    if (extra) Object.entries(extra).forEach(([k, v]) => params = params.set(k, v));
    return this.http.get(`${this.api}/admin/relatorios/balanco-patrimonial/pdf`, { params, responseType: 'blob' });
  }

  downloadAdminRelatorioPdf(tipo: string, empresaId: string, dataInicio: string, dataFim: string, extra?: Record<string, string>): Observable<Blob> {
    let params = new HttpParams().set('empresaId', empresaId).set('dataInicio', dataInicio).set('dataFim', dataFim);
    if (extra) Object.entries(extra).forEach(([k, v]) => params = params.set(k, v));
    return this.http.get(`${this.api}/admin/relatorios/${tipo}/pdf`, { params, responseType: 'blob' });
  }

  listarEmpresas(): Observable<EmpresaOption[]> {
    return this.http.get<EmpresaOption[]>(`${this.api}/admin/relatorios/empresas`);
  }

  // ===== Admin - Contratos =====
  obterDadosEmpresaContrato(empresaId: string): Observable<DadosEmpresaContrato> {
    return this.http.get<DadosEmpresaContrato>(`${this.api}/admin/contratos/empresa/${empresaId}/dados`);
  }

  gerarContratoPdf(req: ContratoRequest): Observable<Blob> {
    return this.http.post(`${this.api}/admin/contratos/pdf`, req, { responseType: 'blob' });
  }

  // ===== Admin - Usuários =====
  listarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.api}/admin/usuarios`);
  }

  criarUsuario(req: CriarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.api}/admin/usuarios`, req);
  }

  editarUsuario(id: string, req: EditarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.api}/admin/usuarios/${id}`, req);
  }

  alterarStatusUsuario(id: string, ativo: boolean): Observable<void> {
    return this.http.put<void>(`${this.api}/admin/usuarios/${id}/status`, { ativo });
  }

  resetSenhaUsuario(id: string): Observable<void> {
    return this.http.post<void>(`${this.api}/admin/usuarios/${id}/reset-senha`, {});
  }

  // ===== Admin - Email =====
  obterConfiguracaoEmail(): Observable<ConfiguracaoEmailResponse> {
    return this.http.get<ConfiguracaoEmailResponse>(`${this.api}/admin/email/configuracao`);
  }

  salvarConfiguracaoEmail(req: ConfiguracaoEmailRequest): Observable<ConfiguracaoEmailResponse> {
    return this.http.post<ConfiguracaoEmailResponse>(`${this.api}/admin/email/configuracao`, req);
  }

  testarEmail(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/admin/email/testar`, {});
  }

  // ===== Dev - Usuários =====
  devListarUsuarios(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(`${this.api}/dev/usuarios`);
  }

  devCriarContador(req: { email: string }): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.api}/dev/usuarios/contador`, req);
  }

  devCriarEmpresa(req: CriarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.api}/dev/usuarios/empresa`, req);
  }

  devEditarUsuario(id: string, req: EditarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.put<UsuarioResponse>(`${this.api}/dev/usuarios/${id}`, req);
  }

  devAlterarStatus(id: string, ativo: boolean): Observable<void> {
    return this.http.put<void>(`${this.api}/dev/usuarios/${id}/status`, { ativo });
  }

  devResetSenha(id: string): Observable<void> {
    return this.http.post<void>(`${this.api}/dev/usuarios/${id}/reset-senha`, {});
  }

  // ===== Dev - Script =====
  devExecutarScript(scriptBase64: string): Observable<ScriptResultadoResponse> {
    return this.http.post<ScriptResultadoResponse>(`${this.api}/dev/script/executar`, { scriptBase64 });
  }

  devHistoricoScripts(): Observable<ScriptHistoricoResponse[]> {
    return this.http.get<ScriptHistoricoResponse[]>(`${this.api}/dev/script/historico`);
  }
}
