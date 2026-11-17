import { Badge, Text } from '@wix/design-system';
import type { Values } from '../../../../data/repository';
import { areasRepo, devicesRepo, entitiesRepo, installationsRepo } from '../../../../data/repositories';
import {
  CLIENT_STATUS,
  CLIENT_STATUS_SKIN,
  CONNECTION_STATUS,
  CONNECTION_STATUS_SKIN,
  PRIORITY,
  PRIORITY_SKIN,
  PROTOCOL,
  toOptions,
  type Option,
} from '../../../../domain/labels';
import { domainOf, type Area, type Client, type Contact, type Device, type Entity, type Installation } from '../../../../domain/model';
import type { FieldDef } from '../../../../ui/RecordFormModal';
import type { Column } from '../../../../ui/RecordSection';

// ---------------------------------------------------------------------------
// Validações
// ---------------------------------------------------------------------------

const EMAIL = { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'E-mail inválido.' };
const URL_HA = { regex: /^https?:\/\/[^\s]+$/i, message: 'Use http:// ou https://, ex.: https://casa.exemplo.com:8123' };
const IPV4 = { regex: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IPv4 inválido, ex.: 192.168.1.50' };
const MAC = { regex: /^([0-9a-f]{2}[:-]){5}[0-9a-f]{2}$/i, message: 'MAC inválido, ex.: AA:BB:CC:DD:EE:FF' };
const ENTITY_ID = { regex: /^[a-z0-9_]+\.[a-z0-9_]+$/, message: 'Formato dominio.nome, ex.: light.sala_teto' };
const HA_ID = { regex: /^[a-z0-9_]+$/, message: 'Use letras minúsculas, números e _.' };

const priorityBadge = (p: keyof typeof PRIORITY) => (
  <Badge size="small" skin={PRIORITY_SKIN[p]}>
    {PRIORITY[p]}
  </Badge>
);

const lookup = (options: Option[], id?: string) => options.find((o) => o.id === id)?.value ?? '—';

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export const clientFields: FieldDef[] = [
  { key: 'name', label: 'Nome', required: true },
  { key: 'document', label: 'CPF/CNPJ' },
  { key: 'status', label: 'Status', type: 'select', options: toOptions(CLIENT_STATUS), required: true, half: true },
  { key: 'priority', label: 'Prioridade', type: 'select', options: toOptions(PRIORITY), required: true, half: true },
  { key: 'contacts.0.name', label: 'Nome', section: 'Contato principal' },
  { key: 'contacts.0.email', label: 'E-mail', type: 'email', pattern: EMAIL, half: true },
  { key: 'contacts.0.phone', label: 'Telefone', half: true },
  { key: 'notes', label: 'Observações', type: 'textarea' },
];

export const clientNewValues: Values = { status: 'prospect', priority: 'medium', contacts: [] };

/** Remove contatos vazios. */
export const prepareClient = (values: Values): Values => ({
  ...values,
  contacts: ((values.contacts as Contact[]) ?? []).filter((c) => c && (c.name || c.email || c.phone)),
});

export const clientColumns: Column<Client>[] = [
  { title: 'Nome', render: (c) => <Text>{c.name}</Text> },
  { title: 'Contato', render: (c) => <Text secondary>{c.contacts[0]?.name || c.contacts[0]?.email || '—'}</Text> },
  {
    title: 'Status',
    render: (c) => (
      <Badge size="small" skin={CLIENT_STATUS_SKIN[c.status]}>
        {CLIENT_STATUS[c.status]}
      </Badge>
    ),
  },
  { title: 'Prioridade', render: (c) => priorityBadge(c.priority) },
];

export const clientSearch = (c: Client) =>
  [c.name, c.document, ...c.contacts.flatMap((ct) => [ct.name, ct.email, ct.phone])].filter(Boolean).join(' ');

export async function checkDeleteClient(c: Client): Promise<string | null> {
  const n = await installationsRepo.count({ clientId: c.id });
  return n ? `Exclua antes as ${n} instalação(ões) deste cliente.` : null;
}

// ---------------------------------------------------------------------------
// Instalação
// ---------------------------------------------------------------------------

export const installationFields: FieldDef[] = [
  { key: 'name', label: 'Nome da instalação', required: true, placeholder: 'Ex.: Residência Centro' },
  { key: 'priority', label: 'Prioridade', type: 'select', options: toOptions(PRIORITY), required: true, half: true },
  {
    key: 'server.baseUrl',
    label: 'URL do Home Assistant',
    type: 'url',
    pattern: URL_HA,
    placeholder: 'https://casa.exemplo.com:8123',
    section: 'Servidor Home Assistant',
  },
  { key: 'address.street', label: 'Logradouro', section: 'Endereço' },
  { key: 'address.city', label: 'Cidade', half: true },
  { key: 'address.state', label: 'Estado', half: true },
  { key: 'address.postalCode', label: 'CEP', half: true },
  { key: 'address.country', label: 'País', half: true },
  { key: 'notes', label: 'Observações', type: 'textarea' },
];

export const installationColumns: Column<Installation>[] = [
  { title: 'Nome', render: (i) => <Text>{i.name}</Text> },
  { title: 'Cidade', render: (i) => <Text secondary>{i.address?.city || '—'}</Text> },
  {
    title: 'Home Assistant',
    render: (i) => (
      <Badge size="small" skin={CONNECTION_STATUS_SKIN[i.server.connectionStatus]}>
        {CONNECTION_STATUS[i.server.connectionStatus]}
      </Badge>
    ),
  },
  {
    title: 'Implantação',
    render: (i) => {
      const total = i.deploymentStages.length;
      const done = i.deploymentStages.filter((s) => s.status === 'done').length;
      return <Text secondary>{total ? `${Math.round((done / total) * 100)}%` : '—'}</Text>;
    },
  },
  { title: 'Prioridade', render: (i) => priorityBadge(i.priority) },
];

export const installationSearch = (i: Installation) =>
  [i.name, i.address?.city, i.address?.street, i.server.baseUrl].filter(Boolean).join(' ');

export async function checkDeleteInstallation(i: Installation): Promise<string | null> {
  const [areas, devices, entities] = await Promise.all([
    areasRepo.count({ installationId: i.id }),
    devicesRepo.count({ installationId: i.id }),
    entitiesRepo.count({ installationId: i.id }),
  ]);
  return areas || devices || entities
    ? `Exclua antes os registros desta instalação: ${areas} ambiente(s), ${devices} dispositivo(s), ${entities} entidade(s).`
    : null;
}

// ---------------------------------------------------------------------------
// Ambiente
// ---------------------------------------------------------------------------

export const areaFields: FieldDef[] = [
  { key: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Sala de estar' },
  { key: 'floor', label: 'Andar', half: true },
  { key: 'haAreaId', label: 'area_id no Home Assistant', pattern: HA_ID, half: true },
  { key: 'notes', label: 'Observações', type: 'textarea' },
];

export const areaColumns: Column<Area>[] = [
  { title: 'Nome', render: (a) => <Text>{a.name}</Text> },
  { title: 'Andar', render: (a) => <Text secondary>{a.floor || '—'}</Text> },
  { title: 'area_id (HA)', render: (a) => <Text secondary>{a.haAreaId || '—'}</Text> },
];

export const areaSearch = (a: Area) => [a.name, a.floor, a.haAreaId].filter(Boolean).join(' ');

export async function checkDeleteArea(a: Area): Promise<string | null> {
  const [devices, entities] = await Promise.all([
    devicesRepo.count({ areaId: a.id }),
    entitiesRepo.count({ areaId: a.id }),
  ]);
  return devices || entities
    ? `Este ambiente está vinculado a ${devices} dispositivo(s) e ${entities} entidade(s). Altere-os antes de excluir.`
    : null;
}

// ---------------------------------------------------------------------------
// Dispositivo
// ---------------------------------------------------------------------------

export const deviceFields = (areas: Option[]): FieldDef[] => [
  { key: 'name', label: 'Nome', required: true, placeholder: 'Ex.: Interruptor sala 2 teclas' },
  { key: 'areaId', label: 'Ambiente', type: 'select', options: areas, half: true },
  { key: 'protocol', label: 'Protocolo', type: 'select', options: toOptions(PROTOCOL), required: true, half: true },
  { key: 'manufacturer', label: 'Fabricante', half: true },
  { key: 'model', label: 'Modelo', half: true },
  { key: 'integration', label: 'Integração no HA', placeholder: 'zha, mqtt, tuya…', half: true },
  { key: 'firmwareVersion', label: 'Firmware', half: true },
  { key: 'ipAddress', label: 'IP', pattern: IPV4, half: true, section: 'Rede' },
  { key: 'macAddress', label: 'MAC', pattern: MAC, half: true },
  { key: 'haDeviceId', label: 'device_id no Home Assistant' },
  { key: 'notes', label: 'Observações', type: 'textarea' },
];

export const deviceNewValues: Values = { protocol: 'zigbee', attachmentIds: [] };

export const deviceColumns = (areas: Option[]): Column<Device>[] => [
  { title: 'Nome', render: (d) => <Text>{d.name}</Text> },
  { title: 'Ambiente', render: (d) => <Text secondary>{lookup(areas, d.areaId)}</Text> },
  { title: 'Protocolo', render: (d) => <Text secondary>{PROTOCOL[d.protocol]}</Text> },
  { title: 'Fabricante / modelo', render: (d) => <Text secondary>{[d.manufacturer, d.model].filter(Boolean).join(' · ') || '—'}</Text> },
];

export const deviceSearch = (d: Device) =>
  [d.name, d.manufacturer, d.model, d.integration, d.ipAddress, d.macAddress, PROTOCOL[d.protocol]].filter(Boolean).join(' ');

export async function checkDeleteDevice(d: Device): Promise<string | null> {
  const n = await entitiesRepo.count({ deviceId: d.id });
  return n ? `Este dispositivo tem ${n} entidade(s) vinculada(s). Exclua ou desvincule-as antes.` : null;
}

// ---------------------------------------------------------------------------
// Entidade
// ---------------------------------------------------------------------------

export const entityFields = (areas: Option[], devices: Option[]): FieldDef[] => [
  { key: 'entityId', label: 'entity_id', required: true, pattern: ENTITY_ID, placeholder: 'light.sala_teto' },
  { key: 'friendlyName', label: 'Nome amigável' },
  { key: 'deviceId', label: 'Dispositivo', type: 'select', options: devices, half: true },
  { key: 'areaId', label: 'Ambiente', type: 'select', options: areas, half: true },
  { key: 'deviceClass', label: 'device_class', placeholder: 'motion, temperature…', half: true },
  { key: 'unitOfMeasurement', label: 'Unidade', placeholder: '°C, %, W…', half: true },
  { key: 'notes', label: 'Observações', type: 'textarea' },
];

/** Deriva o domínio do entity_id. */
export const prepareEntity = (values: Values): Values => ({
  ...values,
  domain: domainOf(String(values.entityId ?? '')) ?? '',
});

export const entityColumns = (areas: Option[], devices: Option[]): Column<Entity>[] => [
  { title: 'entity_id', render: (e) => <Text>{e.entityId}</Text> },
  { title: 'Nome', render: (e) => <Text secondary>{e.friendlyName || '—'}</Text> },
  { title: 'Domínio', render: (e) => <Badge size="small" skin="neutralLight">{e.domain || '—'}</Badge> },
  { title: 'Dispositivo', render: (e) => <Text secondary>{lookup(devices, e.deviceId)}</Text> },
  { title: 'Ambiente', render: (e) => <Text secondary>{lookup(areas, e.areaId)}</Text> },
];

export const entitySearch = (e: Entity) => [e.entityId, e.friendlyName, e.deviceClass, e.domain].filter(Boolean).join(' ');
