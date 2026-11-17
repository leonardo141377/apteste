import { useEffect, useMemo, useState, type FC } from 'react';
import { Badge, Box, Tabs, Text } from '@wix/design-system';
import { areasRepo, devicesRepo, entitiesRepo, installationsRepo } from '../../../../data/repositories';
import { CONNECTION_STATUS, CONNECTION_STATUS_SKIN } from '../../../../domain/labels';
import type { Area, Device, Entity, Installation } from '../../../../domain/model';
import { DetailCard } from '../../../../ui/DetailCard';
import { errorMessage, toastError, toastSuccess } from '../../../../ui/feedback';
import { RecordFormModal } from '../../../../ui/RecordFormModal';
import { RecordSection } from '../../../../ui/RecordSection';
import {
  areaColumns,
  areaDisplayName,
  areaFields,
  areaSearch,
  checkDeleteArea,
  checkDeleteDevice,
  deviceColumns,
  deviceDisplayName,
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

  const areaOptions = useMemo(() => areas.map((a) => ({ id: a.id, value: areaDisplayName(a) })), [areas]);
  const deviceOptions = useMemo(() => devices.map((d) => ({ id: d.id, value: deviceDisplayName(d) })), [devices]);

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
            displayName={areaDisplayName}
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
            fields={deviceFields(areaOptions, deviceOptions)}
            newValues={deviceNewValues}
            searchText={deviceSearch}
            displayName={deviceDisplayName}
            checkDelete={checkDeleteDevice}
            onChanged={setDevices}
          />
        );
      case 'entities':
        return (
          <RecordSection<Entity>
            repo={entitiesRepo}
            filter={filter}
            noun={{ singular: 'Entidade', plural: 'Entidades', article: 'a' }}
            columns={entityColumns(areaOptions, deviceOptions)}
            fields={entityFields(areaOptions, deviceOptions)}
            newValues={{ disabled: false, hidden: false }}
            prepare={prepareEntity}
            searchText={entitySearch}
            displayName={(e) => e.entityId}
          />
        );
      default:
        return (
          <DetailCard
            title="Dados da instalação"
            fields={installationFields}
            record={installation}
            onEdit={() => setEditing(true)}
            header={
              <Box gap="SP2" verticalAlign="middle">
                <Text size="small" secondary>
                  Conexão com o Home Assistant:
                </Text>
                <Badge size="small" skin={CONNECTION_STATUS_SKIN[installation.server.connectionStatus]}>
                  {CONNECTION_STATUS[installation.server.connectionStatus]}
                </Badge>
                <Text size="small" secondary>
                  · Última sincronização:{' '}
                  {installation.server.lastSyncAt ? new Date(installation.server.lastSyncAt).toLocaleString('pt-BR') : 'nunca'}
                </Text>
              </Box>
            }
          />
        );
    }
  };

  return (
    <Box direction="vertical" gap="SP4">
      <Tabs items={TABS} activeId={tab} onClick={(item) => setTab(item.id as TabId)} type="compactSide" />
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
