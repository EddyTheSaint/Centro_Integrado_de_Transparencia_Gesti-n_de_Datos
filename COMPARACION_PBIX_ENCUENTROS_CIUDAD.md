# Comparacion PBIX Encuentros de Ciudad

## Fuentes

- RAW: `referencias/ENCUENTRO DE CIUDAD MAYO.xlsx`
- Hoja: `asistencia y encues 23-22`
- PBIX: `referencias/OBSERVATORIO.pbix`
- Pagina PBIX: `Encuentros de Ciudad`
- Page ID: `fe75146cb079345ede3a`

## Encabezados Criticos

Se imprimieron los encabezados con `JSON.stringify`, longitud y codigos Unicode. Hallazgo principal:

- Header visible del servicio: `"TIENE CELULAR"`
- Header real en las filas: `"TIENE CELULAR "`
- Longitud real: 14
- Ultimo codigo Unicode: `0020` (espacio)

La causa de los ceros era que `leerPrimerHoja()` recortaba los headers para validacion, pero `sheet_to_json()` conservaba la clave real con espacio final en las filas. El resolver ahora prefiere las claves reales de la primera fila y conserva la primera coincidencia canonica.

Campos localizados:

| Campo buscado | Header real |
| --- | --- |
| TIENE CELULAR | `TIENE CELULAR ` |
| Interes en volver | `Le interesaría participar en otro taller de formación en participación ciudadana realizado por la Contraloría General de Medellín?` |
| Canal de atencion | `a través de que canal de atención dispuesto por la contraloría distrital de Medellín se entero del evento?` |

## 4476 vs 4478

| Concepto | Total |
| --- | ---: |
| Rango fisico del Excel | `A1:AF4479` |
| Filas fisicas de datos, sin header | 4478 |
| Filas reales con datos | 4476 |
| Filas totalmente vacias al final | 2 |
| `sheet_to_json` default | 4476 |
| `sheet_to_json` con `blankrows:true` | 4478 |

Conclusion: el dataset correcto para cargar es 4476 registros. No se altera el RAW ni se agregan filas vacias.

## Visuales PBIX

| VISUAL_ID | TIPO | TITULO_VISIBLE | TABLA | CAMPO_EJE | CAMPO_VALOR | MEDIDA | AGREGACION | FILTRO_VISUAL | ORDEN | TOP_N |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| d352b5b702f1d428daba | image |  |  |  |  |  |  |  | 0 |  |
| 8feb597ccb28adbc3c1e | textbox | Observatorio de Participacion Ciudadana |  |  |  |  |  |  | 1 |  |
| 7f0a404b30d01a84532a | textbox | FILTROS |  |  |  |  |  |  | 2 |  |
| c8e3bc569c0a5e698071 | slicer | Año | Calendario | Año |  |  | Column | 2022, 2023, 2024, 2025, 2026 | 3 |  |
| b362c24c0ae9b82d6017 | slicer | Comuna | asistencia y encues 23-22 | Comuna Normalizada |  |  | Column |  | 4 |  |
| d6237a3e66c18a32b8c0 | textbox | Nota Sexo normalizado |  |  |  |  |  |  | 5 |  |
| 827b37260a9e953de546 | cardVisual |  | asistencia y encues 23-22 |  | Total Asistentes | Total Asistentes | Measure |  | 6 |  |
| 97ad86ae0da59c9349d5 | cardVisual |  | asistencia y encues 23-22 |  | % Mujeres Asistentes | % Mujeres Asistentes | Measure |  | 7 |  |
| a7cd624f6698b0fa0280 | cardVisual |  | asistencia y encues 23-22 |  | % Hombres Asistentes | % Hombres Asistentes | Measure |  | 8 |  |
| kp1EncTotalEnc0nt | cardVisual |  | asistencia y encues 23-22 |  | Total Encuentros | Total Encuentros | Measure | Advanced | 10 |  |
| kp1EncPr0medi0As1 | cardVisual |  | asistencia y encues 23-22 |  | Promedio Asistentes por Encuentro | Promedio Asistentes por Encuentro | Measure | Advanced | 11 |  |
| chtEncSat1sfacc10n | barChart |  | asistencia y encues 23-22 | Nivel de Satisfacción Normalizado | Total Asistentes | Total Asistentes | Measure | Excluye N/A y No Encuestado | 12 |  |
| chtEncC0n0ceCtrl1a | donutChart |  | asistencia y encues 23-22 | Conoce la Contraloría Normalizado | Total Asistentes | Total Asistentes | Measure | Incluye No y Sí | 13 |  |
| 1c0nV0lverEncIm1x1 | image |  |  |  |  |  |  |  | 98 |  |
| btkEncuentV0lverP | actionButton | Participacion Ciudadana |  |  |  |  |  |  | 99 |  |

## Medidas Detectadas

- `Total Asistentes`
- `% Mujeres Asistentes`
- `% Hombres Asistentes`
- `Total Encuentros`
- `Promedio Asistentes por Encuentro`

El DAX no quedo expuesto en texto dentro de `Report/definition`, `Metadata`, `DiagramLayout` ni `DataModel` extraido localmente. Por eso los valores PBIX renderizados quedan como `null` en `REFERENCIA_PBIX_ENCUENTROS_CIUDAD.json`.

## Resultados RAW Locales

| Metrica | Valor |
| --- | ---: |
| Total asistentes | 4476 |
| Mujeres | 2641 |
| Hombres | 1736 |
| No informa sexo | 99 |
| % mujeres sobre respondidos | 60.3 |
| % hombres sobre respondidos | 39.7 |
| Total encuentros, candidato A FECHA+LUGAR | 38 |
| Promedio asistentes, candidato A | 117.8 |

