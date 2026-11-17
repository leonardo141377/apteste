import { Badge, Text } from '@wix/design-system';
import type { Values } from '../../../../data/repository';
import { areasRepo, devicesRepo, entitiesRepo, installationsRepo } from '../../../../data/repositories';
import {
  AREA_TYPE,
  CLIENT_STATUS,
  CLIENT_STATUS_SKIN,
  CLIENT_TYPE,
  CONNECTION_STATUS,
  CONNECTION_STATUS_SKIN,
  DEVICE_STATUS,
  DEVICE_STATUS_SKIN,
  HA_INSTALL_METHOD,
  POWER_SOURCE,
  PRIORITY,
  PRIORITY_SKIN,
  PROPERTY_TYPE,
  PROTOCOL,
  REMOTE_ACCESS,
  SUPPORT_PLAN,
  toOptions,
  type Option,
} from '../../../../domain/labels';
import { domainOf, type Area, type Client, type Contact, type Device, type Entity, type Installation } from '../../../../domain/model';
import type { FieldDef } from '../../../../ui/RecordFormModal';
import type { Column } from '../../../../ui/RecordSection';

/*
 * Por enquanto nenhum campo é obrigatório nem validado, exceto o entity_id
 * (identificador da entidade no Home Assistant). Validações serão definidas depois.
 */

const NO_NAME = '(sem nome)';
const nameOf = (r: { name?: string }) => r.name || NO_NAME;

const priorityBadge = (p: keyof typeof PRIORITY) => (
  <Badge size="small" skin={PRIORITY_SKIN[p]}>
    {PRIORITY[p]}
  </Badge>
);

const lookup = (options: Option[], id?: string) => options.find((o) => o.id === id)?.value ?? '—';

/** Campos de endereço sob um prefixo ("address", "billingAddress"). */
const addressFields = (prefix: string, section: string): FieldDef[] => [
  { key: `${prefix}.postalCode`, label: 'CEP', half: true, section },
  { key: `${prefix}.street`, label: 'Logradouro' },
  { key: `${prefix}.number`, label: 'Número', half: true },
  { key: `${prefix}.complement`, label: 'Complemento', half: true },
  { key: `${prefix}.district`, label: 'Bairro', half: true },
  { key: `${prefix}.city`, label: 'Cidade', half: true },
  { key: `${prefix}.state`, label: 'Estado (UF)', half: true },
  { key: `${prefix}.country`, label: 'País', half: true },
];

const contactFields = (prefix: string, section: string): FieldDef[] => [
  { key: `${prefix}.name`, label: 'Nome', half: true, section },
  { key: `${prefix}.role`, label: 'Função / relação', half: true, placeholder: 'Proprietário, síndico, governanta…' },
  { key: `${prefix}.email`, label: 'E-mail', type: 'email', half: true },
  { key: `${prefix}.phone`, label: 'Telefone / WhatsApp', half: true },
];

const tagsField: FieldDef = { key: 'tags', label: 'Etiquetas', type: 'lines', placeholder: 'Uma etiqueta por linha' };
const notesField: FieldDef = { key: 'notes', label: 'Observações', type: 'textarea' };

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export const clientFields: FieldDef[] = [
  { key: 'name', label: 'Nome / razão social', section: 'Identificação' },
  { key: 'clientType', label: 'Tipo', type: 'select', options: toOptions(CLIENT_TYPE), half: true },
  { key: 'tradeName', label: 'Nome fantasia', half: true },
  { key: 'document', label: 'CPF/CNPJ', half: true },
  { key: 'stateRegistration', label: 'Inscrição estadual', half: true },
  { key: 'status', label: 'Status', type: 'select', options: toOptions(CLIENT_STATUS), half: true },
  { key: 'priority', label: 'Prioridade', type: 'select', options: toOptions(PRIORITY), half: true },
  ...contactFields('contacts.0', 'Contato principal'),
  ...contactFields('contacts.1', 'Contato secundário'),
  ...addressFields('billingAddress', 'Endereço de cobrança'),
  { key: 'contractNumber', label: 'Nº do contrato', half: true, section: 'Contrato e atendimento' },
  { key: 'supportPlan', label: 'Plano de suporte', type: 'select', options: toOptions(SUPPORT_PLAN), half: true },
  { key: 'contractStart', label: 'Início do contrato', type: 'date', half: true },
  { key: 'contractEnd', label: 'Fim do contrato', type: 'date', half: true },
  { key: 'technicalResponsible', label: 'Responsável técnico', half: true },
  { key: 'source', label: 'Origem', half: true, placeholder: 'Indicação, site, parceiro…' },
  tagsField,
  notesField,
];

