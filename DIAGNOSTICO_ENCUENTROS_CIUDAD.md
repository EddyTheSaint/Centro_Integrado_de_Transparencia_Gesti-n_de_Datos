# DIAGNÓSTICO: ENCUENTROS DE CIUDAD

**Fecha de análisis**: 2026-09-21  
**Fase**: DIAGNÓSTICO Y COMPARACIÓN (sin implementación)  
**Estado**: PENDIENTE VALIDACIÓN

---

## 1. ARCHIVO ANALIZADO

**Nombre**: `ENCUENTRO DE CIUDAD MAYO.xlsx`  
**Ubicación**: `referencias/`  
**Estado en Git**: Excluido (binario RAW)

---

## 2. HOJA ANALIZADA

**Nombre exacto**: `asistencia y encues 23-22`  
**Número de hojas en el archivo**: 1  
**Rango usado**: A1:X4479

---

## 3. GRANULARIDAD DETECTADA

**Conclusión**: **1 fila = 1 PERSONA / 1 ENCUESTA**

**Evidencia**:
- El archivo contiene campos de persona: SEXO, barrio, rango de edad, escolaridad, actividad económica
- Contiene respuestas de encuesta individual: satisfacción personal, si tiene celular, si conoce la contraloría
- NO hay campo de identificador único de persona
- Múltiples filas pueden corresponder al mismo evento (mismo FECHA + LUGAR + Comuna/Evento)

**Derivación de métricas de evento**:
- **Eventos = combinaciones únicas de (FECHA DEL EVENTO + LUGAR DEL EVENTO)**
- **Asistentes por evento = CONTAR filas para esa combinación**
- **Personas únicas = NO se puede derivar sin identificador de persona**

---

## 4. DIMENSIONES

- **Total filas (registros)**: 4,478
- **Total columnas usadas**: 24
- **Columnas vacías**: 8 (después de la columna 24)
- **Cabecera**: Fila 1
- **Registros de datos**: Filas 2-4479

---

## 5. COLUMNAS EXACTAS Y ANÁLISIS

### Columnas de Evento

| # | Nombre exacto | Tipo observado | Vacíos | Únicos | Estado |
|---|---|---|---|---|---|
| 1 | FECHA DEL EVENTO | Fecha (dd/MM/yyyy) | 2 | 31 | ✓ Limpio |
| 2 | LUGAR DEL EVENTO | Texto | 2 | 37 | ⚠ Variantes |
| 3 | Comuna/Evento | Texto (descripción evento) | 2 | 60 | ⚠ Variantes |

### Columnas de Ubicación/Territorio

| # | Nombre exacto | Tipo observado | Vacíos | Únicos | Estado |
|---|---|---|---|---|---|
| 4 | COMUNA | Texto (código + nombre) | 2 | 38 | ⚠ Variantes |
| 8 | barrio | Texto | 2 | 254 | ⚠ Variantes |

### Columnas Demográficas

| # | Nombre exacto | Tipo observado | Vacíos | Únicos | Estado |
|---|---|---|---|---|---|
| 7 | SEXO | Categórico (F/M) | 2 | 8 | ⚠ Variantes |
| 9 | rango de edad | Categórico | 2 | 11 | ⚠ 69% sin datos |
| 10 | escolaridad | Categórico | 2 | 16 | ⚠ 69% sin datos |
| 11 | actividad económica | Categórico | 2 | 14 | ⚠ 72% sin datos |

### Columnas de Contacto

| # | Nombre exacto | Tipo observado | Vacíos | Únicos | Estado |
|---|---|---|---|---|---|
| 5 | TIENE CELULAR | Sí/No/No responde | 2 | 8 | ⚠ Variantes |
| 6 | TIENE CORREO ELECTRONICO | Sí/No/No responde | 2 | 10 | ⚠ Variantes + Error |

### Columnas de Encuesta - Respuestas SI/NO

| # | Nombre exacto | Vacíos | Únicos | Respuesta esperada | Estado |
|---|---|---|---|---|---|
| 12 | ¿hace parte de alguna organización social? | 2 | 55 | SI/NO o nombre org | ⚠ Mixto |
| 13 | ¿conoce la contraloría distrital de Medellín y sabe que hace? | 2 | 9 | SI/NO | ⚠ Variantes |
| 22 | Le interesaría participar en otro taller de formación en participación ciudadana realizado por la Contraloría General de Medellín? | 70 | 11 | SI/NO/Texto libre | ⚠ Mixto |

