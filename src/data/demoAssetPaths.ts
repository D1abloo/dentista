/** Rutas públicas de archivos demo (`public/demo/`). */
export const demoAsset = {
  prueba: (file: string) => `/demo/prueba/${file}`,
  factura: (file: string) => `/demo/facturas/${file}`,
  documento: (file: string) => `/demo/documentos/${file}`,
  consentimiento: (file: string) => `/demo/consentimientos/${file}`,
  informe: (file: string) => `/demo/informes/${file}`
} as const;
