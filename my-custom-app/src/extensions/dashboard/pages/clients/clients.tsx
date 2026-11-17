import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  CustomModalLayout,
  Dropdown,
  EmptyState,
  FormField,
  Input,
  InputArea,
  Loader,
  Modal,
  Page,
  Search,
  Table,
  TableActionCell,
  Text,
  WixDesignSystemProvider,
} from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { DeleteSmall } from '@wix/wix-ui-icons-common';
import { dashboard } from '@wix/dashboard';
import type { Client, ClientStatus, Priority } from '../../../../domain/model';
import { createClient, listClients, removeClient, updateClient, type ClientInput } from '../../../../data/clients';

const STATUS_LABEL: Record<ClientStatus, string> = {
  prospect: 'Prospecção',
  active: 'Ativo',
  paused: 'Pausado',
  closed: 'Encerrado',
};

const STATUS_SKIN: Record<ClientStatus, 'general' | 'success' | 'warning' | 'neutralLight'> = {
  prospect: 'general',
  active: 'success',
  paused: 'warning',
  closed: 'neutralLight',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

const EMPTY_INPUT: ClientInput = {
  name: '',
  document: '',
  status: 'prospect',
  priority: 'medium',
  contacts: [{ name: '', email: '', phone: '' }],
  notes: '',
};

function toInput(client: Client): ClientInput {
  return {
    name: client.name,
    document: client.document ?? '',
    status: client.status,
    priority: client.priority,
    contacts: client.contacts.length ? client.contacts : [{ name: '', email: '', phone: '' }],
    notes: client.notes ?? '',
  };
}

/** Remove contatos totalmente vazios e espaços extras antes de salvar. */
function cleanInput(input: ClientInput): ClientInput {
  return {
    ...input,
    name: input.name.trim(),
    document: input.document?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    contacts: input.contacts
      .map((c) => ({ ...c, name: c.name.trim(), email: c.email?.trim(), phone: c.phone?.trim() }))
      .filter((c) => c.name || c.email || c.phone),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

interface ClientFormModalProps {
  editing: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}

const ClientFormModal: FC<ClientFormModalProps> = ({ editing, onClose, onSaved }) => {
  const [input, setInput] = useState<ClientInput>(editing ? toInput(editing) : EMPTY_INPUT);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const contact = input.contacts[0];
  const nameMissing = !input.name.trim();

  const setContact = (patch: Partial<typeof contact>) =>
    setInput({ ...input, contacts: [{ ...contact, ...patch }, ...input.contacts.slice(1)] });

  const save = async () => {
    if (nameMissing) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      const data = cleanInput(input);
      const saved = editing ? await updateClient(editing, data) : await createClient(data);
      dashboard.showToast({ message: editing ? 'Cliente atualizado.' : 'Cliente criado.', type: 'success' });
      onSaved(saved);
    } catch (error) {
      dashboard.showToast({ message: `Erro ao salvar: ${errorMessage(error)}`, type: 'error' });
      setSaving(false);
    }
  };

  return (
    <CustomModalLayout
      title={editing ? 'Editar cliente' : 'Novo cliente'}
      primaryButtonText={saving ? 'Salvando…' : 'Salvar'}
      primaryButtonProps={{ disabled: saving }}
      primaryButtonOnClick={save}
      secondaryButtonText="Cancelar"
      secondaryButtonOnClick={onClose}
      onCloseButtonClick={onClose}
      width="600px"
      content={
        <Box direction="vertical" gap="SP4">
          <FormField label="Nome" required status={showErrors && nameMissing ? 'error' : undefined} statusMessage="Informe o nome do cliente.">
            <Input value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} />
          </FormField>
          <FormField label="CPF/CNPJ">
            <Input value={input.document} onChange={(e) => setInput({ ...input, document: e.target.value })} />
          </FormField>
          <Box gap="SP4">
            <Box width="50%" direction="vertical">
              <FormField label="Status">
                <Dropdown
                  selectedId={input.status}
                  options={Object.entries(STATUS_LABEL).map(([id, value]) => ({ id, value }))}
                  onSelect={(option) => setInput({ ...input, status: option.id as ClientStatus })}
                />
              </FormField>
            </Box>
            <Box width="50%" direction="vertical">
              <FormField label="Prioridade">
                <Dropdown
                  selectedId={input.priority}
                  options={Object.entries(PRIORITY_LABEL).map(([id, value]) => ({ id, value }))}
                  onSelect={(option) => setInput({ ...input, priority: option.id as Priority })}
                />
              </FormField>
            </Box>
          </Box>
          <Text weight="bold">Contato principal</Text>
          <FormField label="Nome do contato">
            <Input value={contact.name} onChange={(e) => setContact({ name: e.target.value })} />
          </FormField>
          <Box gap="SP4">
            <Box width="50%" direction="vertical">
              <FormField label="E-mail">
                <Input type="email" value={contact.email ?? ''} onChange={(e) => setContact({ email: e.target.value })} />
              </FormField>
            </Box>
            <Box width="50%" direction="vertical">
              <FormField label="Telefone">
                <Input value={contact.phone ?? ''} onChange={(e) => setContact({ phone: e.target.value })} />
              </FormField>
            </Box>
          </Box>
          <FormField label="Observações">
            <InputArea rows={3} value={input.notes} onChange={(e) => setInput({ ...input, notes: e.target.value })} />
          </FormField>
        </Box>
      }
    />
  );
};

const ClientsPage: FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setClients(await listClients());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.document?.toLowerCase().includes(term) ||
        c.contacts.some((ct) => ct.name.toLowerCase().includes(term) || ct.email?.toLowerCase().includes(term)),
    );
  }, [clients, search]);

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditing(client);
    setModalOpen(true);
  };

  const onSaved = (saved: Client) => {
    setClients((prev) => {
      const others = prev.filter((c) => c.id !== saved.id);
      return [...others, saved].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    });
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await removeClient(deleting.id);
      setClients((prev) => prev.filter((c) => c.id !== deleting.id));
      dashboard.showToast({ message: 'Cliente excluído.', type: 'success' });
    } catch (error) {
      dashboard.showToast({ message: `Erro ao excluir: ${errorMessage(error)}`, type: 'error' });
    } finally {
      setDeleting(null);
    }
  };

  const columns = [
    { title: 'Nome', render: (c: Client) => <Text weight="normal">{c.name}</Text> },
    { title: 'Contato', render: (c: Client) => <Text secondary>{c.contacts[0]?.name || c.contacts[0]?.email || '—'}</Text> },
    {
      title: 'Status',
      render: (c: Client) => (
        <Badge size="small" skin={STATUS_SKIN[c.status]}>
          {STATUS_LABEL[c.status]}
        </Badge>
      ),
    },
    { title: 'Prioridade', render: (c: Client) => <Text secondary>{PRIORITY_LABEL[c.priority]}</Text> },
    {
      title: '',
      width: '160px',
      render: (c: Client) => (
        <TableActionCell
          primaryAction={{ text: 'Editar', onClick: () => openEdit(c) }}
          secondaryActions={[{ text: 'Excluir', icon: <DeleteSmall />, onClick: () => setDeleting(c) }]}
        />
      ),
    },
  ];

  const renderBody = () => {
    if (loading) {
      return (
        <Box align="center" padding="SP10">
          <Loader />
        </Box>
      );
    }
    if (loadError) {
      return (
        <EmptyState
          skin="page"
          title="Não foi possível carregar os clientes"
          subtitle={loadError}
        >
          <Button onClick={load}>Tentar novamente</Button>
        </EmptyState>
      );
    }
    if (!clients.length) {
      return (
        <EmptyState skin="page" title="Nenhum cliente cadastrado" subtitle="Cadastre o primeiro cliente para começar.">
          <Button onClick={openNew}>Novo cliente</Button>
        </EmptyState>
      );
    }
    return (
      <Card>
        <Table data={filtered} columns={columns} rowVerticalPadding="medium">
          <Table.ToolbarContainer>
            {() => (
              <Box padding="SP4">
                <Search value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} placeholder="Buscar por nome, documento ou contato" />
              </Box>
            )}
          </Table.ToolbarContainer>
          <Table.Content />
        </Table>
        {!filtered.length && (
          <Box padding="SP6" align="center">
            <Text secondary>Nenhum cliente encontrado para “{search}”.</Text>
          </Box>
        )}
      </Card>
    );
  };

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <Page>
        <Page.Header
          title="Clientes"
          subtitle="Cadastro de clientes do HA Automation Builder"
          actionsBar={<Button onClick={openNew}>Novo cliente</Button>}
        />
        <Page.Content>{renderBody()}</Page.Content>
      </Page>

      <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} shouldCloseOnOverlayClick>
        {modalOpen ? (
          <ClientFormModal key={editing?.id ?? 'new'} editing={editing} onClose={() => setModalOpen(false)} onSaved={onSaved} />
        ) : (
          <div />
        )}
      </Modal>

      <Modal isOpen={!!deleting} onRequestClose={() => setDeleting(null)}>
        <CustomModalLayout
          theme="destructive"
          title="Excluir cliente?"
          primaryButtonText="Excluir"
          primaryButtonOnClick={confirmDelete}
          secondaryButtonText="Cancelar"
          secondaryButtonOnClick={() => setDeleting(null)}
          onCloseButtonClick={() => setDeleting(null)}
          content={<Text>“{deleting?.name}” será excluído permanentemente. Instalações vinculadas não são apagadas.</Text>}
        />
      </Modal>
    </WixDesignSystemProvider>
  );
};

export default ClientsPage;