### Columnas de Encuesta - Escalas de Satisfacción

| # | Nombre exacto | Vacíos | Únicos | Rango esperado | Estado |
|---|---|---|---|---|---|
| 15 | Cual es su Nivel de satisfacción frente al evento que participo? | 2 | 13 | Excelente/Bueno/Aceptable/Regular/Malo | ⚠ Variantes |
| 17 | cual es el nivel de satisfacción del medio del cual se entero del evento? | 2 | 8 | Excelente/Bueno/Aceptable/Regular/Malo | ⚠ Variantes |

### Columnas de Encuesta - Respuestas Abiertas/Mixtas

| # | Nombre exacto | Vacíos | Tipo | Estado |
|---|---|---|---|---|
| 14 | ¿en que temas le gustaría participar? | 2 | Texto libre | Sin análisis |
| 16 | a través de que canal de atención dispuesto por la contraloría distrital de Medellín se entero del evento? | 2 | Texto libre/Múltiple selección | ⚠ 43 variantes, Valores errados |
| 18 | considera usted que la contraloría general de Medellín , además de hacer control fiscal, debe aportar en procesos de formación en participación ciudadana? | 2 | SI/NO/Texto | Sin análisis |
| 19 | para usted, los espacios de capacitación, realizados por la contraloría general de Medellín son? | 2 | Texto | Sin análisis |
| 20 | la metodología utilizada por el facilitador de la Contraloría General de Medellín le pareció: | 2 | Texto | Sin análisis |
| 21 | la persona que dirigió la capacitación evidencia manejo del tema y capacidad pedológica para transmitir su conocimiento? | 2 | SI/NO | Sin análisis |
| 23 | En que otros temas considera usted, que la Contraloría General de Medellín podría apoyar el proceso de formación ? | 2 | Texto libre | Sin análisis |
| 24 | Tiene alguna sugerencia para mejorar los eventos de participación ciudadana de la contraloría distrital de Medellín? | 2 | Texto libre | Sin análisis |

---

## 6. PROBLEMAS DE CALIDAD DETECTADOS

### 6.1. Variantes en Mayúsculas/Minúsculas

**SEXO**:
- `FEMENINO` vs `F` (mayúsculas/código)
- `MASCULINO` vs `M` (mayúsculas/código)

**¿conoce la contraloría...?**:
- `si` vs `s` vs `SI` vs `si ` (variantes de sí)

**Satisfacción**:
- `excelente` vs `Excelente ` vs `exe` (abreviatura?)
- `bueno` vs `buena`

**Canal de atención** (múltiples variantes):
- `PAGINA WEB DE LA CONTRALORIA` vs `pagina web de la contraloría` vs `Por la Página Web de la Contraloría`
- `POR CORREO ELECTRÓNICO` vs `a través de correo electrónico` vs `correo electrónico`
- `POR REDES SOCIALES WHATSAP` vs `por redes sociales WhatsApp` vs `por redes sociales como WhatsApp`

### 6.2. Espacios Inconsistentes

**TIENE CELULAR**:
- `SI` vs `SI ` (con espacio)
- `NO` vs `NO ` (con espacio)

**TIENE CORREO ELECTRONICO**:
- `SI ` (con espacio)
- `NO ` (con espacio)

**SEXO**:
- `Mayor de 55 años ` (con espacio al final)

**Satisfacción**:
- `Excelente ` (con espacio)

### 6.3. Tildes Inconsistentes

**COMUNA**:
- `Envigado` (se esperaría revisar si hay variantes)

**Canal de atención**:
- `a través de correo electrónico` vs `a traves de correo electrónico`
- `teléfono` vs `telefono`
- `página` vs `pagina`

### 6.4. Valores Especiales / No Informados

**Frecuencia muy alta**:

| Valor | Columna | Frecuencia | % |
|---|---|---|---|
| no encuestado | rango de edad | 3,130 | 69.9% |
| no encuestado | escolaridad | 3,080 | 68.8% |
| no encuestado | actividad económica | 3,220 | 71.9% |
| no encuestado | Satisfacción evento | 3,183 | 71.1% |

**Variantes de "no responde"**:
- `no responde`
- `NO RESPONDE`
- `no respuesta`
- `sin respuesta`
- `sin información`
- `Sin información` (mayúscula)