export const clientNewValues: Values = { status: 'prospect', priority: 'medium', contacts: [] };

const hasContactData = (c?: Contact) => !!c && !!(c.name || c.email || c.phone || c.role);

/** Remove contatos vazios. */
export const prepareClient = (values: Values): Values => ({
  ...values,
  contacts: ((values.contacts as Contact[]) ?? []).filter(hasContactData),
});

export const clientColumns: Column<Client>[] = [
  { title: 'Nome', render: (c) => <Text>{nameOf(c)}</Text> },
  { title: 'Contato', render: (c) => <Text secondary>{c.contacts[0]?.name || c.contacts[0]?.phone || c.contacts[0]?.email || '—'}</Text> },
  { title: 'Cidade', render: (c) => <Text secondary>{c.billingAddress?.city || '—'}</Text> },
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
  [c.name, c.tradeName, c.document, c.billingAddress?.city, ...c.tags, ...c.contacts.flatMap((ct) => [ct.name, ct.email, ct.phone])]
    .filter(Boolean)
    .join(' ');

export const clientDisplayName = nameOf;

export async function checkDeleteClient(c: Client): Promise<string | null> {
  const n = await installationsRepo.count({ clientId: c.id });
  return n ? `Exclua antes as ${n} instalação(ões) deste cliente.` : null;
}

// ---------------------------------------------------------------------------
// Instalação
// ---------------------------------------------------------------------------

export const installationFields: FieldDef[] = [
  { key: 'name', label: 'Nome da instalação', placeholder: 'Ex.: Residência Centro', section: 'Identificação' },
  { key: 'propertyType', label: 'Tipo de imóvel', type: 'select', options: toOptions(PROPERTY_TYPE), half: true },
  { key: 'priority', label: 'Prioridade', type: 'select', options: toOptions(PRIORITY), half: true },
  { key: 'technicalResponsible', label: 'Responsável técnico', half: true },
  { key: 'installedAt', label: 'Data de instalação', type: 'date', half: true },
  { key: 'warrantyUntil', label: 'Garantia até', type: 'date', half: true },
  ...addressFields('address', 'Endereço da instalação'),
  { key: 'accessInstructions', label: 'Instruções de acesso', type: 'textarea', placeholder: 'Portaria, chaves, horários permitidos…' },
  ...contactFields('onSiteContact', 'Contato no local'),
  { key: 'server.baseUrl', label: 'URL externa', placeholder: 'https://casa.exemplo.com:8123', section: 'Servidor Home Assistant' },
  { key: 'server.localUrl', label: 'URL local', placeholder: 'http://192.168.1.10:8123' },
  { key: 'server.installMethod', label: 'Tipo de instalação', type: 'select', options: toOptions(HA_INSTALL_METHOD), half: true },
  { key: 'server.hardware', label: 'Hardware', half: true, placeholder: 'Green, Yellow, Raspberry Pi 5, NUC, VM…' },
  { key: 'server.haVersion', label: 'Versão do HA', half: true, placeholder: '2026.11.1' },
  { key: 'server.remoteAccess', label: 'Acesso remoto', type: 'select', options: toOptions(REMOTE_ACCESS), half: true },
  { key: 'backupLocation', label: 'Local do backup', half: true, placeholder: 'Google Drive, NAS, pendrive…' },
  { key: 'lastBackupAt', label: 'Último backup', type: 'date', half: true },
  { key: 'network.isp', label: 'Provedor de internet', half: true, section: 'Rede' },
  { key: 'network.internetPlan', label: 'Plano de internet', half: true },
  { key: 'network.routerModel', label: 'Roteador principal', half: true },
  { key: 'network.gatewayIp', label: 'IP do gateway', half: true, placeholder: '192.168.1.1' },
  { key: 'network.subnet', label: 'Faixa de rede', half: true, placeholder: '192.168.1.0/24' },
  { key: 'network.wifiSsids', label: 'Redes Wi-Fi (SSID)', type: 'lines', placeholder: 'Uma rede por linha — não informe senhas' },
  { key: 'network.zigbeeCoordinator', label: 'Coordenador Zigbee', half: true, placeholder: 'SONOFF ZBDongle-E, SLZB-06…' },
  { key: 'network.zwaveController', label: 'Controlador Z-Wave', half: true },
  { key: 'network.threadBorderRouter', label: 'Border router Thread/Matter', half: true },
  tagsField,
  notesField,
];

export const installationColumns: Column<Installation>[] = [
  { title: 'Nome', render: (i) => <Text>{nameOf(i)}</Text> },
  { title: 'Tipo', render: (i) => <Text secondary>{i.propertyType ? PROPERTY_TYPE[i.propertyType] : '—'}</Text> },
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
  [i.name, i.address?.city, i.address?.district, i.address?.street, i.server.baseUrl, ...i.tags].filter(Boolean).join(' ');

export const installationDisplayName = nameOf;

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
  { key: 'name', label: 'Nome', placeholder: 'Ex.: Sala de estar' },
  { key: 'areaType', label: 'Tipo', type: 'select', options: toOptions(AREA_TYPE), half: true },
  { key: 'floor', label: 'Andar / pavimento', half: true },
  { key: 'haAreaId', label: 'area_id no Home Assistant', placeholder: 'sala_de_estar' },
  tagsField,
  notesField,
];

export const areaColumns: Column<Area>[] = [
  { title: 'Nome', render: (a) => <Text>{nameOf(a)}</Text> },
  { title: 'Tipo', render: (a) => <Text secondary>{a.areaType ? AREA_TYPE[a.areaType] : '—'}</Text> },
  { title: 'Andar', render: (a) => <Text secondary>{a.floor || '—'}</Text> },
  { title: 'area_id (HA)', render: (a) => <Text secondary>{a.haAreaId || '—'}</Text> },
];

export const areaSearch = (a: Area) =>
  [a.name, a.floor, a.haAreaId, a.areaType && AREA_TYPE[a.areaType], ...a.tags].filter(Boolean).join(' ');

export const areaDisplayName = nameOf;

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

export const deviceFields = (areas: Option[], devices: Option[]): FieldDef[] => [
  { key: 'name', label: 'Nome', placeholder: 'Ex.: Interruptor sala 2 teclas', section: 'Identificação' },
  { key: 'category', label: 'Categoria', half: true, placeholder: 'Interruptor, sensor, fechadura…' },
  { key: 'status', label: 'Situação', type: 'select', options: toOptions(DEVICE_STATUS), half: true },
  { key: 'areaId', label: 'Ambiente', type: 'select', options: areas, half: true },
  { key: 'location', label: 'Localização exata', half: true, placeholder: 'Parede ao lado da porta' },
  { key: 'manufacturer', label: 'Fabricante', half: true, section: 'Fabricação' },
  { key: 'model', label: 'Modelo', half: true },
  { key: 'serialNumber', label: 'Nº de série', half: true },
  { key: 'hardwareVersion', label: 'Versão de hardware', half: true },
  { key: 'firmwareVersion', label: 'Firmware', half: true },
  { key: 'protocol', label: 'Protocolo', type: 'select', options: toOptions(PROTOCOL), half: true, section: 'Conectividade e energia' },
  { key: 'parentDeviceId', label: 'Gateway / dispositivo pai', type: 'select', options: devices, half: true },
  { key: 'powerSource', label: 'Alimentação', type: 'select', options: toOptions(POWER_SOURCE), half: true },
  { key: 'batteryType', label: 'Tipo de bateria', half: true, placeholder: 'CR2032, AAA…' },
  { key: 'ipAddress', label: 'IP', half: true },
  { key: 'macAddress', label: 'MAC / IEEE', half: true },
  { key: 'wifiSsid', label: 'Rede Wi-Fi', half: true },
  { key: 'integration', label: 'Integração no HA', half: true, placeholder: 'zha, mqtt, tuya, matter…', section: 'Home Assistant' },
  { key: 'haDeviceId', label: 'device_id no HA', half: true },
  { key: 'supplier', label: 'Fornecedor', half: true, section: 'Compra e garantia' },
  { key: 'purchaseDate', label: 'Data de compra', type: 'date', half: true },
  { key: 'installedAt', label: 'Data de instalação', type: 'date', half: true },
  { key: 'warrantyUntil', label: 'Garantia até', type: 'date', half: true },
  tagsField,
  notesField,
];

export const deviceNewValues: Values = { protocol: 'zigbee', status: 'planned', attachmentIds: [] };

export const deviceColumns = (areas: Option[]): Column<Device>[] => [
  { title: 'Nome', render: (d) => <Text>{nameOf(d)}</Text> },
  { title: 'Ambiente', render: (d) => <Text secondary>{lookup(areas, d.areaId)}</Text> },
  { title: 'Protocolo', render: (d) => <Text secondary>{PROTOCOL[d.protocol]}</Text> },
  { title: 'Fabricante / modelo', render: (d) => <Text secondary>{[d.manufacturer, d.model].filter(Boolean).join(' · ') || '—'}</Text> },
  {
    title: 'Situação',
    render: (d) =>
      d.status ? (
        <Badge size="small" skin={DEVICE_STATUS_SKIN[d.status]}>
          {DEVICE_STATUS[d.status]}
        </Badge>
      ) : (
        <Text secondary>—</Text>
      ),
  },
];

export const deviceSearch = (d: Device) =>
  [d.name, d.category, d.manufacturer, d.model, d.serialNumber, d.integration, d.ipAddress, d.macAddress, d.location, PROTOCOL[d.protocol], ...d.tags]
    .filter(Boolean)
    .join(' ');

export const deviceDisplayName = nameOf;

export async function checkDeleteDevice(d: Device): Promise<string | null> {
  const [entities, children] = await Promise.all([
    entitiesRepo.count({ deviceId: d.id }),
    devicesRepo.count({ parentDeviceId: d.id }),
  ]);
  if (entities) return `Este dispositivo tem ${entities} entidade(s) vinculada(s). Exclua ou desvincule-as antes.`;
  if (children) return `Este dispositivo é gateway de ${children} outro(s). Altere-os antes de excluir.`;
  return null;
}

// ---------------------------------------------------------------------------
// Entidade
// ---------------------------------------------------------------------------

export const entityFields = (areas: Option[], devices: Option[]): FieldDef[] => [
  // Obrigatório: é o identificador da entidade no HA e é único por instalação.
  { key: 'entityId', label: 'entity_id', required: true, placeholder: 'light.sala_teto' },
  { key: 'friendlyName', label: 'Nome amigável' },
  { key: 'purpose', label: 'Função', placeholder: 'Luz principal da sala, presença do corredor…' },
  { key: 'deviceId', label: 'Dispositivo', type: 'select', options: devices, half: true },
  { key: 'areaId', label: 'Ambiente', type: 'select', options: areas, half: true },
  { key: 'deviceClass', label: 'device_class', half: true, placeholder: 'motion, temperature…' },
  { key: 'unitOfMeasurement', label: 'Unidade', half: true, placeholder: '°C, %, W…' },
  { key: 'icon', label: 'Ícone', half: true, placeholder: 'mdi:lightbulb' },
  { key: 'supportedFeatures', label: 'supported_features', type: 'number', half: true },
  { key: 'disabled', label: 'Desativada', type: 'boolean', half: true },
  { key: 'hidden', label: 'Oculta', type: 'boolean', half: true },
  tagsField,
  notesField,
];

/** Deriva o domínio do entity_id e normaliza para minúsculas. */
export const prepareEntity = (values: Values): Values => {
  const entityId = String(values.entityId ?? '').trim().toLowerCase();
  return { ...values, entityId, domain: domainOf(entityId) ?? entityId.split('.')[0] ?? '' };
};

export const entityColumns = (areas: Option[], devices: Option[]): Column<Entity>[] => [
  { title: 'entity_id', render: (e) => <Text>{e.entityId}</Text> },
  { title: 'Nome', render: (e) => <Text secondary>{e.friendlyName || '—'}</Text> },
  { title: 'Domínio', render: (e) => <Badge size="small" skin="neutralLight">{e.domain || '—'}</Badge> },
  { title: 'Dispositivo', render: (e) => <Text secondary>{lookup(devices, e.deviceId)}</Text> },
  { title: 'Ambiente', render: (e) => <Text secondary>{lookup(areas, e.areaId)}</Text> },
];

export const entitySearch = (e: Entity) =>
  [e.entityId, e.friendlyName, e.purpose, e.deviceClass, e.domain, ...e.tags].filter(Boolean).join(' ');
