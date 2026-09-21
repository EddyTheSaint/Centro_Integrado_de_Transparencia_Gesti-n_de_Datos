# Especificación: Cargador de Habitantes de Calle

## Estado: IMPLEMENTADO - Pendiente validación con Excel RAW

Documento de implementación basado en especificación real:
- Archivo: `BD_HABITANTE_CALLE_MAYO(1).xlsx`
- Hoja: `Datos`
- Registros: 2187
- Período: 2020-2026

---

## Columnas Reales del Excel RAW

| # | Columna | Tipo esperado | Descripción |
|---|---------|---------------|-------------|
| 1 | **AÑO** | Número | Año del registro (2020-2026) |
| 2 | **No. PROYECTO** | Texto | Identificador del proyecto |
| 3 | **Nombre del proyecto** | Texto | Nombre descriptivo del proyecto |
| 4 | **SEDE DE ATENCION** | Texto | Ubicación/sede de atención |
| 5 | **PROGRAMA** | Texto | Programa al que pertenece |
| 6 | **COMPONENTE** | Texto | Componente del programa |
| 7 | **SEXO** | Texto | Género (HOMBRE/HOMBRES, MUJER/MUJERES) |
| 8 | **RANGOS DE EDADES** | Texto | Rango etario (18-28, 29-59, 60+, NO SE SABE) |
| 9 | **CANTIDAD** | Número | Personas atendidas (cantidad) |
| 10 | **PRESUPUESTO** | Número | Presupuesto asignado/ejecutado |

---

## Normalizaciones Implementadas

### SEXO (automática)
```
HOMBRE  → HOMBRE
HOMBRES → HOMBRE (regla: HC-SEXO-HOMBRES-A-HOMBRE)
MUJER   → MUJER
MUJERES → MUJER (regla: HC-SEXO-MUJERES-A-MUJER)
```

### RANGOS DE EDADES (automática)
```
18 A 28 AÑOS     → 18 A 28 AÑOS
18 a 28 AÑOS     → 18 A 28 AÑOS (regla: HC-RANGO-18-28-MINUSCULAS)
29 A 59 AÑOS     → 29 A 59 AÑOS
29 a 59 años     → 29 A 59 AÑOS (regla: HC-RANGO-29-59-MINUSCULAS)
60 AÑOS O MAS    → 60 AÑOS O MAS
60 años o mas    → 60 AÑOS O MAS (regla: HC-RANGO-60-MAS-MINUSCULAS)
NO SE SABE       → NO SE SABE
No se sabe       → NO SE SABE (regla: HC-RANGO-NO-SE-SABE-MINUSCULAS)
```

**Nota:** Nombres de proyecto NO se normalizan automáticamente (pendiente definir catálogo)

---

## Validaciones de Integridad

### Valores de Control (para verificar integridad de carga)

| Métrica | Valor esperado | Nota |
|---------|---|---|
| **Total CANTIDAD** | 240,960 | Suma de todas las personas atendidas |
| **Total PRESUPUESTO** | 561,558,517 | Suma de todos los presupuestos |
| **Total FILAS** | 2,187 | Registros en el archivo |

**Presupuesto por año (para verificar):**
```
2020: 76,069,074 (~76.1M)
2021: 138,457,838 (~138.5M)
2022: 138,753,802 (~138.8M)
2023: 161,334,668 (~161.3M)
2024: 27,315,405 (~27.3M)
2025: 19,698,158 (~19.7M)
2026: 31,329,572 (~31.3M)
```

### Diferencia Conocida con Tablero Institucional

```
Tablero institucional: 242,986 personas
RAW actual:          240,960 personas
─────────────────────────────
Diferencia:            2,026 personas

Ubicación: Categoría "NO SE SABE" en RANGOS_DE_EDADES
  - RAW:     11,891 (incluyendo variantes)
  - Tablero: 13,917
  - Brecha:   2,026
```

**Comportamiento del cargador:**
- NO inventa los 2,026 registros
- Muestra advertencia clara sobre la diferencia
- Propósito: Trazabilidad, no forzar coincidencia
- Marca para futuro análisis y confirmación

