import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import logoWhite from './assets/logo-white.png';
import './Dashboard.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
const supabaseConfigMessage = 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.';

type PageKey =
  | 'overview'
  | 'requests'
  | 'services'
  | 'professionals'
  | 'clients'
  | 'transactions'
  | 'trades'
  | 'functions'
  | 'posts'
  | 'complaints'
  | 'support'
  | 'logs'
  | 'activity'
  | 'bugReports'
  | 'notifications'
  | 'emails'
  | 'queries'
  | 'admins';

type IconName =
  | 'grid'
  | 'clipboard'
  | 'wrench'
  | 'briefcase'
  | 'users'
  | 'card'
  | 'tag'
  | 'flag'
  | 'message'
  | 'alert'
  | 'pulse'
  | 'search'
  | 'refresh'
  | 'plus'
  | 'edit'
  | 'arrow'
  | 'clock'
  | 'menu'
  | 'close'
  | 'logout'
  | 'bug'
  | 'bell'
  | 'mail'
  | 'moon'
  | 'sun'
  | 'home'
  | 'shield'
  | 'database'
  | 'play'
  | 'trash'
  | 'copy'
  | 'sort';

interface User {
  id_usuario: number;
  nome: string;
  tipo_conta: string;
  data_criacao: string | null;
  foto_perfil_url: string | null;
  ultima_conexao: string | null;
  fk_tipo_pessoa: number | null;
  fk_email: number | null;
  fk_telefone: number | null;
}

interface Professional {
  id_profissional: number;
  fk_usuario: number;
  fk_perfil: number | null;
  anos_experiencia: string | null;
  plano_premium: boolean;
  verificar_autenticacao: boolean;
  data_admissao: string | null;
}

interface UserEmail {
  id_email: number;
  endereco_email: string | null;
  verificar_autenticacao: boolean;
  data_verificacao: string | null;
  fk_status: number | null;
}

interface UserPhone {
  id_telefone: number;
  ddd: string;
  numero: string;
  verificar_autenticacao: boolean;
  data_verificacao: string | null;
  fk_status: number | null;
}

interface PersonType {
  id_tipo_pessoa: number;
  fk_pessoa_fisica: number | null;
  fk_pessoa_juridica: number | null;
}

interface NaturalPerson {
  cpf: string | null;
}

interface LegalPerson {
  cnpj: string | null;
  razao_social: string | null;
  data_fundacao: string | null;
  nome_fantasia: string;
}

interface ProfessionalDocument {
  tipo_documento: string;
  validacao_documento: boolean;
}

interface ProfessionalCertificate {
  titulo: string;
  data_emissao: string | null;
  arquivo: string | null;
  tipo_arquivo: string | null;
}

interface LoadedUserDetails {
  personType: PersonType | null;
  naturalPerson: NaturalPerson | null;
  legalPerson: LegalPerson | null;
  documents: ProfessionalDocument[];
  certificates: ProfessionalCertificate[];
}

interface Service {
  id_servico_prof: number;
  titulo: string;
  descricao: string | null;
  valor: number | string;
  ativo: boolean;
  fk_profissional: number;
  tipo_execucao: string;
  carga_servico: string;
  data_criacao: string | null;
}

interface Request {
  id_solicitacao: number;
  data_solicitacao: string;
  valor_final: number | string | null;
  fk_usuario: number;
  fk_profissional: number;
  fk_status: number;
  fk_servico_prof: number | null;
}

interface Payment {
  id_pagamento: number;
  fk_solicitacao: number;
  forma_pagamento: string;
  parcelas: number;
  valor: number | string;
  data_pagamento: string;
  numero_comprovante: string;
}

interface Trade {
  id_oficio: number;
  categoria: string;
  cor: string;
  cod_cor: string | null;
}

interface ProfessionalFunction {
  id_funcao: number;
  fk_oficio: number;
  funcao: string;
  descricao: string | null;
  img_funcao: string | null;
}

interface Post {
  id_postagem: number;
  conteudo: string | null;
  data_postagem: string;
  arquivado: boolean;
  fk_perfil: number;
  tipo_autor: 'profissional' | 'empresa';
  fk_grupo_empresa: number | null;
}

interface PostImage {
  fk_postagem: number;
  url: string;
  ordem: number;
}

interface BusinessGroup {
  id_grupo_empresa: number;
  fk_perfil: number;
  nome_empresa: string;
}

interface RequestStatus {
  id_status: number;
  tipo_status: string;
  status: string;
}

interface PushLog {
  id_notificacao: number;
  fk_usuario: number;
  titulo: string;
  conteudo: string;
  push_status: string;
  push_erro: string | null;
  push_tentativas: number;
  data_criacao: string;
}

interface DashboardData {
  users: User[];
  emails: UserEmail[];
  phones: UserPhone[];
  professionals: Professional[];
  services: Service[];
  requests: Request[];
  payments: Payment[];
  trades: Trade[];
  functions: ProfessionalFunction[];
  posts: Post[];
  postImages: PostImage[];
  businessGroups: BusinessGroup[];
  statuses: RequestStatus[];
  pushLogs: PushLog[];
}

type ServiceForm = {
  id?: number;
  titulo: string;
  descricao: string;
  valor: string;
  ativo: boolean;
  fk_profissional: string;
  tipo_execucao: string;
  carga_servico: string;
};

type TradeForm = {
  id?: number;
  categoria: string;
  cor: string;
  cod_cor: string;
};

type FunctionForm = {
  id?: number;
  fk_oficio: string;
  funcao: string;
  descricao: string;
  img_funcao: string;
};

type PostForm = {
  id: number;
  conteudo: string;
  arquivado: boolean;
};

type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'cmyk';
type ThemeMode = 'light' | 'dark';
type RGB = [number, number, number];

type SortState = { key: string; dir: 'asc' | 'desc' };
type SortOption<T> = { key: string; label: string; value: (row: T) => string | number | null | undefined };
type CascadeTable = 'solicitacoes' | 'servicos_profissional' | 'postagens';
type CascadeState = {
  table: CascadeTable;
  ids: number[];
  report: Record<string, number> | null;
  loading: boolean;
  running: boolean;
  error: string;
};

// Páginas que têm barra própria de busca, ordenação e seleção.
const listPages = new Set<PageKey>(['requests', 'services', 'trades', 'functions', 'posts']);

const cascadeMeta: Record<CascadeTable, { singular: string; plural: string; feminine: boolean }> = {
  solicitacoes: { singular: 'solicitação', plural: 'solicitações', feminine: true },
  servicos_profissional: { singular: 'serviço', plural: 'serviços', feminine: false },
  postagens: { singular: 'postagem', plural: 'postagens', feminine: true },
};

// Nomes amigáveis das tabelas mostradas no aviso de exclusão.
const tableLabels: Record<string, string> = {
  solicitacoes: 'Solicitações',
  servicos_profissional: 'Serviços',
  postagens: 'Postagens',
  pagamentos_stripe: 'Pagamentos (Stripe)',
  pagamentos_solicitacao: 'Pagamentos da solicitação',
  pagamentos_pix: 'Pagamentos PIX',
  solicitacoes_anexos: 'Anexos da solicitação',
  imagens_solicitacao: 'Imagens da solicitação',
  deslocamento_profissional: 'Deslocamentos do profissional',
  deslocamentos_profissional: 'Deslocamentos do profissional',
  lista_servicos_solicitacao: 'Itens da lista de serviços',
  lista_servicos: 'Itens da lista de serviços',
  propostas_solicitacao: 'Propostas',
  avaliacoes: 'Avaliações',
  imagens_postagem: 'Mídias da postagem',
  imagens_postagens: 'Imagens da postagem',
  curtidas_postagem: 'Curtidas',
  curtidas_postagens: 'Curtidas',
  comentarios_postagem: 'Comentários',
  comentarios_postagens: 'Comentários',
  servicos_favoritos: 'Serviços favoritados',
  metodos_entrega_servico: 'Métodos de entrega do serviço',
  imagens_servico: 'Imagens do serviço',
};

const emptyData: DashboardData = {
  users: [],
  emails: [],
  phones: [],
  professionals: [],
  services: [],
  requests: [],
  payments: [],
  trades: [],
  functions: [],
  posts: [],
  postImages: [],
  businessGroups: [],
  statuses: [],
  pushLogs: [],
};

