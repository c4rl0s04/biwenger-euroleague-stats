# 📊 BiwengerStats - Estadísticas

Este documento describe todas las estadísticas disponibles en la aplicación web.

---

## 🏠 Página de Inicio

La página principal ofrece acceso a tres secciones:

| Sección      | Descripción                                                         |
| ------------ | ------------------------------------------------------------------- |
| **Mercado**  | Análisis de fichajes, tendencias de precios y actividad del mercado |
| **Porras**   | Histórico de predicciones, estadísticas de aciertos y rankings      |
| **Usuarios** | Clasificación real y valores de mercado de jugadores                |

---

## � Dashboard (`/dashboard`)

> Vista general de la liga. Datos resumidos, no detallados.

### KPIs Principales

| Métrica             | Descripción                            |
| ------------------- | -------------------------------------- |
| **Posición Liga**   | Tu posición actual en la clasificación |
| **Puntos Totales**  | Suma de puntos fantasy de la temporada |
| **Valor Plantilla** | Valor total de mercado de tu equipo    |

### Tarjetas de Resumen

| Tarjeta                  | Contenido                                  |
| ------------------------ | ------------------------------------------ |
| **Mi Temporada**         | Puntos, partidos, promedio                 |
| **Líderes por Stat**     | Top 5 en puntos, rebotes, asistencias, PIR |
| **Próxima Jornada**      | Fecha y partidos                           |
| **Cumpleaños Próximos**  | Jugadores con cumpleaños esta semana       |
| **Actividad de Mercado** | Últimos fichajes y ventas                  |
| **Racha Actual**         | Tendencia últimas 5 jornadas               |

### Gráficos (Dashboard)

| Gráfico                     | Tipo        | Datos                                          |
| --------------------------- | ----------- | ---------------------------------------------- |
| **Mi Evolución Fantasy** 📈 | Línea       | Puntos por jornada (últimas 10)                |
| **Posición en Liga** 📊     | Área        | Evolución de tu posición a lo largo del tiempo |
| **Sparklines en Líderes**   | Mini-líneas | Tendencia últimos 5 partidos por jugador       |

---

## 🏀 Detalle Jugador (`/player/[id]`)

> Vista individual de un jugador con todo el detalle.

### Información Principal

| Dato              | Descripción                       |
| ----------------- | --------------------------------- |
| **Nombre/Equipo** | Jugador, equipo, posición, dorsal |
| **Propietario**   | Quién lo tiene fichado            |
| **Precio Actual** | Valor de mercado + tendencia      |
| **Estado**        | Lesionado, sancionado, ok         |

### Estadísticas de Temporada

| Métrica            | Total | Media |
| ------------------ | ----- | ----- |
| **Puntos Reales**  | SUM   | AVG   |
| **Fantasy Points** | SUM   | AVG   |
| **Rebotes**        | SUM   | AVG   |
| **Asistencias**    | SUM   | AVG   |
| **Robos**          | SUM   | AVG   |
| **Tapones**        | SUM   | AVG   |
| **Valoración**     | SUM   | AVG   |

### Gráficos (Jugador)

| Gráfico                        | Tipo          | Datos                                       |
| ------------------------------ | ------------- | ------------------------------------------- |
| **�📈 Evolución de Precio**    | Línea + Área  | Histórico de precio con marcas compra/venta |
| **🕸️ Radar de Habilidades**    | Radar         | PTS, REB, AST, STL, BLK, PIR (normalizado)  |
| **📊 Rendimiento por Jornada** | Barras        | Fantasy points cada jornada                 |
| **🏠/✈️ Casa vs Fuera**        | Barras dobles | Comparativa puntos local/visitante          |

### Historial de Traspasos

| Columna | Descripción             |
| ------- | ----------------------- |
| Fecha   | Cuándo se realizó       |
| De → A  | Vendedor → Comprador    |
| Precio  | Monto de la transacción |

---

## 📈 Mercado (`/market`)

### KPIs Principales

| Métrica            | Descripción                                              |
| ------------------ | -------------------------------------------------------- |
| **Volumen Movido** | Dinero total intercambiado en la liga (en millones €)    |
| **Operaciones**    | Número total de operaciones realizadas                   |
| **Precio Medio**   | Precio promedio por operación                            |
| **El más fichado** | Jugador con más traspasos (veces fichado + precio medio) |
| **Récord Pujas**   | Mayor número de pujas en una operación                   |

### Tarjetas Destacadas

| Tarjeta              | Contenido                                                    |
| -------------------- | ------------------------------------------------------------ |
| **Récord Histórico** | Fichaje más caro de la historia (jugador, precio, comprador) |
| **El Jeque**         | Usuario que más ha gastado (gasto total + nº fichajes)       |
| **Porras**           | Enlace rápido al historial de predicciones                   |

### Análisis de Posiciones

| Estadística                       | Descripción                            |
| --------------------------------- | -------------------------------------- |
| **Posición Más Fichada**          | Posición con más fichajes (B/A/P/AP/E) |
| **Precio Medio por Posición**     | Coste promedio según la posición       |
| **Posición Favorita por Usuario** | Qué posición ficha más cada usuario    |

### Guerra de Pujas

| Estadística           | Descripción                                     |
| --------------------- | ----------------------------------------------- |
| **Récord de Pujas**   | Jugador con más pujas, precio final y comprador |
| **Top 5 Más Pujados** | Jugadores con mayor número máximo de pujas      |

### Gráficos (Mercado)

