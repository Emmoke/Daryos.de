// Eigener Build für die Verwaltungs-App (/verwaltung). Getrennt von der öffentlichen Webseite,
// damit deren Code keinerlei Verwaltungsfunktionen enthält.
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: path.resolve(__dirname, 'admin'),
  base: '/verwaltung/',
  plugins: [react(), tailwindcss()],
  build: { outDir: path.resolve(__dirname, 'dist-admin'), emptyOutDir: true },
});
