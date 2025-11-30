# Investigación de API de Jornadas

## ✅ Endpoint Encontrado (Sin CDN)

Podemos usar la API principal de Biwenger:

```
https://biwenger.as.com/api/v2/rounds/euroleague/{roundId}?score=1&lang=es
```

**Probado y funciona:**

- ✅ `biwenger.as.com/api/v2/rounds/euroleague/4746` → Jornada 1
- ✅ `biwenger.as.com/api/v2/rounds/euroleague/4758` → Jornada 13
- ❌ `biwenger.as.com/api/v2/competitions/euroleague/rounds/...` → 400 Error

**Conclusión**: Usaremos el endpoint principal iterando roundId desde 4746 hasta el actual.

---

## 📊 Estructura de Datos del Jugador

Basándome en el endpoint, cada jugador en un partido tiene:

```json
{
  "player": {
    "id": 32117,
    "name": "Justin Anderson",
    "position": 2
  },
  "points": 27,
  "stats": [
    ["Minutos jugados", "26"],
    ["Puntos", "15"],
    ["Rebotes totales", "4"],
    ... (más estadísticas)
  ]
}
```

---

## 💡 Columnas Propuestas para la Tabla `player_round_stats`

| Columna                                | Tipo            | Descripción                     |
| -------------------------------------- | --------------- | ------------------------------- |
| `id`                                   | INTEGER PK AUTO | ID único del registro           |
| `round_id`                             | INTEGER         | ID de la jornada (ej: 4746)     |
| `player_id`                            | INTEGER         | ID del jugador Biwenger         |
| `game_id`                              | INTEGER         | ID del partido específico       |
| `team_id`                              | INTEGER         | ID del equipo (home/away)       |
| `points`                               | INTEGER         | **Puntos Biwenger** del jugador |
| `stats_json`                           | TEXT            | Array completo de stats en JSON |
| `UNIQUE(round_id, player_id, game_id)` | -               | Evitar duplicados               |

**Opcionales** (extraer de `stats_json` si quieres):

- `minutes` INTEGER - Minutos jugados
- `real_points` INTEGER - Puntos reales ACB
- `rebounds` INTEGER - Rebotes

---

## ❓ Confirmación Necesaria

¿Quieres que cree la tabla con estas columnas? ¿Alguna que quieras añadir o quitar?