## Candidatos de Definicion de Evento

| Candidato | Definicion | Valor |
| --- | --- | ---: |
| A | FECHA DEL EVENTO + LUGAR DEL EVENTO | 38 |
| B | FECHA DEL EVENTO + LUGAR DEL EVENTO + Comuna/Evento | 67 |
| C | DISTINCT Comuna/Evento | 60 |
| D | DISTINCT FECHA DEL EVENTO | 31 |
| E | FECHA DEL EVENTO + LUGAR DEL EVENTO + COMUNA raw | 112 |

Implementacion local usada: candidato A. Queda marcado como pendiente de confirmacion DAX porque el PBIX no expone la formula.

## Fechas

| Año | Registros |
| --- | ---: |
| 2022 | 1640 |
| 2023 | 1443 |
| 2024 | 837 |
| 2025 | 494 |
| 2026 | 62 |

Los 62 registros no son invalidos: corresponden a fechas con año `26`, interpretadas como 2026.

## Categorias Clave

`TIENE CELULAR`:

- SI: 3656
- si: 628
- NO: 69
- no encuestado: 100
- N/A: 9
- no responde: 9
- NO CONTESTA: 5

`interesVolver`:

- si: 38
- no: 14
- no informado/no encuestado/otros textos/no respuesta: 4424

`Conoce la Contraloria Normalizado`:

- Sí: 612
- No: 398

`Nivel de Satisfaccion Normalizado`, excluyendo `N/A` y `No Encuestado`:

- Excelente: 671
- Bueno: 343
- Aceptable: 68
- Regular: 15
- Otro: 8
- Buena: 4
- Exe: 2
- Malo: 1

## Pendientes

- Confirmar el DAX real de `Total Encuentros` y `Promedio Asistentes por Encuentro` desde Power BI Desktop o Tabular Editor.
- Comparar contra valores renderizados del PBIX si se exportan datos o captura de visuales.
- Definir si variantes como `Exe`, `Buena`, `Otro` deben normalizarse o mantenerse como categorias originales.

## Ajuste Sexo, Comunas y Anos

### Sexo

| Metrica | Valor |
| --- | ---: |
| Femenino | 2641 |
| Masculino | 1736 |
| No informado | 99 |
| Total sexo informado | 4377 |
| % mujeres sobre total | 59.0 |
| % mujeres sobre sexo informado | 60.3 |

El PBIX no expone el DAX de `% Mujeres Asistentes` ni el valor renderizado. En `dashboardInstitucional` se usa `% mujeres sobre sexo informado` por compatibilidad con el nombre de la medida, y en `dashboardNormalizado` se conservan ambos denominadores.

### Comunas Normalizadas

La normalizacion territorial usa codigo conocido como clave canonica. Ejemplos:

- `8`, `8 Villahermosa`, `8 Villa hermosa` -> `8 VILLAHERMOSA`
- `9`, `9 Buenos Aires`, `9 Buenos aires` -> `9 BUENOS AIRES`
- `80`, `80 San Antonio de Prado`, `80 San antonio de prado` -> `80 SAN ANTONIO DE PRADO`

`VARIAS` se mantiene como categoria propia, `VIRTUAL` se mantiene, y `N/A` / respuestas no informadas pasan a `NO_INFORMADO`.

Top 15 normalizado:

| Comuna | Asistentes |
| --- | ---: |
| 8 VILLAHERMOSA | 527 |
| 9 BUENOS AIRES | 412 |
| 80 SAN ANTONIO DE PRADO | 384 |
| VARIAS | 358 |
| 10 LA CANDELARIA | 275 |
| 15 GUAYABAL | 246 |
| 16 BELEN | 242 |
| 5 CASTILLA | 237 |
| 50 SAN SEBASTIAN DE PALMITAS | 230 |
| 13 SAN JAVIER | 214 |
| 12 LA AMERICA | 207 |
| 1 POPULAR | 161 |
| 7 ROBLEDO | 155 |
| 3 MANRIQUE | 133 |
| 4 ARANJUEZ | 120 |

Suma antes de normalizar: 4476. Suma despues de normalizar: 4476.

### Anos

| Ano | Registros |
| --- | ---: |
| 2022 | 1640 |
| 2023 | 1443 |
| 2024 | 837 |
| 2025 | 494 |
| 2026 | 62 |
| SIN_AÑO_RECONOCIDO | 0 |

Los 62 registros con `4/14/26` se reconocen como 2026 porque `MM/dd/yy` es inequívoco para ese valor y `dd/MM/yy` seria invalido por mes 14.

### Comparacion PBIX

| METRICA | PBIX | CARGADOR | DIFERENCIA | ESTADO |
| --- | --- | --- | --- | --- |
| % Mujeres | N/D | 60.3 | N/D | PBIX sin valor renderizado extraible |
| Asistentes por ano | N/D | 2022=1640, 2023=1443, 2024=837, 2025=494, 2026=62 | N/D | PBIX sin valor renderizado extraible |
| 8 VILLAHERMOSA | N/D | 527 | N/D | PBIX sin valor renderizado extraible |
| 9 BUENOS AIRES | N/D | 412 | N/D | PBIX sin valor renderizado extraible |
| 80 SAN ANTONIO DE PRADO | N/D | 384 | N/D | PBIX sin valor renderizado extraible |
| 5 CASTILLA | N/D | 237 | N/D | PBIX sin valor renderizado extraible |
| 1 POPULAR | N/D | 161 | N/D | PBIX sin valor renderizado extraible |
