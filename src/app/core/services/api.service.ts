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
import { AtividadeMonitor, ErroMonitor, EmpresaMonitorOption } from '../models/monitoramento.models';
import { IntegracaoEmpresaResponse, GerarTokenResponse } from '../models/integracao.models';
import { ConfiguracaoSefaz, SefazBuscaResultado, NotasPendentesPaged } from '../models/sefaz.models';

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
  listarDocumentos(tipo?: string, dataInicio?: string, dataFim?: string, page = 1, pageSize = 50, numero?: string): Observable<PagedResult<DocumentoFiscal>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    if (tipo) params = params.set('tipo', tipo);
    if (dataInicio) params = params.set('dataInicio', dataInicio);
    if (dataFim) params = params.set('dataFim', dataFim);
    if (numero) params = params.set('numero', numero);
    return this.http.get<PagedResult<DocumentoFiscal>>(`${this.api}/documentos`, { params });
  }

  excluirDocumento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/documentos/${id}`);
  }

  excluirDocumentos(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.api}/documentos`, { body: { ids } });
  }

  // ===== Monitoramento (dev) =====
  listarMonitoramentoAtividades(f: { empresaId?: string; acao?: string; de?: string; ate?: string; page: number }): Observable<PagedResult<AtividadeMonitor>> {
    let params = new HttpParams().set('page', f.page.toString()).set('pageSize', '50');
    if (f.empresaId) params = params.set('empresaId', f.empresaId);
    if (f.acao) params = params.set('acao', f.acao);
    if (f.de) params = params.set('de', f.de);
    if (f.ate) params = params.set('ate', f.ate);
    return this.http.get<PagedResult<AtividadeMonitor>>(`${this.api}/dev/monitoramento/atividades`, { params });
  }

  listarMonitoramentoErros(f: { empresaId?: string; origem?: string; de?: string; ate?: string; page: number }): Observable<PagedResult<ErroMonitor>> {
    let params = new HttpParams().set('page', f.page.toString()).set('pageSize', '50');
    if (f.empresaId) params = params.set('empresaId', f.empresaId);
    if (f.origem) params = params.set('origem', f.origem);
    if (f.de) params = params.set('de', f.de);
    if (f.ate) params = params.set('ate', f.ate);
    return this.http.get<PagedResult<ErroMonitor>>(`${this.api}/dev/monitoramento/erros`, { params });
  }

  listarMonitoramentoEmpresas(): Observable<EmpresaMonitorOption[]> {
    return this.http.get<EmpresaMonitorOption[]>(`${this.api}/dev/monitoramento/empresas`);
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
    viaIntegracao?: boolean;
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
    if (params.viaIntegracao !== undefined && params.viaIntegracao !== null) {
      httpParams = httpParams.set('viaIntegracao', String(params.viaIntegracao));
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

  excluirLancamentos(ids: string[]): Observable<void> {
    return this.http.delete<void>(`${this.api}/lancamentos`, { body: { ids } });
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

  getAdminPlanoContas(empresaId: string): Observable<PlanoContaResponse[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<PlanoContaResponse[]>(`${this.api}/admin/relatorios/plano-contas`, { params });
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

  // ===== Admin - Integração =====
  listarIntegracao(): Observable<IntegracaoEmpresaResponse[]> {
    return this.http.get<IntegracaoEmpresaResponse[]>(`${this.api}/admin/integracao`);
  }

  gerarTokenIntegracao(empresaId: string): Observable<GerarTokenResponse> {
    return this.http.post<GerarTokenResponse>(`${this.api}/admin/integracao/${empresaId}/gerar`, {});
  }

  alterarStatusTokenIntegracao(empresaId: string, ativo: boolean): Observable<void> {
    return this.http.patch<void>(`${this.api}/admin/integracao/${empresaId}/status`, { ativo });
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

  // ===== SEFAZ (DFe) =====
  private sefazBase(empresaId?: string): { url: string; params: HttpParams } {
    const url = empresaId ? `${this.api}/admin/sefaz` : `${this.api}/sefaz`;
    let params = new HttpParams();
    if (empresaId) params = params.set('empresaId', empresaId);
    return { url, params };
  }

  getSefazConfiguracao(empresaId?: string): Observable<ConfiguracaoSefaz> {
    const { url, params } = this.sefazBase(empresaId);
    return this.http.get<ConfiguracaoSefaz>(`${url}/configuracao`, { params });
  }

  salvarSefazConfiguracao(form: FormData, empresaId?: string): Observable<ConfiguracaoSefaz> {
    const { url, params } = this.sefazBase(empresaId);
    return this.http.put<ConfiguracaoSefaz>(`${url}/configuracao`, form, { params });
  }

  buscarNotasSefaz(empresaId?: string): Observable<SefazBuscaResultado> {
    const { url, params } = this.sefazBase(empresaId);
    return this.http.post<SefazBuscaResultado>(`${url}/buscar`, {}, { params });
  }

  listarNotasSefaz(
    filtros: { status?: string; dataInicio?: string; dataFim?: string; page: number; pageSize: number },
    empresaId?: string
  ): Observable<NotasPendentesPaged> {
    const { url, params } = this.sefazBase(empresaId);
    let p = params.set('page', filtros.page.toString()).set('pageSize', filtros.pageSize.toString());
    if (filtros.status) p = p.set('status', filtros.status);
    if (filtros.dataInicio) p = p.set('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) p = p.set('dataFim', filtros.dataFim);
    return this.http.get<NotasPendentesPaged>(`${url}/pendentes`, { params: p });
  }

  importarNotasSefaz(ids: string[], empresaId?: string): Observable<ImportacaoResultado> {
    const { url, params } = this.sefazBase(empresaId);
    return this.http.post<ImportacaoResultado>(`${url}/pendentes/importar`, { ids }, { params });
  }

  ignorarNotasSefaz(ids: string[], empresaId?: string): Observable<void> {
    const { url, params } = this.sefazBase(empresaId);
    return this.http.post<void>(`${url}/pendentes/ignorar`, { ids }, { params });
  }

  manifestarNotaSefaz(id: string, empresaId?: string): Observable<void> {
    const { url, params } = this.sefazBase(empresaId);
    return this.http.post<void>(`${url}/pendentes/${id}/manifestar`, {}, { params });
  }
}
