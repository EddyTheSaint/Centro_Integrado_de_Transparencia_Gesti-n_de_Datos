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

## Registro consolidado de cargas

Cada carga terminada por el nuevo flujo local actualiza automáticamente estos archivos:

```text
data/registro-cargas.csv
data/registro-cargas.json
```

Después de una escritura local exitosa, ambos archivos se publican mediante
reemplazo atómico en la carpeta sincronizada de SharePoint:

```text
C:\Users\user\itm.edu.co\Centro integrado de transparencia - gestión de datos. - General\CARGAS_OBSERVATORIOS\CONTROL
```

El CSV usa UTF-8 con BOM, encabezados estables y escape estándar de campos para
su consumo directo desde Power BI. Una carga se identifica por `idCarga`; volver
a registrar el mismo ID actualiza su fila y un reproceso con un ID nuevo conserva
ambas filas.

Para reconstruir el registro sin reprocesar archivos RAW:

```bash
npm run reconstruir-registro-cargas
```

Los normalizados `VALIDADO` de PQRSD y HABITANTE_DE_CALLE también se publican
automáticamente, mediante reemplazo atómico, como archivos estables para Power BI:

```text
CARGAS_OBSERVATORIOS/CONTROL/BI/PQRSD_actual.xlsx
CARGAS_OBSERVATORIOS/CONTROL/BI/HABITANTE_DE_CALLE_actual.xlsx
```

Para reconstruirlos desde la carga validada más reciente sin leer ni reprocesar RAW:

```bash
npm run reconstruir-bi
```

La reconstrucción oficial consulta únicamente `data/processed-files.json` y las
carpetas `03_VALIDACION` y `04_HISTORICO` del flujo local sincronizado. No
incorpora el histórico antiguo de `storage/cargas`. Al terminar también publica
el CSV y JSON en `CONTROL`. El registro está disponible como JSON en:

```text
GET /api/cargas-locales/registro
```

No se versionan archivos RAW, archivos generados, caches, credenciales ni secretos.

## Sincronización de respuestas de Microsoft Forms

Esta función es independiente del validador: descarga los adjuntos recibidos en
Forms y los conserva como RAW, sin normalizarlos ni rechazarlos por formato.

La salida tiene esta forma:

```text
<ruta destino>/<PROCESO>/<PERIODO>/FORMS_<Id>/01_RAW/<archivo original>
<ruta destino>/00_CONTROL/registro_respuestas_forms.json
```

1. Copia `config/forms-sync.example.json` como `config/forms-sync.json`.
2. Verifica la ruta `destinationRoot`; el ejemplo ya contiene la carpeta de
   Observatorios sincronizada en este equipo.
3. Registra una aplicación en Microsoft Entra ID y concédele el permiso de
   aplicación `Files.Read.All` (con consentimiento administrativo) para leer
   los archivos de OneDrive/SharePoint que pertenecen al formulario. Configura en la sesión las variables `MS_TENANT_ID`,
   `MS_CLIENT_ID` y `MS_CLIENT_SECRET`.
4. Ejecuta una simulación y luego la sincronización:

```powershell
npm run sync:forms -- --dry-run
npm run sync:forms
```

El proceso usa el `Id` de la respuesta de Forms para no descargar dos veces un
adjunto ya procesado. Las respuestas con fallo quedan con estado `ERROR` en el
registro y se reintentan en la siguiente ejecución. Para automatizarlo, crea
una tarea de Windows que ejecute `npm run sync:forms` cada 10 o 15 minutos.