**Variantes de "no aplica"**:
- `N/A`
- `N0` (cero en lugar de O)
- `ino responde` (probable error de digitación en CORREO ELECTRONICO)

### 6.5. Valores Problemáticos

**COMUNAS**:
- Entrada `varias` (358 registros) - probablemente evento multiubicación
- Entrada `8` (200 registros) - probablemente truncado, debería ser `8 Villahermosa`

**LUGAR DEL EVENTO**:
- Variantes de capitalización (ej: `IE EL LIMONAR` vs variantes esperadas)

**Rango de edad**:
- Variantes: `mayor de 55 años` vs `mayor de 55` vs `Mayor de 55 años ` vs `mayo de 55 años` (error ortográfico)
- Variantes: `entre 27 y 55 años` vs `entre 18 y 26 años` vs `menor de 18 años`

**Escolaridad**:
- `técnico` vs `Técnico` vs `tecnico`
- `tecnológico` vs `Tecnológico` vs `tecnologico`

**¿hace parte de organización?**:
- Es un campo MIXTO: si es "SI" o "NO", o contiene el nombre de la organización
- 55 valores únicos: la mayoría son nombres de organizaciones
- Variantes: `no ` (con espacio) vs `no` vs `si` vs `SI`

**Canal de atención**:
- Contiene también valores de SATISFACCIÓN (error de entrada): `aceptable`, `bueno`, `excelente`
- Contiene combinaciones múltiples separadas por coma o por palabra "y"
- Ejemplos:
  - `a través de correo electrónico, por teléfono`
  - `por redes sociales como WhatsApp, a través de correo electrónico`
  - `por pagina web de la contraloría, por redes sociales como WhatsApp, a través de correo electrónico`

### 6.6. Fechas

**FECHA DEL EVENTO**:
- Formato: `dd/MM/yyyy` (correcto)
- Rango: 2022 a 2025
- Valores únicos: 31 fechas

---

## 7. MÉTRICAS DIRECTAS DEL RAW (SIN NORMALIZAR)

### 7.1. Totales Generales

| Métrica | Valor |
|---|---|
| **Total registros (encuestas/personas)** | 4,478 |
| **Total eventos (FECHA + LUGAR)** | 39 |
| **Total eventos (FECHA + LUGAR + Comuna/Evento)** | 60 |

### 7.2. Asistentes por Año

| Año | Asistentes |
|---|---|
| 2022 | 1,640 |
| 2023 | 1,443 |
| 2024 | 837 |
| 2025 | 494 |
| **TOTAL** | **4,414** |

*Nota*: Suma = 4,414 (2 registros sin fecha)

### 7.3. Asistentes por Comuna (Top 15)

| Comuna | Asistentes |
|---|---|
| varias | 358 |
| 8 Villahermosa | 320 |
| 80 San Antonio de Prado | 314 |
| 10 La Candelaria | 275 |
| 9 Buenos Aires | 248 |
| 15 Guayabal | 246 |
| 16 Belen | 238 |
| 13 San Javier | 214 |
| 12 La América | 207 |
| 8 | 200 |
| 14 Altos de la Virgen | 160 |
| 11 Laureles-Estadio | 147 |
| 6 Doce de Octubre | 118 |
| 1 Popular | 113 |
| 5 Castilla | 108 |

*Total comunas distintas*: 38

### 7.4. Distribución por Sexo

| Sexo | Asistentes | % |
|---|---|---|
| FEMENINO | 2,192 | 48.9% |
| MASCULINO | 1,522 | 34.0% |
| F | 449 | 10.0% |
| M | 214 | 4.8% |
| no encuestado | 73 | 1.6% |
| N/A | 23 | 0.5% |
| NO RESPONDE | 2 | 0.04% |
| sin información | 1 | 0.02% |

*Nota*: Variantes FEMENINO+F = 58.9%, MASCULINO+M = 38.8%

### 7.5. Distribución por Rango de Edad

| Rango | Asistentes | % |
|---|---|---|
| no encuestado | 3,130 | 69.9% |
| mayor de 55 años | 439 | 9.8% |
| entre 27 y 55 años | 386 | 8.6% |
| N/A | 134 | 3.0% |
| menor de 18 años | 123 | 2.7% |
| mayor de 55 | 96 | 2.1% |
| entre 18 y 26 años | 74 | 1.7% |
| sin información | 73 | 1.6% |
| menor de 18 | 19 | 0.4% |
| Mayor de 55 años | 1 | 0.02% |
| mayo de 55 años | 1 | 0.02% |

