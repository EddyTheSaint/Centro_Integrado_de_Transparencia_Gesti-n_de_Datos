# Diagnostico ENVEJECIMIENTO_Y_VEJEZ

Fecha de analisis: 2026-09-20

Este documento perfila el Excel RAW real antes de implementar el modulo. No se normalizo el RAW, no se modificaron valores y no se definieron reglas de negocio definitivas.

## Archivo RAW de referencia

- Nombre exacto: `BD ENVEJECIMIENTO Y VEJEZ-MAYO.xlsx`
- Ruta local analizada: `C:\Users\user\Desktop\trabajo 2\Fwd_ Archivos Excel - Centro Integrado de Transparencia Componente T.I\BD ENVEJECIMIENTO Y VEJEZ-MAYO.xlsx`
- Candidato no usado como RAW: `xlx normalizados\BD ENVEJECIMIENTO Y VEJEZ-MAYO_.xlsx`

## Hojas del Excel

| Hoja | Uso observado |
| --- | --- |
| `Datos` | Hoja principal de datos |

Hoja principal: `Datos`

## Estructura general

- Total de filas de datos: `11261`
- Headers exactos:

| # | Header exacto |
| --- | --- |
| 1 | `AÑO` |
| 2 | `COMUNA ` |
| 3 | `BARRIO ` |
| 4 | `PROGRAMA` |
| 5 | `SEXO ` |
| 6 | `RANGO DE EDADES` |
| 7 | `CANTIDAD ` |
| 8 | `PRESUPUESTO ` |

Nota: varios headers tienen espacios finales: `COMUNA `, `BARRIO `, `SEXO `, `CANTIDAD `, `PRESUPUESTO `.

## Tipo observado por columna

Lectura realizada con el mismo enfoque del cargador actual: SheetJS / `raw:false`.

| Columna | Tipos observados |
| --- | --- |
| `AÑO` | string: 11261 |
| `COMUNA ` | string: 11261 |
| `BARRIO ` | string: 11261 |
| `PROGRAMA` | string: 11261 |
| `SEXO ` | string: 11261 |
| `RANGO DE EDADES` | string: 11261 |
| `CANTIDAD ` | string: 11113; null: 148 |
| `PRESUPUESTO ` | string: 11261 |

## Valores vacios

| Columna | Vacios |
| --- | ---: |
| `AÑO` | 0 |
| `COMUNA ` | 0 |
| `BARRIO ` | 0 |
| `PROGRAMA` | 0 |
| `SEXO ` | 0 |
| `RANGO DE EDADES` | 0 |
| `CANTIDAD ` | 148 |
| `PRESUPUESTO ` | 0 |

Observacion: `PRESUPUESTO ` no tiene vacios, pero 2596 filas parsean como presupuesto 0. Deben revisarse los valores originales antes de cualquier regla.

## Cardinalidad

| Campo | Distintos observados |
| --- | ---: |
| AÑO | 7 |
| COMUNA | 21 |
| BARRIO | 22 |
| PROGRAMA | 23 |
| SEXO | 2 |
| RANGO DE EDADES | 18 |
| CANTIDAD | 208 |
| PRESUPUESTO | 2539 |

## Valores unicos principales

### AÑO

| Valor | Filas |
| --- | ---: |
| 2026 | 4916 |
| 2024 | 4122 |
| 2025 | 1867 |
| 2023 | 105 |
| 2022 | 89 |
| 2020 | 82 |
| 2021 | 80 |

### COMUNA

| Valor | Filas |
| --- | ---: |
| COMUNA 10 | 891 |
| COMUNA 8 | 737 |
| COMUNA 4 | 685 |
| COMUNA 5 | 680 |
| COMUNA 80 | 668 |
| COMUNA 12 | 650 |
| COMUNA 13 | 643 |
| COMUNA 1 | 611 |
| COMUNA 3 | 604 |
| COMUNA 60 | 601 |
| COMUNA 2 | 559 |
| COMUNA 7 | 515 |
| COMUNA 9 | 494 |
| COMUNA 6 | 460 |
| COMUNA 16 | 451 |
| COMUNA 15 | 445 |
| COMUNA 70 | 372 |
| COMUNA 90 | 351 |
| COMUNA 11 | 323 |
| COMUNA 14 | 306 |
| COMUNA 50 | 215 |

### BARRIO

