import type {
  AreaType,
  ClientStatus,
  ClientType,
  ConnectionStatus,
  DeploymentStageStatus,
  DeviceStatus,
  HaInstallMethod,
  PowerSource,
  Priority,
  PropertyType,
  Protocol,
  RemoteAccess,
  SupportPlan,
} from './model';

export const CLIENT_TYPE: Record<ClientType, string> = {
  person: 'Pessoa física',
  company: 'Pessoa jurídica',
};

export const SUPPORT_PLAN: Record<SupportPlan, string> = {
  none: 'Sem plano',
  basic: 'Básico',
  standard: 'Padrão',
  premium: 'Premium',
};

export const PROPERTY_TYPE: Record<PropertyType, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  condo_house: 'Casa em condomínio',
  office: 'Escritório',
  commercial: 'Comercial',
  other: 'Outro',
};

export const HA_INSTALL_METHOD: Record<HaInstallMethod, string> = {
  haos: 'Home Assistant OS',
  container: 'Container (Docker)',
  supervised: 'Supervised',
  core: 'Core',
  other: 'Outro',
};

export const REMOTE_ACCESS: Record<RemoteAccess, string> = {
  none: 'Sem acesso remoto',
  nabu_casa: 'Nabu Casa',
  cloudflare_tunnel: 'Cloudflare Tunnel',
  duckdns: 'DuckDNS',
  vpn: 'VPN',
  other: 'Outro',
};

export const AREA_TYPE: Record<AreaType, string> = {
  living: 'Sala',
  bedroom: 'Quarto',
  kitchen: 'Cozinha',
  bathroom: 'Banheiro',
  office: 'Escritório',
  garage: 'Garagem',
  outdoor: 'Área externa',
  service: 'Área de serviço',
  hall: 'Corredor / hall',
  technical: 'Área técnica',
  other: 'Outro',
};

export const POWER_SOURCE: Record<PowerSource, string> = {
  mains: 'Rede elétrica',
  battery: 'Bateria',
  poe: 'PoE',
  usb: 'USB',
  other: 'Outro',
};

export const DEVICE_STATUS: Record<DeviceStatus, string> = {
  planned: 'Planejado',
  installed: 'Instalado',
  attention: 'Atenção',
  fault: 'Com defeito',
  removed: 'Removido',
};

export type Option = { id: string; value: string };

export const toOptions = (labels: Record<string, string>): Option[] =>
  Object.entries(labels).map(([id, value]) => ({ id, value }));

export const CLIENT_STATUS: Record<ClientStatus, string> = {
  prospect: 'Prospecção',
  active: 'Ativo',
  paused: 'Pausado',
  closed: 'Encerrado',
};

export const PRIORITY: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

export const STAGE_STATUS: Record<DeploymentStageStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluída',
  blocked: 'Bloqueada',
};

export const CONNECTION_STATUS: Record<ConnectionStatus, string> = {
  not_configured: 'Não configurado',
  online: 'Online',
  offline: 'Offline',
  auth_error: 'Erro de autenticação',
  unknown: 'Desconhecido',
};

export const PROTOCOL: Record<Protocol, string> = {
  zigbee: 'Zigbee',
  zwave: 'Z-Wave',
  wifi: 'Wi-Fi',
  matter: 'Matter',
  thread: 'Thread',
  bluetooth: 'Bluetooth',
  ethernet: 'Ethernet',
  rf433: 'RF 433 MHz',
  infrared: 'Infravermelho',
  cloud: 'Nuvem',
  other: 'Outro',
};

type Skin = 'general' | 'success' | 'warning' | 'danger' | 'neutralLight' | 'standard';

export const CLIENT_STATUS_SKIN: Record<ClientStatus, Skin> = {
  prospect: 'general',
  active: 'success',
  paused: 'warning',
  closed: 'neutralLight',
};

export const STAGE_STATUS_SKIN: Record<DeploymentStageStatus, Skin> = {
  pending: 'neutralLight',
  in_progress: 'general',
  done: 'success',
  blocked: 'danger',
};

export const CONNECTION_STATUS_SKIN: Record<ConnectionStatus, Skin> = {
  not_configured: 'neutralLight',
  online: 'success',
  offline: 'warning',
  auth_error: 'danger',
  unknown: 'neutralLight',
};

export const DEVICE_STATUS_SKIN: Record<DeviceStatus, Skin> = {
  planned: 'neutralLight',
  installed: 'success',
  attention: 'warning',
  fault: 'danger',
  removed: 'neutralLight',
};

export const PRIORITY_SKIN: Record<Priority, Skin> = {
  low: 'neutralLight',
  medium: 'standard',
  high: 'warning',
  critical: 'danger',
};