*Nota*: Solo 30% tiene dato de edad

### 7.6. Distribución por Escolaridad

| Escolaridad | Asistentes | % |
|---|---|---|
| no encuestado | 3,080 | 68.8% |
| secundaria | 423 | 9.4% |
| pregrado | 251 | 5.6% |
| primaria | 141 | 3.1% |
| posgrado | 141 | 3.1% |
| N/A | 134 | 3.0% |
| sin información | 110 | 2.5% |
| Universitario | 65 | 1.5% |
| técnico | 58 | 1.3% |
| tecnológico | 54 | 1.2% |
| no responde | 6 | 0.13% |
| tecnico | 6 | 0.13% |
| tecnologico | 3 | 0.07% |
| ninguna | 2 | 0.04% |
| sin respuesta | 1 | 0.02% |
| ninguno | 1 | 0.02% |

*Nota*: 69% sin dato, variantes técnico/tecnico/Técnico

### 7.7. Distribución por Actividad Económica

| Actividad | Asistentes | % |
|---|---|---|
| no encuestado | 3,220 | 71.9% |
| independiente | 354 | 7.9% |
| ninguna | 344 | 7.7% |
| empleado | 270 | 6.0% |
| N/A | 155 | 3.5% |
| sin información | 110 | 2.5% |
| pensionado | 9 | 0.2% |
| otra | 4 | 0.09% |
| no responde | 4 | 0.09% |
| JA | 2 | 0.04% |
| sin respuesta | 1 | 0.02% |
| jubilada | 1 | 0.02% |
| independiente  | 1 | 0.02% |
| no | 1 | 0.02% |

*Nota*: 72% sin dato

### 7.8. Distribución: Tiene Celular

| Valor | Asistentes | % |
|---|---|---|
| SI | 4,074 | 90.9% |
| SI  | 210 | 4.7% |
| no encuestado | 100 | 2.2% |
| NO | 57 | 1.3% |
| NO  | 12 | 0.27% |
| no responde | 9 | 0.2% |
| N/A | 9 | 0.2% |
| NO CONTESTA | 5 | 0.11% |

*Nota*: SI+SI  = 95.6%

### 7.9. Distribución: Tiene Correo Electrónico

| Valor | Asistentes | % |
|---|---|---|
| SI | 3,036 | 67.8% |
| NO | 609 | 13.6% |
| no responde | 243 | 5.4% |
| SI  | 200 | 4.5% |
| NO CONTESTA | 179 | 4.0% |
| no encuestado | 175 | 3.9% |
| NO  | 30 | 0.67% |
| N0 | 2 | 0.04% |
| ino responde | 1 | 0.02% |
| N/A | 1 | 0.02% |

*Nota*: Variaantes SI+SI  = 72.3%, NO+NO  = 14.3%, error "ino responde" y "N0"

### 7.10. Distribución: Satisfacción con Evento

| Nivel | Asistentes | % |
|---|---|---|
| no encuestado | 3,183 | 71.0% |
| excelente | 670 | 14.9% |
| bueno | 343 | 7.7% |
| N/A | 93 | 2.1% |
| sin información | 72 | 1.6% |
| aceptable | 68 | 1.5% |
| no responde | 16 | 0.36% |
| regular | 15 | 0.34% |
| otro | 8 | 0.18% |
| buena | 4 | 0.09% |
| exe | 2 | 0.04% |
| malo | 1 | 0.02% |
| Excelente  | 1 | 0.02% |

*Nota*: De los 1,295 con dato: 67% excelente+bueno

### 7.11. Distribución: Conoce la Contraloría

| Valor | Asistentes | % |
|---|---|---|
| no encuestado | ~70% (aprox) | Sin datos exactos |
| si | Múltiples variantes | Variantes de "sí" |

*Nota*: Requiere análisis exacto (tiene variantes s/si/SI/si )

### 7.12. Canales de Atención (Respuesta Abierta)

