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
/** Data simples no formato AAAA-MM-DD. */
export type IsoDate = string;

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

export interface Address {
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export type ClientStatus = 'prospect' | 'active' | 'paused' | 'closed';
export type ClientType = 'person' | 'company';
export type SupportPlan = 'none' | 'basic' | 'standard' | 'premium';

export interface Contact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Client extends BaseRecord {
  name: string;
  clientType?: ClientType;
  /** Nome fantasia (pessoa jurídica). */
  tradeName?: string;
  /** CPF ou CNPJ. */
  document?: string;
  /** Inscrição estadual. */
  stateRegistration?: string;
  status: ClientStatus;
  priority: Priority;
  /** Contatos; o primeiro é o principal. */
  contacts: Contact[];
  billingAddress?: Address;
  contractNumber?: string;
  contractStart?: IsoDate;
  contractEnd?: IsoDate;
  supportPlan?: SupportPlan;
  /** Responsável técnico da empresa por este cliente. */
  technicalResponsible?: string;
  /** Como o cliente chegou (indicação, site, parceiro…). */
  source?: string;
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
export type HaInstallMethod = 'haos' | 'container' | 'supervised' | 'core' | 'other';
export type RemoteAccess = 'none' | 'nabu_casa' | 'cloudflare_tunnel' | 'duckdns' | 'vpn' | 'other';
export type PropertyType = 'house' | 'apartment' | 'condo_house' | 'office' | 'commercial' | 'other';

export interface HomeAssistantServer {
  /** URL externa, ex.: https://casa-cliente.exemplo.com:8123 */
  baseUrl: string;
  /** URL na rede local, ex.: http://192.168.1.10:8123 */
  localUrl?: string;
  haVersion?: string;
  installMethod?: HaInstallMethod;
  /** Hardware do servidor (Green, Yellow, Raspberry Pi 5, NUC, VM…). */
  hardware?: string;
  remoteAccess?: RemoteAccess;
  connectionStatus: ConnectionStatus;
  lastSyncAt?: IsoDateTime;
  /**
   * Referência ao token de acesso guardado no cofre do backend/conector.
   * O token NUNCA é armazenado neste registro nem enviado ao navegador.
   */
  credentialRef?: string;
}

/** Rede do local. Senhas de Wi-Fi não são guardadas aqui. */
export interface NetworkInfo {
  isp?: string;
  internetPlan?: string;
  routerModel?: string;
  /** Faixa principal, ex.: 192.168.1.0/24 */
  subnet?: string;
  gatewayIp?: string;
  wifiSsids?: string[];
  /** Coordenador Zigbee (ex.: SONOFF ZBDongle-E, SLZB-06). */
  zigbeeCoordinator?: string;
  zwaveController?: string;
  /** Border router Thread/Matter. */
  threadBorderRouter?: string;
}

export interface Installation extends BaseRecord {
  clientId: Id;
  name: string;
  propertyType?: PropertyType;
  address?: Address;
  /** Portaria, chaves, horários permitidos etc. */
  accessInstructions?: string;
  /** Pessoa de contato no local. */
  onSiteContact?: Contact;
  server: HomeAssistantServer;
  network?: NetworkInfo;
  backupLocation?: string;
  lastBackupAt?: IsoDate;
  installedAt?: IsoDate;
  warrantyUntil?: IsoDate;
  technicalResponsible?: string;
  deploymentStages: DeploymentStage[];
  priority: Priority;
}

// ---------------------------------------------------------------------------
// Ambiente (área do Home Assistant)
// ---------------------------------------------------------------------------

export type AreaType =
  | 'living'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'office'
  | 'garage'
  | 'outdoor'
  | 'service'
  | 'hall'
  | 'technical'
  | 'other';

export interface Area extends BaseRecord {
  installationId: Id;
  name: string;
  areaType?: AreaType;
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

export type PowerSource = 'mains' | 'battery' | 'poe' | 'usb' | 'other';
export type DeviceStatus = 'planned' | 'installed' | 'attention' | 'fault' | 'removed';

export interface Device extends BaseRecord {
  installationId: Id;
  areaId?: Id;
  name: string;
  status?: DeviceStatus;
  /** Tipo livre: interruptor, sensor de presença, fechadura… */
  category?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  hardwareVersion?: string;
  firmwareVersion?: string;
  protocol: Protocol;
  powerSource?: PowerSource;
  batteryType?: string;
  /** Dispositivo pai/gateway (hub, ponte, roteador Zigbee). */
  parentDeviceId?: Id;
  /** Localização exata no ambiente. */
  location?: string;
  /** device_id no Home Assistant, quando sincronizado. */
  haDeviceId?: string;
  /** Integração do HA responsável, ex.: "zha", "mqtt", "tuya". */
  integration?: string;
  ipAddress?: string;
  macAddress?: string;
  wifiSsid?: string;
  supplier?: string;
  purchaseDate?: IsoDate;
  installedAt?: IsoDate;
  warrantyUntil?: IsoDate;
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
  /** Função na automação: o que esta entidade representa para o cliente. */
  purpose?: string;
  /** device_class do HA, ex.: "motion", "temperature". */
  deviceClass?: string;
  unitOfMeasurement?: string;
  /** Ícone MDI, ex.: "mdi:lightbulb". */
  icon?: string;
  /** Bitmask supported_features do HA; usado para montar formulários dinâmicos. */
  supportedFeatures?: number;
  /** Atributos relevantes da última sincronização (ex.: lista de modos, faixa de valores). */
  capabilities?: Record<string, unknown>;
  disabled: boolean;
  hidden?: boolean;
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
