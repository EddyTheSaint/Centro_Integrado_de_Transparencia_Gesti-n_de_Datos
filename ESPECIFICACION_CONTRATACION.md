# Especificación: Cargador de Contratación

## Estado: INFERIDA_DESDE_PBIX (Pendiente confirmación con Excel RAW)

Documento generado a partir del análisis del tablero OBSERVATORIO.pbix (página Contratación).

---

## Columnas Esperadas en el Excel RAW

### CRÍTICAS (Requeridas para validación exitosa)

| Campo lógico | Aliases aceptados | Tipo esperado | Descripción |
|---|---|---|---|
| **Sujeto de Control** | SUJETO_DE_CONTROL<br/>SUJETO DE CONTROL<br/>SUJETO CONTROL | Texto | Entidad responsable del contrato (ej: Alcaldía, Empresa, etc.) |
| **Contratista** | CONTRATISTA<br/>NOMBRE_CONTRATISTA<br/>NOMBRE CONTRATISTA | Texto | Nombre de la persona/empresa contratada |
| **Proceso de Contratación** | PROCESO_DE_CONTRATACION<br/>PROCESO DE CONTRATACION<br/>TIPO_PROCESO<br/>PROCESO | Texto | Tipo de proceso (Licititation, Directo, etc.) |
| **Sector del Proyecto** | SECTOR_DEL_PROYECTO<br/>SECTOR DEL PROYECTO<br/>SECTOR<br/>SECTOR_PROYECTO | Texto | Área del proyecto (Educación, Salud, etc.) |
| **Valor Contratado** | VALOR_CONTRATADO<br/>VALOR CONTRATADO<br/>MONTO<br/>VALOR | Número | Monto del contrato en pesos (COP) |

### RECOMENDADAS (Mejoran el análisis)

| Campo lógico | Aliases aceptados | Tipo esperado | Descripción |
|---|---|---|---|
| **Fecha** | FECHA<br/>FECHA_CONTRATO<br/>FECHA CONTRATO | Fecha | Fecha de registro o firma del contrato |
| **Evento** | EVENTO<br/>TIPO_EVENTO<br/>TIPO EVENTO | Texto/Número | Tipo de evento (1=Principal, 2=Adiciones, 3=Prórrogas, 4=Terminaciones) |

---

## Criterios de Validación

✅ **Validación OK** si:
- Presentes las 5 columnas CRÍTICAS
- Valores de VALOR_CONTRATADO son numéricos
- Registros de EVENTO = "1" o "Principal" (si está presente)

⚠️ **Validación CON ADVERTENCIAS** si:
- Falta FECHA (opcional)
- Falta EVENTO (opcional)
- Hay registros vacíos en campos CRÍTICOS
- Hay valores no numéricos en VALOR_CONTRATADO

❌ **Validación RECHAZADA** si:
- Falta alguna de las 5 columnas CRÍTICAS
- Todas las filas tienen VALOR_CONTRATADO vacío

---

## Salidas Generadas por el Cargador

### 1. **Dashboard de Contratación**

Si la validación es exitosa y hay datos:

**KPIs:**
- Número de Contratos (COUNT)
- Valor Total Contratado (SUM)
- Valor Promedio por Contrato (AVERAGE)
- Total de registros en fuente

**Gráficas (Top 15 cada una):**
- Contratistas (ordenados por Valor Contratado descendente)
- Procesos de Contratación (ordenados por Valor Contratado descendente)
- Sujetos de Control (ordenados por Valor Contratado descendente)
- Sectores del Proyecto (ordenados por Valor Contratado descendente)

**Filtro interactivo:**
- Selector de Sujeto de Control (afecta todos los visuales)

### 2. **Archivos Guardados**

- `RAW`: Archivo original cargado (backup)
- `normalizado.xlsx`: Datos después de normalización
- `validacion.json`: Reporte de validación con errores y advertencias
- `validacion.xlsx`: Resumen visual de validación

---

## Proceso de Normalización

El cargador aplica automáticamente:

1. **Limpieza de espacios** en textos
2. **Conversión de tipos** para VALOR_CONTRATADO (a número)
3. **Validación de fechas** (si está presente)
4. **Validación de eventos** (si está presente)
5. **Registro de reglas aplicadas** (para auditoría)

**Nota:** No modifica datos sin registrar la modificación.

---

## Ejemplo de Estructura Correcta

```
SUJETO_DE_CONTROL | CONTRATISTA | PROCESO_DE_CONTRATACION | SECTOR_DEL_PROYECTO | VALOR_CONTRATADO | FECHA      | EVENTO
-----------------|-------------|------------------------|-------------------|-----------------|-----------|-------
Alcaldía Medellín | Acme Corp   | Licititation Pública   | Educación         | 1500000.50      | 2026-08-01| 1
Alcaldía Medellín | XYZ SAS     | Contratación Directa   | Salud             | 2000000.00      | 2026-08-15| 1
Corp. Admin      | Tech Ideas  | Invitación             | Infraestructura    | 5000000.25      | 2026-08-20| 1
```

---

## ¿Qué Falta Confirmar con el Excel RAW?

### 1. **Nombres exactos de columnas**
   - ¿Se llama "SUJETO_DE_CONTROL" o "SUJETO DE CONTROL"?
   - ¿Se llama "VALOR_CONTRATADO" o algo diferente?

### 2. **Valores únicos en categóricas**
   - ¿Cuáles son los valores reales de "Sujeto de Control"?
   - ¿Cuáles son los "Procesos de Contratación" usados?
   - ¿Cuáles son los "Sectores del Proyecto"?

### 3. **Formato de datos**
   - ¿Valor Contratado es número o texto?
   - ¿Fecha es formato DATE o texto?
   - ¿Evento es número (1,2,3) o texto ("Principal", "Adiciones")?

### 4. **Período de datos**
   - ¿Solo agosto 2026 o datos históricos?
   - ¿Todos los eventos o solo evento 1?

### 5. **Valores especiales**
   - ¿Hay valores vacíos, nulos o "(VACÍO)"?
   - ¿Hay valores negativos o cero en Valor Contratado?

---

## Próximos Pasos

1. **Obtener Excel RAW** de Contratación
2. **Cargar en el cargador** (seleccionar proceso "Contratación")
3. **Revisar validación** y advertencias
4. **Confirmar estructura** con los datos reales
5. **Actualizar catálogos** con valores únicos confirmados
6. **Agregar reglas de normalización** si hay inconsistencias

---

## Archivos del Cargador

- `src/catalogs/contratacion.catalog.js` - Definición de campos y normalizaciones
- `src/validators/contratacion.validator.js` - Validador con aliases configurables
- `src/normalizers/contratacion.normalizer.js` - Normalización automática
- `src/services/dashboard-contratacion.service.js` - Generación de dashboard

---

**Generado:** 2026-09-20  
**Estado:** Implementación base completa  
**Próximo paso:** Confirmación con Excel RAW