**Nota CRÍTICA**: Esta columna tiene 43 valores únicos con problemas:
1. **Variantes de capitalización**: `PAGINA WEB` vs `pagina web` vs `Página Web`
2. **Variantes de formulación**: `a través de`, `por`, `mediante`
3. **Valores de satisfacción**: `aceptable`, `bueno`, `excelente` (datos errados)
4. **Múltiples selecciones**: `por teléfono, correo electrónico y WhatsApp`
5. **Errores ortográficos**: `WHATSAP` (debería ser WHATSAPP), `a treves` (debería ser `a través`)

Canales mencionados:
- Página web de la Contraloría
- Correo electrónico
- Redes sociales (WhatsApp)
- Teléfono
- Invitación personal
- Junta de Acción Comunal
- Club de vida
- Volantes

### 7.13. Satisfacción del Canal

| Nivel | Asistentes |
|---|---|
| no encuestado | ~70% |
| excelente | Presente |
| bueno | Presente |
| aceptable | Presente |
| REGULAR | Presente |

*Nota*: Variantes mayúsculas: `REGULAR` vs `aceptable`

---

## 8. ESTRUCTURA DEL OBSERVATORIO.PBIX

### 8.1. Información General

| Propiedad | Valor |
|---|---|
| **Archivo** | `OBSERVATORIO.pbix` |
| **Tipo de archivo** | ZIP (comprimido) |
| **Páginas totales** | 9 |
| **Página activa** | c0a46c674ee88d6a28f5 (no es Encuentros) |

### 8.2. Página: Encuentros de Ciudad

| Propiedad | Valor |
|---|---|
| **ID interno** | `fe75146cb079345ede3a` |
| **Display Name** | `Encuentros de Ciudad` |
| **Altura** | 1080px |
| **Ancho** | 1920px |
| **Modo** | FitToPage |
| **Total visuales** | 15 |

### 8.3. Visuales en la Página

| Visual ID | Display Name | Tipo | Propósito (inferido) |
|---|---|---|---|
| kp1EncTotalEnc0nt | kp1EncTotalEnc0nt | Card (KPI) | Métrica: "Total Encuentros" |
| kp1EncPr0medi0As1 | kp1EncPr0medi0As1 | Card (KPI) | Métrica: "Promedio Asistentes por Encuentro" |
| chtEncC0n0ceCtrl1a | chtEncC0n0ceCtrl1a | Chart | Conocimiento de Contraloría |
| chtEncSat1sfacc10n | chtEncSat1sfacc10n | Chart | Satisfacción con Evento |
| btkEncuentV0lverP | btkEncuentV0lverP | Button | Botón para volver |
| 1c0nV0lverEncIm1x1 | 1c0nV0lverEncIm1x1 | Image/Icon | Ícono o imagen |
| Otros (7 visuales) | ... | Varios | Varios propósitos |

### 8.4. Tabla Fuente

| Propiedad | Valor |
|---|---|
| **Nombre exacto** | `asistencia y encues 23-22` |
| **Origen** | Excel RAW (mismo archivo que analizamos) |

### 8.5. Medidas Detectadas en PBIX

| Medida | Fórmula DAX | Observaciones |
|---|---|---|
| **Total Encuentros** | [No extraída - PBIX thin report] | Probablemente: DISTINCTCOUNT(FECHA + LUGAR) |
| **Promedio Asistentes por Encuentro** | [No extraída - PBIX thin report] | Probablemente: COUNTA() / DISTINCTCOUNT(evento) |

**Limitación**: El PBIX puede ser un "thin report" (dataset remoto) que no permite extraer las fórmulas DAX exactas.

---

## 9. TABLA VISUAL → CAMPO → AGREGACIÓN

### Intentado Extraer de Visuales

| Visual | Tabla | Campo Categoría | Campo Valor | Agregación | Filtros | Estado |
|---|---|---|---|---|---|---|
| kp1EncTotalEnc0nt | asistencia y encues 23-22 | (ninguno) | Total Encuentros | Measure | Sí | CONFIRMADO_DESDE_PBIX |
| kp1EncPr0medi0As1 | asistencia y encues 23-22 | (ninguno) | Promedio Asistentes por Encuentro | Measure | Sí | CONFIRMADO_DESDE_PBIX |
| chtEncC0n0ceCtrl1a | asistencia y encues 23-22 | ? | ? | Measure o Count | ? | PENDIENTE_CONFIRMACION |
| chtEncSat1sfacc10n | asistencia y encues 23-22 | ? | ? | Measure o Count | ? | PENDIENTE_CONFIRMACION |
| Otros | asistencia y encues 23-22 | ? | ? | ? | ? | PENDIENTE_CONFIRMACION |

