import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const ACTIONS_AUTORISEES = new Set([
  'lire', 'stats', 'ajouter', 'ajouterDonLibre', 'donLibreDetail',
  'rapportComplet', 'smsJamaisPayes', 'smsRetardMois', 'smsIncomplet', 'smsConfirmation',
  'smsPreview', 'smsHistorique', 'smsManuel', 'updateVersement', 'confirmerVersementMulti',
  'updateMembre', 'deleteMembre', 'saveEmail', 'envoyerEmailVers'
]);

function firebaseAuth() {
  if (!getApps().length) {
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey
      })
    });
  }
  return getAuth();
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async (request) => {
  if (request.method !== 'GET') return json({ success: false, error: 'Methode non autorisee' }, 405);

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return json({ success: false, error: 'Connexion requise' }, 401);

  let utilisateur;
  try {
    utilisateur = await firebaseAuth().verifyIdToken(token, true);
  } catch (e) {
    console.error('ECENA_AUTH_DEBUG', e && e.message ? e.message : e);
    return json({ success: false, error: 'Session invalide ou expiree', debug: (e && e.message) || String(e) }, 401);
  }

  const autorises = (process.env.ECENA_ALLOWED_EMAILS || '')
    .split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!utilisateur.email || !autorises.includes(utilisateur.email.toLowerCase())) {
    return json({ success: false, error: 'Compte non autorise' }, 403);
  }

  const entree = new URL(request.url);
  const action = entree.searchParams.get('action') || '';
  if (!ACTIONS_AUTORISEES.has(action)) {
    return json({ success: false, error: 'Action non autorisee' }, 400);
  }

  const urlAppsScript = process.env.APPS_SCRIPT_URL;
  const secret = process.env.ECENA_BACKEND_SECRET;
  if (!urlAppsScript || !secret) return json({ success: false, error: 'Configuration serveur incomplete' }, 500);

  const destination = new URL(urlAppsScript);
  entree.searchParams.forEach((value, key) => destination.searchParams.set(key, value));
  destination.searchParams.set('secret', secret);

  try {
    const reponse = await fetch(destination, { headers: { Accept: 'application/json' } });
    const corps = await reponse.text();
    return new Response(corps, {
      status: reponse.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } catch (_) {
    return json({ success: false, error: 'Service Google temporairement indisponible' }, 502);
  }
};

export const config = { path: '/api/ecena' };
