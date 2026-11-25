import { createApp } from './app.js';
import { config } from './config.js';
import { migrate } from './db/index.js';
import { runSeed } from './db/seed.js';

const kind = await migrate();
await runSeed();

createApp().listen(config.port, () => {
  console.log(`[api] ESC certification API on http://localhost:${config.port} (database: ${kind})`);
});