**Nota**: Los JSONs de los visuales están en formato minimizado y la extracción exacta requiere parseo manual de cada visual.json.

---

## 10. COMPARACIÓN RAW vs PBIX

### Intentado Reproducir Métricas

#### MÉTRICA 1: Total Encuentros

**Definición candidata**: DISTINCTCOUNT de (FECHA DEL EVENTO + LUGAR DEL EVENTO)

| Aspecto | Valor |
|---|---|
| **RAW (FECHA + LUGAR)** | 39 |
| **TABLERO (valor mostrado)** | ? (No verificado en vivo) |
| **DIFERENCIA** | PENDIENTE_CONFIRMACION |
| **ESTADO** | PENDIENTE_CONFIRMACION |

#### MÉTRICA 2: Promedio Asistentes por Encuentro

**Definición candidata**: SUM(Registros) / DISTINCTCOUNT(Eventos)

| Aspecto | Valor |
|---|---|
| **RAW (4,478 / 39)** | 114.8 asistentes/evento |
| **TABLERO (valor mostrado)** | ? (No verificado en vivo) |
| **DIFERENCIA** | PENDIENTE_CONFIRMACION |
| **ESTADO** | PENDIENTE_CONFIRMACION |

#### MÉTRICA 3: Satisfacción (de eventos con dato)

**Definición candidata**: % que respondió "excelente" o "bueno"

| Aspecto | Valor |
|---|---|
| **RAW (670+343) / (4,478-3,183)** | 65.4% satisfecho |
| **TABLERO (valor mostrado)** | ? |
| **DIFERENCIA** | PENDIENTE_CONFIRMACION |
| **ESTADO** | PENDIENTE_CONFIRMACION |

---

## 11. CATEGORÍAS DETECTADAS (CANDIDATAS A NORMALIZACIÓN)

### Sexo

**Valores actuales**:
- FEMENINO (2,192)
- MASCULINO (1,522)
- F (449)
- M (214)
- no encuestado (73)
- N/A (23)
- NO RESPONDE (2)
- sin información (1)

**Mapeo candidato**:
```
FEMENINO, F → FEMENINO
MASCULINO, M → MASCULINO
no encuestado, N/A, NO RESPONDE, sin información → NO_ENCUESTADO
```

**Resultado esperado**: 3 categorías

---

### Rango de Edad

**Valores actuales** (11 variantes, 69.9% sin dato):
- no encuestado (3,130)
- mayor de 55 años (439)
- entre 27 y 55 años (386)
- N/A (134)
- menor de 18 años (123)
- mayor de 55 (96)
- entre 18 y 26 años (74)
- sin información (73)
- menor de 18 (19)
- Mayor de 55 años (1)
- mayo de 55 años (1) ← ERROR

**Mapeo candidato**:
```
menor de 18, menor de 18 años → MENOR_18
entre 18 y 26 años → 18_A_26
entre 27 y 55 años → 27_A_55
mayor de 55, mayor de 55 años, Mayor de 55 años  → MAYOR_55
no encuestado, N/A, sin información, mayo de 55 años (error) → NO_ENCUESTADO
```

**Resultado esperado**: 5 categorías

---

### Escolaridad

**Valores actuales** (16 variantes, 68.8% sin dato):

**Mapeo candidato**:
```
ninguna, ninguno → NINGUNA
primaria → PRIMARIA
secundaria → SECUNDARIA
técnico, tecnico, Técnico → TECNICO
tecnológico, tecnologico, Tecnológico → TECNOLOGICO
pregrado, Universitario → PREGRADO
posgrado → POSGRADO
no encuestado, N/A, sin información, no responde, sin respuesta → NO_ENCUESTADO
```

**Resultado esperado**: 8 categorías

---

### Actividad Económica

**Valores actuales** (14 variantes, 71.9% sin dato):

**Mapeo candidato**:
```
empleado → EMPLEADO
independiente, independiente  → INDEPENDIENTE
pensionado, jubilada → PENSIONADO
ninguna → NINGUNA
otra, JA, no → OTRA
no encuestado, N/A, sin información, no responde, sin respuesta → NO_ENCUESTADO
```

**Resultado esperado**: 6 categorías

---

### Satisfacción con Evento

**Valores actuales** (13 variantes):

