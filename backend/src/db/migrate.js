import { migrate, close } from './index.js';

const kind = await migrate();
console.log(`[migrate] Schema applied (${kind}).`);
await close();
