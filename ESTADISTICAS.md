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

### Gráficos

| Gráfico                             | Tipo         | Datos                              |
| ----------------------------------- | ------------ | ---------------------------------- |
| **Distribución por Posición**       | Pie/Doughnut | Fichajes agrupados por posición    |
| **Tendencias de Mercado (30 días)** | Línea dual   | Volumen de fichajes + Precio medio |

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

### Gráficos

| Gráfico                   | Tipo              | Datos                                  |
| ------------------------- | ----------------- | -------------------------------------- |
| **Participación**         | Barras            | Número de participantes por jornada    |
| **Evolución de Aciertos** | Línea multi-serie | Aciertos por jornada para cada usuario |

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
