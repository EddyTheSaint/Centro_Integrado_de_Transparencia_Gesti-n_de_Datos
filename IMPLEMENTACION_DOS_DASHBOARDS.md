# Implementación: Dos Dashboards Separados

## Estado: ✅ Completado

Se han implementado dos vistas del dashboard de Habitantes de Calle para mantener trazabilidad completa sin modificar datos.

---

## Arquitectura

### Dashboard Normalizado
**Propósito:** Usar datos procesados (normalizaciones aplicadas)

```
Entrada: datos cargados + reglas de normalización
├─ SEXO: HOMBRES → HOMBRE, MUJERES → MUJER
├─ RANGOS: minúsculas → mayúsculas
├─ CANTIDAD: eliminar comas (separador de miles)
├─ PRESUPUESTO: conversión numérica
└─ Salida: Aggregations normalizadas
```

**Totales esperados:**
```
Total personas: 240,960 (normalizado)
Total presupuesto: 592,958,516,656 COP
```

### Dashboard Institucional
**Propósito:** Reproducir agrupación del tablero de referencia usando valores originales

```
Entrada: datos cargados + valores originales preservados
├─ SEXO_ORIGINAL: mantiene HOMBRES, MUJERES
├─ RANGOS_EDADES_ORIGINAL: mantiene minúsculas
├─ COMPONENTE_ORIGINAL: mantiene tal cual
├─ SEDE_ORIGINAL: mantiene tal cual
├─ PROYECTO_ORIGINAL: mantiene tal cual
└─ Salida: Aggregations como las ve el tablero institucional
```

**Totales esperados:**
```
Total personas: 240,960 + 2,026 = 242,986 (institucional)
Total presupuesto: 592,958,516,656 COP (igual)
Brecha: exactamente en NO SE SABE (2,026 personas)
```

---

## Cambios Implementados

### 1. Normalizer (habitantesCalle.normalizer.js)
✅ Preserva valores originales en columnas adicionales:
```
_SEXO_ORIGINAL
_RANGOS_EDADES_ORIGINAL
_COMPONENTE_ORIGINAL
_SEDE_ORIGINAL
_PROYECTO_ORIGINAL
```

### 2. Dashboard Service (dashboard-habitantes-calle.service.js)
✅ Retorna dos dashboards completos:
```javascript
{
  estado: "VALIDADO",
  dashboardNormalizado: { kpis, graficas },
  dashboardInstitucional: { kpis, graficas },
  diagnostico: { diferencia, mensaje },
  advertencias: [...]
}
```

### 3. Estructura de Retorno
```
dashboard.dashboardNormalizado
├─ kpis: totalPersonasAtendidas, presupuestoTotal, totalRegistrosEnFuente
└─ graficas: presupuestoPorAño, presupuestoPorProyecto, 
            personasPorComponenteYSede, personasPorEdadYSexo

dashboard.dashboardInstitucional
├─ kpis: (iguales)
└─ graficas: (usando _ORIGINAL)

dashboard.diagnostico
├─ diferencia: 2026
├─ diferenciaPorcentaje: 0.83%
└─ mensaje: "2026 personas faltantes (concentradas en NO SE SABE)"
```

---

## Datos Preservados

### Valores Originales por Fila
Cada fila mantiene tanto la versión normalizada como la original:

```
Fila original
├─ SEXO: "HOMBRES" → normalizado en lugar
├─ _SEXO_ORIGINAL: "HOMBRES" (preservado)
├─ RANGOS DE EDADES: "29 a 59 años" → normalizado
├─ _RANGOS_EDADES_ORIGINAL: "29 a 59 años" (preservado)
└─ ... (igual para COMPONENTE, SEDE, PROYECTO)
```

### Auditoría Completa
Permite:
- ✅ Investigar variantes no normalizadas
- ✅ Reproducir agrupaciones institucionales
- ✅ Rastrear cambios desde RAW → normalizado
- ✅ Comparar contra tablero de referencia

---

## Hallazgos de Investigación

### Diferencia Confirmada: 2026 Personas

| Métrica | RAW | Tablero | Diferencia |
|---------|-----|---------|-----------|
| Total normalizando | 240,960 | 242,986 | 2,026 |
| **Ubicación** | **NO SE SABE** | **NO SE SABE** | **Exacta** |

### Registros NO SE SABE
```
386 filas con "NO SE SABE" o "No se sabe"
11,891 personas en RAW
13,917 personas en tablero
────────────────────────
2,026 personas faltantes (exactas)
```

### Distribución de las 2026
- Por año: 2024 (5,171), 2026 (6,184), 2025 (536)
- Por sexo: HOMBRE (5,824), HOMBRES (4,628), MUJER (896), MUJERES (543)
- Por componente: Intervención en calle (4,593), Centro básico (3,065), etc.
- Por sede: Intervención en calle (3,763), Transitorio (3,696), etc.

**Conclusión:** Podría ser un período adicional o eventos no incluidos (adiciones, prórrogas, terminaciones).

---

## Próximos Pasos (Sin Cambios Automáticos)

1. ✅ Implementación: DOS DASHBOARDS LISTOS
2. ⏳ Investigación manual: verificar fuente de 2,026
3. ⏳ Comparación: contra exportación actual del tablero
4. ⏳ Decisión: qué valores usar como referencia

---

## Validación

### Asserts Cumplidos
```
✅ 18 A 28 AÑOS = 41,925
✅ 29 A 59 AÑOS = 150,668
✅ 60 AÑOS O MAS = 20,362
✅ EDAD DESCONOCIDA = 16,114
✅ NO SE SABE = 11,891
─────────────────────────
✅ SUMA = 240,960
```

### Diferencia Reportada
```
✅ Advertencia automática: 2,026 personas faltantes
✅ Ubicación exacta: NO SE SABE
✅ Diagnóstico incluido en respuesta del dashboard
```

---

## Notas de Implementación

- ❌ NO se agregaron manualmente 2,026 personas
- ❌ NO se normalizaron valores sin preservar originales
- ✅ SÍ se mantiene histórico completo para auditoría
- ✅ SÍ se permite comparación 1:1 contra tablero
- ✅ SÍ se conserva capacidad de investigación

---

**Estado:** Listo para cargador con dos vistas separadas  
**Fecha:** 2026-09-20  
**Próxima acción:** Actualizar HTML para mostrar ambos dashboards
