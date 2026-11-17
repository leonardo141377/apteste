/**
 * Modelo de domínio do HA Automation Builder.
 * Hierarquia: Cliente → Instalação → Ambiente → Dispositivo → Entidade.
 *
 * Os tipos são independentes do armazenamento (Wix Data, backend próprio etc.).
 * Relações são feitas por ID para permitir persistência em coleções separadas.
 * Este arquivo não faz nenhuma chamada de rede.
 */

export type Id = string;
/** Data/hora em ISO 8601 (UTC). */
export type IsoDateTime = string;

/** Campos comuns a todos os registros, usados para auditoria e versionamento. */
export interface BaseRecord {
  id: Id;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  createdBy: Id;
  updatedBy: Id;
  /** Incrementado a cada alteração; base para controle de concorrência e histórico. */
  revision: number;
  tags: string[];
  notes?: string;
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export type ClientStatus = 'prospect' | 'active' | 'paused' | 'closed';

export interface Contact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Client extends BaseRecord {
  name: string;
  /** CPF ou CNPJ, opcional. */
  document?: string;
  status: ClientStatus;
  contacts: Contact[];
  priority: Priority;
}

// ---------------------------------------------------------------------------
// Instalação (um Home Assistant por instalação)
// ---------------------------------------------------------------------------

export type DeploymentStageStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

export interface DeploymentStage {
  id: Id;
  title: string;
  status: DeploymentStageStatus;
  order: number;
  dueDate?: IsoDateTime;
  completedAt?: IsoDateTime;
  /** Pendências relacionadas a esta etapa, visíveis ao cliente. */
  pendingItems: string[];
}

export type ConnectionStatus = 'not_configured' | 'online' | 'offline' | 'auth_error' | 'unknown';

export interface HomeAssistantServer {
  /** URL base, ex.: https://casa-cliente.duckdns.org:8123 */
  baseUrl: string;
  haVersion?: string;
  connectionStatus: ConnectionStatus;
  lastSyncAt?: IsoDateTime;
  /**
   * Referência ao token de acesso guardado no cofre do backend/conector.
   * O token NUNCA é armazenado neste registro nem enviado ao navegador.
   */
  credentialRef?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Installation extends BaseRecord {
  clientId: Id;
  name: string;
  address?: Address;
  server: HomeAssistantServer;
  deploymentStages: DeploymentStage[];
  priority: Priority;
}

// ---------------------------------------------------------------------------
// Ambiente (área do Home Assistant)
// ---------------------------------------------------------------------------

export interface Area extends BaseRecord {
  installationId: Id;
  name: string;
  floor?: string;
  /** area_id no Home Assistant, quando sincronizado. */
  haAreaId?: string;
}

// ---------------------------------------------------------------------------
// Dispositivo
// ---------------------------------------------------------------------------

export type Protocol =
  | 'zigbee'
  | 'zwave'
  | 'wifi'
  | 'matter'
  | 'thread'
  | 'bluetooth'
  | 'ethernet'
  | 'rf433'
  | 'infrared'
  | 'cloud'
  | 'other';

export interface Device extends BaseRecord {
  installationId: Id;
  areaId?: Id;
  name: string;
  manufacturer?: string;
  model?: string;
  protocol: Protocol;
  firmwareVersion?: string;
  /** device_id no Home Assistant, quando sincronizado. */
  haDeviceId?: string;
  /** Integração do HA responsável, ex.: "zha", "mqtt", "tuya". */
  integration?: string;
  ipAddress?: string;
  macAddress?: string;
  /** IDs de anexos (manuais, imagens, cópias de configuração). */
  attachmentIds: Id[];
}

// ---------------------------------------------------------------------------
// Entidade
// ---------------------------------------------------------------------------

/** Domínio da entidade no HA (parte antes do ponto em entity_id). */
export type EntityDomain =
  | 'light'
  | 'switch'
  | 'sensor'
  | 'binary_sensor'
  | 'climate'
  | 'cover'
  | 'fan'
  | 'lock'
  | 'media_player'
  | 'camera'
  | 'alarm_control_panel'
  | 'button'
  | 'number'
  | 'select'
  | 'input_boolean'
  | 'input_number'
  | 'input_select'
  | 'scene'
  | 'script'
  | 'automation'
  | (string & {});

export interface Entity extends BaseRecord {
  installationId: Id;
  deviceId?: Id;
  /** Pode diferir da área do dispositivo, como no HA. */
  areaId?: Id;
  /** entity_id no HA, ex.: "light.sala_teto". */
  entityId: string;
  domain: EntityDomain;
  friendlyName?: string;
  /** device_class do HA, ex.: "motion", "temperature". */
  deviceClass?: string;
  unitOfMeasurement?: string;
  /** Bitmask supported_features do HA; usado para montar formulários dinâmicos. */
  supportedFeatures?: number;
  /** Atributos relevantes da última sincronização (ex.: lista de modos, faixa de valores). */
  capabilities?: Record<string, unknown>;
  disabled: boolean;
  lastSeenState?: string;
  lastSyncAt?: IsoDateTime;
}

// ---------------------------------------------------------------------------
// Anexos
// ---------------------------------------------------------------------------

export type AttachmentKind = 'manual' | 'image' | 'network_map' | 'config_backup' | 'document' | 'other';

export interface Attachment extends BaseRecord {
  installationId: Id;
  kind: AttachmentKind;
  title: string;
  fileUrl: string;
  mimeType?: string;
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/** Extrai o domínio de um entity_id ("light.sala" → "light"). Retorna undefined se inválido. */
export function domainOf(entityId: string): EntityDomain | undefined {
  const match = /^([a-z0-9_]+)\.[a-z0-9_]+$/.exec(entityId);
  return match?.[1];
}
