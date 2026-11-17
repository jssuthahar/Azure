/**
 * Lazy Firebase. Nothing here runs or downloads until a feature asks for it,
 * so learners who never sign in only load the small Firestore Lite client,
 * and only when a usage count is sent.
 */
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore/lite';
import { FIREBASE } from '../../config';

let appP: Promise<FirebaseApp> | null = null;
let authP: Promise<Auth> | null = null;
let dbP: Promise<Firestore> | null = null;

export const app = () =>
  (appP ??= import('firebase/app').then(({ initializeApp, getApps }) => getApps()[0] ?? initializeApp(FIREBASE)));

export const auth = () =>
  (authP ??= Promise.all([import('firebase/auth'), app()]).then(([m, a]) => m.getAuth(a)));

export const db = () =>
  (dbP ??= Promise.all([import('firebase/firestore/lite'), app()]).then(([m, a]) => m.getFirestore(a)));
