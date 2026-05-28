/**
 * Persiste qué IDs ya fueron notificados para evitar reenvíos.
 * Se guarda en data/state.json dentro de esta carpeta.
 */

import fs   from 'fs';
import path from 'path';

const STATE_FILE = path.join(__dirname, 'data', 'state.json');

interface State {
  credenciales: string[];   // studentIds que ya recibieron credenciales
  anuncios:     string[];   // announcementIds ya notificados
  encuestas:    string[];   // surveyIds ya notificados
}

function load(): State {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw) as State;
  } catch {
    return { credenciales: [], anuncios: [], encuestas: [] };
  }
}

function save(state: State): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export function yaNotificado(tipo: keyof State, id: string): boolean {
  return load()[tipo].includes(id);
}

export function marcarNotificado(tipo: keyof State, id: string): void {
  const state = load();
  if (!state[tipo].includes(id)) {
    state[tipo].push(id);
    save(state);
  }
}

export function estadoActual(): State {
  return load();
}
