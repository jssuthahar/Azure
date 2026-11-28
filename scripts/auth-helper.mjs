/**
 * Self-hosted Firebase Auth helper (so Google shows "continue to azure.msdevbuild.com"
 * instead of msdevbuild-azure.firebaseapp.com). The script itself is shared with the blog:
 * @msdevbuild/config/scripts/auth-helper.mjs. This passes Azure's host and key.
 *
 *   npm run auth-helper     re-run every few months, or if sign-in starts failing
 *
 * GitHub Pages serves /__/auth/handler from handler.html (extensionless URLs map to .html).
 */
import { FIREBASE_SOURCE, AUTH_HOST } from './auth-helper.config.mjs';

process.argv.push('--host', AUTH_HOST, '--api-key', FIREBASE_SOURCE.apiKey);
await import('@msdevbuild/config/scripts/auth-helper.mjs');
