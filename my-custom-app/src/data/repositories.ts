import type { Area, Attachment, Client, DeploymentStage, Device, Entity, Installation } from '../domain/model';
import { createRepository } from './repository';

/** IDs completos das coleções do app: <namespace>/<idSuffix>. */
export const COLLECTIONS = {
  clients: '@classimin/app-ha/clients',
  installations: '@classimin/app-ha/installations',
  areas: '@classimin/app-ha/areas',
  devices: '@classimin/app-ha/devices',
  entities: '@classimin/app-ha/entities',
  attachments: '@classimin/app-ha/attachments',
} as const;

/** Etapas padrão criadas junto com cada nova instalação. */
export const DEFAULT_STAGE_TITLES = [
  'Levantamento e projeto',
  'Infraestrutura de rede',
  'Instalação dos dispositivos',
  'Configuração do Home Assistant',
  'Automações e cenas',
  'Testes e ajustes',
  'Entrega e treinamento',
];

export function newStage(title: string, order: number): DeploymentStage {
  return { id: crypto.randomUUID(), title, status: 'pending', order, pendingItems: [] };
}

export const clientsRepo = createRepository<Client>(COLLECTIONS.clients, () => ({
  name: '',
  status: 'prospect',
  priority: 'medium',
  contacts: [],
}));

export const installationsRepo = createRepository<Installation>(COLLECTIONS.installations, () => ({
  clientId: '',
  name: '',
  priority: 'medium',
  server: { baseUrl: '', connectionStatus: 'not_configured' },
  deploymentStages: [],
}));

export const areasRepo = createRepository<Area>(COLLECTIONS.areas, () => ({
  installationId: '',
  name: '',
}));

export const devicesRepo = createRepository<Device>(COLLECTIONS.devices, () => ({
  installationId: '',
  name: '',
  protocol: 'other',
  attachmentIds: [],
}));

export const entitiesRepo = createRepository<Entity>(
  COLLECTIONS.entities,
  () => ({ installationId: '', entityId: '', domain: '', disabled: false }),
  'entityId',
);

export const attachmentsRepo = createRepository<Attachment>(
  COLLECTIONS.attachments,
  () => ({ installationId: '', kind: 'other', title: '', fileUrl: '' }),
  'title',
);
