import { Fragment, type FC, type ReactNode } from 'react';
import { Box, Button, Card, Cell, Layout, Text } from '@wix/design-system';
import { getPath } from './path';
import type { FieldDef } from './RecordFormModal';

/** Formata um valor para leitura conforme o tipo do campo. */
function formatValue(field: FieldDef, value: unknown): string {
  if (value == null || value === '') return '—';
  switch (field.type) {
    case 'select':
      return field.options?.find((o) => o.id === value)?.value ?? String(value);
    case 'boolean':
      return value ? 'Sim' : 'Não';
    case 'date': {
      const [y, m, d] = String(value).split('-');
      return d ? `${d}/${m}/${y}` : String(value);
    }
    case 'lines':
      return Array.isArray(value) && value.length ? value.join(', ') : '—';
    default:
      return String(value);
  }
}

interface Props {
  title: string;
  fields: FieldDef[];
  record: unknown;
  onEdit?: () => void;
  /** Conteúdo extra no topo (ex.: badges de status). */
  header?: ReactNode;
}

/** Exibe um registro em modo leitura usando as mesmas definições de campos do formulário. */
export const DetailCard: FC<Props> = ({ title, fields, record, onEdit, header }) => (
  <Card>
    <Card.Header
      title={title}
      suffix={
        onEdit && (
          <Button size="small" priority="secondary" onClick={onEdit}>
            Editar
          </Button>
        )
      }
    />
    <Card.Divider />
    <Card.Content>
      <Box direction="vertical" gap="SP4">
        {header}
        <Layout gap="16px">
          {fields.map((field) => {
            const wide = !field.half || field.type === 'textarea' || field.type === 'lines';
            return (
              <Fragment key={field.key}>
                {field.section && (
                  <Cell span={12}>
                    <Box paddingTop="SP2">
                      <Text weight="bold">{field.section}</Text>
                    </Box>
                  </Cell>
                )}
                <Cell span={wide ? 6 : 3}>
                  <Box direction="vertical" gap="SP1">
                    <Text size="small" secondary>
                      {field.label}
                    </Text>
                    <Text size="small" style={{ whiteSpace: 'pre-wrap' }}>
                      {formatValue(field, getPath(record, field.key))}
                    </Text>
                  </Box>
                </Cell>
              </Fragment>
            );
          })}
        </Layout>
      </Box>
    </Card.Content>
  </Card>
);
