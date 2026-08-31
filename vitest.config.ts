import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // אותו כינוי שמוגדר ב-tsconfig, כדי שטסטים יוכלו לייבא כמו קוד רגיל.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
