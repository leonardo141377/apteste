import { useState, type FC } from 'react';
import { Badge, Box, Button, Card, Dropdown, LinearProgressBar, Table, TableActionCell, Text } from '@wix/design-system';
import { ChevronDownSmall, ChevronUpSmall, DeleteSmall } from '@wix/wix-ui-icons-common';
import { installationsRepo, newStage } from '../../../../data/repositories';
import { STAGE_STATUS, STAGE_STATUS_SKIN, toOptions } from '../../../../domain/labels';
import type { DeploymentStage, DeploymentStageStatus, Installation } from '../../../../domain/model';
import { ConfirmDeleteModal } from '../../../../ui/ConfirmDeleteModal';
import { errorMessage, toastError } from '../../../../ui/feedback';
import { RecordFormModal, type FieldDef } from '../../../../ui/RecordFormModal';

const stageFields: FieldDef[] = [
  { key: 'title', label: 'Etapa', required: true },
  { key: 'status', label: 'Status', type: 'select', options: toOptions(STAGE_STATUS), required: true },
  { key: 'pendingItems', label: 'Pendências (visíveis ao cliente)', type: 'lines' },
];

interface Props {
  installation: Installation;
  onUpdated: (installation: Installation) => void;
}

export const DeploymentTab: FC<Props> = ({ installation, onUpdated }) => {
  const [form, setForm] = useState<{ stage: DeploymentStage | null } | null>(null);
  const [deleting, setDeleting] = useState<DeploymentStage | null>(null);
  const stages = [...installation.deploymentStages].sort((a, b) => a.order - b.order);
  const done = stages.filter((s) => s.status === 'done').length;
  const percent = stages.length ? Math.round((done / stages.length) * 100) : 0;

  /** Salva a lista de etapas renumerando a ordem. */
  const saveStages = async (next: DeploymentStage[]) => {
    const deploymentStages = next.map((s, index) => ({ ...s, order: index + 1 }));
    onUpdated(await installationsRepo.update(installation, { deploymentStages }));
  };

  const safely = (action: () => Promise<void>) => async () => {
    try {
      await action();
    } catch (error) {
      toastError(`Erro ao salvar: ${errorMessage(error)}`);
    }
  };

  const setStatus = (stage: DeploymentStage, status: DeploymentStageStatus) =>
    safely(() =>
      saveStages(
        stages.map((s) =>
          s.id === stage.id
            ? { ...s, status, completedAt: status === 'done' ? new Date().toISOString() : undefined }
            : s,
        ),
      ),
    )();

  const move = (index: number, delta: number) =>
    safely(() => {
      const next = [...stages];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return saveStages(next);
    })();

  const submitStage = async (values: Record<string, unknown>) => {
    const editing = form?.stage;
    const status = values.status as DeploymentStageStatus;
    const patch = {
      title: String(values.title),
      status,
      pendingItems: (values.pendingItems as string[]) ?? [],
    };
    if (editing) {
      await saveStages(
        stages.map((s) =>
          s.id === editing.id
            ? { ...s, ...patch, completedAt: status === 'done' ? s.completedAt ?? new Date().toISOString() : undefined }
            : s,
        ),
      );
    } else {
      await saveStages([...stages, { ...newStage(patch.title, stages.length + 1), ...patch }]);
    }
    setForm(null);
  };

  const columns = [
    { title: '#', width: '48px', render: (s: DeploymentStage) => <Text secondary>{s.order}</Text> },
    { title: 'Etapa', render: (s: DeploymentStage) => <Text>{s.title}</Text> },
    {
      title: 'Status',
      width: '200px',
      render: (s: DeploymentStage) => (
        <Dropdown
          size="small"
          selectedId={s.status}
          options={toOptions(STAGE_STATUS)}
          onSelect={(option) => void setStatus(s, option.id as DeploymentStageStatus)}
          valueParser={(option) => option.value as string}
          prefix={<Badge size="tiny" skin={STAGE_STATUS_SKIN[s.status]}>{' '}</Badge>}
        />
      ),
    },
    {
      title: 'Pendências',
      render: (s: DeploymentStage) => (
        <Text secondary size="small">
          {s.pendingItems.length ? s.pendingItems.join(' · ') : '—'}
        </Text>
      ),
    },
    {
      title: '',
      width: '160px',
      render: (s: DeploymentStage) => {
        const index = stages.findIndex((x) => x.id === s.id);
        return (
          <TableActionCell
            primaryAction={{ text: 'Editar', onClick: () => setForm({ stage: s }) }}
            secondaryActions={[
              { text: 'Mover para cima', icon: <ChevronUpSmall />, disabled: index === 0, onClick: () => void move(index, -1) },
              { text: 'Mover para baixo', icon: <ChevronDownSmall />, disabled: index === stages.length - 1, onClick: () => void move(index, 1) },
              { text: 'Excluir', icon: <DeleteSmall />, onClick: () => setDeleting(s) },
            ]}
          />
        );
      },
    },
  ];

  return (
    <Card>
      <Card.Header
        title="Etapas da implantação"
        subtitle={`${done} de ${stages.length} concluída(s)`}
        suffix={
          <Button size="small" onClick={() => setForm({ stage: null })}>
            Nova etapa
          </Button>
        }
      />
      <Card.Content>
        <LinearProgressBar value={percent} showProgressIndication skin={percent === 100 ? 'success' : 'standard'} />
      </Card.Content>
      <Card.Divider />
      {stages.length ? (
        <Table data={stages} columns={columns}>
          <Table.Content />
        </Table>
      ) : (
        <Box padding="SP6" align="center">
          <Text secondary>Nenhuma etapa cadastrada.</Text>
        </Box>
      )}

      <RecordFormModal
        key={form?.stage?.id ?? 'new'}
        isOpen={!!form}
        title={form?.stage ? 'Editar etapa' : 'Nova etapa'}
        fields={stageFields}
        initial={form?.stage ? { ...form.stage } : { status: 'pending', pendingItems: [] }}
        onSubmit={submitStage}
        onClose={() => setForm(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deleting}
        title="Excluir etapa?"
        message={`“${deleting?.title ?? ''}” será removida desta instalação.`}
        onConfirm={safely(async () => {
          await saveStages(stages.filter((s) => s.id !== deleting?.id));
          setDeleting(null);
        })}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
};