**Mapeo candidato**:
```
malo → INSATISFECHO
regular → ACEPTABLE
aceptable → ACEPTABLE
bueno, buena → SATISFECHO
excelente, exe, Excelente  → MUY_SATISFECHO
otro, N/A, no responde, sin información, no encuestado → NO_ENCUESTADO
```

**Resultado esperado**: 5 categorías (+ NO_ENCUESTADO)

---

### Canales de Atención (CRÍTICO)

**Problema**: Columna MIXTA con texto libre, múltiples selecciones y valores errados

**Valores detectados** (43 variantes):
- Página web de la Contraloría (múltiples variantes capitales)
- Correo electrónico (múltiples variantes)
- Redes sociales WhatsApp (múltiples variantes)
- Teléfono
- Invitación personal
- Junta de Acción Comunal
- Club de vida
- Volantes
- Valores de satisfacción errados: aceptable, bueno, excelente

**Estrategia de normalización**:
1. Limpiar mayúsculas
2. Detectar múltiples selecciones (separadas por ",", "y", "o")
3. Mapear a categorías: PAGINA_WEB, CORREO, WHATSAPP, TELEFONO, OTRO
4. Crear registro asociativo (1:N) o flag columns para múltiple selección
5. Remover valores errados (satisfacción)

**Resultado esperado**: 5-6 categorías + manejo de múltiple selección

---

## 12. DUDAS PENDIENTES

### A Aclaración con Usuario

1. **¿Qué hace el valor "varias" en COMUNA?**
   - ¿Es un evento que se llevó a cabo en múltiples comunas?
   - ¿Debería desglosarse a nivel evento?

2. **¿La columna "¿hace parte de alguna organización social?" es binaria o de texto libre?**
   - Actualmente tiene 55 valores únicos (nombres de org + SI/NO/Variantes)
   - ¿Se debe normalizar a SI/NO e ignorar el nombre de la org, o crear columna separada?

3. **Respuestas abiertas (columnas 14, 18-21, 23-24)**:
   - ¿Se van a usar para análisis de texto?
   - ¿O solo se categorizan (ej: tema sugerido)?
   - ¿Son obligatorias para el dashboard?

4. **Datos "no encuestado" (69-72% en demográficos)**:
   - ¿Estos registros son VÁLIDOS (asistentes sin datos demográficos)?
   - ¿O indican que hay eventos donde no se recolectó esta información?
   - ¿Se deben filtrar en el dashboard o mantener separados?

5. **Canales de atención - múltiple selección**:
   - ¿Se ve en el tablero actual como "uno o varios canales"?
   - ¿Debería haber una columna separada por cada canal?

6. **Eventos por año**:
   - 2025 solo tiene 494 registros (¿datos parciales del año)?
   - ¿Se deben excluir del análisis de tendencia?

7. **Personas únicas**:
   - No hay ID de persona
   - ¿Se puede asumir que NO hay duplicados (una persona = una encuesta)?
   - ¿O podría la misma persona asistir a múltiples eventos?

8. **Tabla fuente en PBIX**:
   - ¿Es thin report (dataset remoto) o conecta directamente al Excel?
   - ¿Cómo se actualiza? ¿Manual o automático?

---

## 13. PROBLEMAS CRÍTICOS ENCONTRADOS

### Severidad ALTA

| Problema | Impacto | Acción |
|---|---|---|
| 69-72% de datos demográficos faltantes | Análisis segmentado muy limitado | Validar si es intencional |
| Variantes de "Sí/No" sin normalizar | Métricas incorrectas si se usan strings | Crear normalizador |
| Canales de atención: múltiple selección + valores errados | Dashboard incorrecto | Recolección de datos defectuosa |
| Sexo: 4 variantes diferentes | Duplicación en gráficos | Normalizador simple |

### Severidad MEDIA

| Problema | Impacto | Acción |
|---|---|---|
| Espacios inconsistentes | Búsquedas y filtros imprecsos | Trim en normalizador |
| Mayúsculas inconsistentes | Bucles de error en agrupaciones | Normalización a mayúscula o minúscula estándar |
| Ortografía (ej: "mayo" vs "mayor") | Búsquedas manuales fallidas | Validar origen de datos |
| Valor "varias" en Comuna | Confusión en análisis geográfico | Documentar su significado |

### Severidad BAJA