| Valor | Filas |
| --- | ---: |
| LA CANDELARIA | 891 |
| VILLA HERMOSA | 737 |
| ARANJUEZ | 685 |
| CASTILLA | 680 |
| CORREGIMIENTO DE SAN ANTONIO DE PRADO | 668 |
| LA AMÉRICA | 650 |
| SAN JAVIER | 643 |
| POPULAR | 611 |
| MANRIQUE | 604 |
| CORREGIMIENTO SAN CRISTÓBAL | 601 |
| SANTA CRUZ | 559 |
| ROBLEDO | 515 |
| BUENOS AIRES | 494 |
| DOCE DE OCTUBRE | 460 |
| GUAYABAL | 445 |
| BELÉN | 379 |
| CORREGIMIENTO DE ALTAVISTA | 372 |
| CORREGIMIENTO DE SANTA ELENA | 351 |
| LAURELES ESTADIO | 323 |
| EL POBLADO | 306 |
| CORREGIMIENTO DE SAN SEBASTIÁN DE PALMITAS | 215 |
| BELEN | 72 |

### PROGRAMA

| Valor | Filas |
| --- | ---: |
| AFILIACIÓN DE PERSONAS MAYORES AL SERVICIO EXEQUIAL | 2381 |
| CENTRO VIDA GERONTOLÓGICO | 1451 |
| Apoyo Económico | 1138 |
| Servicio Exequial | 1082 |
| FAMILIAS CUIDADORAS DE PERSONAS MAYORES | 1066 |
| RED DE HOGARES GERONTOLÓGICOS | 893 |
| Centro Vida Gerontologico | 770 |
| La Red | 438 |
| Cómo Queremos Envejecer | 353 |
| APOYO ECONÓMICO PARA PERSONAS MAYORES | 311 |
| CVG | 306 |
| CAPACITACIÓN EN MANUALIDADES A PERSONAS MAYORES | 261 |
| CAPACITACION CUIDADORES | 244 |
| COLONIA BELENCITO | 133 |
| CAPACITACIÓN A CUIDADORES DE PERSONAS MAYORES | 95 |
| DORMITORIO SOCIAL PARA PERSONAS MAYORES | 92 |
| La Colonia | 75 |
| Dormitorio Social | 44 |
| CAPACITACIÓN EN INFORMÁTICA A PERSONAS MAYORES | 34 |
| FORMACIÓN EN ARTES Y OFICIOS PARA PERSONAS MAYORES | 33 |
| Rediseño de proyecto de Vida | 28 |
| REDISEÑAR EL PROYECTO DE VIDA DE PERSONAS MAYORES | 25 |
| FERIA DE MUESTRA DE MANUALIDADES PERSONAS MAYORES | 8 |

### SEXO

| Valor | Filas |
| --- | ---: |
| MUJER | 6012 |
| HOMBRE | 5249 |

### RANGO DE EDADES

| Valor | Filas |
| --- | ---: |
| 70-74 | 1794 |
| 75-79 | 1443 |
| 80-84 | 1443 |
| 65-69 | 1416 |
| 60-64 | 1317 |
| 85-89 | 1308 |
| 90-94 | 630 |
| 55-59 | 549 |
| 90 + | 485 |
| 95-99 | 357 |
| 100ymás | 184 |
| 54-59 | 142 |
| 50-54 | 119 |
| 18-53 | 52 |
| 18-49 | 16 |
| 50-59 | 3 |
| 75 | 2 |
| 99-99 | 1 |

## Sumas generales

| Medida | Total |
| --- | ---: |
| SUM(CANTIDAD) | 232811 |
| SUM(PRESUPUESTO) | 472529119951.71 |

Nota tecnica: para sumar `PRESUPUESTO ` se interpretaron los strings monetarios originales, sin modificar el RAW.

## Presupuesto por año

| AÑO | SUM(PRESUPUESTO) |
| --- | ---: |
| 2020 | 75214004753.13 |
| 2021 | 74907541999.12 |
| 2022 | 94608688304.42 |
| 2023 | 92812201452.80 |
| 2024 | 73507315623.92 |
| 2025 | 24803792876.31 |
| 2026 | 36675574942.00 |

## Personas atendidas por año

| AÑO | SUM(CANTIDAD) |
| --- | ---: |
| 2020 | 1185 |
| 2021 | 1196 |
| 2022 | 1208 |
| 2023 | 1057 |
| 2024 | 92670 |
| 2025 | 40030 |
| 2026 | 95465 |

## Personas atendidas por sexo

| SEXO | SUM(CANTIDAD) |
| --- | ---: |
| HOMBRE | 86026 |
| MUJER | 146785 |

