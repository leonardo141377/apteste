import { extensions, type DataCollection } from '@wix/custom-extensions';

/**
 * Coleções Wix Data do Admin Geral.
 * Espelham src/domain/model.ts. Os campos nativos do Wix Data (_id, _createdDate,
 * _updatedDate, _owner) correspondem a id, createdAt, updatedAt e criador.
 *
 * Acesso: somente PRIVILEGED (administradores do site/empresa).
 * Tokens do Home Assistant NÃO são guardados aqui — apenas credentialRef.
 * Datas simples (AAAA-MM-DD) são guardadas como texto.
 */

type Field = DataCollection['fields'][number];
type ObjectField = NonNullable<Field['objectOptions']>['fields'][number];

const PRIVILEGED_ONLY: DataCollection['dataPermissions'] = {
  itemRead: 'PRIVILEGED',
  itemInsert: 'PRIVILEGED',
  itemUpdate: 'PRIVILEGED',
  itemRemove: 'PRIVILEGED',
};

const text = (key: string, displayName: string, maxLength = 500): Field => ({
  key,
  displayName,
  type: 'TEXT',
  textOptions: { textValidation: { maxLength } },
});

const enumText = (key: string, displayName: string, values: string[]): Field => ({
  key,
  displayName,
  type: 'TEXT',
  textOptions: { enumValues: { values } },
});

/** ID de outro registro (relação por ID, como em model.ts). */
const ref = (key: string, displayName: string): Field => text(key, displayName, 100);
/** Data AAAA-MM-DD. */
const date = (key: string, displayName: string): Field => text(key, displayName, 10);

const object = (key: string, displayName: string, keys: string[]): Field => ({
  key,
  displayName,
  type: 'OBJECT',
  objectOptions: { fields: keys.map((k): ObjectField => ({ key: k, type: 'TEXT' })) },
});

