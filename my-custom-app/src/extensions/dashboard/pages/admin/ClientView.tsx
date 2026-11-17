import { useState, type FC } from 'react';
import { Box } from '@wix/design-system';
import { DEFAULT_STAGE_TITLES, clientsRepo, installationsRepo, newStage } from '../../../../data/repositories';
import type { Client, Installation } from '../../../../domain/model';
import { DetailCard } from '../../../../ui/DetailCard';
import { toastSuccess } from '../../../../ui/feedback';
import { RecordFormModal } from '../../../../ui/RecordFormModal';
import { RecordSection } from '../../../../ui/RecordSection';
import {
  checkDeleteInstallation,
  clientFields,
  installationColumns,
  installationDisplayName,
  installationFields,
  installationSearch,
  prepareClient,
} from './config';

interface Props {
  client: Client;
  onUpdated: (client: Client) => void;
  onOpenInstallation: (installation: Installation) => void;
}

export const ClientView: FC<Props> = ({ client, onUpdated, onOpenInstallation }) => {
  const [editing, setEditing] = useState(false);

  return (
    <Box direction="vertical" gap="SP6">
      <RecordSection<Installation>
        repo={installationsRepo}
        filter={{ clientId: client.id }}
        noun={{ singular: 'Instalação', plural: 'Instalações', article: 'a' }}
        columns={installationColumns}
        fields={installationFields}
        newValues={{
          priority: 'medium',
          server: { baseUrl: '', connectionStatus: 'not_configured' },
          deploymentStages: DEFAULT_STAGE_TITLES.map((title, i) => newStage(title, i + 1)),
        }}
        searchText={installationSearch}
        displayName={installationDisplayName}
        checkDelete={checkDeleteInstallation}
        onOpen={onOpenInstallation}
      />

      <DetailCard title="Dados do cliente" fields={clientFields} record={client} onEdit={() => setEditing(true)} />

      <RecordFormModal
        isOpen={editing}
        title="Editar cliente"
        fields={clientFields}
        initial={{ ...client }}
        onSubmit={async (values) => {
          onUpdated(await clientsRepo.update(client, prepareClient(values)));
          toastSuccess('Cliente atualizado.');
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    </Box>
  );
};