---

## Dashboard Generado

### KPIs
- **Total Personas Atendidas** (suma de CANTIDAD)
- **Presupuesto Total** (suma de PRESUPUESTO)
- **Total Registros en Fuente** (cantidad de filas)
- **Advertencias** (contador de inconsistencias detectadas)

### Gráficas

1. **Presupuesto por Año** (línea temporal 2020-2026)
   - Ordenada cronológicamente
   - Permite ver evolución presupuestaria

2. **Presupuesto por Proyecto** (Top 20)
   - Identifica proyectos de mayor costo
   - Ordenados descendente por presupuesto

3. **Personas Atendidas por Componente y Sede** (Top 30 combinaciones)
   - Matriz componente × sede
   - Suma de personas por combinación
   - Permite analizar cobertura geográfica

4. **Personas Atendidas por Rango de Edades y Sexo**
   - Matriz rango de edad × sexo
   - Desglose demográfico completo
   - Incluye categoría "NO SE SABE"

---

## Advertencias Automáticas

El cargador detecta y reporta:

1. **HC-DIFERENCIA-TABLERO** (información)
   - Si CANTIDAD total ≠ 240,960
   - Muestra diferencia exacta y ubicación

2. **HC-RANGO-NO-SABE-DETECTADO** (información)
   - Detecta registros con "NO SE SABE"
   - Informa cantidad de personas en esa categoría

3. **Variantes detectadas en normalización**
   - Lista todos los valores únicos encontrados
   - Permite verificar que normalizaciones funcionan

---

## Archivos del Cargador

- `src/catalogs/habitantesCalle.catalog.js` - Definición de campos y normalizaciones
- `src/validators/habitantesCalle.validator.js` - Validador con detección de variantes
- `src/normalizers/habitantesCalle.normalizer.js` - Normalización automática
- `src/services/dashboard-habitantes-calle.service.js` - Generación de dashboard

---

## Cómo Usar

1. Cargar el archivo Excel en el cargador
   - Seleccionar proceso: **"Habitantes de Calle"**
   - Seleccionar periodo: (mes del archivo)
   - Seleccionar archivo: `BD_HABITANTE_CALLE_MAYO(1).xlsx`

2. Sistema validará:
   - Presencia de 10 columnas requeridas
   - Tipos de datos correctos
   - Suma de CANTIDAD = 240,960 (o reportará diferencia)
   - Variantes de SEXO y RANGOS DE EDADES

3. Sistema normalizará automáticamente:
   - Variantes de SEXO (HOMBRES → HOMBRE, etc.)
   - Variantes de RANGOS DE EDADES
   - Conversión de tipos (año, cantidad, presupuesto a números)

4. Dashboard mostrará:
   - KPIs generales
   - Gráficas de análisis por categoría
   - Advertencias sobre diferencias detectadas

---

## Validación de Integridad en Test

Para verificar que el Excel se cargó completo y correctamente:

**Verificar estos valores en el resumen:**
- Total Personas Atendidas: 240,960 ✓
- Total Presupuesto: 561,558,517 ✓
- Total Registros: 2,187 ✓

Si alguno es diferente:
- Revisar que el archivo esté completo
- Verificar que no hay filtros aplicados
- Confirmar que se cargó la hoja "Datos"

---

## Próximos Pasos

1. **Verificar integridad de carga**
   - Cargar el Excel y validar valores de control
   - Confirmar que sumas coinciden

2. **Revisar normalizaciones**
   - Verificar que variantes de SEXO se normalizan correctamente
   - Verificar que variantes de RANGOS se normalizan correctamente

3. **Definir catálogo de proyectos**
   - Una vez confirmado el RAW, definir fusiones/reclasificaciones
   - NO se hace automáticamente para evitar pérdida de trazabilidad

4. **Análisis de diferencia NO SE SABE**
   - Investigar por qué hay 2,026 registros menos
   - Determinar si es por período de corte o dato faltante

---

**Estado:** Implementación base 100% completa  
**Próximo paso:** Cargar y validar con Excel RAW  
**Fecha:** 2026-09-20

