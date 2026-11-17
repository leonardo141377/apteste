/** Lê um valor por caminho com pontos ("server.baseUrl", "contacts.0.name"). */
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<any>((current, key) => (current == null ? undefined : current[key]), obj);
}

/** Retorna uma cópia de `obj` com o valor definido no caminho (imutável). */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const [head, ...rest] = path.split('.');
  const source: any = obj ?? {};
  const clone: any = Array.isArray(source) ? [...source] : { ...source };
  if (!rest.length) {
    clone[head] = value;
    return clone;
  }
  const child = clone[head] ?? (/^\d+$/.test(rest[0]) ? [] : {});
  clone[head] = setPath(child, rest.join('.'), value);
  return clone;
}
