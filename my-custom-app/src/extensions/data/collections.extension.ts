import { extensions, type DataCollection } from '@wix/custom-extensions';

/**
 * Coleções Wix Data do Admin Geral.
 * Espelham src/domain/model.ts. Os campos nativos do Wix Data (_id, _createdDate,
 * _updatedDate, _owner) correspondem a id, createdAt, updatedAt e criador.
 *
 * Acesso: somente PRIVILEGED (administradores do site/empresa).
 * Tokens do Home Assistant NÃO são guardados aqui — apenas credentialRef.
 */

type Field = DataCollection['fields'][number];

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
    text('document', 'CPF/CNPJ', 20),
    enumText('status', 'Status', ['prospect', 'active', 'paused', 'closed']),
    { key: 'contacts', displayName: 'Contatos', type: 'ARRAY_DOCUMENT' },
    enumText('priority', 'Prioridade', PRIORITIES),
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
    {
      key: 'address',
      displayName: 'Endereço',
      type: 'OBJECT',
      objectOptions: {
        fields: [
          { key: 'street', type: 'TEXT' },
          { key: 'city', type: 'TEXT' },
          { key: 'state', type: 'TEXT' },
          { key: 'postalCode', type: 'TEXT' },
          { key: 'country', type: 'TEXT' },
        ],
      },
    },
    {
      key: 'server',
      displayName: 'Servidor Home Assistant',
      type: 'OBJECT',
      objectOptions: {
        fields: [
          { key: 'baseUrl', type: 'URL' },
          { key: 'haVersion', type: 'TEXT' },
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
    text('manufacturer', 'Fabricante', 200),
    text('model', 'Modelo', 200),
    enumText('protocol', 'Protocolo', [
      'zigbee', 'zwave', 'wifi', 'matter', 'thread', 'bluetooth',
      'ethernet', 'rf433', 'infrared', 'cloud', 'other',
    ]),
    text('firmwareVersion', 'Firmware', 100),
    text('haDeviceId', 'device_id (HA)', 200),
    text('integration', 'Integração (HA)', 100),
    text('ipAddress', 'IP', 64),
    text('macAddress', 'MAC', 32),
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
    {
      key: 'entityId',
      displayName: 'entity_id',
      type: 'TEXT',
      textOptions: { textValidation: { maxLength: 255, pattern: '^[a-z0-9_]+\\.[a-z0-9_]+$' } },
    },
    text('domain', 'Domínio', 64),
    text('friendlyName', 'Nome amigável', 255),
    text('deviceClass', 'device_class', 64),
    text('unitOfMeasurement', 'Unidade', 32),
    { key: 'supportedFeatures', displayName: 'supported_features', type: 'NUMBER', numberOptions: { min: 0 } },
    { key: 'capabilities', displayName: 'Capacidades', type: 'OBJECT' },
    { key: 'disabled', displayName: 'Desativada', type: 'BOOLEAN' },
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
