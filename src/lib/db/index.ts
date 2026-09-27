// Connection-only compatibility entrypoint for scripts and infrastructure.
// Domain reads use the owning feature's server contract.
export { db, pool, pool as pgClient } from './client';