const navGroups: { label: string; items: { key: PageKey; label: string; icon: IconName }[] }[] = [
  {
    label: 'Visão geral',
    items: [{ key: 'overview', label: 'Dashboard', icon: 'grid' }],
  },
  {
    label: 'Operação',
    items: [
      { key: 'requests', label: 'Solicitações', icon: 'clipboard' },
      { key: 'services', label: 'Serviços', icon: 'wrench' },
      { key: 'professionals', label: 'Profissionais', icon: 'briefcase' },
      { key: 'clients', label: 'Clientes', icon: 'users' },
      { key: 'transactions', label: 'Transações', icon: 'card' },
      { key: 'trades', label: 'Ofícios', icon: 'tag' },
      { key: 'functions', label: 'Funções', icon: 'briefcase' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [{ key: 'posts', label: 'Postagens', icon: 'message' }],
  },
  {
    label: 'Atendimento',
    items: [
      { key: 'complaints', label: 'Denúncias', icon: 'flag' },
      { key: 'support', label: 'Suporte', icon: 'message' },
      { key: 'emails', label: 'E-mails recebidos', icon: 'mail' },
    ],
  },
  {
    label: 'Monitoramento',
    items: [
      { key: 'activity', label: 'Usuários online', icon: 'pulse' },
      { key: 'logs', label: 'Falhas de notificação', icon: 'alert' },
      { key: 'bugReports', label: 'Relatórios de bugs', icon: 'bug' },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { key: 'notifications', label: 'Notificações gerais', icon: 'bell' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { key: 'admins', label: 'Administradores', icon: 'shield' },
      { key: 'queries', label: 'Consultas SQL', icon: 'database' },
    ],
  },
];

const pageMeta: Record<PageKey, { title: string; subtitle: string }> = {
  overview: { title: 'Dashboard', subtitle: 'Acompanhe a operação do ConsertaJá em um só lugar.' },
  admins: { title: 'Administradores', subtitle: 'Crie contas administrativas e defina quem pode acessar o painel.' },
  requests: { title: 'Solicitações', subtitle: 'Acompanhe os pedidos e atualize seus status.' },
  services: { title: 'Serviços', subtitle: 'Gerencie os serviços publicados pelos profissionais.' },
  professionals: { title: 'Profissionais', subtitle: 'Consulte perfis, verificações e planos.' },
  clients: { title: 'Clientes', subtitle: 'Consulte os clientes cadastrados na plataforma.' },
  transactions: { title: 'Transações', subtitle: 'Visualize pagamentos registrados para as solicitações.' },
  trades: { title: 'Ofícios', subtitle: 'Mantenha as categorias de trabalho oferecidas no aplicativo.' },
  functions: { title: 'Funções', subtitle: 'Gerencie as funções vinculadas a cada ofício.' },
  posts: { title: 'Postagens', subtitle: 'Revise, edite ou remova publicações da plataforma.' },
  complaints: { title: 'Denúncias', subtitle: 'Central de moderação e acompanhamento de denúncias.' },
  support: { title: 'Mensagens de suporte', subtitle: 'Acompanhe as conversas direcionadas à equipe de suporte.' },
  logs: { title: 'Falhas de notificação', subtitle: 'Falhas registradas no envio de notificações para dispositivos.' },
  activity: { title: 'Usuários online', subtitle: 'Conexões recentes identificadas pelo último registro de atividade.' },
  bugReports: { title: 'Relatórios de bugs', subtitle: 'Acompanhe problemas reportados pelos usuários.' },
  notifications: { title: 'Notificações gerais', subtitle: 'Prepare avisos para os usuários da plataforma.' },
  emails: { title: 'E-mails recebidos', subtitle: 'Acompanhe as mensagens recebidas pela plataforma.' },
  queries: { title: 'Consultas SQL', subtitle: 'Consultas salvas no SQL Editor do Supabase, compartilhadas com todos os administradores.' },
};

const iconPaths: Record<IconName, string> = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  clipboard: 'M9 5H5v16h14V5h-4 M9 3h6v4H9z M8 12h8 M8 16h8',
  wrench: 'M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 12l-3-3z',
  briefcase: 'M3 7h18v14H3z M8 7V4h8v3 M3 12h18 M10 12v2h4v-2',
  users: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  card: 'M3 5h18v14H3z M3 10h18 M7 15h4',
  tag: 'M20 13 13 20 3 10V3h7z M7.5 7.5h.01',
  flag: 'M5 21V5 M5 5c5-4 9 4 14 0v10c-5 4-9-4-14 0',
  message: 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z',
  alert: 'M10.3 3.9 1.8 18.5A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.5L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01',
  pulse: 'M3 12h4l3-8 4 16 3-8h4',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.35-4.35',
  refresh: 'M20 7v5h-5 M4 17v-5h5 M5.6 9A7 7 0 0 1 18 6l2 2 M4 16l2 2a7 7 0 0 0 12.4-3',
  plus: 'M12 5v14 M5 12h14',
  edit: 'M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  clock: 'M12 8v4l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  close: 'M18 6 6 18 M6 6l12 12',
  logout: 'M10 17l5-5-5-5 M15 12H3 M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7',
  bug: 'M8 8h8v9a4 4 0 0 1-8 0z M9 4l3 2 3-2 M4 10h4 M16 10h4 M4 16h4 M16 16h4 M12 11v4',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  mail: 'M4 5h16v14H4z M4 7l8 6 8-6',
  moon: 'M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2z',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z M9 12l2 2 4-4',
  database: 'M12 3c4.97 0 9 1.34 9 3s-4.03 3-9 3-9-1.34-9-3 4.03-3 9-3z M3 6v6c0 1.66 4.03 3 9 3s9-1.34 9-3V6 M3 12v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6',
  play: 'M7 4.5v15l12-7.5z',
  trash: 'M4 7h16 M10 11v6 M14 11v6 M6 7l1 13h10l1-13 M9 7V4h6v3',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  sort: 'M7 4v16 M3 8l4-4 4 4 M17 20V4 M13 16l4 4 4-4',
  sun: 'M12 3v2 M12 19v2 M5.64 5.64l1.42 1.42 M16.94 16.94l1.42 1.42 M3 12h2 M19 12h2 M5.64 18.36l1.42-1.42 M16.94 7.06l1.42-1.42 M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}

function currency(value: number | string | null | undefined) {
  const parsed = Number(value);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(parsed) ? parsed : 0
  );
}

function dateTime(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR');
}

function relativeTime(value: string | null | undefined) {
  if (!value) return 'Sem registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sem registro';
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Há ${hours} h`;
  return `Há ${Math.floor(hours / 24)} d`;
}

function displayError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string' && message) return message;
  }
  return String(error);
}

// URL da landing page (o dashboard fica em /dashboard/).
const siteUrl = '../';

const gestaoSqlFile = 'supabase/dashboard_admin_gestao.sql';

const deleteDependencyLabels: [string, string][] = [
  ['ass_oficio_profissional', 'profissionais vinculados'],
  ['ass_oficio_grupo_empresa', 'empresas vinculadas'],
  ['servicos_profissional', 'serviços cadastrados'],
  ['servicos_chat_temporarios', 'propostas no chat'],
  ['servicos_catalogo', 'catálogo de serviços'],
  ['solicitacoes', 'solicitações'],
  ['funcoes', 'funções'],
];

function rlsBlockedError(action: string, entity: string) {
  return new Error(
    `O Supabase não ${action} ${entity}: a política de segurança (RLS) da tabela bloqueou a operação sem retornar erro. ` +
    `Execute o script ${gestaoSqlFile} no SQL Editor do Supabase e tente novamente.`
  );
}

function isMissingRpc(error: unknown) {
  const err = error as { code?: string; message?: string } | null;
  return Boolean(err && (err.code === 'PGRST202' || err.code === '42883' || /could not find the function/i.test(err.message ?? '')));
}

function describeDeleteError(error: unknown, entity: string) {
  const err = (error ?? {}) as { code?: string; message?: string; details?: string };
  const text = `${err.message ?? ''} ${err.details ?? ''}`;
  if (err.code === '23503' || /foreign key/i.test(text)) {
    // Tabelas que ainda apontam para o item (mensagem do Postgres: ... on table "x" / referenced from table "x").
    const referencing = new Set(
      [...text.matchAll(/(?:constraint "[^"]+" on table|referenced from table) "([^"]+)"/g)].map((match) => match[1])
    );
    const found = [...referencing].map((table) => deleteDependencyLabels.find(([name]) => name === table)?.[1] ?? table);
    return new Error(
      `Não é possível excluir ${entity}: ainda existem registros usando este item${found.length ? ` (${found.join(', ')})` : ''}. ` +
      'Remova ou altere esses vínculos antes de excluir.'
    );
  }
  if (err.code === '42501' || /permission denied|row-level security|acesso negado/i.test(text)) {
    return new Error(`Sem permissão para excluir ${entity}. Execute o script ${gestaoSqlFile} no SQL Editor do Supabase.`);
  }
  return new Error(displayError(error));
}

function safeHttpUrl(value: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(() =>
    window.localStorage.getItem('consertaja-dashboard-theme') === 'dark' ? 'dark' : 'light'
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authError, setAuthError] = useState('');
  const [adminAuthorization, setAdminAuthorization] = useState<{ userId: string; authorized: boolean } | null>(null);
  const [signInBusy, setSignInBusy] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('consertaja-dashboard-theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === 'dark' ? 'light' : 'dark');
  }

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAuthError(`Não foi possível verificar sua sessão: ${error.message}`);
        setSession(error ? null : data.session);
        setAuthLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAuthError(`Não foi possível verificar sua sessão: ${displayError(error)}`);
        setAuthLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const sessionUserId = session?.user.id;

  useEffect(() => {
    if (!supabase || !sessionUserId) {
      setAdminAuthorization(null);
      return undefined;
    }

    let active = true;
    setAdminAuthorization(null);
    setAuthError('');

    void (async () => {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', sessionUserId)
          .maybeSingle();
        if (!active) return;
        if (error) {
          setAuthError(`Não foi possível verificar o cadastro administrativo. Execute o script supabase/admin_access.sql no SQL Editor. Detalhe: ${error.message}`);
          setAdminAuthorization({ userId: sessionUserId, authorized: false });
          return;
        }
        if (!data) {
          setAuthError('Esta conta ainda não está autorizada como administradora. Confira o cadastro em public.admin_users.');
          setAdminAuthorization({ userId: sessionUserId, authorized: false });
          return;
        }
        setAdminAuthorization({ userId: sessionUserId, authorized: true });
      } catch (error) {
        if (!active) return;
        setAuthError(`Não foi possível verificar o acesso administrativo: ${displayError(error)}`);
        setAdminAuthorization({ userId: sessionUserId, authorized: false });
      }
    })();

    return () => {
      active = false;
    };
  }, [sessionUserId]);

  async function signIn(email: string, password: string) {
    if (!supabase) return;
    setSignInBusy(true);
    setAuthError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSession(data.session);
    } catch (error) {
      setAuthError(`Não foi possível entrar: ${displayError(error)}`);
    } finally {
      setSignInBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(`Não foi possível sair da conta: ${error.message}`);
  }

  if (!supabase) {
    return <AuthMessage title="Configure a conexão com o Supabase" message={supabaseConfigMessage} theme={theme} onToggleTheme={toggleTheme} />;
  }
  if (authLoading) {
    return <AuthLoading message="Verificando sua sessão…" theme={theme} onToggleTheme={toggleTheme} />;
  }
  if (!session) {
    return <LoginScreen onSubmit={signIn} busy={signInBusy} error={authError} theme={theme} onToggleTheme={toggleTheme} />;
  }
  const currentAdminAuthorization =
    adminAuthorization?.userId === session.user.id ? adminAuthorization : null;
  if (!currentAdminAuthorization) {
    return <AuthLoading message="Verificando acesso administrativo…" theme={theme} onToggleTheme={toggleTheme} />;
  }
  if (!currentAdminAuthorization.authorized) {
    return (
      <AuthMessage
        title="Acesso administrativo não autorizado"
        message={authError || 'Esta conta não está na lista de administradores.'}
        actionLabel="Sair"
        onAction={() => void signOut()}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return <DashboardApp adminEmail={session.user.email ?? ''} onSignOut={() => void signOut()} theme={theme} onToggleTheme={toggleTheme} />;
}

function DashboardApp({ adminEmail, onSignOut, theme, onToggleTheme }: { adminEmail: string; onSignOut: () => void; theme: ThemeMode; onToggleTheme: () => void }) {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [page, setPage] = useState<PageKey>('overview');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [databaseIssues, setDatabaseIssues] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceForm | null>(null);
  const [tradeForm, setTradeForm] = useState<TradeForm | null>(null);
  const [functionForm, setFunctionForm] = useState<FunctionForm | null>(null);
  const [postForm, setPostForm] = useState<PostForm | null>(null);
  const [clientForm, setClientForm] = useState<{ id: number; nome: string } | null>(null);
  const [detailsUserId, setDetailsUserId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [cascade, setCascade] = useState<CascadeState | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const title = pageMeta[page];

  async function loadData(silent = false) {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      if (!supabase) {
        setDatabaseConnected(false);
        setDatabaseIssues(false);
        setLoadError(supabaseConfigMessage);
        return;
      }

      const [users, emails, phones, professionals, services, requests, payments, trades, functions, posts, postMedia, pluralPostMedia, businessGroups, statuses, pushLogs] =
        await Promise.all([
          supabase
            .from('usuarios')
            .select('id_usuario,nome,tipo_conta,data_criacao,foto_perfil_url,ultima_conexao,fk_tipo_pessoa,fk_email,fk_telefone')
            .order('data_criacao', { ascending: false })
            .limit(1000)
            .returns<User[]>(),
          supabase
            .from('emails')
            .select('id_email,endereco_email,verificar_autenticacao,data_verificacao,fk_status')
            .limit(1000)
            .returns<UserEmail[]>(),
          supabase
            .from('telefones')
            .select('id_telefone,ddd,numero,verificar_autenticacao,data_verificacao,fk_status')
            .limit(1000)
            .returns<UserPhone[]>(),
          supabase
            .from('dados_profissionais')
            .select('id_profissional,fk_usuario,fk_perfil,anos_experiencia,plano_premium,verificar_autenticacao,data_admissao')
            .order('data_admissao', { ascending: false })
            .limit(1000)
            .returns<Professional[]>(),
          supabase
            .from('servicos_profissional')
            .select('id_servico_prof,titulo,descricao,valor,ativo,fk_profissional,tipo_execucao,carga_servico,data_criacao')
            .order('data_criacao', { ascending: false })
            .limit(1000)
            .returns<Service[]>(),
          supabase
            .from('solicitacoes')
            .select('id_solicitacao,data_solicitacao,valor_final,fk_usuario,fk_profissional,fk_status,fk_servico_prof')
            .order('data_solicitacao', { ascending: false })
            .limit(1000)
            .returns<Request[]>(),
          supabase
            .from('pagamentos_solicitacao')
            .select('id_pagamento,fk_solicitacao,forma_pagamento,parcelas,valor,data_pagamento,numero_comprovante')
            .order('data_pagamento', { ascending: false })
            .limit(1000)
            .returns<Payment[]>(),
          supabase
            .from('oficios')
            .select('id_oficio,categoria,cor,cod_cor')
            .order('categoria', { ascending: true })
            .limit(1000)
            .returns<Trade[]>(),
          supabase
            .from('funcoes')
            .select('id_funcao,fk_oficio,funcao,descricao,img_funcao')
            .order('funcao', { ascending: true })
            .limit(1000)
            .returns<ProfessionalFunction[]>(),
          supabase
            .from('postagens')
            .select('id_postagem,conteudo,data_postagem,arquivado,fk_perfil,tipo_autor,fk_grupo_empresa')
            .order('data_postagem', { ascending: false })
            .limit(1000)
            .returns<Post[]>(),
          supabase
            .from('imagens_postagem')
            .select('fk_postagem,anexo_url,ordem_carrossel')
            .order('ordem_carrossel', { ascending: true })
            .limit(1000)
            .returns<{ fk_postagem: number; anexo_url: string; ordem_carrossel: number | string }[]>(),
          supabase
            .from('imagens_postagens')
            .select('fk_postagem,url_imagem,ordem')
            .order('ordem', { ascending: true })
            .limit(1000)
            .returns<{ fk_postagem: number; url_imagem: string; ordem: number }[]>(),
          supabase
            .from('grupo_empresa')
            .select('id_grupo_empresa,fk_perfil,nome_empresa')
            .order('nome_empresa', { ascending: true })
            .limit(1000)
            .returns<BusinessGroup[]>(),
          supabase
            .from('status')
            .select('id_status,tipo_status,status')
            .order('status', { ascending: true })
            .limit(1000)
            .returns<RequestStatus[]>(),
          supabase
            .from('notificacoes')
            .select('id_notificacao,fk_usuario,titulo,conteudo,push_status,push_erro,push_tentativas,data_criacao')
            .not('push_erro', 'is', null)
            .order('data_criacao', { ascending: false })
            .limit(100)
            .returns<PushLog[]>(),
        ]);

      const results = [
        ['usuários', users],
        ['e-mails', emails],
        ['telefones', phones],
        ['profissionais', professionals],
        ['serviços', services],
        ['solicitações', requests],
        ['pagamentos', payments],
        ['ofícios', trades],
        ['funções', functions],
        ['postagens', posts],
        ['mídias das postagens', postMedia],
        ['imagens das postagens', pluralPostMedia],
        ['empresas', businessGroups],
        ['status', statuses],
        ['erros de notificação', pushLogs],
      ] as const;
      const errors = results
        .filter(([, result]) => result.error)
        .map(([label, result]) => `${label}: ${result.error?.message}`);

      setDatabaseConnected(!users.error);
      setDatabaseIssues(errors.length > 0);
      setData((current) => ({
        users: users.error ? current.users : users.data ?? [],
        emails: emails.error ? current.emails : emails.data ?? [],
        phones: phones.error ? current.phones : phones.data ?? [],
        professionals: professionals.error ? current.professionals : professionals.data ?? [],
        services: services.error ? current.services : services.data ?? [],
        requests: requests.error ? current.requests : requests.data ?? [],
        payments: payments.error ? current.payments : payments.data ?? [],
        trades: trades.error ? current.trades : trades.data ?? [],
        functions: functions.error ? current.functions : functions.data ?? [],
        posts: posts.error ? current.posts : posts.data ?? [],
        postImages: postMedia.error || pluralPostMedia.error
          ? current.postImages
          : [
              ...(postMedia.data ?? []).map((image) => ({
                fk_postagem: image.fk_postagem,
                url: image.anexo_url,
                ordem: Number(image.ordem_carrossel),
              })),
              ...(pluralPostMedia.data ?? []).map((image) => ({
                fk_postagem: image.fk_postagem,
                url: image.url_imagem,
                ordem: image.ordem,
              })),
            ],
        businessGroups: businessGroups.error ? current.businessGroups : businessGroups.data ?? [],
        statuses: statuses.error ? current.statuses : statuses.data ?? [],
        pushLogs: pushLogs.error ? current.pushLogs : pushLogs.data ?? [],
      }));
      setLoadError(errors.join(' · '));
    } catch (error) {
      setDatabaseConnected(false);
      setDatabaseIssues(false);
      setLoadError(`Não foi possível carregar os dados do Supabase: ${displayError(error)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const userById = useMemo(
    () => new Map(data.users.map((user) => [user.id_usuario, user])),
    [data.users]
  );
  const emailById = useMemo(
    () => new Map(data.emails.map((email) => [email.id_email, email])),
    [data.emails]
  );
  const phoneById = useMemo(
    () => new Map(data.phones.map((phone) => [phone.id_telefone, phone])),
    [data.phones]
  );
  const professionalById = useMemo(
    () => new Map(data.professionals.map((professional) => [professional.id_profissional, professional])),
    [data.professionals]
  );
  const professionalByProfileId = useMemo(
    () => {
      const byProfileId = new Map<number, Professional>();
      for (const professional of data.professionals) {
        if (professional.fk_perfil !== null) byProfileId.set(professional.fk_perfil, professional);
      }
      return byProfileId;
    },
    [data.professionals]
  );
  const businessGroupById = useMemo(
    () => new Map(data.businessGroups.map((group) => [group.id_grupo_empresa, group])),
    [data.businessGroups]
  );
  const tradeById = useMemo(
    () => new Map(data.trades.map((trade) => [trade.id_oficio, trade])),
    [data.trades]
  );
  const postImagesById = useMemo(() => {
    const grouped = new Map<number, PostImage[]>();
    for (const image of data.postImages) {
      const currentImages = grouped.get(image.fk_postagem) ?? [];
      currentImages.push(image);
      grouped.set(image.fk_postagem, currentImages);
    }
    for (const images of grouped.values()) images.sort((first, second) => first.ordem - second.ordem);
    return grouped;
  }, [data.postImages]);
  const statusById = useMemo(
    () => new Map(data.statuses.map((status) => [status.id_status, status])),
    [data.statuses]
  );
  const detailsUser = detailsUserId === null ? null : userById.get(detailsUserId) ?? null;
  const detailsProfessional = detailsUser
    ? data.professionals.find((professional) => professional.fk_usuario === detailsUser.id_usuario)
    : undefined;
  const detailsBusinessGroupId = detailsProfessional && detailsProfessional.fk_perfil !== null
    ? data.businessGroups.find((group) => group.fk_perfil === detailsProfessional.fk_perfil)?.id_grupo_empresa
    : undefined;
  function userContact(user: User) {
    const email = user.fk_email === null ? null : emailById.get(user.fk_email)?.endereco_email;
    const phone = user.fk_telefone === null ? null : phoneById.get(user.fk_telefone);
    const values = [email, phone ? `(${phone.ddd}) ${phone.numero}` : null].filter(Boolean);
    return values.length ? values.join(' · ') : 'Sem e-mail ou telefone cadastrado';
  }
  function statusName(statusId: number) {
    return statusById.get(statusId)?.status || 'Status não identificado';
  }
  const clients = useMemo(
    () => data.users.filter((user) => user.tipo_conta?.toLocaleLowerCase('pt-BR') === 'cliente'),
    [data.users]
  );
  const recentUsers = useMemo(
    () =>
      data.users.filter((user) => {
        if (!user.ultima_conexao) return false;
        const lastSeen = new Date(user.ultima_conexao).getTime();
        return Number.isFinite(lastSeen) && Date.now() - lastSeen <= 5 * 60_000;
      }),
    [data.users]
  );
  const requestStatuses = useMemo(
    () =>
      data.statuses.filter((status) =>
        status.tipo_status?.toLocaleLowerCase('pt-BR').includes('solic')
      ),
    [data.statuses]
  );

  const searchTerm = search.trim().toLocaleLowerCase('pt-BR');
  const matches = (...values: unknown[]) =>
    !searchTerm ||
    values.some((value) => String(value ?? '').toLocaleLowerCase('pt-BR').includes(searchTerm));
  const hasDataLoadError = (resource: string) =>
    loadError.split(' · ').some((error) => error.startsWith(`${resource}:`));
  const unavailableDescription = databaseConnected
    ? 'Verifique as permissões RLS desta tabela no Supabase.'
    : 'Verifique a conexão com o Supabase para carregar esta lista.';
  const emptyState = (title: string, description: string) =>
    loadError
      ? <EmptyState title="Dados indisponíveis" description={unavailableDescription} />
      : <EmptyState title={title} description={description} />;

  function notifySuccess(text: string) {
    setToast({ kind: 'success', text });
  }

  function notifyError(error: unknown) {
    setToast({ kind: 'error', text: displayError(error) });
  }

  async function updateRequestStatus(requestId: number, statusId: number) {
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    const { error } = await supabase
      .from('solicitacoes')
      .update({ fk_status: statusId })
      .eq('id_solicitacao', requestId);
    if (error) {
      notifyError(error);
      return;
    }
    setData((current) => ({
      ...current,
      requests: current.requests.map((request) =>
        request.id_solicitacao === requestId ? { ...request, fk_status: statusId } : request
      ),
    }));
    notifySuccess('Status da solicitação atualizado.');
  }

  async function updateProfessional(
    professionalId: number,
    field: 'plano_premium' | 'verificar_autenticacao',
    value: boolean
  ) {
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    const { error } = await supabase
      .from('dados_profissionais')
      .update({ [field]: value })
      .eq('id_profissional', professionalId);
    if (error) {
      notifyError(error);
      return;
    }
    setData((current) => ({
      ...current,
      professionals: current.professionals.map((professional) =>
        professional.id_profissional === professionalId
          ? { ...professional, [field]: value }
          : professional
      ),
    }));
    notifySuccess('Perfil profissional atualizado.');
  }

  async function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientForm || !clientForm.nome.trim()) return;
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nome: clientForm.nome.trim() })
        .eq('id_usuario', clientForm.id);
      if (error) throw error;
      setData((current) => ({
        ...current,
        users: current.users.map((user) =>
          user.id_usuario === clientForm.id ? { ...user, nome: clientForm.nome.trim() } : user
        ),
      }));
      setClientForm(null);
      notifySuccess('Cliente atualizado.');
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceForm) return;
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    const price = Number(serviceForm.valor);
    if (!serviceForm.titulo.trim() || !Number.isFinite(price) || price < 0 || !serviceForm.fk_profissional) {
      notifyError(new Error('Preencha o título, um valor válido e selecione o profissional.'));
      return;
    }

    const payload = {
      titulo: serviceForm.titulo.trim(),
      descricao: serviceForm.descricao.trim() || null,
      valor: price,
      ativo: serviceForm.ativo,
      fk_profissional: Number(serviceForm.fk_profissional),
      tipo_execucao: serviceForm.tipo_execucao,
      carga_servico: serviceForm.carga_servico,
    };

    setSaving(true);
    try {
      const result = serviceForm.id
        ? await supabase
            .from('servicos_profissional')
            .update(payload)
            .eq('id_servico_prof', serviceForm.id)
        : await supabase.from('servicos_profissional').insert(payload);
      if (result.error) throw result.error;
      setServiceForm(null);
      notifySuccess(serviceForm.id ? 'Serviço atualizado.' : 'Serviço criado.');
      await loadData();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  async function saveTrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    if (!tradeForm?.categoria.trim() || !tradeForm.cor.trim()) {
      notifyError(new Error('Informe o nome do ofício e sua cor.'));
      return;
    }
    const colorHex = normalizeHex(tradeForm.cod_cor);
    if (!colorHex) {
      notifyError(new Error('Informe uma cor válida em formato hexadecimal.'));
      return;
    }
    const payload = {
      categoria: tradeForm.categoria.trim(),
      cor: tradeForm.cor.trim(),
      cod_cor: colorHex,
    };
    setSaving(true);
    try {
      const result = tradeForm.id
        ? await supabase.from('oficios').update(payload).eq('id_oficio', tradeForm.id).select('id_oficio')
        : await supabase.from('oficios').insert(payload);
      if (result.error) throw result.error;
      if (tradeForm.id && !result.data?.length) throw rlsBlockedError('atualizou', 'o ofício');
      setTradeForm(null);
      notifySuccess(tradeForm.id ? 'Ofício atualizado.' : 'Ofício criado.');
      await loadData();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  async function removeTrade(trade: Trade) {
    if (!supabase) throw new Error(supabaseConfigMessage);
    const linkedFunctions = data.functions.filter((item) => item.fk_oficio === trade.id_oficio);
    // 1ª opção: função segura no banco (exclui ofício + funções numa única transação).
    const rpc = await supabase.rpc('admin_delete_oficio', { p_id_oficio: trade.id_oficio });
    if (rpc.error && !isMissingRpc(rpc.error)) throw rpc.error;
    if (rpc.error) {
      // Fallback: exclusão direta nas tabelas, conferindo se o RLS realmente permitiu.
      if (linkedFunctions.length) {
        const removedFunctions = await supabase.from('funcoes').delete().eq('fk_oficio', trade.id_oficio).select('id_funcao');
        if (removedFunctions.error) throw removedFunctions.error;
        if ((removedFunctions.data?.length ?? 0) < linkedFunctions.length) throw rlsBlockedError('excluiu', 'as funções deste ofício');
      }
      const removedTrade = await supabase.from('oficios').delete().eq('id_oficio', trade.id_oficio).select('id_oficio');
      if (removedTrade.error) throw removedTrade.error;
      if (!removedTrade.data?.length) throw rlsBlockedError('excluiu', 'o ofício');
    }
    setData((current) => ({
      ...current,
      trades: current.trades.filter((item) => item.id_oficio !== trade.id_oficio),
      functions: current.functions.filter((item) => item.fk_oficio !== trade.id_oficio),
    }));
  }

  async function deleteTrade(trade: Trade) {
    const linkedFunctions = data.functions.filter((item) => item.fk_oficio === trade.id_oficio);
    const question = linkedFunctions.length
      ? `Excluir o ofício "${trade.categoria}" e ${linkedFunctions.length === 1 ? 'a função vinculada' : `as ${linkedFunctions.length} funções vinculadas`} a ele?\n\nSe alguma função estiver em uso por profissionais ou serviços, nada será excluído.`
      : `Excluir o ofício "${trade.categoria}"?`;
    if (!window.confirm(question)) return;
    try {
      await removeTrade(trade);
      notifySuccess(linkedFunctions.length ? 'Ofício e funções vinculadas excluídos.' : 'Ofício excluído.');
    } catch (error) {
      notifyError(describeDeleteError(error, 'este ofício'));
    }
  }

  async function saveFunction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!functionForm) return;
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    const officeId = Number(functionForm.fk_oficio);
    if (!functionForm.funcao.trim() || !Number.isInteger(officeId) || officeId < 1) {
      notifyError(new Error('Informe o nome da função e selecione um ofício.'));
      return;
    }

    const payload = {
      fk_oficio: officeId,
      funcao: functionForm.funcao.trim(),
      descricao: functionForm.descricao.trim() || null,
      img_funcao: functionForm.img_funcao.trim() || null,
    };

    setSaving(true);
    try {
      const result = functionForm.id
        ? await supabase.from('funcoes').update(payload).eq('id_funcao', functionForm.id).select('id_funcao')
        : await supabase.from('funcoes').insert(payload);
      if (result.error) throw result.error;
      if (functionForm.id && !result.data?.length) throw rlsBlockedError('atualizou', 'a função');
      setFunctionForm(null);
      notifySuccess(functionForm.id ? 'Função atualizada.' : 'Função criada.');
      await loadData();
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  async function removeFunction(item: ProfessionalFunction) {
    if (!supabase) throw new Error(supabaseConfigMessage);
    const rpc = await supabase.rpc('admin_delete_funcao', { p_id_funcao: item.id_funcao });
    if (rpc.error && !isMissingRpc(rpc.error)) throw rpc.error;
    if (rpc.error) {
      const removed = await supabase.from('funcoes').delete().eq('id_funcao', item.id_funcao).select('id_funcao');
      if (removed.error) throw removed.error;
      if (!removed.data?.length) throw rlsBlockedError('excluiu', 'a função');
    }
    setData((current) => ({
      ...current,
      functions: current.functions.filter((currentItem) => currentItem.id_funcao !== item.id_funcao),
    }));
  }

  async function deleteFunction(item: ProfessionalFunction) {
    if (!window.confirm(`Excluir a função "${item.funcao}"?\n\nSe ela estiver em uso por profissionais ou serviços, a exclusão será bloqueada.`)) return;
    try {
      await removeFunction(item);
      notifySuccess('Função excluída.');
    } catch (error) {
      notifyError(describeDeleteError(error, 'esta função'));
    }
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!postForm) return;
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('postagens')
        .update({
          conteudo: postForm.conteudo.trim() || null,
          arquivado: postForm.arquivado,
        })
        .eq('id_postagem', postForm.id);
      if (error) throw error;
      setData((current) => ({
        ...current,
        posts: current.posts.map((post) =>
          post.id_postagem === postForm.id
            ? { ...post, conteudo: postForm.conteudo.trim() || null, arquivado: postForm.arquivado }
            : post
        ),
      }));
      setPostForm(null);
      notifySuccess('Postagem atualizada.');
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  function selectPage(nextPage: PageKey) {
    setPage(nextPage);
    setSearch('');
    setSort(null);
    setSelected(new Set());
    setSidebarOpen(false);
  }

  // ---------- Ordenação e seleção das listas ----------
  function toggleSort(key: string) {
    setSort((current) => current?.key === key
      ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
      : { key, dir: 'asc' });
  }

  function applySort<T>(rows: T[], options: SortOption<T>[]): T[] {
    const option = sort ? options.find((item) => item.key === sort.key) : undefined;
    if (!sort || !option) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((first, second) => {
      const a = option.value(first);
      const b = option.value(second);
      if (a === b) return 0;
      if (a === null || a === undefined || a === '') return 1;
      if (b === null || b === undefined || b === '') return -1;
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor;
      return String(a).localeCompare(String(b), 'pt-BR', { numeric: true, sensitivity: 'base' }) * factor;
    });
  }

  function selectionFor(ids: number[]) {
    const chosen = ids.filter((id) => selected.has(id));
    return {
      chosen,
      all: ids.length > 0 && chosen.length === ids.length,
      some: chosen.length > 0 && chosen.length < ids.length,
      toggleAll: () => setSelected((current) => {
        const next = new Set(current);
        const everyOne = ids.length > 0 && ids.every((id) => next.has(id));
        for (const id of ids) {
          if (everyOne) next.delete(id);
          else next.add(id);
        }
        return next;
      }),
      toggle: (id: number) => setSelected((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    };
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function listToolbar<T>(options: SortOption<T>[], placeholder: string, chosenCount: number, bulkActions: React.ReactNode) {
    return (
      <ListToolbar
        search={search}
        onSearch={setSearch}
        placeholder={placeholder}
        options={options}
        sort={sort}
        onSort={setSort}
        selectedCount={chosenCount}
        onClearSelection={clearSelection}
        busy={bulkBusy}
      >
        {bulkActions}
      </ListToolbar>
    );
  }

  function sortHeader(label: string, key: string) {
    return <SortHeader label={label} sortKey={key} sort={sort} onSort={toggleSort} />;
  }

  // ---------- Exclusão em cascata (solicitações, serviços, postagens) ----------
  async function openCascadeDelete(table: CascadeTable, ids: number[]) {
    if (!ids.length) return;
    if (!supabase) {
      notifyError(new Error(supabaseConfigMessage));
      return;
    }
    setCascade({ table, ids, report: null, loading: true, running: false, error: '' });
    try {
      const { data: report, error } = await supabase.rpc('admin_exclusao_cascata', { p_tabela: table, p_ids: ids, p_executar: false });
      if (error) throw error;
      setCascade((current) => current && { ...current, report: (report ?? {}) as Record<string, number>, loading: false });
    } catch (error) {
      const text = isMissingRpc(error)
        ? `A função admin_exclusao_cascata ainda não existe no banco. Execute o script ${gestaoSqlFile} no SQL Editor do Supabase e tente de novo.`
        : displayError(error);
      setCascade((current) => current && { ...current, loading: false, error: text });
    }
  }

  async function confirmCascadeDelete() {
    if (!cascade || !supabase) return;
    setCascade({ ...cascade, running: true, error: '' });
    try {
      const { data: report, error } = await supabase.rpc('admin_exclusao_cascata', { p_tabela: cascade.table, p_ids: cascade.ids, p_executar: true });
      if (error) throw error;
      const removed = Object.values((report ?? {}) as Record<string, number>).reduce((sum, value) => sum + Number(value || 0), 0);
      const meta = cascadeMeta[cascade.table];
      setCascade(null);
      clearSelection();
      notifySuccess(`${cascade.ids.length} ${cascade.ids.length === 1 ? meta.singular : meta.plural} excluíd${meta.feminine ? 'a' : 'o'}${cascade.ids.length === 1 ? '' : 's'} (${removed} registros removidos no total).`);
      await loadData(true);
    } catch (error) {
      setCascade((current) => current && { ...current, running: false, error: displayError(error) });
    }
  }

  // ---------- Ações em massa ----------
  async function bulkUpdate(table: 'servicos_profissional' | 'postagens', idColumn: string, ids: number[], values: Record<string, boolean>, message: string) {
    if (!ids.length || !supabase) return;
    setBulkBusy(true);
    try {
      const { data: updated, error } = await supabase.from(table).update(values).in(idColumn, ids).select(idColumn);
      if (error) throw error;
      if (!updated?.length) throw rlsBlockedError('atualizou', 'os itens selecionados');
      clearSelection();
      notifySuccess(message);
      await loadData(true);
    } catch (error) {
      notifyError(error);
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkDeleteCatalog(kind: 'trades' | 'functions', ids: number[]) {
    if (!ids.length) return;
    const isTrade = kind === 'trades';
    const linked = isTrade ? data.functions.filter((item) => ids.includes(item.fk_oficio)).length : 0;
    const question = isTrade
      ? `Excluir ${ids.length} ofício(s)${linked ? ` e as ${linked} funções vinculadas a eles` : ''}?\n\nOfícios ou funções em uso por profissionais ou serviços não serão excluídos.`
      : `Excluir ${ids.length} função(ões)?\n\nFunções em uso por profissionais ou serviços não serão excluídas.`;
    if (!window.confirm(question)) return;
    setBulkBusy(true);
    const failures: string[] = [];
    let okCount = 0;
    for (const id of ids) {
      try {
        if (isTrade) {
          const trade = data.trades.find((item) => item.id_oficio === id);
          if (trade) await removeTrade(trade);
        } else {
          const item = data.functions.find((current) => current.id_funcao === id);
          if (item) await removeFunction(item);
        }
        okCount += 1;
      } catch (error) {
        const name = isTrade
          ? data.trades.find((item) => item.id_oficio === id)?.categoria
          : data.functions.find((item) => item.id_funcao === id)?.funcao;
        failures.push(`${name ?? `#${id}`}: ${describeDeleteError(error, isTrade ? 'este ofício' : 'esta função').message}`);
      }
    }
    setBulkBusy(false);
    clearSelection();
    if (failures.length) {
      notifyError(new Error(`${okCount ? `${okCount} excluído(s); ` : ''}${failures.length} não puderam ser excluídos. ${failures.slice(0, 2).join(' · ')}${failures.length > 2 ? ' …' : ''}`));
    } else if (okCount) {
      notifySuccess(`${okCount} ${isTrade ? 'ofício(s) excluído(s)' : 'função(ões) excluída(s)'}.`);
    }
  }

  function renderOverview() {
    const totalPaid = data.payments.reduce((sum, payment) => sum + Number(payment.valor || 0), 0);
    const serviceCount = data.services.length;
    const activeServices = data.services.filter((service) => service.ativo).length;
    const maxRequestCount = Math.max(
      1,
      ...Array.from({ length: 7 }, (_, index) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - index));
        return data.requests.filter(
          (request) => new Date(request.data_solicitacao).toDateString() === day.toDateString()
        ).length;
      })
    );

    return (
      <>
        <div className="welcome-panel">
          <div>
            <span className="eyebrow">PAINEL ADMINISTRATIVO</span>
            <h1>Bom dia, equipe <em>ConsertaJá</em></h1>
            <p>Confira os indicadores e cuide da operação da plataforma.</p>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <span className="welcome-orbit orbit-one" />
            <span className="welcome-orbit orbit-two" />
            <span className="welcome-icon"><Icon name="wrench" size={34} /></span>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard
            icon="users"
            label="Usuários cadastrados"
            value={loadError ? '—' : data.users.length}
            note={loadError ? unavailableDescription : `${clients.length} clientes · ${data.professionals.length} profissionais`}
            tone="blue"
            available={!loadError}
            connected={databaseConnected}
          />
          <MetricCard
            icon="clipboard"
            label="Solicitações"
            value={loadError ? '—' : data.requests.length}
            note={loadError ? unavailableDescription : 'Pedidos registrados'}
            tone="navy"
            available={!loadError}
            connected={databaseConnected}
          />
          <MetricCard
            icon="wrench"
            label="Serviços ativos"
            value={loadError ? '—' : activeServices}
            note={loadError ? unavailableDescription : `${serviceCount} serviços no catálogo`}
            tone="green"
            available={!loadError}
            connected={databaseConnected}
          />
          <MetricCard
            icon="card"
            label="Pagamentos registrados"
            value={loadError ? '—' : currency(totalPaid)}
            note={loadError ? unavailableDescription : `${data.payments.length} transações`}
            tone="purple"
            available={!loadError}
            connected={databaseConnected}
          />
        </div>

        <div className="overview-grid">
          <section className="panel activity-panel">
            <PanelHeading
              eyebrow="MOVIMENTO"
              title="Solicitações na semana"
              action={<button className="text-action" onClick={() => selectPage('requests')}>Ver solicitações <Icon name="arrow" size={16} /></button>}
            />
            <div className={`week-chart ${loadError ? 'unavailable' : ''}`}>
              {!loadError && Array.from({ length: 7 }, (_, index) => {
                const day = new Date();
                day.setDate(day.getDate() - (6 - index));
                const count = data.requests.filter(
                  (request) => new Date(request.data_solicitacao).toDateString() === day.toDateString()
                ).length;
                return (
                  <div className="chart-column" key={day.toISOString()}>
                    <span className="chart-value">{count}</span>
                    <div className="chart-track">
                      <span style={{ height: `${Math.max(7, (count / maxRequestCount) * 100)}%` }} />
                    </div>
                    <span className="chart-label">{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                  </div>
                );
              })}
            </div>
            {loadError && <p className="chart-empty">{unavailableDescription}</p>}
          </section>

          <section className="panel quick-panel">
            <PanelHeading eyebrow="ACESSO RÁPIDO" title="Atalhos" />
            <div className="quick-links">
              {[
                ['requests', 'Revisar solicitações', 'Atualize o andamento dos pedidos', 'clipboard'],
                ['services', 'Gerenciar serviços', 'Edite o catálogo profissional', 'wrench'],
                ['professionals', 'Ver profissionais', 'Acompanhe perfis e verificações', 'briefcase'],
                ['trades', 'Editar ofícios', 'Organize categorias de trabalho', 'tag'],
              ].map(([key, label, description, icon]) => (
                <button className="quick-link" key={key} onClick={() => selectPage(key as PageKey)}>
                  <span className="quick-icon"><Icon name={icon as IconName} size={19} /></span>
                  <span className="quick-copy"><b>{label}</b><small>{description}</small></span>
                  <Icon name="arrow" size={17} />
                </button>
              ))}
            </div>
          </section>

          <section className="panel recent-panel">
            <PanelHeading
              eyebrow="ATUALIZAÇÕES"
              title="Solicitações recentes"
              action={<button className="text-action" onClick={() => selectPage('requests')}>Ver todas <Icon name="arrow" size={16} /></button>}
            />
            {data.requests.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Solicitação</th><th>Cliente</th><th>Status</th><th>Valor</th></tr></thead>
                  <tbody>
                    {data.requests.slice(0, 5).map((request) => {
                      const client = userById.get(request.fk_usuario);
                      return (
                        <tr key={request.id_solicitacao}>
                          <td><b>#{request.id_solicitacao}</b><small>{dateTime(request.data_solicitacao)}</small></td>
                          <td><div className="user-identity">
                            <UserAvatar name={client?.nome ?? `Cliente #${request.fk_usuario}`} photoUrl={client?.foto_perfil_url ?? null} />
                            <span className="user-identity-copy"><b>{client?.nome ?? `Cliente #${request.fk_usuario}`}</b></span>
                          </div></td>
                          <td><StatusBadge label={statusName(request.fk_status)} /></td>
                          <td>{currency(request.valor_final)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : emptyState('Nenhuma solicitação encontrada', 'As solicitações aparecerão aqui quando forem registradas.')}
          </section>
          <section className="panel online-panel">
            <PanelHeading
              eyebrow="PRESENÇA"
              title="Conexões recentes"
              action={<button className="text-action" onClick={() => selectPage('activity')}>Ver atividade <Icon name="arrow" size={16} /></button>}
            />
            <div className="online-summary">
              <span className="online-pulse" />
              <strong>{loadError ? '—' : recentUsers.length}</strong>
              <span>{loadError ? 'conecte o Supabase para ver a atividade' : 'usuários conectados nos últimos 5 minutos'}</span>
            </div>
            <p className="helper-text">{loadError ? 'Os dados de atividade ainda não foram carregados.' : 'Estimativa baseada no campo de última conexão do perfil.'}</p>
          </section>
        </div>
      </>
    );
  }

  function requestClientName(request: Request) {
    return userById.get(request.fk_usuario)?.nome ?? `Cliente #${request.fk_usuario}`;
  }

  function requestProfessionalName(request: Request) {
    return userById.get(professionalById.get(request.fk_profissional)?.fk_usuario ?? -1)?.nome ?? `Profissional #${request.fk_profissional}`;
  }

  function renderRequests() {
    const sortOptions: SortOption<Request>[] = [
      { key: 'id', label: 'Número do pedido', value: (request) => request.id_solicitacao },
      { key: 'client', label: 'Cliente', value: requestClientName },
      { key: 'professional', label: 'Profissional', value: requestProfessionalName },
      { key: 'date', label: 'Data', value: (request) => new Date(request.data_solicitacao).getTime() || null },
      { key: 'value', label: 'Valor', value: (request) => request.valor_final === null ? null : Number(request.valor_final) },
      { key: 'status', label: 'Status', value: (request) => statusName(request.fk_status) },
    ];
    const visibleRequests = applySort(data.requests.filter((request) =>
      matches(
        request.id_solicitacao,
        requestClientName(request),
        requestProfessionalName(request),
        statusById.get(request.fk_status)?.status
      )
    ), sortOptions);
    const selection = selectionFor(visibleRequests.map((request) => request.id_solicitacao));
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="OPERAÇÃO" title="Todas as solicitações" />
        {listToolbar(sortOptions, 'Buscar por pedido, cliente, profissional ou status…', selection.chosen.length, (
          <button className="danger-button" type="button" onClick={() => void openCascadeDelete('solicitacoes', selection.chosen)}>
            <Icon name="trash" size={16} /> Excluir selecionadas
          </button>
        ))}
        {!requestStatuses.length && (
          <InlineNotice>
            O schema não retornou status classificados para solicitações. Os pedidos podem ser consultados, mas o status não pode ser alterado por aqui.
          </InlineNotice>
        )}
        {visibleRequests.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <SelectAllHeader checked={selection.all} indeterminate={selection.some} onChange={selection.toggleAll} />
                {sortHeader('Pedido', 'id')}{sortHeader('Cliente', 'client')}{sortHeader('Profissional', 'professional')}{sortHeader('Data', 'date')}{sortHeader('Valor', 'value')}{sortHeader('Status', 'status')}<th>Ação</th>
              </tr></thead>
              <tbody>
                {visibleRequests.map((request) => {
                  const currentStatus = statusById.get(request.fk_status);
                  const client = userById.get(request.fk_usuario);
                  const professional = professionalById.get(request.fk_profissional);
                  const professionalUser = professional ? userById.get(professional.fk_usuario) : undefined;
                  const statusOptions = currentStatus && !requestStatuses.some((status) => status.id_status === request.fk_status)
                    ? [currentStatus, ...requestStatuses]
                    : requestStatuses;
                  const isSelected = selected.has(request.id_solicitacao);
                  return (
                    <tr key={request.id_solicitacao} className={isSelected ? 'is-selected' : ''}>
                      <RowCheckbox checked={isSelected} label={`Selecionar pedido ${request.id_solicitacao}`} onChange={() => selection.toggle(request.id_solicitacao)} />
                      <td><b>#{request.id_solicitacao}</b></td>
                      <td><div className="user-identity">
                        <UserAvatar name={requestClientName(request)} photoUrl={client?.foto_perfil_url ?? null} />
                        <span className="user-identity-copy"><b>{requestClientName(request)}</b></span>
                      </div></td>
                      <td><div className="user-identity">
                        <UserAvatar name={requestProfessionalName(request)} photoUrl={professionalUser?.foto_perfil_url ?? null} />
                        <span className="user-identity-copy"><b>{requestProfessionalName(request)}</b></span>
                      </div></td>
                      <td>{dateTime(request.data_solicitacao)}</td>
                      <td>{currency(request.valor_final)}</td>
                      <td>
                        {requestStatuses.length ? (
                          <select
                            className="status-select"
                            aria-label={`Status da solicitação ${request.id_solicitacao}`}
                            value={request.fk_status}
                            onChange={(event) => void updateRequestStatus(request.id_solicitacao, Number(event.target.value))}
                          >
                            {!currentStatus && <option value={request.fk_status} disabled>Status não identificado</option>}
                            {statusOptions.map((status) => <option key={status.id_status} value={status.id_status}>{status.status}</option>)}
                          </select>
                        ) : <StatusBadge label={statusName(request.fk_status)} />}
                      </td>
                      <td className="row-actions">
                        <button className="icon-button danger-icon" title="Excluir solicitação" aria-label={`Excluir solicitação ${request.id_solicitacao}`} onClick={() => void openCascadeDelete('solicitacoes', [request.id_solicitacao])}><Icon name="trash" size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : hasDataLoadError('solicitações')
          ? emptyState('Não foi possível carregar as solicitações', 'Confira o aviso de erro acima e tente atualizar os dados.')
          : emptyState('Nenhuma solicitação encontrada', 'Tente alterar a busca ou atualizar os dados.')}
        <TableFooter count={visibleRequests.length} label="solicitações" />
      </section>
    );
  }

  function serviceProfessionalName(service: Service) {
    return userById.get(professionalById.get(service.fk_profissional)?.fk_usuario ?? -1)?.nome ?? `#${service.fk_profissional}`;
  }

  function renderServices() {
    const sortOptions: SortOption<Service>[] = [
      { key: 'title', label: 'Título', value: (service) => service.titulo },
      { key: 'professional', label: 'Profissional', value: serviceProfessionalName },
      { key: 'execution', label: 'Execução', value: (service) => service.tipo_execucao },
      { key: 'value', label: 'Valor', value: (service) => Number(service.valor) },
      { key: 'status', label: 'Status', value: (service) => service.ativo ? 'Ativo' : 'Inativo' },
      { key: 'created', label: 'Data de criação', value: (service) => service.data_criacao ? new Date(service.data_criacao).getTime() : null },
    ];
    const visibleServices = applySort(data.services.filter((service) =>
      matches(service.titulo, service.descricao, service.id_servico_prof, serviceProfessionalName(service), service.tipo_execucao, service.ativo ? 'ativo' : 'inativo')
    ), sortOptions);
    const selection = selectionFor(visibleServices.map((service) => service.id_servico_prof));
    return (
      <section className="panel data-panel">
        <PanelHeading
          eyebrow="CATÁLOGO"
          title="Serviços profissionais"
          action={<button className="primary-button" onClick={() => setServiceForm(newServiceForm())}><Icon name="plus" size={18} /> Novo serviço</button>}
        />
        {listToolbar(sortOptions, 'Buscar por serviço, profissional ou status…', selection.chosen.length, (
          <>
            <button className="secondary-button" type="button" onClick={() => void bulkUpdate('servicos_profissional', 'id_servico_prof', selection.chosen, { ativo: true }, 'Serviços ativados.')}>Ativar</button>
            <button className="secondary-button" type="button" onClick={() => void bulkUpdate('servicos_profissional', 'id_servico_prof', selection.chosen, { ativo: false }, 'Serviços desativados.')}>Desativar</button>
            <button className="danger-button" type="button" onClick={() => void openCascadeDelete('servicos_profissional', selection.chosen)}><Icon name="trash" size={16} /> Excluir selecionados</button>
          </>
        ))}
        {visibleServices.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <SelectAllHeader checked={selection.all} indeterminate={selection.some} onChange={selection.toggleAll} />
                {sortHeader('Serviço', 'title')}{sortHeader('Profissional', 'professional')}{sortHeader('Execução', 'execution')}{sortHeader('Valor', 'value')}{sortHeader('Status', 'status')}<th>Ações</th>
              </tr></thead>
              <tbody>
                {visibleServices.map((service) => {
                  const isSelected = selected.has(service.id_servico_prof);
                  return (
                    <tr key={service.id_servico_prof} className={isSelected ? 'is-selected' : ''}>
                      <RowCheckbox checked={isSelected} label={`Selecionar ${service.titulo}`} onChange={() => selection.toggle(service.id_servico_prof)} />
                      <td><b>{service.titulo}</b><small>{service.descricao || 'Sem descrição'}</small></td>
                      <td>{serviceProfessionalName(service)}</td>
                      <td>{service.tipo_execucao}<small>Carga {service.carga_servico.toLocaleLowerCase('pt-BR')}</small></td>
                      <td>{currency(service.valor)}</td>
                      <td><StatusBadge label={service.ativo ? 'Ativo' : 'Inativo'} positive={service.ativo} /></td>
                      <td className="row-actions">
                        <button className="icon-button" title="Editar serviço" aria-label={`Editar ${service.titulo}`} onClick={() => setServiceForm(editServiceForm(service))}><Icon name="edit" size={17} /></button>
                        <button className="icon-button danger-icon" title="Excluir serviço" aria-label={`Excluir ${service.titulo}`} onClick={() => void openCascadeDelete('servicos_profissional', [service.id_servico_prof])}><Icon name="trash" size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : emptyState('Nenhum serviço encontrado', 'Cadastre um serviço ou ajuste a busca.')}
        <TableFooter count={visibleServices.length} label="serviços" />
      </section>
    );
  }

  function renderProfessionals() {
    const visibleProfessionals = data.professionals.filter((professional) =>
      matches(
        professional.id_profissional,
        professional.anos_experiencia,
        userById.get(professional.fk_usuario)?.nome,
        professional.plano_premium ? 'premium' : 'padrão'
      )
    );
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="CADASTROS" title="Profissionais cadastrados" />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Profissional</th><th>Experiência</th><th>Cadastro</th><th>Verificado</th><th>Plano premium</th><th>Detalhes</th></tr></thead>
            <tbody>
              {visibleProfessionals.map((professional) => {
                const user = userById.get(professional.fk_usuario);
                return (
                  <tr key={professional.id_profissional}>
                    <td>
                      <div className="user-identity">
                        <UserAvatar name={user?.nome ?? `Profissional #${professional.id_profissional}`} photoUrl={user?.foto_perfil_url ?? null} />
                        <span className="user-identity-copy">
                          <b>{user?.nome ?? `Profissional #${professional.id_profissional}`}</b>
                          <small>{user ? userContact(user) : `ID #${professional.id_profissional}`}</small>
                        </span>
                      </div>
                    </td>
                    <td>{professional.anos_experiencia ?? 'Não informado'}</td>
                    <td>{dateTime(professional.data_admissao)}</td>
                    <td><Toggle checked={professional.verificar_autenticacao} label="Verificado" onChange={(value) => void updateProfessional(professional.id_profissional, 'verificar_autenticacao', value)} /></td>
                    <td><Toggle checked={professional.plano_premium} label="Premium" onChange={(value) => void updateProfessional(professional.id_profissional, 'plano_premium', value)} /></td>
                    <td><button className="details-button" onClick={() => setDetailsUserId(professional.fk_usuario)}><Icon name="search" size={14} />Detalhes</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!visibleProfessionals.length && (
          hasDataLoadError('profissionais')
            ? emptyState('Não foi possível carregar os profissionais', 'Confira o aviso de erro acima e tente atualizar os dados.')
            : emptyState('Nenhum profissional encontrado', 'Tente alterar a busca.')
        )}
        <TableFooter count={visibleProfessionals.length} label="profissionais" />
      </section>
    );
  }

  function renderClients() {
    const visibleClients = clients.filter((client) =>
      matches(client.nome, client.id_usuario, client.tipo_conta)
    );
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="CADASTROS" title="Clientes cadastrados" />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Cadastro</th><th>Última conexão</th><th>Ações</th></tr></thead>
            <tbody>
              {visibleClients.map((client) => (
                <tr key={client.id_usuario}>
                  <td>
                    <div className="user-identity">
                      <UserAvatar name={client.nome} photoUrl={client.foto_perfil_url} />
                      <span className="user-identity-copy"><b>{client.nome}</b><small>{userContact(client)}</small></span>
                    </div>
                  </td>
                  <td>{dateTime(client.data_criacao)}</td>
                  <td>{relativeTime(client.ultima_conexao)}</td>
                  <td><div className="row-actions">
                    <button className="icon-button" aria-label={`Ver detalhes de ${client.nome}`} title="Ver detalhes" onClick={() => setDetailsUserId(client.id_usuario)}><Icon name="search" size={16} /></button>
                    <button className="icon-button" aria-label={`Editar ${client.nome}`} title="Editar cliente" onClick={() => setClientForm({ id: client.id_usuario, nome: client.nome })}><Icon name="edit" size={17} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visibleClients.length && emptyState('Nenhum cliente encontrado', 'Tente alterar a busca.')}
        <TableFooter count={visibleClients.length} label="clientes" />
      </section>
    );
  }

  function renderPayments() {
    const visiblePayments = data.payments.filter((payment) =>
      matches(payment.id_pagamento, payment.fk_solicitacao, payment.forma_pagamento, payment.numero_comprovante)
    );
    const total = visiblePayments.reduce((sum, payment) => sum + Number(payment.valor || 0), 0);
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="FINANCEIRO" title="Transações registradas" />
        <div className="inline-total"><span>Valor exibido na busca</span><strong>{currency(total)}</strong></div>
        {visiblePayments.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Comprovante</th><th>Solicitação</th><th>Data</th><th>Pagamento</th><th>Parcelas</th><th>Valor</th></tr></thead>
              <tbody>
                {visiblePayments.map((payment) => (
                  <tr key={payment.id_pagamento}>
                    <td><b>{payment.numero_comprovante}</b><small>ID #{payment.id_pagamento}</small></td>
                    <td>#{payment.fk_solicitacao}</td>
                    <td>{dateTime(payment.data_pagamento)}</td>
                    <td><StatusBadge label={payment.forma_pagamento} /></td>
                    <td>{payment.parcelas}x</td>
                    <td><b>{currency(payment.valor)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : emptyState('Nenhuma transação encontrada', 'Os pagamentos aparecerão aqui quando forem registrados.')}
        <TableFooter count={visiblePayments.length} label="transações" />
      </section>
    );
  }

  function renderTrades() {
    const sortOptions: SortOption<Trade>[] = [
      { key: 'name', label: 'Categoria', value: (trade) => trade.categoria },
      { key: 'id', label: 'ID', value: (trade) => trade.id_oficio },
      { key: 'color', label: 'Cor', value: (trade) => trade.cor },
      { key: 'functions', label: 'Quantidade de funções', value: (trade) => data.functions.filter((item) => item.fk_oficio === trade.id_oficio).length },
    ];
    const visibleTrades = applySort(data.trades.filter((trade) =>
      matches(trade.categoria, trade.id_oficio, trade.cor, trade.cod_cor)
    ), sortOptions);
    const selection = selectionFor(visibleTrades.map((trade) => trade.id_oficio));
    return (
      <section className="panel data-panel">
        <PanelHeading
          eyebrow="CATÁLOGO"
          title="Ofícios oferecidos"
          action={<button className="primary-button" onClick={() => setTradeForm(newTradeForm())}><Icon name="plus" size={18} /> Novo ofício</button>}
        />
        {listToolbar(sortOptions, 'Buscar por categoria, cor ou ID…', selection.chosen.length, (
          <button className="danger-button" type="button" onClick={() => void bulkDeleteCatalog('trades', selection.chosen)}><Icon name="trash" size={16} /> Excluir selecionados</button>
        ))}
        {visibleTrades.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <SelectAllHeader checked={selection.all} indeterminate={selection.some} onChange={selection.toggleAll} />
                {sortHeader('Categoria', 'name')}{sortHeader('Cor', 'color')}<th>Código</th>{sortHeader('Funções', 'functions')}<th>Ações</th>
              </tr></thead>
              <tbody>
                {visibleTrades.map((trade) => {
                  const isSelected = selected.has(trade.id_oficio);
                  const functionCount = data.functions.filter((item) => item.fk_oficio === trade.id_oficio).length;
                  return (
                    <tr key={trade.id_oficio} className={isSelected ? 'is-selected' : ''}>
                      <RowCheckbox checked={isSelected} label={`Selecionar ${trade.categoria}`} onChange={() => selection.toggle(trade.id_oficio)} />
                      <td><span className="trade-name"><i style={{ backgroundColor: trade.cod_cor || trade.cor }} /> <b>{trade.categoria}</b></span><small>ID #{trade.id_oficio}</small></td>
                      <td>{trade.cor}</td>
                      <td>{trade.cod_cor ?? '—'}</td>
                      <td>{functionCount}</td>
                      <td className="row-actions">
                        <button className="icon-button" title="Editar ofício" aria-label={`Editar ${trade.categoria}`} onClick={() => setTradeForm(editTradeForm(trade))}><Icon name="edit" size={17} /></button>
                        <button className="icon-button danger-icon" title="Excluir ofício" aria-label={`Excluir ${trade.categoria}`} onClick={() => void deleteTrade(trade)}><Icon name="trash" size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : emptyState('Nenhum ofício encontrado', 'Cadastre um ofício ou ajuste a busca.')}
        <TableFooter count={visibleTrades.length} label="ofícios" />
      </section>
    );
  }

  function renderFunctions() {
    const tradeName = (item: ProfessionalFunction) => tradeById.get(item.fk_oficio)?.categoria ?? `Ofício #${item.fk_oficio}`;
    const sortOptions: SortOption<ProfessionalFunction>[] = [
      { key: 'name', label: 'Função', value: (item) => item.funcao },
      { key: 'trade', label: 'Ofício', value: tradeName },
      { key: 'id', label: 'ID', value: (item) => item.id_funcao },
      { key: 'image', label: 'Imagem', value: (item) => item.img_funcao ? 'Cadastrada' : 'Sem imagem' },
    ];
    const visibleFunctions = applySort(data.functions.filter((item) =>
      matches(item.funcao, item.descricao, item.id_funcao, tradeName(item))
    ), sortOptions);
    const selection = selectionFor(visibleFunctions.map((item) => item.id_funcao));
    return (
      <section className="panel data-panel">
        <PanelHeading
          eyebrow="CATÁLOGO"
          title="Funções profissionais"
          action={<button className="primary-button" onClick={() => setFunctionForm(newFunctionForm(data.trades))}><Icon name="plus" size={18} /> Nova função</button>}
        />
        {listToolbar(sortOptions, 'Buscar por função, ofício ou descrição…', selection.chosen.length, (
          <button className="danger-button" type="button" onClick={() => void bulkDeleteCatalog('functions', selection.chosen)}><Icon name="trash" size={16} /> Excluir selecionadas</button>
        ))}
        {visibleFunctions.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <SelectAllHeader checked={selection.all} indeterminate={selection.some} onChange={selection.toggleAll} />
                {sortHeader('Função', 'name')}{sortHeader('Ofício', 'trade')}<th>Descrição</th>{sortHeader('Imagem', 'image')}<th>Ações</th>
              </tr></thead>
              <tbody>
                {visibleFunctions.map((item) => {
                  const isSelected = selected.has(item.id_funcao);
                  const imageUrl = item.img_funcao ? safeHttpUrl(item.img_funcao) : null;
                  return (
                    <tr key={item.id_funcao} className={isSelected ? 'is-selected' : ''}>
                      <RowCheckbox checked={isSelected} label={`Selecionar ${item.funcao}`} onChange={() => selection.toggle(item.id_funcao)} />
                      <td><b>{item.funcao}</b><small>ID #{item.id_funcao}</small></td>
                      <td>{tradeName(item)}</td>
                      <td>{item.descricao || 'Sem descrição'}</td>
                      <td>{imageUrl ? <img className="function-thumb" src={imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : item.img_funcao ? 'Cadastrada' : '—'}</td>
                      <td className="row-actions">
                        <button className="icon-button" title="Editar função" aria-label={`Editar ${item.funcao}`} onClick={() => setFunctionForm(editFunctionForm(item))}><Icon name="edit" size={17} /></button>
                        <button className="icon-button danger-icon" title="Excluir função" aria-label={`Excluir ${item.funcao}`} onClick={() => void deleteFunction(item)}><Icon name="trash" size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : emptyState('Nenhuma função encontrada', data.trades.length ? 'Cadastre uma função ou ajuste a busca.' : 'Cadastre um ofício antes de criar funções.')}
        <TableFooter count={visibleFunctions.length} label="funções" />
      </section>
    );
  }

  function postAuthor(post: Post) {
    if (post.tipo_autor === 'empresa') {
      const businessGroup = post.fk_grupo_empresa ? businessGroupById.get(post.fk_grupo_empresa) : undefined;
      return businessGroup?.nome_empresa ?? `Empresa #${post.fk_grupo_empresa ?? post.fk_perfil}`;
    }
    const professional = professionalByProfileId.get(post.fk_perfil);
    return userById.get(professional?.fk_usuario ?? -1)?.nome ?? `Profissional · Perfil #${post.fk_perfil}`;
  }

  function renderPosts() {
    const sortOptions: SortOption<Post>[] = [
      { key: 'date', label: 'Data', value: (post) => new Date(post.data_postagem).getTime() || null },
      { key: 'author', label: 'Autor', value: postAuthor },
      { key: 'content', label: 'Conteúdo', value: (post) => post.conteudo ?? '' },
      { key: 'status', label: 'Status', value: (post) => post.arquivado ? 'Arquivada' : 'Publicada' },
      { key: 'media', label: 'Quantidade de mídias', value: (post) => postImagesById.get(post.id_postagem)?.length ?? 0 },
    ];
    const visiblePosts = applySort(data.posts.filter((post) =>
      matches(
        post.id_postagem,
        post.conteudo,
        postAuthor(post),
        post.tipo_autor,
        post.arquivado ? 'arquivada' : 'publicada'
      )
    ), sortOptions);
    const selection = selectionFor(visiblePosts.map((post) => post.id_postagem));
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="CONTEÚDO" title="Postagens publicadas" />
        {listToolbar(sortOptions, 'Buscar por texto, autor ou status…', selection.chosen.length, (
          <>
            <button className="secondary-button" type="button" onClick={() => void bulkUpdate('postagens', 'id_postagem', selection.chosen, { arquivado: true }, 'Postagens arquivadas.')}>Arquivar</button>
            <button className="secondary-button" type="button" onClick={() => void bulkUpdate('postagens', 'id_postagem', selection.chosen, { arquivado: false }, 'Postagens publicadas novamente.')}>Publicar</button>
            <button className="danger-button" type="button" onClick={() => void openCascadeDelete('postagens', selection.chosen)}><Icon name="trash" size={16} /> Excluir selecionadas</button>
          </>
        ))}
        {visiblePosts.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr>
                <SelectAllHeader checked={selection.all} indeterminate={selection.some} onChange={selection.toggleAll} />
                {sortHeader('Postagem', 'content')}{sortHeader('Autor', 'author')}{sortHeader('Data', 'date')}{sortHeader('Status', 'status')}<th>Ações</th>
              </tr></thead>
              <tbody>
                {visiblePosts.map((post) => {
                  const isSelected = selected.has(post.id_postagem);
                  const images = postImagesById.get(post.id_postagem) ?? [];
                  return (
                    <tr key={post.id_postagem} className={isSelected ? 'is-selected' : ''}>
                      <RowCheckbox checked={isSelected} label={`Selecionar postagem ${post.id_postagem}`} onChange={() => selection.toggle(post.id_postagem)} />
                      <td>
                        <span className="post-content" title={post.conteudo ?? 'Sem texto'}>
                          {post.conteudo || (images.length ? 'Publicação com mídia' : 'Publicação sem texto')}
                        </span>
                        {images.length ? (
                          <div className="post-media-links">
                            {images.map((image, index) => {
                              const url = safeHttpUrl(image.url);
                              return url
                                ? <a href={url} key={`${image.url}-${index}`} target="_blank" rel="noopener noreferrer">Abrir mídia {index + 1}</a>
                                : <span key={`${image.url}-${index}`}>Mídia {index + 1} sem URL válida</span>;
                            })}
                          </div>
                        ) : null}
                        <small>ID #{post.id_postagem}</small>
                      </td>
                      <td>{postAuthor(post)}</td>
                      <td>{dateTime(post.data_postagem)}</td>
                      <td><StatusBadge label={post.arquivado ? 'Arquivada' : 'Publicada'} positive={!post.arquivado} /></td>
                      <td className="row-actions">
                        <button className="icon-button" title="Editar postagem" aria-label={`Editar postagem ${post.id_postagem}`} onClick={() => setPostForm({ id: post.id_postagem, conteudo: post.conteudo ?? '', arquivado: post.arquivado })}><Icon name="edit" size={17} /></button>
                        <button className="icon-button danger-icon" title="Excluir postagem" aria-label={`Excluir postagem ${post.id_postagem}`} onClick={() => void openCascadeDelete('postagens', [post.id_postagem])}><Icon name="trash" size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : emptyState('Nenhuma postagem encontrada', 'As publicações aparecerão aqui quando forem registradas.')}
        <TableFooter count={visiblePosts.length} label="postagens" />
      </section>
    );
  }

  function renderActivity() {
    const visibleUsers = recentUsers.filter((user) => matches(user.nome, user.id_usuario, user.tipo_conta));
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="PRESENÇA" title="Conexões dos últimos 5 minutos" />
        <InlineNotice>
          O schema informa a última conexão, mas não possui presença em tempo real. Esta lista indica atividade recente e não confirma que a pessoa continua online.
        </InlineNotice>
        {visibleUsers.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Usuário</th><th>Perfil</th><th>Última conexão</th><th>Atividade</th></tr></thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.id_usuario}>
                    <td><div className="user-identity">
                      <UserAvatar name={user.nome} photoUrl={user.foto_perfil_url} />
                      <span className="user-identity-copy"><b>{user.nome}</b><small>{userContact(user)}</small></span>
                    </div></td>
                    <td>{user.tipo_conta}</td>
                    <td>{dateTime(user.ultima_conexao)}</td>
                    <td><StatusBadge label={relativeTime(user.ultima_conexao)} positive /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : emptyState('Nenhuma conexão recente', 'Não há usuários com conexão registrada nos últimos cinco minutos.')}
        <TableFooter count={visibleUsers.length} label="usuários recentes" />
      </section>
    );
  }

  function renderLogs() {
    const visibleLogs = data.pushLogs.filter((log) =>
      matches(log.titulo, log.conteudo, log.push_erro, log.push_status, userById.get(log.fk_usuario)?.nome)
    );
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="DISPOSITIVOS" title="Falhas de notificação" />
        <InlineNotice>
          Esta lista usa os campos <code>push_erro</code> e <code>push_status</code> da tabela <code>notificacoes</code>. Logs gerais de erros do aplicativo não estão no schema enviado.
        </InlineNotice>
        {visibleLogs.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Notificação</th><th>Usuário</th><th>Erro</th><th>Tentativas</th><th>Data</th></tr></thead>
              <tbody>
                {visibleLogs.map((log) => (
                  <tr key={log.id_notificacao}>
                    <td><b>{log.titulo}</b><small>ID #{log.id_notificacao} · {log.push_status}</small></td>
                    <td>{userById.get(log.fk_usuario)?.nome ?? `#${log.fk_usuario}`}</td>
                    <td className="error-cell">{log.push_erro ?? log.conteudo ?? 'Sem detalhes'}</td>
                    <td>{log.push_tentativas}</td>
                    <td>{dateTime(log.data_criacao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : emptyState('Nenhuma falha registrada', 'Notificações com erro de envio aparecerão aqui.')}
        <TableFooter count={visibleLogs.length} label="falhas de envio" />
      </section>
    );
  }

  function renderUnavailable(kind: 'complaints' | 'support' | 'bugReports' | 'emails') {
    const features: Record<typeof kind, { icon: IconName; title: string; description: string; requirements: string }> = {
      complaints: {
        icon: 'flag',
        title: 'Denúncias ainda não conectadas',
        description: 'O schema enviado não contém uma tabela ou coluna para denúncias. Para habilitar a listagem e o acompanhamento, será necessário informar a tabela, seus campos e os status disponíveis.',
        requirements: 'Identificador, autor, motivo, descrição, data e status da denúncia.',
      },
      support: {
        icon: 'message',
        title: 'Conversas de suporte ainda não identificadas',
        description: 'O schema contém conversas e mensagens entre usuários, mas não indica quais delas são direcionadas ao suporte. Para evitar exibir conversas privadas por engano, esta área aguarda uma tabela ou um campo que identifique os chamados.',
        requirements: 'Identificador do chamado, usuário, assunto, mensagens, data e status de atendimento.',
      },
      bugReports: {
        icon: 'bug',
        title: 'Relatórios de bugs ainda não conectados',
        description: 'O schema não contém uma área para receber e acompanhar problemas reportados pelos usuários. Esta tela é apenas visual até existir uma tabela ou serviço de coleta.',
        requirements: 'Identificador, descrição, usuário, data, versão do aplicativo e status de acompanhamento.',
      },
      emails: {
        icon: 'mail',
        title: 'Caixa de e-mails ainda não conectada',
        description: 'Não há uma tabela nem integração com um provedor de e-mail para consultar mensagens recebidas. Nenhuma mensagem é simulada ou exibida nesta tela.',
        requirements: 'Integração de e-mail e dados de remetente, assunto, conteúdo, data e status de leitura.',
      },
    };
    const feature = features[kind];

    return (
      <section className="panel unavailable-panel">
        <span className="unavailable-icon"><Icon name={feature.icon} size={25} /></span>
        <span className="eyebrow">AGUARDANDO INTEGRAÇÃO</span>
        <h2>{feature.title}</h2>
        <p>{feature.description}</p>
        <div className="schema-hint">
          <b>O que falta conectar</b>
          <span>{feature.requirements}</span>
        </div>
      </section>
    );
  }

  function renderNotifications() {
    return (
      <section className="panel data-panel broadcast-panel">
        <PanelHeading eyebrow="COMUNICAÇÃO" title="Preparar aviso geral" />
        <InlineNotice>
          O schema possui registros de notificações push por usuário, mas não define um fluxo de campanhas gerais. Esta interface é apenas visual e não envia notificações.
        </InlineNotice>
        <div className="broadcast-form">
          <div className="form-grid">
            <label className="form-field">Título<input disabled placeholder="Ex.: Manutenção programada" /></label>
            <label className="form-field">Destinatários
              <select disabled defaultValue="all">
                <option value="all">Todos os usuários</option>
                <option value="clients">Clientes</option>
                <option value="professionals">Profissionais</option>
              </select>
            </label>
          </div>
          <label className="form-field">Mensagem<textarea disabled rows={5} placeholder="Digite o conteúdo do aviso..." /></label>
        </div>
        <div className="broadcast-actions">
          <span><Icon name="bell" size={17} /> Envio desativado até a integração com o serviço de notificações.</span>
          <button className="primary-button" type="button" disabled><Icon name="bell" size={16} /> Enviar aviso</button>
        </div>
      </section>
    );
  }

  function renderCurrentPage() {
    if (loading) {
      return <div className="loading-panel"><span className="spinner" /><b>Carregando dados do Supabase…</b></div>;
    }
    switch (page) {
      case 'overview': return renderOverview();
      case 'requests': return renderRequests();
      case 'services': return renderServices();
      case 'professionals': return renderProfessionals();
      case 'clients': return renderClients();
      case 'transactions': return renderPayments();
      case 'trades': return renderTrades();
      case 'functions': return renderFunctions();
      case 'posts': return renderPosts();
      case 'activity': return renderActivity();
      case 'logs': return renderLogs();
      case 'bugReports':
      case 'emails':
      case 'complaints':
      case 'support':
        return renderUnavailable(page);
      case 'notifications': return renderNotifications();
      case 'admins': return <AdminAccountsPanel search={search} onSuccess={notifySuccess} onError={notifyError} />;
      case 'queries': return <QueriesPanel onSuccess={notifySuccess} onError={notifyError} />;
      default:
        return null;
    }
  }

  return (
    <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {sidebarOpen && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}
      <aside className="sidebar">
        <div className="brand-lockup">
          <img className="brand-logo" src={logoWhite} alt="" />
          <span className="brand-word">Conserta<b>Já</b><small>PAINEL ADMINISTRATIVO</small></span>
          <button className="sidebar-close" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)}><Icon name="close" /></button>
        </div>

        <nav className="side-nav" aria-label="Navegação principal">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-label">{group.label}</span>
              {group.items.map((item) => (
                <button
                  className={`nav-item ${page === item.key ? 'active' : ''}`}
                  key={item.key}
                  onClick={() => selectPage(item.key)}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {item.key === 'requests' && data.requests.length > 0 && <small>{data.requests.length}</small>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <a className="nav-item back-to-site" href={siteUrl}>
          <Icon name="home" size={19} />
          <span>Voltar ao site</span>
          <Icon name="arrow" size={15} />
        </a>

        <div className={`sidebar-footer ${databaseConnected ? (databaseIssues ? 'partial' : 'connected') : 'disconnected'}`}>
          <span className="connection-dot" />
          <span><b>{loading ? 'Verificando conexão' : databaseConnected ? (databaseIssues ? 'Acesso parcial' : 'Conexão ativa') : 'Conexão indisponível'}</b><small>Banco Supabase</small></span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Icon name="menu" /></button>
          <div className="breadcrumb"><span>ConsertaJá</span><i>/</i><b>{title.title}</b></div>
          <div className="topbar-actions">
            {page !== 'overview' && page !== 'queries' && !listPages.has(page) && (
              <label className="search-box">
                <Icon name="search" size={18} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar..." aria-label="Buscar nesta página" />
                {search && <button onClick={() => setSearch('')} aria-label="Limpar busca"><Icon name="close" size={15} /></button>}
              </label>
            )}
            <a className="refresh-button site-button" href={siteUrl} title="Voltar para a página inicial do ConsertaJá">
              <Icon name="home" size={17} />
              <span>Site</span>
            </a>
            <button className="refresh-button" onClick={() => void loadData()} disabled={refreshing} aria-label="Atualizar dados">
              <Icon name="refresh" size={18} />
              <span>{refreshing ? 'Atualizando' : 'Atualizar'}</span>
            </button>
            <button className="logout-button" onClick={onSignOut} title={`Sair de ${adminEmail}`}>
              <Icon name="logout" size={16} /><span>Sair</span>
            </button>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </header>

        <div className="content-area">
          <div className="page-heading">
            <div><h2>{title.title}</h2><p>{title.subtitle}</p></div>
            <span className="today-date"><Icon name="clock" size={16} />{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>

          {loadError && (
            <div className="error-banner" role="alert">
              <Icon name="alert" size={19} />
              <span><b>Alguns dados não puderam ser carregados:</b> {loadError}</span>
              <button onClick={() => void loadData()} aria-label="Tentar carregar novamente"><Icon name="refresh" size={17} /></button>
            </div>
          )}

          {renderCurrentPage()}
          <footer className="page-footer">ConsertaJá · Painel administrativo <span>Dados atualizados sob demanda</span></footer>
        </div>
      </main>

      {serviceForm && (
        <Modal title={serviceForm.id ? 'Editar serviço' : 'Novo serviço'} onClose={() => setServiceForm(null)}>
          <form onSubmit={saveService}>
            <label className="form-field">Título<input autoFocus required maxLength={120} value={serviceForm.titulo} onChange={(event) => setServiceForm({ ...serviceForm, titulo: event.target.value })} /></label>
            <label className="form-field">Descrição<textarea rows={3} value={serviceForm.descricao} onChange={(event) => setServiceForm({ ...serviceForm, descricao: event.target.value })} /></label>
            <div className="form-grid">
              <label className="form-field">Valor (R$)<input type="number" min="0" step="0.01" required value={serviceForm.valor} onChange={(event) => setServiceForm({ ...serviceForm, valor: event.target.value })} /></label>
              <label className="form-field">Profissional<select required value={serviceForm.fk_profissional} onChange={(event) => setServiceForm({ ...serviceForm, fk_profissional: event.target.value })}><option value="">Selecione</option>{data.professionals.map((professional) => <option key={professional.id_profissional} value={professional.id_profissional}>{userById.get(professional.fk_usuario)?.nome ?? `#${professional.id_profissional}`}</option>)}</select></label>
              <label className="form-field">Modalidade<select value={serviceForm.tipo_execucao} onChange={(event) => setServiceForm({ ...serviceForm, tipo_execucao: event.target.value })}><option>Execução</option><option>Entrega</option></select></label>
              <label className="form-field">Carga<select value={serviceForm.carga_servico} onChange={(event) => setServiceForm({ ...serviceForm, carga_servico: event.target.value })}><option>Leve</option><option>Médio</option><option>Alto</option></select></label>
            </div>
            <label className="check-field"><input type="checkbox" checked={serviceForm.ativo} onChange={(event) => setServiceForm({ ...serviceForm, ativo: event.target.checked })} /> Serviço ativo no catálogo</label>
            <ModalActions onCancel={() => setServiceForm(null)} saving={saving} />
          </form>
        </Modal>
      )}

      {tradeForm && (
        <Modal title={tradeForm.id ? 'Editar ofício' : 'Novo ofício'} onClose={() => setTradeForm(null)}>
          <form onSubmit={saveTrade}>
            <label className="form-field">Nome da categoria<input autoFocus required maxLength={100} value={tradeForm.categoria} onChange={(event) => setTradeForm({ ...tradeForm, categoria: event.target.value })} /></label>
            <label className="form-field">Nome da cor<input required value={tradeForm.cor} onChange={(event) => setTradeForm({ ...tradeForm, cor: event.target.value })} placeholder="Azul" /></label>
            <ColorPicker color={tradeForm.cod_cor} onChange={(cod_cor) => setTradeForm({ ...tradeForm, cod_cor })} />
            <ModalActions onCancel={() => setTradeForm(null)} saving={saving} />
          </form>
        </Modal>
      )}

      {functionForm && (
        <Modal title={functionForm.id ? 'Editar função' : 'Nova função'} onClose={() => setFunctionForm(null)}>
          <form onSubmit={saveFunction}>
            <label className="form-field">Nome da função<input autoFocus required maxLength={120} value={functionForm.funcao} onChange={(event) => setFunctionForm({ ...functionForm, funcao: event.target.value })} /></label>
            <label className="form-field">Ofício
              <select required value={functionForm.fk_oficio} onChange={(event) => setFunctionForm({ ...functionForm, fk_oficio: event.target.value })}>
                <option value="">Selecione um ofício</option>
                {data.trades.map((trade) => <option key={trade.id_oficio} value={trade.id_oficio}>{trade.categoria}</option>)}
              </select>
            </label>
            <label className="form-field">Descrição<textarea rows={3} value={functionForm.descricao} onChange={(event) => setFunctionForm({ ...functionForm, descricao: event.target.value })} /></label>
            <label className="form-field">URL da imagem<input type="text" value={functionForm.img_funcao} onChange={(event) => setFunctionForm({ ...functionForm, img_funcao: event.target.value })} placeholder="https://..." /></label>
            <ModalActions onCancel={() => setFunctionForm(null)} saving={saving} />
          </form>
        </Modal>
      )}

      {postForm && (
        <Modal title={`Editar postagem #${postForm.id}`} onClose={() => setPostForm(null)}>
          <form onSubmit={savePost}>
            <label className="form-field">Conteúdo<textarea rows={6} value={postForm.conteudo} onChange={(event) => setPostForm({ ...postForm, conteudo: event.target.value })} placeholder="Esta publicação não possui texto." /></label>
            <label className="check-field"><input type="checkbox" checked={postForm.arquivado} onChange={(event) => setPostForm({ ...postForm, arquivado: event.target.checked })} /> Postagem arquivada</label>
            <ModalActions onCancel={() => setPostForm(null)} saving={saving} />
          </form>
        </Modal>
      )}

      {clientForm && (
        <Modal title="Editar cliente" onClose={() => setClientForm(null)}>
          <form onSubmit={saveClient}>
            <label className="form-field">Nome<input autoFocus required maxLength={120} value={clientForm.nome} onChange={(event) => setClientForm({ ...clientForm, nome: event.target.value })} /></label>
            <ModalActions onCancel={() => setClientForm(null)} saving={saving} />
          </form>
        </Modal>
      )}

      {detailsUser && (
        <UserDetailsModal
          key={detailsUser.id_usuario}
          user={detailsUser}
          email={detailsUser.fk_email === null ? undefined : emailById.get(detailsUser.fk_email)}
          phone={detailsUser.fk_telefone === null ? undefined : phoneById.get(detailsUser.fk_telefone)}
          professional={detailsProfessional}
          businessGroupId={detailsBusinessGroupId}
          statuses={statusById}
          onClose={() => setDetailsUserId(null)}
        />
      )}

      {cascade && (
        <Modal title={`Excluir ${cascade.ids.length === 1 ? cascadeMeta[cascade.table].singular : `${cascade.ids.length} ${cascadeMeta[cascade.table].plural}`}`} onClose={() => !cascade.running && setCascade(null)}>
          <div className="cascade-body">
            {cascade.loading ? (
              <div className="cascade-loading"><span className="spinner" /> Verificando registros ligados…</div>
            ) : cascade.report ? (
              <>
                <div className="cascade-warning">
                  <Icon name="alert" size={20} />
                  <span>
                    <b>Esta exclusão é permanente e não pode ser desfeita.</b>
                    Além {cascade.ids.length === 1 ? `d${cascadeMeta[cascade.table].feminine ? 'a' : 'o'} ${cascadeMeta[cascade.table].singular}` : `d${cascadeMeta[cascade.table].feminine ? 'as' : 'os'} ${cascadeMeta[cascade.table].plural}`} selecionad{cascadeMeta[cascade.table].feminine ? 'a' : 'o'}{cascade.ids.length === 1 ? '' : 's'}, os registros ligados abaixo também serão apagados do Supabase.
                  </span>
                </div>
                <ul className="cascade-list">
                  {Object.entries(cascade.report)
                    .sort(([first], [second]) => (first === cascade.table ? -1 : second === cascade.table ? 1 : first.localeCompare(second)))
                    .map(([table, count]) => (
                      <li key={table} className={table === cascade.table ? 'main' : ''}>
                        <span><b>{tableLabels[table] ?? table}</b><code>{table}</code></span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                </ul>
                <p className="modal-intro">Registros que apenas apontam para estes itens de forma opcional (como notificações) são mantidos, só perdem o vínculo.</p>
              </>
            ) : null}
            {cascade.error && <div className="auth-error" role="alert">{cascade.error}</div>}
          </div>
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={() => setCascade(null)} disabled={cascade.running}>Cancelar</button>
            <button className="danger-button solid" type="button" onClick={() => void confirmCascadeDelete()} disabled={cascade.loading || cascade.running || !cascade.report}>
              <Icon name="trash" size={16} /> {cascade.running ? 'Excluindo…' : 'Excluir definitivamente'}
            </button>
          </div>
        </Modal>
      )}

      {toast && <div className={`toast-message ${toast.kind}`} role="status">{toast.kind === 'success' ? '✓' : '!'} {toast.text}<button onClick={() => setToast(null)} aria-label="Fechar aviso"><Icon name="close" size={15} /></button></div>}
    </div>
  );
}

function newServiceForm(): ServiceForm {
  return { titulo: '', descricao: '', valor: '', ativo: true, fk_profissional: '', tipo_execucao: 'Execução', carga_servico: 'Médio' };
}

function editServiceForm(service: Service): ServiceForm {
  return {
    id: service.id_servico_prof,
    titulo: service.titulo,
    descricao: service.descricao ?? '',
    valor: String(service.valor),
    ativo: service.ativo,
    fk_profissional: String(service.fk_profissional),
    tipo_execucao: service.tipo_execucao,
    carga_servico: service.carga_servico,
  };
}

function newTradeForm(): TradeForm {
  return { categoria: '', cor: 'Azul', cod_cor: '#1db1f6' };
}

function editTradeForm(trade: Trade): TradeForm {
  return {
    id: trade.id_oficio,
    categoria: trade.categoria,
    cor: trade.cor,
    cod_cor: normalizeHex(trade.cod_cor ?? '') ?? '#1db1f6',
  };
}

function newFunctionForm(trades: Trade[]): FunctionForm {
  return {
    fk_oficio: trades[0]?.id_oficio.toString() ?? '',
    funcao: '',
    descricao: '',
    img_funcao: '',
  };
}

function editFunctionForm(item: ProfessionalFunction): FunctionForm {
  return {
    id: item.id_funcao,
    fk_oficio: String(item.fk_oficio),
    funcao: item.funcao,
    descricao: item.descricao ?? '',
    img_funcao: item.img_funcao ?? '',
  };
}

function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, '');
  const expanded = raw.length === 3 ? raw.split('').map((digit) => `${digit}${digit}`).join('') : raw;
  return /^[\da-f]{6}$/i.test(expanded) ? `#${expanded.toLowerCase()}` : null;
}

function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex) ?? '#1db1f6';
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function rgbToHex([red, green, blue]: RGB): string {
  const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0');
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function rgbToHsl([redValue, greenValue, blueValue]: RGB): [number, number, number] {
  const red = redValue / 255;
  const green = greenValue / 255;
  const blue = blueValue / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;
  let saturation = 0;
  const lightness = (max + min) / 2;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return [((hue + 360) % 360), saturation * 100, lightness * 100];
}

function rgbToCmyk([redValue, greenValue, blueValue]: RGB): [number, number, number, number] {
  const red = redValue / 255;
  const green = greenValue / 255;
  const blue = blueValue / 255;
  const black = 1 - Math.max(red, green, blue);
  if (black === 1) return [0, 0, 0, 100];
  return [
    ((1 - red - black) / (1 - black)) * 100,
    ((1 - green - black) / (1 - black)) * 100,
    ((1 - blue - black) / (1 - black)) * 100,
    black * 100,
  ];
}

function rgbToHsv([redValue, greenValue, blueValue]: RGB): { hue: number; saturation: number; value: number } {
  const red = redValue / 255;
  const green = greenValue / 255;
  const blue = blueValue / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return {
    hue: (hue + 360) % 360,
    saturation: max === 0 ? 0 : (delta / max) * 100,
    value: max,
  };
}

function hsvToHex(hue: number, saturation: number, value: number): string {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = Math.max(0, Math.min(100, saturation)) / 100;
  const normalizedValue = Math.max(0, Math.min(1, value));
  const chroma = normalizedValue * normalizedSaturation;
  const secondary = chroma * (1 - Math.abs(((normalizedHue / 60) % 2) - 1));
  const match = normalizedValue - chroma;
  let rgb: [number, number, number];

  if (normalizedHue < 60) rgb = [chroma, secondary, 0];
  else if (normalizedHue < 120) rgb = [secondary, chroma, 0];
  else if (normalizedHue < 180) rgb = [0, chroma, secondary];
  else if (normalizedHue < 240) rgb = [0, secondary, chroma];
  else if (normalizedHue < 300) rgb = [secondary, 0, chroma];
  else rgb = [chroma, 0, secondary];

  return rgbToHex([
    (rgb[0] + match) * 255,
    (rgb[1] + match) * 255,
    (rgb[2] + match) * 255,
  ]);
}

function hslToHex(hueValue: number, saturationValue: number, lightnessValue: number): string {
  const hue = (((hueValue % 360) + 360) % 360) / 360;
  const saturation = saturationValue / 100;
  const lightness = lightnessValue / 100;
  if (saturation === 0) {
    const gray = lightness * 255;
    return rgbToHex([gray, gray, gray]);
  }

  const q = lightness < 0.5
    ? lightness * (1 + saturation)
    : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  const hueToRgb = (offset: number) => {
    let channelHue = offset;
    if (channelHue < 0) channelHue += 1;
    if (channelHue > 1) channelHue -= 1;
    if (channelHue < 1 / 6) return p + (q - p) * 6 * channelHue;
    if (channelHue < 1 / 2) return q;
    if (channelHue < 2 / 3) return p + (q - p) * (2 / 3 - channelHue) * 6;
    return p;
  };

  return rgbToHex([
    hueToRgb(hue + 1 / 3) * 255,
    hueToRgb(hue) * 255,
    hueToRgb(hue - 1 / 3) * 255,
  ]);
}

function cmykToHex(cyan: number, magenta: number, yellow: number, black: number): string {
  const normalizedBlack = black / 100;
  return rgbToHex([
    255 * (1 - cyan / 100) * (1 - normalizedBlack),
    255 * (1 - magenta / 100) * (1 - normalizedBlack),
    255 * (1 - yellow / 100) * (1 - normalizedBlack),
  ]);
}

function parseColorFormat(format: ColorFormat, value: string): string | null {
  if (format === 'hex') return normalizeHex(value);
  const values = value.match(/-?(?:\d+\.?\d*|\.\d+)/g)?.map(Number);
  const expectedLength = format === 'cmyk' ? 4 : 3;
  if (!values || values.length !== expectedLength || values.some((number) => !Number.isFinite(number))) return null;

  if (format === 'rgb') {
    if (values.some((number) => number < 0 || number > 255)) return null;
    return rgbToHex(values as RGB);
  }
  if (format === 'hsl') {
    const [hue, saturation, lightness] = values;
    if (hue < 0 || hue > 360 || saturation < 0 || saturation > 100 || lightness < 0 || lightness > 100) return null;
    return hslToHex(hue, saturation, lightness);
  }
  if (values.some((number) => number < 0 || number > 100)) return null;
  return cmykToHex(values[0], values[1], values[2], values[3]);
}

function formatColorValues(hex: string): Record<ColorFormat, string> {
  const rgb = hexToRgb(hex);
  const [hue, saturation, lightness] = rgbToHsl(rgb);
  const [cyan, magenta, yellow, black] = rgbToCmyk(rgb);
  const decimal = (value: number) => Number(value.toFixed(1));
  return {
    hex,
    rgb: `${rgb[0]}, ${rgb[1]}, ${rgb[2]}`,
    hsl: `${decimal(hue)}, ${decimal(saturation)}%, ${decimal(lightness)}%`,
    cmyk: `${decimal(cyan)}%, ${decimal(magenta)}%, ${decimal(yellow)}%, ${decimal(black)}%`,
  };
}

function ColorPicker({ color, onChange }: { color: string; onChange: (hex: string) => void }) {
  const hex = normalizeHex(color) ?? '#1db1f6';
  const hsv = rgbToHsv(hexToRgb(hex));
  const [drafts, setDrafts] = useState<Record<ColorFormat, string>>(() => formatColorValues(hex));
  const markerOffset = (hsv.saturation / 100) * 44;
  const markerPosition = {
    left: `${50 + markerOffset * Math.cos((hsv.hue * Math.PI) / 180)}%`,
    top: `${50 + markerOffset * Math.sin((hsv.hue * Math.PI) / 180)}%`,
  };

  useEffect(() => {
    setDrafts(formatColorValues(hex));
  }, [hex]);

  function chooseFromWheel(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(bounds.width, bounds.height) / 2;
    const deltaX = event.clientX - (bounds.left + bounds.width / 2);
    const deltaY = event.clientY - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(deltaX, deltaY);
    if (distance > radius) return;
    const hue = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 360) % 360;
    const saturation = (distance / radius) * 100;
    onChange(hsvToHex(hue, saturation, hsv.value));
  }

  function handleWheelKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 5 : 1;
    let hue = hsv.hue;
    let saturation = hsv.saturation;
    if (event.key === 'ArrowRight') hue += step;
    else if (event.key === 'ArrowLeft') hue -= step;
    else if (event.key === 'ArrowUp') saturation += step;
    else if (event.key === 'ArrowDown') saturation -= step;
    else return;
    event.preventDefault();
    onChange(hsvToHex(hue, saturation, hsv.value));
  }

  function updateFormat(format: ColorFormat, value: string) {
    setDrafts((current) => ({ ...current, [format]: value }));
    const parsedColor = parseColorFormat(format, value);
    if (parsedColor) onChange(parsedColor);
  }

  const fields: { format: ColorFormat; label: string; placeholder: string }[] = [
    { format: 'hex', label: 'HEX', placeholder: '#1db1f6' },
    { format: 'rgb', label: 'RGB', placeholder: '29, 177, 246' },
    { format: 'hsl', label: 'HSL', placeholder: '198, 92%, 54%' },
    { format: 'cmyk', label: 'CMYK', placeholder: '88%, 28%, 0%, 4%' },
  ];

  return (
    <div className="color-picker">
      <div className="color-picker-wheel-column">
        <div
          className="color-wheel"
          role="slider"
          aria-label="Roda de cores"
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={Math.round(hsv.hue)}
          aria-valuetext={`${hex}, matiz ${Math.round(hsv.hue)} graus, saturação ${Math.round(hsv.saturation)} por cento`}
          tabIndex={0}
          style={{ filter: `brightness(${hsv.value})` }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            chooseFromWheel(event);
          }}
          onPointerMove={(event) => {
            if (event.buttons === 1) chooseFromWheel(event);
          }}
          onKeyDown={handleWheelKeyDown}
        >
          <span className="color-wheel-indicator" style={markerPosition} />
        </div>
        <label className="color-brightness">
          Brilho
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(hsv.value * 100)}
            onChange={(event) => onChange(hsvToHex(hsv.hue, hsv.saturation, Number(event.target.value) / 100))}
          />
        </label>
      </div>
      <div className="color-picker-details">
        <div className="color-selected">
          <label className="color-native-picker" title="Abrir seletor de cor do sistema">
            <input type="color" aria-label="Escolher cor" value={hex} onChange={(event) => onChange(event.target.value)} />
            <span style={{ backgroundColor: hex }} />
          </label>
          <div className="color-selected-copy"><b>{hex.toUpperCase()}</b><small>Pré-visualização</small></div>
        </div>
        <div className="color-format-grid">
          {fields.map(({ format, label, placeholder }) => (
            <label className="color-format-field" key={format}>
              {label}
              <input
                type="text"
                spellCheck={false}
                value={drafts[format]}
                placeholder={placeholder}
                onChange={(event) => updateFormat(format, event.target.value)}
                onBlur={() => setDrafts(formatColorValues(hex))}
                aria-label={`Cor em ${label}`}
              />
            </label>
          ))}
        </div>
        <small className="color-picker-hint">Edite qualquer formato; o código HEX será salvo.</small>
      </div>
    </div>
  );
}

function AuthBrand() {
  return (
    <div className="auth-brand">
      <img className="brand-logo" src={logoWhite} alt="" />
      <span className="brand-word">Conserta<b>Já</b><small>PAINEL ADMINISTRATIVO</small></span>
    </div>
  );
}

function ThemeToggle({ theme, onToggle, className = '' }: { theme: ThemeMode; onToggle: () => void; className?: string }) {
  const nextTheme = theme === 'dark' ? 'claro' : 'escuro';
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={onToggle}
      aria-label={`Ativar modo ${nextTheme}`}
      title={`Ativar modo ${nextTheme}`}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
      <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
    </button>
  );
}

function AuthLoading({ message, theme, onToggleTheme }: { message: string; theme: ThemeMode; onToggleTheme: () => void }) {
  return (
    <main className="auth-screen">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} className="auth-theme-toggle" />
      <BackToSiteLink />
      <section className="auth-card auth-status-card">
        <AuthBrand />
        <div className="auth-loading"><span className="spinner" /><b>{message}</b></div>
      </section>
    </main>
  );
}

function AuthMessage({
  title,
  message,
  actionLabel,
  onAction,
  theme,
  onToggleTheme,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  return (
    <main className="auth-screen">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} className="auth-theme-toggle" />
      <BackToSiteLink />
      <section className="auth-card auth-status-card">
        <AuthBrand />
        <span className="auth-lock"><Icon name="alert" size={23} /></span>
        <h1>{title}</h1>
        <p>{message}</p>
        {actionLabel && onAction && <button className="primary-button auth-submit" onClick={onAction}>{actionLabel}</button>}
      </section>
    </main>
  );
}

function LoginScreen({
  onSubmit,
  busy,
  error,
  theme,
  onToggleTheme,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
  busy: boolean;
  error: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSubmit(email.trim(), password);
  }

  return (
    <main className="auth-screen">
      <ThemeToggle theme={theme} onToggle={onToggleTheme} className="auth-theme-toggle" />
      <BackToSiteLink />
      <section className="auth-card">
        <AuthBrand />
        <span className="eyebrow">ACESSO RESTRITO</span>
        <h1>Entre no painel</h1>
        <p className="auth-description">Use a conta administrativa cadastrada no Supabase.</p>
        <form className="auth-form" onSubmit={submit}>
          <label className="form-field">E-mail<input autoFocus autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" /></label>
          <label className="form-field">Senha<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <p className="auth-footnote">O acesso só é liberado para contas listadas como administradoras.</p>
      </section>
    </main>
  );
}

function MetricCard({ icon, label, value, note, tone, available, connected }: { icon: IconName; label: string; value: string | number; note: string; tone: string; available: boolean; connected: boolean }) {
  return (
    <section className="metric-card">
      <div className="metric-top"><span className={`metric-icon ${tone}`}><Icon name={icon} size={20} /></span><span className={`metric-indicator ${available ? '' : 'unavailable'}`}><i /> {available ? 'Atualizado' : connected ? 'Acesso parcial' : 'Sem conexão'}</span></div>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-note">{note}</span>
    </section>
  );
}

function PanelHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="panel-heading">
      <div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3></div>
      {action}
    </div>
  );
}

function StatusBadge({ label, positive = false }: { label: string; positive?: boolean }) {
  return <span className={`status-badge ${positive ? 'positive' : ''}`}><i />{label}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><span><Icon name="search" size={22} /></span><b>{title}</b><p>{description}</p></div>;
}

function InlineNotice({ children }: { children: React.ReactNode }) {
  return <div className="inline-notice"><Icon name="alert" size={18} /><span>{children}</span></div>;
}

function TableFooter({ count, label }: { count: number; label: string }) {
  return <div className="table-footer">{count} {label} exibidos</div>;
}

function Toggle({ checked, label, onChange, disabled = false, title }: { checked: boolean; label: string; onChange: (value: boolean) => void; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? 'checked' : ''}`}
      disabled={disabled}
      title={title}
      role="switch"
      aria-checked={checked}
      aria-label={`${label}: ${checked ? 'sim' : 'não'}`}
      onClick={() => onChange(!checked)}
    ><span /></button>
  );
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal-card ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><h3 id="modal-title">{title}</h3><button className="icon-button" onClick={onClose} aria-label="Fechar"><Icon name="close" /></button></div>
        {children}
      </section>
    </div>
  );
}

function UserAvatar({ name, photoUrl, large = false }: { name: string; photoUrl: string | null; large?: boolean }) {
  const imageUrl = photoUrl ? safeHttpUrl(photoUrl) : null;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toLocaleUpperCase('pt-BR');
  return (
    <span className={`user-avatar ${large ? 'large' : ''}`}>
      <span>{initials || '?'}</span>
      {imageUrl && <img src={imageUrl} alt="" aria-hidden="true" referrerPolicy="no-referrer" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} />}
    </span>
  );
}

function UserDetailsModal({
  user,
  email,
  phone,
  professional,
  businessGroupId,
  statuses,
  onClose,
}: {
  user: User;
  email?: UserEmail;
  phone?: UserPhone;
  professional?: Professional;
  businessGroupId?: number;
  statuses: Map<number, RequestStatus>;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<LoadedUserDetails | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setDetails(null);
    setErrors([]);
    setLoading(true);

    async function loadDetails() {
      if (!supabase) {
        setErrors([supabaseConfigMessage]);
        setLoading(false);
        return;
      }

      const nextErrors: string[] = [];
      let personType: PersonType | null = null;
      let naturalPerson: NaturalPerson | null = null;
      let legalPerson: LegalPerson | null = null;
      let documents: ProfessionalDocument[] = [];
      let certificates: ProfessionalCertificate[] = [];

      try {
        if (user.fk_tipo_pessoa !== null) {
          const result = await supabase
            .from('ass_tipo_pessoa')
            .select('id_tipo_pessoa,fk_pessoa_fisica,fk_pessoa_juridica')
            .eq('id_tipo_pessoa', user.fk_tipo_pessoa)
            .maybeSingle();
          if (result.error) nextErrors.push(`Tipo de pessoa: ${result.error.message}`);
          else personType = result.data;
        }

        if (personType?.fk_pessoa_fisica !== null && personType?.fk_pessoa_fisica !== undefined) {
          const result = await supabase
            .from('pessoa_fisica')
            .select('cpf')
            .eq('id_pessoa_fisica', personType.fk_pessoa_fisica)
            .maybeSingle();
          if (result.error) nextErrors.push(`CPF: ${result.error.message}`);
          else naturalPerson = result.data;
        }

        if (personType?.fk_pessoa_juridica !== null && personType?.fk_pessoa_juridica !== undefined) {
          const result = await supabase
            .from('pessoa_juridica')
            .select('cnpj,razao_social,data_fundacao,nome_fantasia')
            .eq('id_pessoa_juridica', personType.fk_pessoa_juridica)
            .maybeSingle();
          if (result.error) nextErrors.push(`CNPJ: ${result.error.message}`);
          else legalPerson = result.data;
        }

        if (professional) {
          const [documentResult, certificateResult] = await Promise.all([
            supabase
              .from('documentos_profissionais')
              .select('tipo_documento,validacao_documento')
              .eq('fk_profissional', professional.id_profissional)
              .limit(200),
            supabase
              .from('certificados_profissional')
              .select('titulo,data_emissao,arquivo,tipo_arquivo')
              .eq('fk_profissional', professional.id_profissional)
              .limit(200),
          ]);
          if (documentResult.error) nextErrors.push(`Documentos: ${documentResult.error.message}`);
          else documents = documentResult.data ?? [];
          if (certificateResult.error) nextErrors.push(`Certificados: ${certificateResult.error.message}`);
          else certificates = certificateResult.data ?? [];

          if (businessGroupId !== undefined) {
            const groupCertificateResult = await supabase
              .from('certificados_profissional')
              .select('titulo,data_emissao,arquivo,tipo_arquivo')
              .eq('fk_grupo_empresa', businessGroupId)
              .limit(200);
            if (groupCertificateResult.error) nextErrors.push(`Certificados da empresa: ${groupCertificateResult.error.message}`);
            else {
              const knownCertificates = new Set(certificates.map((certificate) => JSON.stringify(certificate)));
              for (const certificate of groupCertificateResult.data ?? []) {
                const key = JSON.stringify(certificate);
                if (!knownCertificates.has(key)) {
                  knownCertificates.add(key);
                  certificates.push(certificate);
                }
              }
            }
          }
        }

        if (active) {
          setDetails({ personType, naturalPerson, legalPerson, documents, certificates });
          setErrors(nextErrors);
        }
      } catch (error) {
        if (active) setErrors([...nextErrors, `Não foi possível carregar os detalhes: ${displayError(error)}`]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDetails();
    return () => {
      active = false;
    };
  }, [user, professional, businessGroupId]);

  const emailStatus = email?.fk_status === null || email?.fk_status === undefined
    ? undefined
    : statuses.get(email.fk_status)?.status;
  const phoneStatus = phone?.fk_status === null || phone?.fk_status === undefined
    ? undefined
    : statuses.get(phone.fk_status)?.status;

  return (
    <Modal title={`Detalhes de ${user.nome}`} onClose={onClose} wide>
      <div className="user-details-content">
        <div className="user-details-hero">
          <UserAvatar name={user.nome} photoUrl={user.foto_perfil_url} large />
          <div><h4>{user.nome}</h4><p>{user.tipo_conta} · ID #{user.id_usuario}</p></div>
        </div>

        {errors.map((error) => <div className="auth-error details-error" key={error} role="alert">{error}</div>)}
        {loading && <div className="loading-panel"><span className="spinner" />Carregando dados pessoais e documentos…</div>}

        <section className="user-detail-section">
          <h4>Contato e acesso</h4>
          <div className="user-detail-grid">
            <DetailItem label="E-mail">{email?.endereco_email ?? 'Não cadastrado'}</DetailItem>
            <DetailItem label="Verificação do e-mail">{email ? (email.verificar_autenticacao ? 'Verificado' : 'Pendente') : 'Não cadastrado'}</DetailItem>
            <DetailItem label="Status do e-mail">{emailStatus ?? 'Não informado'}</DetailItem>
            <DetailItem label="E-mail verificado em">{dateTime(email?.data_verificacao)}</DetailItem>
            <DetailItem label="Telefone">{phone ? `(${phone.ddd}) ${phone.numero}` : 'Não cadastrado'}</DetailItem>
            <DetailItem label="Verificação do telefone">{phone ? (phone.verificar_autenticacao ? 'Verificado' : 'Pendente') : 'Não cadastrado'}</DetailItem>
            <DetailItem label="Status do telefone">{phoneStatus ?? 'Não informado'}</DetailItem>
            <DetailItem label="Telefone verificado em">{dateTime(phone?.data_verificacao)}</DetailItem>
            <DetailItem label="Conta criada em">{dateTime(user.data_criacao)}</DetailItem>
            <DetailItem label="Última conexão">{dateTime(user.ultima_conexao)}</DetailItem>
          </div>
        </section>

        <section className="user-detail-section">
          <h4>Dados pessoais</h4>
          <div className="user-detail-grid">
            <DetailItem label="Tipo de pessoa">
              {details?.personType?.fk_pessoa_fisica !== null && details?.personType?.fk_pessoa_fisica !== undefined
                ? 'Pessoa física'
                : details?.personType?.fk_pessoa_juridica !== null && details?.personType?.fk_pessoa_juridica !== undefined
                  ? 'Pessoa jurídica'
                  : 'Não informado'}
            </DetailItem>
            <DetailItem label="CPF">{details?.naturalPerson?.cpf ?? 'Não informado'}</DetailItem>
            <DetailItem label="CNPJ">{details?.legalPerson?.cnpj ?? 'Não informado'}</DetailItem>
            {details?.legalPerson && <>
              <DetailItem label="Razão social">{details.legalPerson.razao_social ?? 'Não informado'}</DetailItem>
              <DetailItem label="Nome fantasia">{details.legalPerson.nome_fantasia ?? 'Não informado'}</DetailItem>
              <DetailItem label="Fundação">{dateTime(details.legalPerson.data_fundacao)}</DetailItem>
            </>}
          </div>
        </section>

        {professional && (
          <section className="user-detail-section">
            <h4>Perfil profissional</h4>
            <div className="user-detail-grid">
              <DetailItem label="ID profissional">#{professional.id_profissional}</DetailItem>
              <DetailItem label="Experiência">{professional.anos_experiencia ?? 'Não informado'}</DetailItem>
              <DetailItem label="Cadastro profissional">{dateTime(professional.data_admissao)}</DetailItem>
              <DetailItem label="Verificação do perfil">{professional.verificar_autenticacao ? 'Verificado' : 'Pendente'}</DetailItem>
              <DetailItem label="Plano premium">{professional.plano_premium ? 'Ativo' : 'Inativo'}</DetailItem>
            </div>
          </section>
        )}

        {professional && (
          <section className="user-detail-section">
            <h4>Documentos de verificação</h4>
            {details?.documents.length ? (
              <ul className="user-detail-list">
                {details.documents.map((document, index) => (
                  <li key={`${document.tipo_documento}-${index}`}>
                    <span><b>{document.tipo_documento}</b><small>Documento profissional</small></span>
                    <StatusBadge label={document.validacao_documento ? 'Validado' : 'Pendente'} positive={document.validacao_documento} />
                  </li>
                ))}
              </ul>
            ) : <p className="detail-empty">{loading ? 'Buscando documentos…' : 'Nenhum documento profissional cadastrado.'}</p>}
          </section>
        )}

        {professional && (
          <section className="user-detail-section">
            <h4>Certificados</h4>
            {details?.certificates.length ? (
              <ul className="user-detail-list">
                {details.certificates.map((certificate, index) => {
                  const fileUrl = certificate.arquivo && /^https?:\/\//i.test(certificate.arquivo.trim())
                    ? safeHttpUrl(certificate.arquivo)
                    : null;
                  return (
                    <li key={`${certificate.titulo}-${certificate.data_emissao}-${index}`}>
                      <span>
                        <b>{certificate.titulo}</b>
                        <small>{certificate.tipo_arquivo ?? 'Arquivo'} · emissão: {dateTime(certificate.data_emissao)}</small>
                      </span>
                      {fileUrl
                        ? <a href={fileUrl} target="_blank" rel="noopener noreferrer">Abrir arquivo</a>
                        : <small>Arquivo sem link HTTP(S)</small>}
                    </li>
                  );
                })}
              </ul>
            ) : <p className="detail-empty">{loading ? 'Buscando certificados…' : 'Nenhum certificado cadastrado.'}</p>}
          </section>
        )}
      </div>
    </Modal>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="user-detail-item"><span>{label}</span><strong>{children}</strong></div>;
}

function BackToSiteLink() {
  return (
    <a className="auth-back-link" href={siteUrl}>
      <Icon name="home" size={16} />
      <span>Voltar ao site</span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Administradores: criação de contas e controle de acesso ao painel.
// Usa a Edge Function "admin-contas" (supabase/functions/admin-contas), que roda
// com a chave service_role no servidor — a chave secreta nunca vai para o navegador.
// ---------------------------------------------------------------------------

interface AdminAccount {
  id: string;
  email: string;
  nome: string | null;
  is_admin: boolean;
  created_at: string | null;
  last_sign_in_at: string | null;
  confirmed: boolean;
}

type AdminFilter = 'all' | 'admins' | 'others';
type AdminCreateForm = { email: string; password: string; confirm: string };

const adminFunctionName = 'admin-contas';

class AdminFunctionMissingError extends Error {
  constructor(functionName = adminFunctionName) {
    super(`A Edge Function "${functionName}" não respondeu. Verifique se ela foi publicada no Supabase.`);
    this.name = 'AdminFunctionMissingError';
  }
}

async function callAdminFunction<T>(body: Record<string, unknown>): Promise<T> {
  return callEdgeFunction<T>(adminFunctionName, body);
}

async function callEdgeFunction<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error(supabaseConfigMessage);
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      if (context.status === 404) throw new AdminFunctionMissingError(functionName);
      try {
        const payload = await context.clone().json();
        if (payload && typeof payload.error === 'string') throw new Error(payload.error);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.name !== 'SyntaxError') throw parseError;
      }
    }
    if (error.name === 'FunctionsFetchError' || error.name === 'FunctionsRelayError') throw new AdminFunctionMissingError(functionName);
    throw new Error(displayError(error));
  }
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    throw new Error((data as { error: string }).error);
  }
  return data as T;
}

function AdminAccountsPanel({ search, onSuccess, onError }: { search: string; onSuccess: (text: string) => void; onError: (error: unknown) => void }) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [meId, setMeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<AdminFilter>('all');
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [createForm, setCreateForm] = useState<AdminCreateForm | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await callAdminFunction<{ me: string; accounts: AdminAccount[] }>({ action: 'list' });
      setAccounts(result.accounts ?? []);
      setMeId(result.me ?? '');
      setMissing(false);
    } catch (error) {
      if (error instanceof AdminFunctionMissingError) setMissing(true);
      else setLoadError(displayError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const term = search.trim().toLocaleLowerCase('pt-BR');
  const adminCount = accounts.filter((account) => account.is_admin).length;
  const visible = accounts.filter((account) => {
    if (filter === 'admins' && !account.is_admin) return false;
    if (filter === 'others' && account.is_admin) return false;
    return !term || `${account.email} ${account.nome ?? ''}`.toLocaleLowerCase('pt-BR').includes(term);
  });

  async function setAdmin(account: AdminAccount, value: boolean) {
    if (account.id === meId && !value) return;
    if (!value && !window.confirm(`Remover o acesso administrativo de ${account.email}?`)) return;
    setPending((current) => ({ ...current, [account.id]: true }));
    setAccounts((current) => current.map((item) => (item.id === account.id ? { ...item, is_admin: value } : item)));
    try {
      await callAdminFunction({ action: 'set_admin', user_id: account.id, admin: value });
      onSuccess(value ? `${account.email} agora é administrador.` : `Acesso de ${account.email} removido.`);
    } catch (error) {
      setAccounts((current) => current.map((item) => (item.id === account.id ? { ...item, is_admin: !value } : item)));
      onError(error);
    } finally {
      setPending((current) => {
        const next = { ...current };
        delete next[account.id];
        return next;
      });
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createForm) return;
    const email = createForm.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Informe um e-mail válido.');
      return;
    }
    if (createForm.password.length < 8) {
      setFormError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (createForm.password !== createForm.confirm) {
      setFormError('As senhas não conferem.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const result = await callAdminFunction<{ created: boolean; already_admin: boolean }>({
        action: 'create',
        email,
        password: createForm.password,
      });
      setCreateForm(null);
      onSuccess(
        result.created
          ? `Conta ${email} criada com acesso ao painel.`
          : result.already_admin
            ? `${email} já era administrador.`
            : `${email} já tinha conta: o acesso ao painel foi liberado (a senha atual foi mantida).`
      );
      await load();
    } catch (error) {
      setFormError(displayError(error));
    } finally {
      setSaving(false);
    }
  }

  const openCreate = () => {
    setFormError('');
    setCreateForm({ email: '', password: '', confirm: '' });
  };

  return (
    <>
      <section className="panel data-panel admin-accounts">
        <PanelHeading
          eyebrow="CONTROLE DE ACESSO"
          title="Contas administrativas"
          action={
            <div className="admin-heading-actions">
              <button className="secondary-button" type="button" onClick={() => void load()} disabled={loading}>
                <Icon name="refresh" size={16} /> Atualizar
              </button>
              <button className="primary-button" type="button" onClick={openCreate} disabled={missing}>
                <Icon name="plus" size={18} /> Nova conta admin
              </button>
            </div>
          }
        />

        {missing ? (
          <div className="admin-setup">
            <span className="admin-setup-icon"><Icon name="shield" size={22} /></span>
            <div>
              <b>Falta publicar a função de administradores no Supabase</b>
              <p>
                Criar contas no Supabase Auth exige a chave secreta (service_role), que não pode ficar no navegador.
                Por isso esta tela usa a Edge Function <code>{adminFunctionName}</code>, que já está no projeto em{' '}
                <code>supabase/functions/{adminFunctionName}</code>. Publique-a uma vez pelo terminal, na pasta do projeto:
              </p>
              <pre>{`npx supabase login\nnpx supabase functions deploy ${adminFunctionName} --project-ref ${supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'SEU_PROJECT_REF'}`}</pre>
              <button className="primary-button" type="button" onClick={() => void load()}><Icon name="refresh" size={16} /> Tentar novamente</button>
            </div>
          </div>
        ) : (
          <>
            <div className="admin-toolbar">
              <div className="admin-tabs" role="tablist" aria-label="Filtrar contas">
                {([
                  ['all', 'Todas', accounts.length],
                  ['admins', 'Administradores', adminCount],
                  ['others', 'Sem acesso', accounts.length - adminCount],
                ] as [AdminFilter, string, number][]).map(([key, label, count]) => (
                  <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>
                    {label}<small>{count}</small>
                  </button>
                ))}
              </div>
              <span className="admin-hint"><Icon name="shield" size={15} /> Ligue a chave para liberar o acesso ao painel. Você não pode remover o próprio acesso.</span>
            </div>

            {loadError && <InlineNotice>{loadError}</InlineNotice>}

            {loading ? (
              <div className="loading-panel"><span className="spinner" /><b>Carregando contas…</b></div>
            ) : visible.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Conta</th><th>Criada em</th><th>Último acesso</th><th>Situação</th><th>Administrador</th></tr></thead>
                  <tbody>
                    {visible.map((account) => {
                      const isMe = account.id === meId;
                      return (
                        <tr key={account.id} className={account.is_admin ? 'is-admin' : ''}>
                          <td>
                            <span className="user-identity">
                              <UserAvatar name={account.nome || account.email} photoUrl={null} />
                              <span className="user-identity-copy">
                                <b>{account.nome || account.email.split('@')[0]}{isMe && <em className="me-badge">Você</em>}</b>
                                <small>{account.email}</small>
                              </span>
                            </span>
                          </td>
                          <td>{dateTime(account.created_at)}</td>
                          <td>{account.last_sign_in_at ? relativeTime(account.last_sign_in_at) : 'Nunca entrou'}</td>
                          <td><StatusBadge label={account.confirmed ? 'E-mail confirmado' : 'Aguardando confirmação'} positive={account.confirmed} /></td>
                          <td>
                            <span className="admin-switch">
                              <Toggle
                                checked={account.is_admin}
                                label={`Administrador ${account.email}`}
                                disabled={isMe || Boolean(pending[account.id])}
                                title={isMe ? 'Você não pode remover o seu próprio acesso.' : undefined}
                                onChange={(value) => void setAdmin(account, value)}
                              />
                              <span>{pending[account.id] ? 'Salvando…' : account.is_admin ? 'Sim' : 'Não'}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Nenhuma conta encontrada" description={term ? 'Ajuste a busca ou o filtro.' : 'Crie a primeira conta administrativa.'} />
            )}
            <TableFooter count={visible.length} label="contas" />
          </>
        )}
      </section>

      {createForm && (
        <Modal title="Nova conta de administrador" onClose={() => !saving && setCreateForm(null)}>
          <form onSubmit={createAccount}>
            <p className="modal-intro">
              A conta é criada no Supabase Auth já confirmada e entra na lista de administradores.
              Se o e-mail já tiver conta, ela só recebe o acesso ao painel e a senha atual é mantida.
            </p>
            <label className="form-field">E-mail<input autoFocus type="email" required autoComplete="off" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} placeholder="nome@email.com" /></label>
            <div className="form-grid">
              <label className="form-field">Senha<input type="password" required minLength={8} autoComplete="new-password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} placeholder="Mínimo de 8 caracteres" /></label>
              <label className="form-field">Confirmar senha<input type="password" required minLength={8} autoComplete="new-password" value={createForm.confirm} onChange={(event) => setCreateForm({ ...createForm, confirm: event.target.value })} placeholder="Repita a senha" /></label>
            </div>
            {formError && <div className="auth-error" role="alert">{formError}</div>}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setCreateForm(null)} disabled={saving}>Cancelar</button>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Criando…' : 'Criar conta admin'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function ModalActions({ onCancel, saving }: { onCancel: () => void; saving: boolean }) {
  return (
    <div className="modal-actions">
      <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>Cancelar</button>
      <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra de busca/ordenação/seleção das listas
// ---------------------------------------------------------------------------

function ListToolbar<T>({
  search,
  onSearch,
  placeholder,
  options,
  sort,
  onSort,
  selectedCount,
  onClearSelection,
  busy,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  options: SortOption<T>[];
  sort: SortState | null;
  onSort: (value: SortState | null) => void;
  selectedCount: number;
  onClearSelection: () => void;
  busy: boolean;
  children: React.ReactNode;
}) {
  const activeKey = sort && options.some((option) => option.key === sort.key) ? sort.key : '';
  return (
    <div className="list-toolbar">
      <div className="list-toolbar-row">
        <label className="list-search">
          <Icon name="search" size={18} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} aria-label="Buscar nesta lista" />
          {search && <button type="button" onClick={() => onSearch('')} aria-label="Limpar busca"><Icon name="close" size={15} /></button>}
        </label>
        <div className="list-sort">
          <Icon name="sort" size={17} />
          <select
            aria-label="Ordenar por"
            value={activeKey}
            onChange={(event) => onSort(event.target.value ? { key: event.target.value, dir: sort?.dir ?? 'asc' } : null)}
          >
            <option value="">Ordem padrão</option>
            {options.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
          <button
            type="button"
            className="sort-direction"
            disabled={!activeKey}
            onClick={() => sort && onSort({ key: sort.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
            title={sort?.dir === 'desc' ? 'Decrescente (clique para inverter)' : 'Crescente (clique para inverter)'}
            aria-label="Inverter ordem"
          >
            {sort?.dir === 'desc' ? '↓ Z–A' : '↑ A–Z'}
          </button>
        </div>
      </div>
      {selectedCount > 0 && (
        <div className="bulk-bar" role="region" aria-label="Ações para os itens selecionados">
          <span><b>{selectedCount}</b> {selectedCount === 1 ? 'item selecionado' : 'itens selecionados'}</span>
          <div className="bulk-actions">
            <fieldset disabled={busy}>{children}</fieldset>
            <button type="button" className="text-action" onClick={onClearSelection}>Limpar seleção</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortHeader({ label, sortKey, sort, onSort }: { label: string; sortKey: string; sort: SortState | null; onSort: (key: string) => void }) {
  const active = sort?.key === sortKey;
  return (
    <th aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={`sort-th ${active ? 'active' : ''}`} onClick={() => onSort(sortKey)}>
        {label}<span aria-hidden="true">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
}

function SelectAllHeader({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  return (
    <th className="check-cell">
      <input
        type="checkbox"
        aria-label="Selecionar todos os itens exibidos"
        checked={checked}
        ref={(element) => { if (element) element.indeterminate = indeterminate; }}
        onChange={onChange}
      />
    </th>
  );
}

function RowCheckbox({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <td className="check-cell"><input type="checkbox" aria-label={label} checked={checked} onChange={onChange} /></td>;
}

// ---------------------------------------------------------------------------
// Consultas SQL salvas no Supabase (Edge Function admin-consultas)
// ---------------------------------------------------------------------------

interface SavedQuery {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  inserted_at: string | null;
  updated_at: string | null;
  favorite?: boolean;
  owner?: { username?: string } | null;
}

type QueryResult = { rows: Record<string, unknown>[]; raw: unknown; ms: number };

const queriesFunctionName = 'admin-consultas';
const writeSqlPattern = /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|comment|vacuum|reindex|call|do)\b/i;
const visibilityLabels: Record<string, string> = { user: 'Privada', project: 'Projeto', org: 'Organização', public: 'Pública' };

function QueriesPanel({ onSuccess, onError }: { onSuccess: (text: string) => void; onError: (error: unknown) => void }) {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<'missing' | 'token' | null>(null);
  const [setupMessage, setSetupMessage] = useState('');
  const [listError, setListError] = useState('');
  const [filter, setFilter] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [original, setOriginal] = useState('');
  const [sql, setSql] = useState('');
  const [loadingSql, setLoadingSql] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [runError, setRunError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setListError('');
    try {
      const response = await callEdgeFunction<{ snippets?: SavedQuery[]; setup_required?: boolean; error?: string }>(queriesFunctionName, { action: 'list' });
      if (response.setup_required) {
        setSetup('token');
        setSetupMessage(response.error ?? '');
        return;
      }
      setSetup(null);
      setQueries((response.snippets ?? []).slice().sort((first, second) => first.name.localeCompare(second.name, 'pt-BR')));
    } catch (error) {
      if (error instanceof AdminFunctionMissingError) setSetup('missing');
      else if (/CONSULTAS_ACCESS_TOKEN/.test(displayError(error))) {
        setSetup('token');
        setSetupMessage(displayError(error));
      } else setListError(displayError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function openQuery(query: SavedQuery) {
    setActiveId(query.id);
    setResult(null);
    setRunError('');
    setLoadingSql(true);
    try {
      const response = await callEdgeFunction<{ snippet: { content?: { sql?: string } } }>(queriesFunctionName, { action: 'get', id: query.id });
      const text = response.snippet?.content?.sql ?? '';
      setOriginal(text);
      setSql(text);
    } catch (error) {
      setRunError(displayError(error));
      setOriginal('');
      setSql('');
    } finally {
      setLoadingSql(false);
    }
  }

  function newQuery() {
    setActiveId('new');
    setOriginal('');
    setSql('');
    setResult(null);
    setRunError('');
  }

  async function run() {
    const query = sql.trim();
    if (!query) return;
    if (writeSqlPattern.test(query) && !window.confirm('Esta consulta pode ALTERAR ou APAGAR dados do banco de produção.\n\nDeseja executá-la mesmo assim?')) return;
    setRunning(true);
    setRunError('');
    setResult(null);
    try {
      const response = await callEdgeFunction<QueryResult & { setup_required?: boolean; error?: string }>(queriesFunctionName, { action: 'run', query });
      if (response.setup_required) throw new Error(response.error ?? 'Configure o segredo CONSULTAS_ACCESS_TOKEN.');
      setResult({ rows: response.rows ?? [], raw: response.raw, ms: response.ms });
      onSuccess(`Consulta executada${response.rows?.length ? ` · ${response.rows.length} linha(s)` : ''}.`);
    } catch (error) {
      setRunError(displayError(error));
      onError(error);
    } finally {
      setRunning(false);
    }
  }

  async function copySql() {
    try {
      await navigator.clipboard.writeText(sql);
      onSuccess('SQL copiado.');
    } catch (error) {
      onError(error);
    }
  }

  const term = filter.trim().toLocaleLowerCase('pt-BR');
  const visible = queries.filter((query) => !term || `${query.name} ${query.description ?? ''}`.toLocaleLowerCase('pt-BR').includes(term));
  const active = queries.find((query) => query.id === activeId);
  const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : 'SEU_PROJECT_REF';
  const columns = result ? Array.from(new Set(result.rows.slice(0, 200).flatMap((row) => Object.keys(row ?? {})))) : [];
  const shownRows = result ? result.rows.slice(0, 500) : [];

  if (setup) {
    return (
      <section className="panel data-panel">
        <PanelHeading eyebrow="BANCO DE DADOS" title="Consultas salvas" />
        <div className="admin-setup">
          <span className="admin-setup-icon"><Icon name="database" size={22} /></span>
          <div>
            <b>{setup === 'missing' ? 'Falta publicar a função de consultas no Supabase' : 'Falta configurar o token de acesso do Supabase'}</b>
            <p>
              As consultas salvas no SQL Editor ficam na plataforma do Supabase, não no banco. Para listá-las e executá-las com
              segurança, o painel usa a Edge Function <code>{queriesFunctionName}</code> com um token pessoal guardado como segredo
              (ele nunca chega ao navegador). Gere o token em <code>supabase.com/dashboard/account/tokens</code> e rode na pasta do projeto:
            </p>
            {setupMessage && <p className="setup-detail">{setupMessage}</p>}
            <pre>{`npx supabase login\nnpx supabase secrets set CONSULTAS_ACCESS_TOKEN=sbp_SEU_TOKEN --project-ref ${projectRef}\nnpx supabase functions deploy ${queriesFunctionName} --project-ref ${projectRef}`}</pre>
            <button className="primary-button" type="button" onClick={() => void load()}><Icon name="refresh" size={16} /> Tentar novamente</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="queries-layout">
      <section className="panel queries-list">
        <PanelHeading
          eyebrow="SQL EDITOR"
          title="Consultas salvas"
          action={<button className="icon-button" type="button" title="Atualizar lista" aria-label="Atualizar lista" onClick={() => void load()} disabled={loading}><Icon name="refresh" size={16} /></button>}
        />
        <label className="list-search">
          <Icon name="search" size={17} />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filtrar consultas…" aria-label="Filtrar consultas" />
        </label>
        <button className={`query-item new ${activeId === 'new' ? 'active' : ''}`} type="button" onClick={newQuery}>
          <Icon name="plus" size={17} /><span><b>Nova consulta</b><small>Escreva um SQL avulso</small></span>
        </button>
        {listError && <InlineNotice>{listError}</InlineNotice>}
        {loading ? (
          <div className="cascade-loading"><span className="spinner" /> Carregando consultas…</div>
        ) : visible.length ? (
          <div className="query-items">
            {visible.map((query) => (
              <button key={query.id} type="button" className={`query-item ${activeId === query.id ? 'active' : ''}`} onClick={() => void openQuery(query)}>
                <span className="query-icon">SQL</span>
                <span>
                  <b>{query.name}</b>
                  <small>{query.description || `${visibilityLabels[query.visibility] ?? query.visibility} · ${relativeTime(query.updated_at)}`}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState title="Nenhuma consulta encontrada" description={term ? 'Ajuste o filtro.' : 'Salve consultas no SQL Editor do Supabase para vê-las aqui.'} />
        )}
      </section>

      <section className="panel queries-editor">
        {activeId ? (
          <>
            <PanelHeading
              eyebrow={active ? `${visibilityLabels[active.visibility] ?? active.visibility}${active.owner?.username ? ` · ${active.owner.username}` : ''}` : 'CONSULTA AVULSA'}
              title={active?.name ?? 'Nova consulta'}
              action={
                <div className="admin-heading-actions">
                  <button className="secondary-button" type="button" onClick={() => void copySql()} disabled={!sql}><Icon name="copy" size={15} /> Copiar</button>
                  {active && sql !== original && <button className="secondary-button" type="button" onClick={() => setSql(original)}>Desfazer edição</button>}
                  <button className="primary-button" type="button" onClick={() => void run()} disabled={running || loadingSql || !sql.trim()}>
                    <Icon name="play" size={15} /> {running ? 'Executando…' : 'Executar'}
                  </button>
                </div>
              }
            />
            {active?.description && <p className="modal-intro">{active.description}</p>}
            {loadingSql ? (
              <div className="cascade-loading"><span className="spinner" /> Carregando SQL…</div>
            ) : (
              <textarea
                className="sql-editor"
                spellCheck={false}
                value={sql}
                onChange={(event) => setSql(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault();
                    void run();
                  }
                }}
                placeholder="select * from public.usuarios limit 20;"
                aria-label="SQL da consulta"
              />
            )}
            <p className="helper-text">Ctrl + Enter executa. As edições aqui não alteram a consulta salva no Supabase. Comandos que alteram dados pedem confirmação.</p>
            {runError && <div className="auth-error" role="alert">{runError}</div>}
            {result && (
              <div className="query-result">
                <div className="query-result-head">
                  <b>{result.rows.length ? `${result.rows.length} linha(s)` : 'Executada sem linhas de retorno'}</b>
                  <span>{result.ms} ms{result.rows.length > shownRows.length ? ` · exibindo as primeiras ${shownRows.length}` : ''}</span>
                </div>
                {result.rows.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
                      <tbody>
                        {shownRows.map((row, index) => (
                          <tr key={index}>
                            {columns.map((column) => {
                              const value = row?.[column];
                              return <td key={column} className={value === null || value === undefined ? 'null-cell' : ''}>{value === null || value === undefined ? 'NULL' : typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : result.raw ? <pre className="query-raw">{JSON.stringify(result.raw, null, 2)}</pre> : null}
              </div>
            )}
          </>
        ) : (
          <EmptyState title="Escolha uma consulta" description="Selecione uma consulta salva à esquerda para ver o SQL e executá-la, ou crie uma consulta avulsa." />
        )}
      </section>
    </div>
  );
}

export default App;
