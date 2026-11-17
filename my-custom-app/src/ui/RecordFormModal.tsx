import { Fragment, useState, type FC } from 'react';
import { Box, Cell, CustomModalLayout, Dropdown, FormField, Input, InputArea, Layout, Modal, Text } from '@wix/design-system';
import type { Values } from '../data/repository';
import type { Option } from '../domain/labels';
import { errorMessage, toastError } from './feedback';
import { getPath, setPath } from './path';

export type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'url' | 'email' | 'lines';

export interface FieldDef {
  /** Caminho no registro, ex.: "name", "server.baseUrl", "contacts.0.email". */
  key: string;
  label: string;
  type?: FieldType;
  options?: Option[];
  required?: boolean;
  pattern?: { regex: RegExp; message: string };
  placeholder?: string;
  /** Ocupa meia largura. */
  half?: boolean;
  /** Título de seção exibido antes deste campo. */
  section?: string;
}

const NONE = '__none__';

function isEmpty(value: unknown): boolean {
  return value == null || (typeof value === 'string' && !value.trim()) || (Array.isArray(value) && !value.length);
}

function validate(field: FieldDef, value: unknown): string | null {
  if (field.required && isEmpty(value)) return 'Campo obrigatório.';
  if (field.pattern && typeof value === 'string' && value.trim() && !field.pattern.regex.test(value.trim())) {
    return field.pattern.message;
  }
  return null;
}

/** Normaliza antes de salvar: apara textos e troca vazios por undefined. */
function normalize(fields: FieldDef[], values: Values): Values {
  let result = values;
  for (const field of fields) {
    const value = getPath(result, field.key);
    if (typeof value === 'string') result = setPath(result, field.key, value.trim() || undefined);
    if (field.type === 'lines' && Array.isArray(value)) {
      result = setPath(result, field.key, value.map((s) => String(s).trim()).filter(Boolean));
    }
  }
  return result;
}

interface Props {
  isOpen: boolean;
  title: string;
  fields: FieldDef[];
  initial: Values;
  onSubmit: (values: Values) => Promise<void>;
  onClose: () => void;
}

const FormBody: FC<Omit<Props, 'isOpen'>> = ({ title, fields, initial, onSubmit, onClose }) => {
  const [values, setValues] = useState<Values>(initial);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = Object.fromEntries(fields.map((f) => [f.key, validate(f, getPath(values, f.key))]));
  const hasErrors = Object.values(errors).some(Boolean);
  const set = (key: string, value: unknown) => setValues((prev) => setPath(prev, key, value));

  const submit = async () => {
    if (hasErrors) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(normalize(fields, values));
    } catch (error) {
      toastError(`Erro ao salvar: ${errorMessage(error)}`);
      setSaving(false);
    }
  };

  const renderInput = (field: FieldDef) => {
    const value = getPath(values, field.key);
    switch (field.type) {
      case 'textarea':
        return <InputArea rows={3} value={(value as string) ?? ''} onChange={(e) => set(field.key, e.target.value)} />;
      case 'lines':
        return (
          <InputArea
            rows={4}
            placeholder={field.placeholder ?? 'Um item por linha'}
            value={((value as string[]) ?? []).join('\n')}
            onChange={(e) => set(field.key, e.target.value.split('\n'))}
            onBlur={() => set(field.key, ((getPath(values, field.key) as string[]) ?? []).map((s) => s.trim()).filter(Boolean))}
          />
        );
      case 'select': {
        const options = field.required ? field.options ?? [] : [{ id: NONE, value: '—' }, ...(field.options ?? [])];
        return (
          <Dropdown
            placeholder="Selecione"
            selectedId={(value as string) || (field.required ? undefined : NONE)}
            options={options}
            onSelect={(option) => set(field.key, option.id === NONE ? undefined : option.id)}
          />
        );
      }
      case 'number':
        return (
          <Input
            type="number"
            value={value == null ? '' : String(value)}
            onChange={(e) => set(field.key, e.target.value === '' ? undefined : Number(e.target.value))}
          />
        );
      default:
        return (
          <Input
            type={field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
            value={(value as string) ?? ''}
            onChange={(e) => set(field.key, e.target.value)}
          />
        );
    }
  };

  return (
    <CustomModalLayout
      title={title}
      width="640px"
      primaryButtonText={saving ? 'Salvando…' : 'Salvar'}
      primaryButtonProps={{ disabled: saving }}
      primaryButtonOnClick={submit}
      secondaryButtonText="Cancelar"
      secondaryButtonOnClick={onClose}
      onCloseButtonClick={onClose}
      content={
        <Box direction="vertical" paddingBottom="SP2">
          <Layout gap="16px">
            {fields.map((field) => (
              <Fragment key={field.key}>
                {field.section && (
                  <Cell span={12}>
                    <Text weight="bold">{field.section}</Text>
                  </Cell>
                )}
                <Cell span={field.half ? 6 : 12}>
                  <FormField
                    label={field.label}
                    required={field.required}
                    status={showErrors && errors[field.key] ? 'error' : undefined}
                    statusMessage={errors[field.key] ?? undefined}
                  >
                    {renderInput(field)}
                  </FormField>
                </Cell>
              </Fragment>
            ))}
          </Layout>
        </Box>
      }
    />
  );
};

/** Modal de formulário genérico dirigido por descrições de campos. */
export const RecordFormModal: FC<Props> = ({ isOpen, onClose, ...rest }) => (
  <Modal isOpen={isOpen} onRequestClose={onClose} shouldCloseOnOverlayClick>
    {isOpen ? <FormBody onClose={onClose} {...rest} /> : <div />}
  </Modal>
);
