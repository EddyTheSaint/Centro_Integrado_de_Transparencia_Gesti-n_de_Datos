# Implementación BUEN_COMIENZO - v0.1

## Resumen de Cambios

Se agregó soporte completo para el proceso **BUEN_COMIENZO** manteniendo intacto el módulo PQRSD existente.

### Archivos Creados

#### 1. Catálogo de Campos y Normalizaciones
**`src/catalogs/buenComienzo.catalog.js`**
- Define campos esperados: ID, COMUNA, CORREGIMIENTO, NIÑAS, NIÑOS, TOTAL, MODALIDAD, PRESUPUESTO_ASIGNADO, PRESUPUESTO_EJECUTADO, MES, FECHA_CORTE
- Reglas de normalización para:
  - **Modalidades**: CENTRO INFANTIL, JARDÍN INFANTIL, INSTITUCIONAL FLEXIBLE, ENTORNO FAMILIAR
  - **Comunas**: Las 16 comunas de Medellín (POPULAR, SANTA CRUZ, MANRIQUE, etc.)

#### 2. Validador
**`src/validators/buenComienzo.validator.js`**
- Validaciones críticas:
  - Requiere columna COMUNA
  - Requiere al menos una: TOTAL, NIÑAS o NIÑOS
  - Detecta automáticamente columns por aliases flexibles
- Reporta:
  - Comunas vacías
  - Niñas/Niños/Total vacíos
  - Presupuestos no informados
  - Categorías detectadas (modalidades y comunas)

#### 3. Normalizador
**`src/normalizers/buenComienzo.normalizer.js`**
- Normaliza valores en MODALIDAD y COMUNA contra el catálogo
- **Importante**: Calcula TOTAL = NIÑAS + NIÑOS si TOTAL no existe
- Registra todas las aplicaciones de reglas

#### 4. Dashboard Service
**`src/services/dashboard-buen-comienzo.service.js`**
- Genera 6 KPIs:
  - Total Beneficiarios
  - Total Niñas
  - Total Niños
  - Comunas Cubiertas (conteo único)
  - % Comunas Cubiertas (÷ 16)
  - Presupuesto Asignado
  - Presupuesto Ejecutado
  - Tasa de Ejecución (%)

- Genera 3 Gráficas:
  - Beneficiarios por Modalidad (suma)
  - Beneficiarios por Comuna (suma)
  - Beneficiarios por Sexo (desglose Niñas/Niños)

### Archivos Modificados

#### 1. `src/validators/index.js`
- Agregada importación y registro de `buenComienzo` validator

#### 2. `src/normalizers/index.js`
- Agregada importación y registro de `normalizarBuenComienzo` normalizer

#### 3. `src/services/dashboard.service.js`
- Importado `crearDashboardBuenComienzo`
- Actualizada función `crearDashboard()` para delegar a servicio específico según proceso

#### 4. `public/index.html`
- Agregada opción "Buen Comienzo" en selector de procesos
- Actualizada sección de dashboard con contenedor de KPIs
- Actualizada función `renderDashboard()` para renderizar dinámicamente según tipo de dashboard
  - PQRSD: muestra gráficas de tipo/medio/comuna/estado
  - BUEN_COMIENZO: muestra KPIs + gráficas de modalidad/comuna/sexo

## Instrucciones de Prueba

### Formato Esperado del Archivo

El archivo BUEN_COMIENZO.xlsx debe tener una hoja con estructura similar a:

| COMUNA | CORREGIMIENTO | NIÑAS | NIÑOS | MODALIDAD | PRESUPUESTO_ASIGNADO | PRESUPUESTO_EJECUTADO |
|--------|---------------|-------|-------|-----------|---------------------|----------------------|
| POPULAR | | 150 | 140 | CENTRO INFANTIL | 50000000 | 45000000 |
| SANTA CRUZ | | 200 | 210 | JARDÍN INFANTIL | 60000000 | 58000000 |
| MANRIQUE | | 180 | 175 | ENTORNO FAMILIAR | 40000000 | 38000000 |

**Columnas Reconocidas** (nombres alternativos):
- **COMUNA**: NOMBRE COMUNA
- **NIÑAS**: NINAS
- **NIÑOS**: NINOS
- **TOTAL**: TOTAL BENEFICIARIOS
- **PRESUPUESTO_ASIGNADO**: PRESUPUESTO ASIGNADO, PRESUPUESTO APROBADO
- **PRESUPUESTO_EJECUTADO**: PRESUPUESTO EJECUTADO
- **FECHA_CORTE**: FECHA CORTE

### Prueba Manual

1. **Iniciar servidor**:
```bash
npm start
```
Acceder a http://localhost:3000

2. **Cargar archivo**:
   - Seleccionar proceso: **Buen Comienzo**
   - Seleccionar período: (cualquier mes/año)
   - Seleccionar archivo: BD_BUEN_COMIENZO_MAYO.xlsx (u otro formato válido)

3. **Resultado Esperado**:
   - **Estado**: VALIDADO (si no hay errores críticos)
   - **KPIs mostrados**:
     - Total Beneficiarios: suma de TOTAL o NIÑAS+NIÑOS
     - Niñas: suma de columna NIÑAS
     - Niños: suma de columna NIÑOS
     - % Comunas Cubiertas: (comunas con beneficiarios ÷ 16) × 100%
   - **Gráficas**:
     - Beneficiarios por Modalidad (barras horizontales)
     - Beneficiarios por Comuna (top 12)
     - Desglose Niñas/Niños

4. **Archivos Generados**:
   - RAW: copia del archivo original
   - Normalizado (XLSX): datos normalizados
   - Validación (XLSX + JSON): reporte de validación y reglas aplicadas
   - Histórico: metadata de la carga

## Notas Técnicas

### Arquitectura Modular
- Mismo patrón que PQRSD
- Catalogo independiente
- Validador específico
- Normalizador específico
- Dashboard service específico
- No hay código compartido roto

### Reglas Implementadas

**No inventadas** - Derivan de estructura de datos:
- `BC-ESTRUCTURA`: validación de columnas requeridas
- `BC-COMUNA-VACIA`: alerta si COMUNA está vacía
- `BC-MODALIDAD-*`: normalización de modalidades
- `BC-COMUNA-*`: normalización de comunas
- `BC-TOTAL-CALCULADO`: cuando se calcula TOTAL de NIÑAS+NIÑOS

### Datos RAW vs Normalizado

El archivo BD_BUEN_COMIENZO_MAYO.xlsx tiene múltiples hojas:
- El sistema lee automáticamente la **primera hoja** (configurable)
- Detecta automáticamente nombres de columnas
- Si faltan columnas requeridas, reporta en VALIDACION

## Diferencias Detectadas RAW → Normalizado

(A confirmar después de primera carga real)

El archivo RAW observado contiene:
- Múltiples hojas (Consolidado, Cobertura, Presupuesto, etc.)
- Datos por año, secretaría, y presupuesto (no beneficiarios por comuna directamente)
- Estructura de tablas pivotadas

**Acción requerida**: Proporcionar ejemplo de archivo normalizado o confirmar qué hoja del RAW contiene datos de beneficiarios por modalidad/comuna.

## Próximos Pasos

1. Validar formato exacto del archivo RAW
2. Derivar reglas adicionales de normalizacion si existen conversiones no cubiertas
3. Implementar gráfica adicional si se requieren más vistas
4. Almacenamiento en base de datos (si está planeado)