## Personas atendidas por rango de edad y sexo

| RANGO DE EDADES | SEXO | SUM(CANTIDAD) |
| --- | --- | ---: |
| 18-49 | HOMBRE | 8 |
| 18-49 | MUJER | 88 |
| 18-53 | HOMBRE | 18 |
| 18-53 | MUJER | 230 |
| 50-54 | HOMBRE | 81 |
| 50-54 | MUJER | 924 |
| 50-59 | HOMBRE | 3 |
| 54-59 | HOMBRE | 75 |
| 54-59 | MUJER | 389 |
| 55-59 | HOMBRE | 1078 |
| 55-59 | MUJER | 3323 |
| 60-64 | HOMBRE | 7728 |
| 60-64 | MUJER | 14881 |
| 65-69 | HOMBRE | 11390 |
| 65-69 | MUJER | 19491 |
| 70-74 | HOMBRE | 16832 |
| 70-74 | MUJER | 26178 |
| 75 | HOMBRE | 12 |
| 75 | MUJER | 34 |
| 75-79 | HOMBRE | 16705 |
| 75-79 | MUJER | 24822 |
| 80-84 | HOMBRE | 13090 |
| 80-84 | MUJER | 19577 |
| 85-89 | HOMBRE | 9791 |
| 85-89 | MUJER | 16629 |
| 90 + | HOMBRE | 3749 |
| 90 + | MUJER | 8110 |
| 90-94 | HOMBRE | 4304 |
| 90-94 | MUJER | 9298 |
| 95-99 | HOMBRE | 1081 |
| 95-99 | MUJER | 2645 |
| 99-99 | MUJER | 1 |
| 100ymás | HOMBRE | 81 |
| 100ymás | MUJER | 165 |

## Personas atendidas por comuna

| COMUNA | SUM(CANTIDAD) |
| --- | ---: |
| COMUNA 1 | 16723 |
| COMUNA 2 | 16045 |
| COMUNA 3 | 18761 |
| COMUNA 4 | 17907 |
| COMUNA 5 | 9967 |
| COMUNA 6 | 13389 |
| COMUNA 7 | 14315 |
| COMUNA 8 | 20066 |
| COMUNA 9 | 9978 |
| COMUNA 10 | 26645 |
| COMUNA 11 | 1933 |
| COMUNA 12 | 9054 |
| COMUNA 13 | 19258 |
| COMUNA 14 | 1691 |
| COMUNA 15 | 5375 |
| COMUNA 16 | 12199 |
| COMUNA 50 | 1084 |
| COMUNA 60 | 7211 |
| COMUNA 70 | 3179 |
| COMUNA 80 | 6143 |
| COMUNA 90 | 1888 |

## Inconsistencias y hallazgos de calidad

### Espacios

- Headers con espacios finales: `COMUNA `, `BARRIO `, `SEXO `, `CANTIDAD `, `PRESUPUESTO `.
- Variantes por espacios finales en `COMUNA`: existen pares como `COMUNA 10` y `COMUNA 10 `.
- Variantes por espacios iniciales: `EL POBLADO` y ` EL POBLADO`.
- Variantes por espacios finales en `PROGRAMA`: `Servicio Exequial` vs `Servicio Exequial `; `La Red` vs `La Red `; `Centro Vida Gerontologico `.

### Tildes

- `BELÉN` y `BELEN` aparecen como valores distintos en `BARRIO `.
- `CENTRO VIDA GERONTOLÓGICO` y `Centro Vida Gerontologico ` aparecen como variantes equivalentes por tilde/caso/espacio.
- `CAPACITACIÓN CUIDADORES` y `CAPACITACION CUIDADORES` evidencian uso mixto de tildes.

### Mayusculas/minusculas

- `PROGRAMA` mezcla mayusculas sostenidas y titulo: `Apoyo Económico`, `Servicio Exequial`, `La Red`, `Dormitorio Social`, etc.

### Rangos de edad escritos distinto o sospechosos

No se deben normalizar todavia, pero requieren revision:

- `90 +` podria equivaler a un rango abierto tipo `90+`.
- `100ymás` no tiene espacio y mezcla palabra con simbolo de acento.
- `75` aparece como rango unitario.
- `99-99` aparece como rango unitario/sospechoso.
- `50-59`, `54-59`, `55-59`, `50-54`, `18-49`, `18-53` pueden responder a cortes distintos por programa o a inconsistencias; se debe validar con negocio antes de mapear.

