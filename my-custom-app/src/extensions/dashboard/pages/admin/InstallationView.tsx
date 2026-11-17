import { useEffect, useMemo, useState, type FC } from 'react';
import { Badge, Box, Button, Card, Cell, Layout, Tabs, Text } from '@wix/design-system';
import { areasRepo, devicesRepo, entitiesRepo, installationsRepo } from '../../../../data/repositories';
import { CONNECTION_STATUS, CONNECTION_STATUS_SKIN, PRIORITY } from '../../../../domain/labels';
import type { Area, Device, Installation } from '../../../../domain/model';
import { errorMessage, toastError, toastSuccess } from '../../../../ui/feedback';
import { RecordFormModal } from '../../../../ui/RecordFormModal';
import { RecordSection } from '../../../../ui/RecordSection';
import {
  areaColumns,
  areaFields,
  areaSearch,
  checkDeleteArea,
  checkDeleteDevice,
  deviceColumns,
  deviceFields,
  deviceNewValues,
  deviceSearch,
  entityColumns,
  entityFields,
  entitySearch,
  installationFields,
  prepareEntity,
} from './config';
import { DeploymentTab } from './DeploymentTab';

type TabId = 'overview' | 'deployment' | 'areas' | 'devices' | 'entities';

const TABS: { id: TabId; title: string }[] = [
  { id: 'overview', title: 'Visão geral' },
  { id: 'deployment', title: 'Implantação' },
  { id: 'areas', title: 'Ambientes' },
  { id: 'devices', title: 'Dispositivos' },
  { id: 'entities', title: 'Entidades' },
];

const Info: FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <Box direction="vertical" gap="SP1">
    <Text size="small" secondary>
      {label}
    </Text>
    {typeof value === 'string' || value == null ? <Text>{value || '—'}</Text> : value}
  </Box>
);

interface Props {
  installation: Installation;
  onUpdated: (installation: Installation) => void;
}

export const InstallationView: FC<Props> = ({ installation, onUpdated }) => {
  const [tab, setTab] = useState<TabId>('overview');
  const [editing, setEditing] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const filter = useMemo(() => ({ installationId: installation.id }), [installation.id]);

  // Listas usadas nos seletores de ambiente/dispositivo.
  useEffect(() => {
    Promise.all([areasRepo.list(filter), devicesRepo.list(filter)])
      .then(([a, d]) => {
        setAreas(a);
        setDevices(d);
      })
      .catch((error) => toastError(errorMessage(error)));
  }, [filter]);

  const areaOptions = useMemo(() => areas.map((a) => ({ id: a.id, value: a.name })), [areas]);
  const deviceOptions = useMemo(() => devices.map((d) => ({ id: d.id, value: d.name })), [devices]);

  const { server, address } = installation;
  const addressText = [address?.street, address?.city, address?.state, address?.postalCode, address?.country]
    .filter(Boolean)
    .join(', ');

  const renderTab = () => {
    switch (tab) {
      case 'deployment':
        return <DeploymentTab installation={installation} onUpdated={onUpdated} />;
      case 'areas':
        return (
          <RecordSection<Area>
            repo={areasRepo}
            filter={filter}
            noun={{ singular: 'Ambiente', plural: 'Ambientes', article: 'o' }}
            columns={areaColumns}
            fields={areaFields}
            searchText={areaSearch}
            displayName={(a) => a.name}
            checkDelete={checkDeleteArea}
            onChanged={setAreas}
          />
        );
      case 'devices':
        return (
          <RecordSection<Device>
            repo={devicesRepo}
            filter={filter}
            noun={{ singular: 'Dispositivo', plural: 'Dispositivos', article: 'o' }}
            columns={deviceColumns(areaOptions)}
            fields={deviceFields(areaOptions)}
            newValues={deviceNewValues}
            searchText={deviceSearch}
            displayName={(d) => d.name}
            checkDelete={checkDeleteDevice}
            onChanged={setDevices}
          />
        );
      case 'entities':
        return (
          <RecordSection
            repo={entitiesRepo}
            filter={filter}
            noun={{ singular: 'Entidade', plural: 'Entidades', article: 'a' }}
            columns={entityColumns(areaOptions, deviceOptions)}
            fields={entityFields(areaOptions, deviceOptions)}
            newValues={{ disabled: false }}
            prepare={prepareEntity}
            searchText={entitySearch}
            displayName={(e) => e.entityId}
          />
        );
      default:
        return (
          <Card>
            <Card.Header
              title="Dados da instalação"
              suffix={
                <Button size="small" priority="secondary" onClick={() => setEditing(true)}>
                  Editar
                </Button>
              }
            />
            <Card.Divider />
            <Card.Content>
              <Layout>
                <Cell span={6}>
                  <Info label="URL do Home Assistant" value={server.baseUrl} />
                </Cell>
                <Cell span={3}>
                  <Info
                    label="Conexão"
                    value={
                      <Badge size="small" skin={CONNECTION_STATUS_SKIN[server.connectionStatus]}>
                        {CONNECTION_STATUS[server.connectionStatus]}
                      </Badge>
                    }
                  />
                </Cell>
                <Cell span={3}>
                  <Info label="Prioridade" value={PRIORITY[installation.priority]} />
                </Cell>
                <Cell span={6}>
                  <Info label="Endereço" value={addressText} />
                </Cell>
                <Cell span={3}>
                  <Info label="Versão do HA" value={server.haVersion} />
                </Cell>
                <Cell span={3}>
                  <Info
                    label="Última sincronização"
                    value={server.lastSyncAt ? new Date(server.lastSyncAt).toLocaleString('pt-BR') : 'Nunca'}
                  />
                </Cell>
                <Cell span={12}>
                  <Info label="Observações" value={installation.notes} />
                </Cell>
              </Layout>
            </Card.Content>
          </Card>
        );
    }
  };

  return (
    <Box direction="vertical" gap="SP4">
      <Tabs
        items={TABS}
        activeId={tab}
        onClick={(item) => setTab(item.id as TabId)}
        type="compactSide"
      />
      {renderTab()}

      <RecordFormModal
        isOpen={editing}
        title="Editar instalação"
        fields={installationFields}
        initial={{ ...installation }}
        onSubmit={async (values) => {
          onUpdated(await installationsRepo.update(installation, values));
          toastSuccess('Instalação atualizada.');
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    </Box>
  );
};
