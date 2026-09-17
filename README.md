# CIT Cargador MVP v0.3

Vertical local para cargar Excel mensuales, validar estructura, normalizar datos PQRSD sin alterar el RAW, generar reportes y mostrar un dashboard inicial.

## Ejecutar

Necesitas Node.js 20+.

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Probar con el Excel de julio

1. Selecciona `PQRSD`.
2. Selecciona el periodo de julio.
3. Carga el Excel real de julio.
4. Presiona `Cargar y validar`.
5. Revisa:
   - resultado de validacion,
   - reglas de normalizacion aplicadas,
   - dashboard PQRSD,
   - rutas de archivos generados.

La carga valida genera archivos en:

```text
storage/cargas/<idCarga>/
```

## Separacion v0.3

- RAW: copia exacta del archivo recibido.
- Normalizado: nuevo Excel `normalizado.xlsx`.
- Reglas aplicadas: arreglo auditado con campo, valor original, valor normalizado, regla y cantidad afectada.
- Reporte de validacion: `validacion.json` y `validacion.xlsx`.
- Historico: `historico.json`.

## Normalizacion PQRSD

Los mapeos viven en:

```text
src/catalogs/pqrsd.catalog.js
```

No se inventan equivalencias de negocio. Solo se normalizan valores configurados ahi. El RAW no se modifica.

## SharePoint

`src/services/sharepoint.service.js` expone el contrato:

- `guardarRaw()`
- `guardarNormalizado()`
- `guardarValidacion()`
- `registrarHistorico()`

Por ahora guarda en local. No implementa Microsoft Graph, no usa credenciales hardcodeadas y queda listo para reemplazar el backend de almacenamiento mas adelante.
