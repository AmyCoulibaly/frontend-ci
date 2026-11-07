// Client de l'API REST Flask (routes /api/... du document de modélisation).
//
// Mode démonstration : en développement (npm run dev), si l'API est injoignable, l'application bascule sur
// un backend simulé (demoBackend.js). Dans l'image Docker de production, ce mode est désactivé
// (VITE_ENABLE_DEMO=false) : le code et les comptes fictifs ne sont alors même pas inclus dans le site compilé.
import { normMedecin, normOrdonnance, normRdv, normSlot } from './models.js';

// nginx (production) et Vite (développement) relaient /api vers le backend Flask sans retirer le préfixe.
const BASE = (import.meta.env && import.meta.env.VITE_API_URL) || '/api';
const SESSION_KEY = 'esante_session_v1';

const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO !== 'false';
// Chargement paresseux : lorsque DEMO_ENABLED est faux, cette branche est supprimée du build.
const loadDemo = DEMO_ENABLED
  ? () => import('./demoBackend.js')
  : () => Promise.reject(new Error('Mode démonstration désactivé.'));

// ───────── Session (jeton JWT + utilisateur) ─────────
let session = null;
try {
  session = JSON.parse(localStorage.getItem(SESSION_KEY));
} catch {
  session = null;
}
const sessionListeners = new Set();

export const getUser = () => session?.user || null;
export function onSession(fn) {
  sessionListeners.add(fn);
  return () => sessionListeners.delete(fn);
}
function setSession(s) {
  session = s;
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  sessionListeners.forEach((f) => f(s?.user || null));
}
export const logout = () => setSession(null);

