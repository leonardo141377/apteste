import type {
  ClientStatus,
  ConnectionStatus,
  DeploymentStageStatus,
  Priority,
  Protocol,
} from './model';

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

export const PRIORITY_SKIN: Record<Priority, Skin> = {
  low: 'neutralLight',
  medium: 'standard',
  high: 'warning',
  critical: 'danger',
};
