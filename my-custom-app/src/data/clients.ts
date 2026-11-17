import { items } from '@wix/data';
import type { Client, ClientStatus, Contact, Priority } from '../domain/model';

/** IDs completos das coleções do app: <namespace>/<idSuffix>. */
export const COLLECTIONS = {
  clients: '@classimin/app-ha/clients',
  installations: '@classimin/app-ha/installations',
  areas: '@classimin/app-ha/areas',
  devices: '@classimin/app-ha/devices',
  entities: '@classimin/app-ha/entities',
  attachments: '@classimin/app-ha/attachments',
} as const;

/** Dados editáveis no formulário de cliente. */
export interface ClientInput {
  name: string;
  document?: string;
  status: ClientStatus;
  priority: Priority;
  contacts: Contact[];
  notes?: string;
}

/** Converte um item do Wix Data para o modelo de domínio. */
function toClient(item: Record<string, any>): Client {
  return {
    id: item._id,
    createdAt: item._createdDate ? new Date(item._createdDate).toISOString() : '',
    updatedAt: item._updatedDate ? new Date(item._updatedDate).toISOString() : '',
    createdBy: item.createdBy ?? item._owner ?? '',
    updatedBy: item.updatedBy ?? '',
    revision: item.revision ?? 0,
    tags: item.tags ?? [],
    notes: item.notes,
    name: item.name ?? '',
    document: item.document,
    status: item.status ?? 'prospect',
    priority: item.priority ?? 'medium',
    contacts: item.contacts ?? [],
  };
}

export async function listClients(): Promise<Client[]> {
  const result = await items.query(COLLECTIONS.clients).ascending('name').limit(1000).find();
  return result.items.map(toClient);
}

export async function createClient(input: ClientInput): Promise<Client> {
  const item = await items.insert(COLLECTIONS.clients, { ...input, revision: 1, tags: [] });
  return toClient(item);
}

export async function updateClient(current: Client, input: ClientInput): Promise<Client> {
  const item = await items.update(COLLECTIONS.clients, {
    _id: current.id,
    ...input,
    tags: current.tags,
    createdBy: current.createdBy,
    revision: current.revision + 1,
  });
  return toClient(item);
}

export async function removeClient(id: string): Promise<void> {
  await items.remove(COLLECTIONS.clients, id);
}
