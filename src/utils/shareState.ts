/**
 * Codificação de estado para compartilhar por link (sem backend).
 *
 * Serializa um objeto em base64url, curto o bastante para caber numa URL. Usado
 * para compartilhar o palpite do Simulador (bracket) entre amigos.
 */

/** Objeto → string base64url (segura para URL). */
export function encodeState(obj: unknown): string {
  const json = JSON.stringify(obj);
  // btoa não lida com unicode direto → encode antes.
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** string base64url → objeto (null se inválida/corrompida). */
export function decodeState<T>(s: string): T | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as T) : null;
  } catch {
    return null;
  }
}