| Gráfico                             | Tipo         | Datos                              |
| ----------------------------------- | ------------ | ---------------------------------- |
| **Distribución por Posición**       | Pie/Doughnut | Fichajes agrupados por posición    |
| **Tendencias de Mercado (30 días)** | Línea dual   | Volumen de fichajes + Precio medio |
| **📈 Inflación del Mercado**        | Área         | Precio medio por semana            |

### Tablas

| Tabla                 | Columnas                                                      |
| --------------------- | ------------------------------------------------------------- |
| **Finanzas Managers** | Manager, Operaciones (Compras/Ventas), Balance                |
| **Mercado en vivo**   | Fecha, Jugador, Operación (Vendedor→Comprador), Precio, Pujas |

---

## 🎯 Porras (`/porras`)

### Logros Especiales

| Logro             | Descripción                                                    |
| ----------------- | -------------------------------------------------------------- |
| **Perfect 10**    | Usuarios que han conseguido 10/10 aciertos (usuario + jornada) |
| **Blanked**       | Usuarios con 0 aciertos en una jornada                         |
| **Clutch Player** | Mejor promedio en las últimas 3 jornadas                       |
| **Más Victorias** | Usuario con más jornadas ganadas                               |

### Estadísticas de Jornada

| Métrica            | Descripción                                                          |
| ------------------ | -------------------------------------------------------------------- |
| **Mejor Jornada**  | Récord de aciertos en una jornada (usuario + aciertos + jornada)     |
| **Mejor Promedio** | Usuario con mejor promedio de aciertos (promedio + jornadas jugadas) |

### Gráficos (Porras)

| Gráfico                   | Tipo              | Datos                                            |
| ------------------------- | ----------------- | ------------------------------------------------ |
| **Participación**         | Barras            | Número de participantes por jornada              |
| **Evolución de Aciertos** | Línea multi-serie | Aciertos por jornada para cada usuario           |
| **🏆 Ranking Animado**    | Race bar chart    | Evolución del ranking a lo largo de la temporada |

### Tabla de Estadísticas Detalladas

| Columna  | Descripción                                  |
| -------- | -------------------------------------------- |
| Jugador  | Nombre del usuario                           |
| Promedio | Media de aciertos                            |
| Mediana  | Valor mediano de aciertos                    |
| Jornadas | Número de jornadas jugadas                   |
| Total    | Suma total de aciertos                       |
| Mejor    | Mayor puntuación en una jornada              |
| Peor     | Menor puntuación en una jornada              |
| Forma    | Tendencia (↗ subiendo, ↘ bajando, → estable) |

### Histórico por Jornadas

Tabla cruzada con:

- **Filas**: Cada jornada
- **Columnas**: Cada usuario
- **Valores**: Aciertos por usuario/jornada (coloreados según rendimiento)

---

## 👥 Usuarios (`/usuarios`)

### Vista General

Para cada usuario se muestra:

- Número de jugadores en plantilla
- Valor total de la plantilla
- Media de puntos por jornada
- Jornadas jugadas
- MVP (mejor jugador)

### Análisis de Valor

| Gráfico                       | Tipo                 | Descripción                       |
| ----------------------------- | -------------------- | --------------------------------- |
| **Valor Total de Plantillas** | Barras horizontales  | Comparativa del valor por usuario |
| **Eficiencia de Plantilla**   | Dispersión (Scatter) | Valor vs Puntos totales           |

### Distribución Posicional

Para cada usuario:

- Gráfico de dona con distribución B/A/P
- Puntuación de equilibrio (%)
- Recomendaciones de fichaje

### Top Performers

Los 3 mejores jugadores de cada usuario:

- Nombre y equipo
- Puntos totales

### Eficiencia y ROI

| Métrica                 | Descripción                                   |
| ----------------------- | --------------------------------------------- |
| **Puntos por Millón €** | Ratio de eficiencia (puntos/millón invertido) |
| **Podio de Eficiencia** | Top 3 usuarios más eficientes                 |

### Detalle de Plantillas (Expandible)

| Columna | Descripción          |
| ------- | -------------------- |
| Jugador | Nombre y equipo      |
| Pos     | Posición (B/A/P)     |
| Puntos  | Puntos totales       |
| Media   | Media de puntos      |
| Valor   | Valor de mercado (€) |

### Comparativa de Equipos

- Gráfico de barras horizontal con todos los equipos de la Euroliga
- Número de jugadores fichados por equipo

---

## 🆚 Comparador de Jugadores (Nueva Página)

> Selecciona 2 jugadores para comparar lado a lado.

### Visualización

| Gráfico                 | Tipo        | Datos                            |
| ----------------------- | ----------- | -------------------------------- |
| **Radar Comparativo**   | Radar doble | Ambos jugadores superpuestos     |
| **Barras Lado a Lado**  | Barras H2H  | Cada stat comparada directamente |
| **Evolución de Precio** | Línea dual  | Histórico de precio de ambos     |

---

## 🎨 Leyenda de Colores por Posición

| Código | Posición   | Color      |
| ------ | ---------- | ---------- |
| B      | Base       | 🔵 Azul    |
| A      | Alero      | 🟢 Verde   |
| P      | Pívot      | 🔴 Rojo    |
| AP     | Ala-Pívot  | 🟠 Naranja |
| E      | Entrenador | 🟣 Índigo  |

---

## 📐 Leyenda de Rendimiento (Porras)

| Aciertos | Indicador            |
| -------- | -------------------- |
| ≥7       | 🟢 Verde (Excelente) |
| 5-6      | 🟡 Amarillo (Bueno)  |
| 3-4      | 🟠 Naranja (Regular) |
| <3       | 🔴 Rojo (Malo)       |

---

_BiwengerStats © 2025_