function decodeJwt(token) {
  try {
    const payload = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// ───────── Mode : 'api' (backend joignable), 'demo' (backend simulé) ou 'down' (injoignable, sans démo) ─────────
let mode = 'api';
const modeListeners = new Set();
export const getMode = () => mode;
export function onModeChange(fn) {
  modeListeners.add(fn);
  return () => modeListeners.delete(fn);
}
function setMode(m) {
  if (mode === m) return;
  mode = m;
  // Une session créée dans l'autre mode (API réelle ou démo) n'est pas valable ici : reconnexion nécessaire
  if (session && m !== 'down' && (m === 'demo') !== Boolean(session.demo)) setSession(null);
  modeListeners.forEach((f) => f(m));
}

// ───────── Client HTTP ─────────
async function http(path, { method = 'GET', body } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (session && !session.demo && session.token) headers.Authorization = `Bearer ${session.token}`;
    const res = await fetch(BASE + path, {
      method,
      headers,
      signal: ctrl.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const err = new Error(data?.message || data?.msg || data?.error || data?.erreur || `Erreur serveur (${res.status})`);
      err.status = res.status;
      if (res.status === 401 && session && !path.startsWith('/auth/')) logout(); // jeton expiré
      throw err;
    }
    setMode('api');
    return res.status === 204 ? null : await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// L'API répond-elle ? (GET /medecins est public ; toute réponse < 500 prouve que le backend est vivant)
async function ping() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${BASE}/medecins`, { signal: ctrl.signal });
    // Une page HTML (SPA ou page d'erreur d'un proxy) n'est pas notre API JSON
    return res.status < 500 && !(res.headers.get('content-type') || '').includes('text/html');
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth() {
  const alive = await ping();
  setMode(alive ? 'api' : DEMO_ENABLED ? 'demo' : 'down');
  return alive;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Exécute une opération sur le backend simulé (chargé à la demande)
const local = (fn) => () => loadDemo().then((m) => sleep(250).then(() => fn(m.demo)));

// Erreurs métier (400, 401, 403, 409, 422…) : remontées à l'interface.
// Réseau coupé, 404 ou 5xx : on vérifie que l'API est réellement absente avant de passer en démo (ou en erreur).
async function withFallback(remote, localFn) {
  if (mode === 'demo') return localFn();
  try {
    return await remote();
  } catch (e) {
    const suspect = !e.status || e.status >= 500 || e.status === 404;
    if (suspect && !(await ping())) {
      if (DEMO_ENABLED) {
        setMode('demo');
        return localFn();
      }
      setMode('down');
      throw new Error('L’API est injoignable. Réessayez dans un instant.');
    }
    throw e;
  }
}

const qs = (obj = {}) => {
  const p = new URLSearchParams(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const s = p.toString();
  return s ? `?${s}` : '';
};

const call = (path, opts, localFn, map = (x) => x) => withFallback(() => http(path, opts), local(localFn)).then(map);
const me = () => session?.user;
const list = (fn) => (l) => (Array.isArray(l) ? l : []).map(fn);

// ───────── API publique utilisée par les pages ─────────
export const api = {
  // Comptes fictifs affichés sur la page de connexion en mode démo (null si le mode démo est désactivé)
  async demoAccounts() {
    if (!DEMO_ENABLED) return null;
    const m = await loadDemo();
    return { password: m.DEMO_PASSWORD, patient: m.demoEmail('Awa', 'Diop'), medecin: m.demoEmail('Cheikh', 'Fall') };
  },

  // POST /api/auth/register
  register: (d) => call('/auth/register', { method: 'POST', body: d }, (db) => db.register(d)),

  // POST /api/auth/login -> jeton JWT ; le profil vient de la réponse ou des claims du jeton
  async login(email, password) {
    const res = await withFallback(
      () => http('/auth/login', { method: 'POST', body: { email, mot_de_passe: password } }),
      local((db) => db.login(email, password))
    );
    const token = res.token || res.access_token;
    const claims = decodeJwt(token) || {};
    const u = res.utilisateur || res.user || {};
    const user = {
      id: Number(u.id ?? claims.sub ?? claims.id ?? claims.identity),
      nom: u.nom || '',
      prenom: u.prenom || '',
      email: u.email || email,
      role: String(u.role ?? claims.role ?? '').toUpperCase(),
    };
    setSession({ token, user, demo: mode === 'demo' });
    return user;
  },

  // GET /api/medecins?specialite=...  (filtre appliqué côté serveur)
  medecins: (specialite) => call(`/medecins${qs({ specialite })}`, {}, (db) => db.medecins(specialite), list(normMedecin)),

  // GET /api/medecins/{id}/disponibilites   (créneaux libres) ; toutes=true : tous les créneaux du médecin connecté
  disponibilites: (idMedecin, toutes = false) =>
    call(
      `/medecins/${idMedecin}/disponibilites${qs({ toutes: toutes || undefined })}`,
      {},
      (db) => db.disponibilites(idMedecin, toutes),
      list(normSlot)
    ),
  // POST /api/medecins/{id}/disponibilites  ·  DELETE /api/disponibilites/{id}
  creerDisponibilite: (idMedecin, { debut, fin }) =>
    call(
      `/medecins/${idMedecin}/disponibilites`,
      { method: 'POST', body: { date_heure_debut: debut, date_heure_fin: fin } },
      (db) => db.creerDisponibilite(me(), idMedecin, { date_heure_debut: debut, date_heure_fin: fin }),
      normSlot
    ),
  supprimerDisponibilite: (id) => call(`/disponibilites/${id}`, { method: 'DELETE' }, (db) => db.supprimerDisponibilite(me(), id)),

  // POST /api/rendezvous  { id_medecin, id_creneau, motif }  -> 201, ou 409 si le créneau vient d'être pris
  reserver: (body) => call('/rendezvous', { method: 'POST', body }, (db) => db.reserver(me(), body), normRdv),

  // GET /api/patients/{id}/rendezvous  ·  GET /api/medecins/{id}/rendezvous?date=AAAA-MM-JJ (date facultative)
  rdvPatient: (idPatient) => call(`/patients/${idPatient}/rendezvous`, {}, (db) => db.rdvPatient(idPatient), list(normRdv)),
  rdvMedecin: (idMedecin, date) =>
    call(`/medecins/${idMedecin}/rendezvous${qs({ date })}`, {}, (db) => db.rdvMedecin(idMedecin, date), list(normRdv)),

  // PUT /api/rendezvous/{id}  { statut } ou { id_creneau } (modifier)
  majRdv: (id, patch) => call(`/rendezvous/${id}`, { method: 'PUT', body: patch }, (db) => db.majRdv(me(), id, patch), normRdv),

  // GET /api/patients/{id}/ordonnances  ·  GET /api/medecins/{id}/ordonnances
  ordonnancesPatient: (id) => call(`/patients/${id}/ordonnances`, {}, (db) => db.ordonnancesPatient(id), list(normOrdonnance)),
  ordonnancesMedecin: (id) => call(`/medecins/${id}/ordonnances`, {}, (db) => db.ordonnancesMedecin(id), list(normOrdonnance)),

  // POST /api/rendezvous/{id}/ordonnance  { instructions, lignes: [{ medicament, posologie, duree, quantite }] }
  creerOrdonnance: (idRdv, body) =>
    call(`/rendezvous/${idRdv}/ordonnance`, { method: 'POST', body }, (db) => db.creerOrdonnance(me(), idRdv, body), normOrdonnance),
};