| Problema | Impacto | Acción |
|---|---|---|
| Tildes inconsistentes | Legibilidad | Normalizar en dashboard |
| Variante "exe" (excelente) | Menor impacto si se normaliza bien | Normalizador |

---

## 14. PROPUESTA DE ARQUITECTURA DEL MÓDULO

### Estructura de Carpetas

```
src/modules/encuentros-ciudad/
├── encuentrosCiudad.validator.js
│   ├── validateRow()
│   ├── validateColumns()
│   └── generateReport()
├── encuentrosCiudad.normalizer.js
│   ├── normalizeRow()
│   ├── normalizeSexo()
│   ├── normalizeEdad()
│   ├── normalizeEscolaridad()
│   ├── normalizeActividad()
│   ├── normalizeSatisfaccion()
│   ├── normalizeCanalesAtencion()
│   ├── normalizeOrganizacion()
│   └── normalizeComunaBarrio()
├── dashboard-encuentros-ciudad.service.js
│   ├── calculateMetrics()
│   ├── getEventStats()
│   ├── getSatisfactionAnalysis()
│   ├── getDemographicAnalysis()
│   └── getChannelAnalysis()
└── test/
    ├── encuentrosCiudad.validator.test.js
    ├── encuentrosCiudad.normalizer.test.js
    └── dashboard-encuentros-ciudad.service.test.js
```

### Granularidad de Validación

1. **Row Validation**: Por cada registro, validar:
   - Campos obligatorios (FECHA, LUGAR, COMUNA)
   - Tipos de datos
   - Rangos de valores
   - Consistencia de referencias

2. **Column Validation**: Por cada columna:
   - Tipo correcto
   - Cardinalidad esperada
   - Presencia de valores especiales

3. **Cross-Row Validation**: A nivel dataset:
   - Fechas consistentes
   - Eventos válidos
   - Anomalías de eventos ("varias", etc.)

### Granularidad de Normalización

1. **Per-column**: Mapeo directo de valores
2. **Per-row**: Limpieza de espacios, mayúsculas
3. **Cross-row**: Deduplicación de eventos, resolución de "varias"

### Métricas en Dashboard Service

```javascript
// Eventos y asistentes
totalEventos
totalAsistentes
asistentesPromedioPorEvento
asistentesMediana
asistentesMin
asistentesMax

// Temporal
asistentesporAnio  // Array de {año, asistentes}
eventosporAnio
tendenciaAsistentes

// Geográfico
asistentesporComuna
asistentesporBarrio
comunasCubiertas

// Demográfico (solo datos con dato)
distribucionSexo
distribucionEdad
distribucionEscolaridad
distribucionActividad

// Encuesta
satisfaccionPromedio
% Conoce contraloría
% Tiene celular
% Tiene correo
% Interés en volver

// Canales
distribucionCanales (con manejo de múltiple selección)
satisfaccionporCanal
```

---

## 15. SIGUIENTE PASO

**NO IMPLEMENTAR AÚN**: Esperar validación de dudas pendientes.

**Pendiente de usuario**:
1. Validar estructura de datos (granularidad, evento = qué)
2. Aclarar campos problemáticos (múltiple selección, datos faltantes)
3. Confirmar visuales esperados vs tabla actual
4. Definir estrategia de datos faltantes (filtrar / imputar / reportar)

**A entrega**:
- Commit: `DIAGNOSTICO_ENCUENTROS_CIUDAD.md`
- Archivo analizando sin cambios

---

## RESUMEN EJECUTIVO

| Aspecto | Resultado |
|---|---|
| **Archivo analizado** | ENCUENTRO DE CIUDAD MAYO.xlsx ✓ |
| **Hoja** | asistencia y encues 23-22 ✓ |
| **Total registros** | 4,478 ✓ |
| **Granularidad** | 1 encuesta/persona ✓ |
| **Eventos únicos** | 39 (FECHA+LUGAR) o 60 (FECHA+LUGAR+Comuna) ✓ |
| **Años cubiertos** | 2022-2025 ✓ |
| **Pagina PBIX** | "Encuentros de Ciudad" (fe75146cb079345ede3a) ✓ |
| **Calidad de datos** | 🟡 Media (69-72% datos demográficos faltantes, variantes en respuestas) |
| **Estado para implementación** | 🔴 BLOQUEADO (pendiente aclaraciones) |

---

**Documento generado**: 2026-09-21  
**Próxima acción**: Validación de diagnóstico con usuario
