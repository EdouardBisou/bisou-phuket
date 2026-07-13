/**
 * Deploys the Sanity Studio to https://bisouphuket.sanity.studio without an
 * interactive `sanity login`. It authenticates with a Deploy-Studio-scoped
 * token read from the environment or .env.local, so the studio can be
 * redeployed (e.g. after a schema change) with one command:
 *
 *     npm run sanity:deploy
 *
 * Token resolution order:
 *   1. SANITY_DEPLOY_TOKEN   (env or .env.local) — role "Deploy Studio" only
 *   2. SANITY_AUTH_TOKEN     (env)
 *   3. SANITY_API_WRITE_TOKEN(.env.local) — fallback; usually lacks deployStudio
 *
 * Create the token at https://www.sanity.io/manage/project/5oq4q4y4/api
 * (Tokens -> Add API token -> permission "Deploy Studio (Token only)").
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function fromEnvFile(key) {
  try {
    const env = readFileSync(path.join(ROOT, '.env.local'), 'utf-8');
    const m = env.match(new RegExp(`^${key}=(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  } catch {
    return '';
  }
}
const val = (key) => process.env[key] || fromEnvFile(key);

const token =
  val('SANITY_DEPLOY_TOKEN') ||
  process.env.SANITY_AUTH_TOKEN ||
  val('SANITY_API_WRITE_TOKEN');

if (!token) {
  console.error(
    'No deploy token found. Add SANITY_DEPLOY_TOKEN to .env.local\n' +
    '(create one at https://www.sanity.io/manage/project/5oq4q4y4/api,\n' +
    ' permission "Deploy Studio (Token only)"), or run `npx sanity login` first.'
  );
  process.exit(1);
}

const env = {
  ...process.env,
  SANITY_AUTH_TOKEN: token,
  NEXT_PUBLIC_SANITY_PROJECT_ID: val('NEXT_PUBLIC_SANITY_PROJECT_ID') || '5oq4q4y4',
  NEXT_PUBLIC_SANITY_DATASET: val('NEXT_PUBLIC_SANITY_DATASET') || 'production'
};

const res = spawnSync('npx', ['sanity', 'deploy', '--no-open'], {
  stdio: 'inherit',
  env,
  cwd: ROOT,
  shell: true
});
process.exit(res.status ?? 0);
