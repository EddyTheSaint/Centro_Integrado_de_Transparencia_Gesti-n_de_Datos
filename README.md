# CIT Cargador MVP

Proyecto local Node/Express para cargar archivos Excel, validar estructura, normalizar datos por proceso y generar reportes/dashboard.

## Ejecutar

Necesitas Node.js 20+.

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Procesos

### PQRSD

Estado: FUNCIONAL

Flujo actual:

- Excel
- Multer
- validacion
- normalizacion
- dashboard
- RAW local
- normalizado.xlsx
- validacion.json
- validacion.xlsx
- historico.json

### HABITANTES_CALLE

Estado: EN DESARROLLO / VALIDACION

RAW de referencia usado localmente:

```text
BD_HABITANTE_CALLE_MAYO.xlsx
```

No incluir el Excel en Git.

Resultado actual esperado del RAW:

- registros fuente: 2187
- SUM(CANTIDAD): 240960
- presupuesto total: 561628945101

Rangos normalizados:

- 18 A 28 AÑOS = 41925
- 29 A 59 AÑOS = 150668
- 60 AÑOS O MAS = 20362
- EDAD DESCONOCIDA = 16114
- NO SE SABE = 11891

Referencia tablero institucional:

```text
TOTAL = 242986
```

Diferencia pendiente de investigacion:

```text
2026 personas, concentradas en NO SE SABE.
```

Tambien queda pendiente revisar presupuesto 2026.

### BUEN_COMIENZO

Estado: PAUSADO / pendiente confirmar fuente exacta del tablero.

### CONTRATACION

Estado: PAUSADO / pendiente Excel RAW.

## Persistencia

La persistencia actual conserva copia local de los archivos generados en:

```text
storage/cargas/<idCarga>/
```

`src/services/sharepoint.service.js` mantiene el contrato:

- `guardarRaw()`
- `guardarNormalizado()`
- `guardarValidacion()`
- `registrarHistorico()`

No se versionan archivos RAW, archivos generados, caches, credenciales ni secretos.
