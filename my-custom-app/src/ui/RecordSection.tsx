import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Box, Button, Card, EmptyState, Loader, Search, Table, TableActionCell, Text } from '@wix/design-system';
import { DeleteSmall, EditSmall } from '@wix/wix-ui-icons-common';
import type { BaseRecord } from '../domain/model';
import type { Filter, Repository, Values } from '../data/repository';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { errorMessage, toastError, toastSuccess } from './feedback';
import { RecordFormModal, type FieldDef } from './RecordFormModal';

export interface Column<T> {
  title: string;
  render: (record: T) => ReactNode;
  width?: string;
}

export interface RecordSectionProps<T extends BaseRecord> {
  repo: Repository<T>;
  /** Filtro fixo da listagem, também aplicado aos novos registros (ex.: { installationId }). */
  filter?: Filter;
  /** Textos: singular/plural e artigo ("o"/"a"). */
  noun: { singular: string; plural: string; article: 'o' | 'a' };
  columns: Column<T>[];
  fields: FieldDef[];
  /** Valores iniciais para novos registros (além do filtro). */
  newValues?: Values;
  /** Texto pesquisável de cada registro. */
  searchText: (record: T) => string;
  /** Nome exibido nas confirmações. */
  displayName: (record: T) => string;
  /** Converte/valida valores antes de salvar. Lance Error para bloquear. */
  prepare?: (values: Values) => Values;
  /** Retorna mensagem se a exclusão deve ser bloqueada (ex.: há registros vinculados). */
  checkDelete?: (record: T) => Promise<string | null>;
  /** Abre o detalhe do registro (clique na linha). */
  onOpen?: (record: T) => void;
  /** Chamado após criar/editar/excluir, para atualizar dados dependentes. */
  onChanged?: (records: T[]) => void;
}

export function RecordSection<T extends BaseRecord>(props: RecordSectionProps<T>) {
  const { repo, filter, noun, columns, fields, newValues, searchText, displayName, prepare, checkDelete, onOpen, onChanged } = props;
  const filterKey = JSON.stringify(filter ?? {});

  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ editing: T | null } | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const update = (next: T[]) => {
    setRecords(next);
    onChangedRef.current?.(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await repo.list(JSON.parse(filterKey));
      setRecords(list);
      onChangedRef.current?.(list);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [repo, filterKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? records.filter((r) => searchText(r).toLowerCase().includes(term)) : records;
  }, [records, search, searchText]);

  const newLabel = `${noun.article === 'a' ? 'Nova' : 'Novo'} ${noun.singular.toLowerCase()}`;

  const save = async (values: Values) => {
    const data = prepare ? prepare(values) : values;
    const editing = form?.editing;
    const saved = editing ? await repo.update(editing, data) : await repo.create({ ...newValues, ...data, ...filter });
    update(editing ? records.map((r) => (r.id === saved.id ? saved : r)) : [...records, saved]);
    toastSuccess(`${noun.singular} ${editing ? 'atualizad' : 'criad'}${noun.article}.`);
    setForm(null);
  };

  const askDelete = async (record: T) => {
    try {
      const blocked = await checkDelete?.(record);
      if (blocked) toastError(blocked);
      else setDeleting(record);
    } catch (error) {
      toastError(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await repo.remove(deleting.id);
      update(records.filter((r) => r.id !== deleting.id));
      toastSuccess(`${noun.singular} excluíd${noun.article}.`);
    } catch (error) {
      toastError(`Erro ao excluir: ${errorMessage(error)}`);
    } finally {
      setDeleting(null);
    }
  };

  const tableColumns = [
    ...columns,
    {
      title: '',
      width: '200px',
      render: (record: T) => (
        <TableActionCell
          primaryAction={
            onOpen
              ? { text: 'Abrir', onClick: () => onOpen(record) }
              : { text: 'Editar', onClick: () => setForm({ editing: record }) }
          }
          secondaryActions={[
            ...(onOpen ? [{ text: 'Editar', icon: <EditSmall />, onClick: () => setForm({ editing: record }) }] : []),
            { text: 'Excluir', icon: <DeleteSmall />, onClick: () => void askDelete(record) },
          ]}
        />
      ),
    },
  ];

  const renderBody = () => {
    if (loading) {
      return (
        <Box align="center" padding="SP8">
          <Loader size="small" />
        </Box>
      );
    }
    if (loadError) {
      return (
        <EmptyState title={`Não foi possível carregar ${noun.plural.toLowerCase()}`} subtitle={loadError}>
          <Button size="small" onClick={load}>
            Tentar novamente
          </Button>
        </EmptyState>
      );
    }
    if (!records.length) {
      return (
        <EmptyState title={`Nenhum${noun.article === 'a' ? 'a' : ''} ${noun.singular.toLowerCase()} cadastrad${noun.article}`}>
          <Button size="small" onClick={() => setForm({ editing: null })}>
            {newLabel}
          </Button>
        </EmptyState>
      );
    }
    return (
      <>
        <Table
          data={filtered}
          columns={tableColumns}
          onRowClick={onOpen ? (row: T) => onOpen(row) : undefined}
        >
          <Table.ToolbarContainer>
            {() => (
              <Box padding="SP3" paddingLeft="SP4" paddingRight="SP4">
                <Search
                  size="small"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClear={() => setSearch('')}
                  placeholder="Buscar"
                />
              </Box>
            )}
          </Table.ToolbarContainer>
          <Table.Content />
        </Table>
        {!filtered.length && (
          <Box padding="SP6" align="center">
            <Text secondary>Nenhum resultado para “{search}”.</Text>
          </Box>
        )}
      </>
    );
  };

  const editing = form?.editing ?? null;

  return (
    <Card>
      <Card.Header
        title={noun.plural}
        subtitle={loading || loadError ? undefined : `${records.length} cadastrad${noun.article}${records.length === 1 ? '' : 's'}`}
        suffix={
          <Button size="small" onClick={() => setForm({ editing: null })}>
            {newLabel}
          </Button>
        }
      />
      <Card.Divider />
      {renderBody()}

      <RecordFormModal
        key={editing?.id ?? 'new'}
        isOpen={!!form}
        title={editing ? `Editar ${noun.singular.toLowerCase()}` : newLabel}
        fields={fields}
        initial={(editing as unknown as Values) ?? { ...newValues }}
        onSubmit={save}
        onClose={() => setForm(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deleting}
        title={`Excluir ${noun.singular.toLowerCase()}?`}
        message={`“${deleting ? displayName(deleting) : ''}” será excluíd${noun.article} permanentemente.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
