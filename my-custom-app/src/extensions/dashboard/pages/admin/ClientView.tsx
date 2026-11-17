import { useState, type FC } from 'react';
import { Badge, Box, Button, Card, Cell, Layout, Text } from '@wix/design-system';
import { DEFAULT_STAGE_TITLES, clientsRepo, installationsRepo, newStage } from '../../../../data/repositories';
import { CLIENT_STATUS, CLIENT_STATUS_SKIN, PRIORITY } from '../../../../domain/labels';
import type { Client, Installation } from '../../../../domain/model';
import { toastSuccess } from '../../../../ui/feedback';
import { RecordFormModal } from '../../../../ui/RecordFormModal';
import { RecordSection } from '../../../../ui/RecordSection';
import {
  checkDeleteInstallation,
  clientFields,
  installationColumns,
  installationFields,
  installationSearch,
  prepareClient,
} from './config';

interface Props {
  client: Client;
  onUpdated: (client: Client) => void;
  onOpenInstallation: (installation: Installation) => void;
}

const Info: FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <Box direction="vertical" gap="SP1">
    <Text size="small" secondary>
      {label}
    </Text>
    {typeof value === 'string' || value == null ? <Text>{value || '—'}</Text> : value}
  </Box>
);

export const ClientView: FC<Props> = ({ client, onUpdated, onOpenInstallation }) => {
  const [editing, setEditing] = useState(false);
  const contact = client.contacts[0];

  return (
    <Box direction="vertical" gap="SP6">
      <Card>
        <Card.Header
          title="Dados do cliente"
          suffix={
            <Button size="small" priority="secondary" onClick={() => setEditing(true)}>
              Editar
            </Button>
          }
        />
        <Card.Divider />
        <Card.Content>
          <Layout>
            <Cell span={3}>
              <Info
                label="Status"
                value={
                  <Badge size="small" skin={CLIENT_STATUS_SKIN[client.status]}>
                    {CLIENT_STATUS[client.status]}
                  </Badge>
                }
              />
            </Cell>
            <Cell span={3}>
              <Info label="Prioridade" value={PRIORITY[client.priority]} />
            </Cell>
            <Cell span={6}>
              <Info label="CPF/CNPJ" value={client.document} />
            </Cell>
            <Cell span={3}>
              <Info label="Contato" value={contact?.name} />
            </Cell>
            <Cell span={3}>
              <Info label="E-mail" value={contact?.email} />
            </Cell>
            <Cell span={6}>
              <Info label="Telefone" value={contact?.phone} />
            </Cell>
            <Cell span={12}>
              <Info label="Observações" value={client.notes} />
            </Cell>
          </Layout>
        </Card.Content>
      </Card>

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
        displayName={(i) => i.name}
        checkDelete={checkDeleteInstallation}
        onOpen={onOpenInstallation}
      />

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
