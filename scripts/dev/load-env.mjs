import dotenv from 'dotenv';

export function loadEnvironment(env = process.env) {
  for (const file of [env.ENV_LOCAL_FILE || '.env.local', env.ENV_FILE || '.env']) {
    dotenv.config({ path: file, processEnv: env, quiet: true });
  }
}

loadEnvironment();
