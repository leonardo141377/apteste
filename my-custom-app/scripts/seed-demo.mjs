/**
 * Cria um cliente de demonstração completo no site de testes:
 * cliente → instalação → ambientes → dispositivos → entidades.
 *
 * Uso: node scripts/seed-demo.mjs <site-id>
 * Usa o login atual da Wix CLI (npx wix token --site). Não acessa nenhum Home Assistant.
 */
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const siteId = process.argv[2];
if (!siteId) {
  console.error('Uso: node scripts/seed-demo.mjs <site-id>');
  process.exit(1);
}

const token = execSync(`npx wix token --site ${siteId}`, { encoding: 'utf8' }).trim().split('\n').pop();
const NS = '@classimin/app-ha';

async function insert(collection, data) {
  const res = await fetch('https://www.wixapis.com/wix-data/v2/items', {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataCollectionId: `${NS}/${collection}`, dataItem: { data: { revision: 1, tags: [], ...data } } }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${collection}: ${res.status} ${JSON.stringify(body)}`);
  return body.dataItem.id;
}

const stage = (title, order, status, pendingItems = []) => ({
  id: randomUUID(),
  title,
  order,
  status,
  pendingItems,
  ...(status === 'done' ? { completedAt: '2026-11-10T15:00:00.000Z' } : {}),
});

const clientId = await insert('clients', {
  name: 'Mariana Albuquerque Costa',
  clientType: 'person',
  document: '123.456.789-09',
  status: 'active',
  priority: 'high',
  contacts: [
    { name: 'Mariana Albuquerque Costa', role: 'Proprietária', email: 'mariana.demo@exemplo.com', phone: '(11) 98765-4321' },
    { name: 'Rosa Lima', role: 'Governanta', email: 'rosa.demo@exemplo.com', phone: '(11) 91234-5678' },
  ],
  billingAddress: {
    postalCode: '04538-133',
    street: 'Av. Brigadeiro Faria Lima',
    number: '3477',
    complement: 'Conj. 12',
    district: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    country: 'Brasil',
  },
  contractNumber: 'CT-2026-0042',
  contractStart: '2026-09-01',
  contractEnd: '2027-08-31',
  supportPlan: 'premium',
  technicalResponsible: 'Leonardo',
  source: 'Indicação de arquiteto',
  tags: ['demo', 'residencial', 'alto padrão'],
  notes: 'Cliente de demonstração criado automaticamente para testes.',
});

const installationId = await insert('installations', {
  clientId,
  name: 'Residência Alphaville',
  propertyType: 'condo_house',
  priority: 'high',
  technicalResponsible: 'Leonardo',
  installedAt: '2026-10-15',
  warrantyUntil: '2027-10-15',
  address: {
    postalCode: '06454-000',
    street: 'Alameda Rio Negro',
    number: '1030',
    complement: 'Residencial 5, casa 18',
    district: 'Alphaville',
    city: 'Barueri',
    state: 'SP',
    country: 'Brasil',
  },
  accessInstructions: 'Portaria do Residencial 5: informar nome e documento. Acesso técnico de seg. a sex., 9h–17h. Quadro de rede no closet do escritório.',
  onSiteContact: { name: 'Rosa Lima', role: 'Governanta', phone: '(11) 91234-5678', email: 'rosa.demo@exemplo.com' },
  server: {
    baseUrl: 'https://alphaville-demo.exemplo.com',
    localUrl: 'http://192.168.10.5:8123',
    installMethod: 'haos',
    hardware: 'Home Assistant Green',
    haVersion: '2026.11.1',
    remoteAccess: 'nabu_casa',
    connectionStatus: 'not_configured',
  },
  network: {
    isp: 'Vivo Fibra',
    internetPlan: '1 Gbps',
    routerModel: 'TP-Link Deco X68 (mesh, 3 unidades)',
    gatewayIp: '192.168.10.1',
    subnet: '192.168.10.0/24',
    wifiSsids: ['Casa18', 'Casa18_IoT', 'Casa18_Visitas'],
    zigbeeCoordinator: 'SONOFF ZBDongle-E',
    zwaveController: '',
    threadBorderRouter: 'Apple TV 4K',
  },
  backupLocation: 'Google Drive (backup automático diário)',
  lastBackupAt: '2026-11-16',
  deploymentStages: [
    stage('Levantamento e projeto', 1, 'done'),
    stage('Infraestrutura de rede', 2, 'done'),
    stage('Instalação dos dispositivos', 3, 'done'),
    stage('Configuração do Home Assistant', 4, 'in_progress', ['Renomear entidades da área externa']),
    stage('Automações e cenas', 5, 'pending', ['Cliente definir horários da irrigação', 'Aprovar cena "Cinema"']),
    stage('Testes e ajustes', 6, 'pending'),
    stage('Entrega e treinamento', 7, 'pending', ['Agendar treinamento com a governanta']),
  ],
  tags: ['demo'],
  notes: 'Instalação de demonstração.',
});

const area = (name, areaType, floor, haAreaId) => insert('areas', { installationId, name, areaType, floor, haAreaId });
const sala = await area('Sala de estar', 'living', 'Térreo', 'sala_de_estar');
const cozinha = await area('Cozinha', 'kitchen', 'Térreo', 'cozinha');
const suite = await area('Suíte master', 'bedroom', 'Superior', 'suite_master');
const externa = await area('Área externa', 'outdoor', 'Térreo', 'area_externa');

const device = (data) =>
  insert('devices', {
    installationId,
    status: 'installed',
    attachmentIds: [],
    supplier: 'Distribuidora Demo',
    purchaseDate: '2026-09-20',
    installedAt: '2026-10-10',
    warrantyUntil: '2027-10-10',
    ...data,
  });

const coordinator = await device({
  name: 'Coordenador Zigbee',
  category: 'Gateway',
  areaId: sala,
  location: 'Rack do escritório (cabo USB de extensão)',
  manufacturer: 'SONOFF',
  model: 'ZBDongle-E',
  serialNumber: 'ZBE-0099812',
  firmwareVersion: '7.4.1',
  protocol: 'zigbee',
  powerSource: 'usb',
  integration: 'zha',
});

const switchSala = await device({
  name: 'Interruptor sala 2 teclas',
  category: 'Interruptor',
  areaId: sala,
  location: 'Parede ao lado da porta de entrada',
  manufacturer: 'Tuya',
  model: 'TS0012',
  firmwareVersion: '1.0.6',
  protocol: 'zigbee',
  powerSource: 'mains',
  parentDeviceId: coordinator,
  macAddress: 'A4:C1:38:5E:22:10:FF:01',
  integration: 'zha',
});

const presence = await device({
  name: 'Sensor de presença cozinha',
  category: 'Sensor de presença',
  areaId: cozinha,
  location: 'Teto, centro do ambiente',
  manufacturer: 'Aqara',
  model: 'FP2',
  firmwareVersion: '1.2.7',
  protocol: 'wifi',
  powerSource: 'usb',
  ipAddress: '192.168.10.41',
  macAddress: '54:EF:44:12:AB:90',
  wifiSsid: 'Casa18_IoT',
  integration: 'homekit_controller',
});

const ac = await device({
  name: 'Ar-condicionado suíte',
  category: 'Climatização',
  areaId: suite,
  location: 'Parede acima da cama',
  manufacturer: 'LG',
  model: 'Dual Inverter 12000 BTU',
  protocol: 'wifi',
  powerSource: 'mains',
  ipAddress: '192.168.10.52',
  wifiSsid: 'Casa18_IoT',
  integration: 'lg_thinq',
});

const gate = await device({
  name: 'Sensor do portão',
  category: 'Sensor de abertura',
  areaId: externa,
  location: 'Portão da garagem, lado esquerdo',
  manufacturer: 'Aqara',
  model: 'MCCGQ11LM',
  protocol: 'zigbee',
  powerSource: 'battery',
  batteryType: 'CR1632',
  parentDeviceId: coordinator,
  integration: 'zha',
});

const entity = (data) => insert('entities', { installationId, disabled: false, hidden: false, ...data });
await entity({ entityId: 'light.sala_teto', domain: 'light', friendlyName: 'Luz teto sala', purpose: 'Iluminação principal da sala', deviceId: switchSala, areaId: sala, icon: 'mdi:ceiling-light' });
await entity({ entityId: 'light.sala_sanca', domain: 'light', friendlyName: 'Sanca sala', purpose: 'Iluminação indireta para cenas', deviceId: switchSala, areaId: sala, icon: 'mdi:led-strip' });
await entity({ entityId: 'binary_sensor.cozinha_presenca', domain: 'binary_sensor', friendlyName: 'Presença cozinha', purpose: 'Acender luz da cozinha ao entrar', deviceId: presence, areaId: cozinha, deviceClass: 'occupancy' });
await entity({ entityId: 'sensor.cozinha_iluminancia', domain: 'sensor', friendlyName: 'Luminosidade cozinha', purpose: 'Evitar acender a luz durante o dia', deviceId: presence, areaId: cozinha, deviceClass: 'illuminance', unitOfMeasurement: 'lx' });
await entity({ entityId: 'climate.suite_ar', domain: 'climate', friendlyName: 'Ar suíte', purpose: 'Pré-climatizar antes de dormir', deviceId: ac, areaId: suite, supportedFeatures: 393 });
await entity({ entityId: 'binary_sensor.portao_contato', domain: 'binary_sensor', friendlyName: 'Portão garagem', purpose: 'Alerta de portão aberto à noite', deviceId: gate, areaId: externa, deviceClass: 'garage_door' });
await entity({ entityId: 'sensor.portao_bateria', domain: 'sensor', friendlyName: 'Bateria sensor portão', purpose: 'Aviso de troca de bateria', deviceId: gate, areaId: externa, deviceClass: 'battery', unitOfMeasurement: '%', hidden: true });

console.log('Demo criada: 1 cliente, 1 instalação, 4 ambientes, 5 dispositivos, 7 entidades.');