### Programas posiblemente equivalentes

No se implementan reglas todavia. Posibles equivalencias a validar:

| Grupo canonico observado | Variantes |
| --- | --- |
| CENTRO VIDA GERONTOLOGICO | `CENTRO VIDA GERONTOLÓGICO`; `Centro Vida Gerontologico `; posible alias `CVG` |
| SERVICIO EXEQUIAL | `Servicio Exequial`; `Servicio Exequial `; posible relacion con `AFILIACIÓN DE PERSONAS MAYORES AL SERVICIO EXEQUIAL` |
| LA RED | `La Red`; `La Red `; posible relacion con `RED DE HOGARES GERONTOLÓGICOS` |
| APOYO ECONOMICO | `Apoyo Económico`; posible relacion con `APOYO ECONÓMICO PARA PERSONAS MAYORES` |
| DORMITORIO SOCIAL | `Dormitorio Social`; posible relacion con `DORMITORIO SOCIAL PARA PERSONAS MAYORES` |
| COLONIA | `La Colonia`; posible relacion con `COLONIA BELENCITO` |
| REDISEÑO PROYECTO DE VIDA | `Rediseño de proyecto de Vida`; posible relacion con `REDISEÑAR EL PROYECTO DE VIDA DE PERSONAS MAYORES` |

## Tablero de referencia

Archivo PBIX localizado:

`C:\Users\user\Desktop\trabajo 2\Fwd_ Archivos Excel - Centro Integrado de Transparencia Componente T.I\pbs dashboards\rev_dbEnvejecimiento_vejez.pbix`

El layout del PBIX contiene 4 visuales tipo `clusteredColumnChart` en `Página 1`.

| Visual | Campo categoria | Campo valor | Agregacion | Observaciones |
| --- | --- | --- | --- | --- |
| Presupuesto por año | `AÑO` | `PRESUPUESTO ` | SUM | Confirmado en PBIX: campos `AÑO`, `PRESUPUESTO ` |
| Personas atendidas por comuna | `COMUNA ` | `CANTIDAD ` | SUM | Confirmado en PBIX: campos `COMUNA `, `CANTIDAD ` |
| Personas atendidas por rango de edades y sexo | `RANGO DE EDADES`, `SEXO ` | `CANTIDAD ` | SUM | Confirmado en PBIX: campos `RANGO DE EDADES`, `CANTIDAD `, `SEXO ` |
| Personas atendidas por sexo | `SEXO ` | `CANTIDAD ` | SUM | Confirmado en PBIX: campos `CANTIDAD `, `SEXO ` |

## Reglas que propondria, sin implementarlas todavia

1. Resolver headers por nombre canonico ignorando espacios finales: `COMUNA ` -> `COMUNA`, `CANTIDAD ` -> `CANTIDAD`, etc.
2. Para categorias, aplicar `trim` antes de agrupar, pero registrar auditoria de valores originales.
3. Definir catalogos explicitos para `BARRIO`, especialmente `BELÉN`/`BELEN` y ` EL POBLADO`/`EL POBLADO`.
4. Definir catalogo de programas con validacion de negocio antes de unir alias como `CVG`, `La Red`, `Servicio Exequial` o `Apoyo Económico`.
5. Definir catalogo de rangos de edad, revisando con negocio los casos `75`, `99-99`, `90 +`, `100ymás`, `18-49`, `18-53`, `50-59`, `54-59`, `55-59`.
6. Convertir `CANTIDAD ` a numero, manteniendo alerta por 148 filas vacias.
7. Convertir `PRESUPUESTO ` desde texto monetario a numero solo para agregacion/normalizado, conservando RAW intacto.
8. Registrar reglas aplicadas con campo, valor original, valor normalizado, regla y cantidad afectada.

## Resumen ejecutivo

- Columnas reales: `AÑO`, `COMUNA `, `BARRIO `, `PROGRAMA`, `SEXO `, `RANGO DE EDADES`, `CANTIDAD `, `PRESUPUESTO `.
- Total filas: `11261`.
- Total CANTIDAD: `232811`.
- Total PRESUPUESTO: `472529119951.71`.
- Categorias detectadas: 7 años, 21 comunas, 22 barrios, 23 programas, 2 sexos, 18 rangos de edad.
- Inconsistencias principales: espacios finales/iniciales, tildes, mayusculas/minusculas, rangos de edad sospechosos/equivalentes y posibles alias de programas.
