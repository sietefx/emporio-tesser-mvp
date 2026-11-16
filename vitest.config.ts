import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // regras de negócio e segurança; as telas são cobertas pelo teste de fluxo no navegador
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/db.ts', 'src/lib/auth.ts', 'src/lib/consultas.ts', 'src/lib/formato.ts'],
      reporter: ['text', 'html'],
    },
  },
})