const ADDRESS_KEYS = ['street', 'number', 'complement', 'district', 'city', 'state', 'postalCode', 'country'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

/** Campos de auditoria/versionamento comuns (BaseRecord). */
const baseFields: Field[] = [
  ref('createdBy', 'Criado por'),
  ref('updatedBy', 'Alterado por'),
  { key: 'revision', displayName: 'Revisão', type: 'NUMBER', numberOptions: { min: 0 } },
  { key: 'tags', displayName: 'Etiquetas', type: 'ARRAY_STRING' },
  { key: 'notes', displayName: 'Observações', type: 'RICH_TEXT' },
];

const byInstallation = { fields: [{ path: 'installationId' }] };

const clients: DataCollection = {
  idSuffix: 'clients',
  displayName: 'Clientes',
  displayField: 'name',
  dataPermissions: PRIVILEGED_ONLY,
  fields: [
    text('name', 'Nome', 200),
    enumText('clientType', 'Tipo', ['person', 'company']),
    text('tradeName', 'Nome fantasia', 200),
    text('document', 'CPF/CNPJ', 20),
    text('stateRegistration', 'Inscrição estadual', 30),
    enumText('status', 'Status', ['prospect', 'active', 'paused', 'closed']),
    enumText('priority', 'Prioridade', PRIORITIES),
    { key: 'contacts', displayName: 'Contatos', type: 'ARRAY_DOCUMENT' },
    object('billingAddress', 'Endereço de cobrança', ADDRESS_KEYS),
    text('contractNumber', 'Nº do contrato', 50),
    date('contractStart', 'Início do contrato'),
    date('contractEnd', 'Fim do contrato'),
    enumText('supportPlan', 'Plano de suporte', ['none', 'basic', 'standard', 'premium']),
    text('technicalResponsible', 'Responsável técnico', 200),
    text('source', 'Origem', 200),
    ...baseFields,
  ],
};

const installations: DataCollection = {
  idSuffix: 'installations',
  displayName: 'Instalações',
  displayField: 'name',
  dataPermissions: PRIVILEGED_ONLY,
  fields: [
    ref('clientId', 'Cliente'),
    text('name', 'Nome', 200),
    enumText('propertyType', 'Tipo de imóvel', ['house', 'apartment', 'condo_house', 'office', 'commercial', 'other']),
    object('address', 'Endereço', ADDRESS_KEYS),
    text('accessInstructions', 'Instruções de acesso', 2000),
    object('onSiteContact', 'Contato no local', ['name', 'email', 'phone', 'role']),
    {
      key: 'server',
      displayName: 'Servidor Home Assistant',
      type: 'OBJECT',
      objectOptions: {
        fields: [
          { key: 'baseUrl', type: 'TEXT' },
          { key: 'localUrl', type: 'TEXT' },
          { key: 'haVersion', type: 'TEXT' },
          { key: 'installMethod', type: 'TEXT' },
          { key: 'hardware', type: 'TEXT' },
          { key: 'remoteAccess', type: 'TEXT' },
          {
            key: 'connectionStatus',
            type: 'TEXT',
            textOptions: {
              enumValues: { values: ['not_configured', 'online', 'offline', 'auth_error', 'unknown'] },
            },
          },
          { key: 'lastSyncAt', type: 'DATETIME' },
          // Referência ao cofre do conector; nunca o token em si.
          { key: 'credentialRef', type: 'TEXT' },
        ],
      },
    },
    {
      key: 'network',
      displayName: 'Rede',
      type: 'OBJECT',
      objectOptions: {
        fields: [
          ...['isp', 'internetPlan', 'routerModel', 'subnet', 'gatewayIp', 'zigbeeCoordinator', 'zwaveController', 'threadBorderRouter'].map(
            (k): ObjectField => ({ key: k, type: 'TEXT' }),
          ),
          { key: 'wifiSsids', type: 'ARRAY_STRING' },
        ],
      },
    },
    text('backupLocation', 'Local do backup', 500),
    date('lastBackupAt', 'Último backup'),
    date('installedAt', 'Data de instalação'),
    date('warrantyUntil', 'Garantia até'),
    text('technicalResponsible', 'Responsável técnico', 200),
    { key: 'deploymentStages', displayName: 'Etapas de implantação', type: 'ARRAY_DOCUMENT' },
    enumText('priority', 'Prioridade', PRIORITIES),
    ...baseFields,
  ],
  indexes: [{ fields: [{ path: 'clientId' }] }],
};

const areas: DataCollection = {
  idSuffix: 'areas',
  displayName: 'Ambientes',
  displayField: 'name',
  dataPermissions: PRIVILEGED_ONLY,
  fields: [
    ref('installationId', 'Instalação'),
    text('name', 'Nome', 200),
    enumText('areaType', 'Tipo', [
      'living', 'bedroom', 'kitchen', 'bathroom', 'office', 'garage',
      'outdoor', 'service', 'hall', 'technical', 'other',
    ]),
    text('floor', 'Andar', 100),
    text('haAreaId', 'area_id (HA)', 200),
    ...baseFields,
  ],
  indexes: [byInstallation],
};

const devices: DataCollection = {
  idSuffix: 'devices',
  displayName: 'Dispositivos',
  displayField: 'name',
  dataPermissions: PRIVILEGED_ONLY,
  fields: [
    ref('installationId', 'Instalação'),
    ref('areaId', 'Ambiente'),
    text('name', 'Nome', 200),
    enumText('status', 'Situação', ['planned', 'installed', 'attention', 'fault', 'removed']),
    text('category', 'Categoria', 100),
    text('manufacturer', 'Fabricante', 200),
    text('model', 'Modelo', 200),
    text('serialNumber', 'Nº de série', 100),
    text('hardwareVersion', 'Versão de hardware', 50),
    text('firmwareVersion', 'Firmware', 100),
    enumText('protocol', 'Protocolo', [
      'zigbee', 'zwave', 'wifi', 'matter', 'thread', 'bluetooth',
      'ethernet', 'rf433', 'infrared', 'cloud', 'other',
    ]),
    enumText('powerSource', 'Alimentação', ['mains', 'battery', 'poe', 'usb', 'other']),
    text('batteryType', 'Tipo de bateria', 50),
    ref('parentDeviceId', 'Gateway / dispositivo pai'),
    text('location', 'Localização exata', 300),
    text('haDeviceId', 'device_id (HA)', 200),
    text('integration', 'Integração (HA)', 100),
    text('ipAddress', 'IP', 64),
    text('macAddress', 'MAC', 32),
    text('wifiSsid', 'Rede Wi-Fi', 100),
    text('supplier', 'Fornecedor', 200),
    date('purchaseDate', 'Data de compra'),
    date('installedAt', 'Data de instalação'),
    date('warrantyUntil', 'Garantia até'),
    { key: 'attachmentIds', displayName: 'Anexos', type: 'ARRAY_STRING' },
    ...baseFields,
  ],
  indexes: [byInstallation],
};

const entities: DataCollection = {
  idSuffix: 'entities',
  displayName: 'Entidades',
  displayField: 'entityId',
  dataPermissions: PRIVILEGED_ONLY,
  fields: [
    ref('installationId', 'Instalação'),
    ref('deviceId', 'Dispositivo'),
    ref('areaId', 'Ambiente'),
    text('entityId', 'entity_id', 255),
    text('domain', 'Domínio', 64),
    text('friendlyName', 'Nome amigável', 255),
    text('purpose', 'Função', 500),
    text('deviceClass', 'device_class', 64),
    text('unitOfMeasurement', 'Unidade', 32),
    text('icon', 'Ícone', 100),
    { key: 'supportedFeatures', displayName: 'supported_features', type: 'NUMBER', numberOptions: { min: 0 } },
    { key: 'capabilities', displayName: 'Capacidades', type: 'OBJECT' },
    { key: 'disabled', displayName: 'Desativada', type: 'BOOLEAN' },
    { key: 'hidden', displayName: 'Oculta', type: 'BOOLEAN' },
    text('lastSeenState', 'Último estado', 255),
    { key: 'lastSyncAt', displayName: 'Última sincronização', type: 'DATETIME' },
    ...baseFields,
  ],
  // Um entity_id é único dentro de cada instalação.
  indexes: [{ fields: [{ path: 'installationId' }, { path: 'entityId' }], unique: true }],
};

const attachments: DataCollection = {
  idSuffix: 'attachments',
  displayName: 'Anexos',
  displayField: 'title',
  dataPermissions: PRIVILEGED_ONLY,
  fields: [
    ref('installationId', 'Instalação'),
    enumText('kind', 'Tipo', ['manual', 'image', 'network_map', 'config_backup', 'document', 'other']),
    text('title', 'Título', 200),
    { key: 'fileUrl', displayName: 'Arquivo', type: 'URL' },
    text('mimeType', 'Tipo MIME', 100),
    ...baseFields,
  ],
  indexes: [byInstallation],
};

export default extensions.dataCollections({
  id: 'e5d536a6-4e0e-43c6-a9aa-53f9a46f208d',
  name: 'HA Admin Data',
  collections: [clients, installations, areas, devices, entities, attachments],
});
