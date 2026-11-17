import { items } from '@wix/data';
import type { BaseRecord } from '../domain/model';

/** Valores de formulário (campos do domínio sem os metadados de BaseRecord). */
export type Values = Record<string, unknown>;
type Raw = Record<string, any>;
export type Filter = Record<string, string>;

export interface Repository<T extends BaseRecord> {
  collectionId: string;
  list(filter?: Filter): Promise<T[]>;
  count(filter: Filter): Promise<number>;
  get(id: string): Promise<T | null>;
  create(values: Values): Promise<T>;
  /** Substitui o item inteiro preservando campos não editados e incrementando a revisão. */
  update(current: T, values: Values): Promise<T>;
  remove(id: string): Promise<void>;
}

const iso = (value: unknown): string => (value ? new Date(value as string).toISOString() : '');

/** Remove campos de sistema do Wix Data (_id, _owner, _createdDate…). */
function stripSystemFields(item: Raw): Raw {
  return Object.fromEntries(Object.entries(item).filter(([key]) => !key.startsWith('_')));
}

/**
 * Cria um repositório CRUD para uma coleção Wix Data.
 * `defaults` garante que registros antigos ou incompletos tenham todos os campos do tipo.
 */
export function createRepository<T extends BaseRecord>(
  collectionId: string,
  defaults: () => Omit<T, keyof BaseRecord>,
  sortField = 'name',
): Repository<T> {
  const toRecord = (item: Raw): T => {
    const rest = stripSystemFields(item);
    return {
      ...defaults(),
      ...rest,
      id: item._id,
      createdAt: iso(item._createdDate),
      updatedAt: iso(item._updatedDate),
      createdBy: rest.createdBy || item._owner || '',
      updatedBy: rest.updatedBy ?? '',
      revision: rest.revision ?? 0,
      tags: rest.tags ?? [],
    } as T;
  };

  const query = (filter: Filter = {}) => {
    let q = items.query(collectionId);
    for (const [field, value] of Object.entries(filter)) q = q.eq(field, value);
    return q;
  };

  return {
    collectionId,

    async list(filter) {
      const result = await query(filter).ascending(sortField).limit(1000).find();
      return result.items.map(toRecord);
    },

    async count(filter) {
      return query(filter).count();
    },

    async get(id) {
      const item = await items.get(collectionId, id);
      return item ? toRecord(item) : null;
    },

    async create(values) {
      const item = await items.insert(collectionId, { ...defaults(), ...values, revision: 1, tags: values.tags ?? [] });
      return toRecord(item);
    },

    async update(current, values) {
      const { id, createdAt, updatedAt, ...rest } = current;
      // Formulários de edição recebem o registro inteiro; metadados não são campos da coleção.
      const { id: _i, createdAt: _c, updatedAt: _u, revision: _r, ...changes } = values;
      const item = await items.update(collectionId, {
        ...rest,
        ...changes,
        _id: id,
        revision: (current.revision ?? 0) + 1,
      });
      return toRecord(item);
    },

    async remove(id) {
      await items.remove(collectionId, id);
    },
  };
}
