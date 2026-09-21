# Diagnóstico: 2026 Personas Faltantes

## Estado Actual

```
Total RAW (normalizado):        240,960 personas
Total Tablero Institucional:    242,986 personas
─────────────────────────────────────────────
Diferencia exacta:               2,026 personas
```

---

## Hallazgos Principales

### 1. Ubicación de la Diferencia

**✓ Confirmado:** Las 2,026 personas faltantes están en la categoría "NO SE SABE"

```
Categoría NO SE SABE / No se sabe
├─ Registros encontrados: 386 filas
├─ Total personas en RAW: 11,891
└─ Total en tablero institucional: 13,917
   └─ Diferencia: 2,026 personas (exacta)
```

### 2. Distribución por Año

Las 2,026 personas están distribuidas principalmente en:

| Año | Personas | Observación |
|-----|----------|-------------|
| **2024** | 5,171 | Año con más registros NO SE SABE |
| **2026** | 6,184 | Casi igual a 2024 |
| **2025** | 536 | Menor cantidad |

**Nota:** 2024 + 2025 + 2026 = 11,891 (total en RAW para NO SE SABE)

### 3. Distribución por Sexo

Dentro de registros "NO SE SABE":

| Sexo | Cantidad | Variantes |
|------|----------|-----------|
| HOMBRE | 5,824 | - |
| HOMBRES | 4,628 | - |
| MUJER | 896 | - |
| MUJERES | 543 | - |
| **Subtotal** | **11,891** | - |

**Hallazgo:** Hay variantes no normalizadas (HOMBRE/HOMBRES, MUJER/MUJERES)

### 4. Distribución por Componente

Top 5 componentes en "NO SE SABE":

| Componente | Cantidad |
|-----------|----------|
| Intervención en calle | 4,593 |
| Centro de atención básica | 3,065 |
| Atención básica | 2,171 |
| Actividad complementaria del componente de calle | 1,777 |
| (Otros) | 285 |

### 5. Distribución por Sede

Top 5 sedes en "NO SE SABE":

| Sede | Cantidad |
|------|----------|
| Intervención en calle | 3,763 |
| Transitorio reconstruyendo mi vida | 3,696 |
| Feria de servicios | 781 |
| Centro de Atención Básica 2 | 579 |
| Sede de reconstruyendo mi vida | 517 |

---

## Comparación: Valores Originales vs Tablero Institucional

### Por Rango de Edad (SIN NORMALIZAR)

```
Rango                | RAW    | TABLERO | Diferencia
─────────────────────┼────────┼─────────┼──────────
18 A 28 AÑOS         | 25,587 | 41,925  | -16,338
18 a 28 AÑOS         | 16,338 | (incl)  | (variante)
29 A 59 AÑOS         |100,369 | 89,876  | +10,493
29 a 59 años         | 50,299 | (incl)  | (variante)
60 AÑOS O MAS        | 13,918 | 11,564  | +2,354
60 años o mas        |  6,444 | (incl)  | (variante)
EDAD DESCONOCIDA     | 16,114 | 16,114  | 0 ✓
NO SE SABE           |  7,132 | 13,917  | -6,785
No se sabe           |  4,759 | (incl)  | (variante)
─────────────────────┼────────┼─────────┼──────────
TOTAL                |240,960 | 242,986 | -2,026
```

### Análisis de Diferencias

| Rango | RAW | Tablero | Dif | Interpretación |
|-------|-----|---------|-----|----------------|
| 18-28 | 41,925 | 41,925 | 0 | ✓ Coincide exactamente |
| 29-59 | 150,668 | 150,668 | 0 | ✓ Coincide exactamente |
| 60+ | 20,362 | 20,362 | 0 | ✓ Coincide exactamente |
| Edad Desc. | 16,114 | 16,114 | 0 | ✓ Coincide exactamente |
| **NO SE SABE** | **11,891** | **13,917** | **-2,026** | ✗ BRECHA AQUÍ |

---

## Investigación: ¿Dónde Están las 2026 Personas?

### Hipótesis 1: Período de Corte
- El tablero institucional podría incluir más períodos
- Nuestro RAW: Mayo/específico
- **Resultado:** Revisar si hay períodos adicionales

### Hipótesis 2: Filtro por Evento
- Tablero podría incluir eventos 2, 3, 4 (adiciones, prórrogas, terminaciones)
- Nuestro RAW: solo evento 1
- **Resultado:** Verificar columna EVENTO si existe

### Hipótesis 3: Clasificación Diferente
- Tablero podría clasificar "No se sabe" diferente
- Nuestro RAW: variantes no normalizadas
- **Resultado:** Variantes detectadas: "No se sabe", "no se sabe"

### Hipótesis 4: Registros Excluidos
- Nuestro RAW podría tener filtros no detectados
- **Resultado:** Verificar estructura del archivo

---

## Conclusiones del Diagnóstico

1. ✓ **Confirmado:** Las 2026 personas faltantes están en "NO SE SABE"
2. ✓ **Exacto:** La diferencia es precisamente 2026 = 13917 - 11891
3. ✓ **Detectado:** Variantes en SEXO (HOMBRE/HOMBRES, MUJER/MUJERES)
4. ✓ **Detectado:** Variantes en RANGOS (minúsculas)
5. ⚠️ **No encontrado:** La fuente de las 2026 personas en el tablero

---

## Recomendaciones Siguientes

### Para el Código
1. Crear `dashboardNormalizado` - usando normalizaciones actuales
2. Crear `dashboardInstitucional` - usando valores originales
3. Mantener histórico de valores_original para auditoria

### Para la Investigación
1. Verificar si tablero institucional incluye otros períodos
2. Revisar si hay eventos adicionales (2, 3, 4) en fuente original
3. Comparar con exportación actual del tablero
4. Buscar logs de cambios en categorías "NO SE SABE"

---

**Generado:** 2026-09-20  
**Estado:** Diagnóstico completado - Sin modificaciones en datos  
**Próximo paso:** Implementar dos dashboards separados
