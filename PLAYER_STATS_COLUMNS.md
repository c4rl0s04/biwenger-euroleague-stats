# Propuesta de Columnas para `player_round_stats`

Basándome en las estadísticas estándar de Biwenger para Euroliga:

## Columnas Propuestas (SIN JSON) - VERSIÓN LIMPIA

### Identificadores

```sql
id                  INTEGER PRIMARY KEY AUTOINCREMENT
round_id            INTEGER    -- ID de la jornada (ej: 4746)
player_id           INTEGER    -- ID del jugador (FK a players)
game_id             INTEGER    -- ID del partido específico
```

### Puntuación Biwenger

```sql
points              INTEGER    -- Puntos Biwenger de ESE PARTIDO
```

### Estadísticas del Partido

```sql
minutos_jugados     INTEGER    -- Minutos en cancha
puntos_reales       INTEGER    -- Puntos anotados en el partido real
rebotes_totales     INTEGER    -- Rebotes defensivos + ofensivos
rebotes_defensivos  INTEGER
rebotes_ofensivos   INTEGER
asistencias         INTEGER
robos               INTEGER    -- Robos de balón
tapones             INTEGER    -- Tapones/Bloqueos
perdidas            INTEGER    -- Balones perdidos
faltas_cometidas    INTEGER
faltas_recibidas    INTEGER
tiros_campo_anotados   INTEGER -- Tiros de campo convertidos
tiros_campo_intentados INTEGER -- Tiros de campo totales
tiros_3_anotados    INTEGER    -- Triples convertidos
tiros_3_intentados  INTEGER    -- Triples intentados
tiros_libres_anotados   INTEGER -- Tiros libres convertidos
tiros_libres_intentados INTEGER -- Tiros libres intentados
valoracion          INTEGER    -- Valoración ACB
```

### Clave Única

```sql
UNIQUE(round_id, player_id, game_id)
FOREIGN KEY(player_id) REFERENCES players(id)
```

---

## Totales

**Versión completa**: 22 columnas (sin redundancias)
**Versión reducida**: 13 columnas

### Versión Reducida (Solo lo Esencial):

```
- id, round_id, player_id, game_id
- points (Biwenger)
- minutos_jugados
- puntos_reales
- rebotes_totales
- asistencias
- robos
- tapones
- perdidas
- valoracion
```

**Nota**: `team_id` y `position` se obtienen haciendo JOIN con la tabla `players`

¿Prefieres la versión completa (22 cols) o la reducida (13 cols)?
