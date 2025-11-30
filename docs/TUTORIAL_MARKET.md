# 🎓 Tutorial: Market API + Interactive Page

## 📚 Lo que Acabamos de Crear

Hemos creado una **página Market completa** que demuestra:

- ✅ **API REST** (backend)
- ✅ **Client Component** interactivo (frontend)
- ✅ **Comunicación API-Frontend**

---

## 📂 Archivos Creados

### 1. **`src/app/api/market/route.js`** - API Backend

```javascript
export async function GET(request) {
  // 1. Parse query parameters
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");

  // 2. Get data from database
  const data = getMarketData();

  // 3. Return JSON
  return NextResponse.json({ data });
}
```

**URL**: `http://localhost:3000/api/market`

**Respuesta**:

```json
{
  "success": true,
  "data": {
    "kpis": { ... },
    "transfers": [ ... ],
    "trends": [ ... ]
  }
}
```

**Pruébala**:

```bash
curl http://localhost:3000/api/market
# O abre en el navegador directamente
```

---

### 2. **`src/app/market/page.js`** - Frontend Interactivo

```javascript
"use client"; // ← Client Component

export default function MarketPage() {
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch from API
  useEffect(() => {
    fetch("/api/market")
      .then((res) => res.json())
      .then((result) => setData(result.data));
  }, []);

  // Interactive search
  const filtered = data?.transfers.filter((t) =>
    t.comprador.includes(searchTerm)
  );

  return (
    <div>
      <input onChange={(e) => setSearchTerm(e.target.value)} />
      {filtered.map((t) => (
        <div>{t.comprador}</div>
      ))}
    </div>
  );
}
```

**URL**: `http://localhost:3000/market`

---

## 🔄 Flujo Completo

```
1. Usuario abre /market
        ↓
2. Market page (Client Component) carga
        ↓
3. useEffect() ejecuta fetch('/api/market')
        ↓
4. API route recibe petición GET
        ↓
5. API consulta database.js
        ↓
6. Database devuelve datos a API
        ↓
7. API devuelve JSON al frontend
        ↓
8. useState actualiza con los datos
        ↓
9. Página se renderiza con datos
        ↓
10. Usuario escribe en búsqueda
        ↓
11. onChange actualiza searchTerm (useState)
        ↓
12. React filtra y re-renderiza (sin API, sin reload)
```

---

## 🎯 Conceptos Demostrados

### **1. API REST Endpoint**

**Definición**: URL que devuelve datos en formato JSON

**Ejemplo**:

```
GET /api/market → { "data": {...} }
```

**Ventajas**:

- Separación backend/frontend
- Reutilizable (web, móvil, etc.)
- Testeable independientemente

---

### **2. Client Component**

**Indicador**: `'use client'` en la primera línea

**Características**:

- ✅ Ejecuta JavaScript en el navegador
- ✅ Puede usar hooks (useState, useEffect)
- ✅ Puede escuchar eventos (onClick, onChange)
- ❌ No puede acceder a DB directamente

---

### **3. React Hooks**

#### **useState** - Datos que pueden cambiar

```javascript
const [count, setCount] = useState(0);

// Leer valor
console.log(count); // 0

// Cambiar valor
setCount(5); // Ahora count = 5, página se actualiza
```

**En nuestra página**:

```javascript
const [searchTerm, setSearchTerm] = useState(""); // Búsqueda
const [data, setData] = useState(null); // Datos de API
const [loading, setLoading] = useState(true); // Estado de carga
```

---

#### **useEffect** - Hacer algo cuando la página carga

```javascript
useEffect(() => {
  // Este código se ejecuta cuando la página carga
  console.log("Página cargada!");
}, []); // [] = solo una vez
```

**En nuestra página**:

```javascript
useEffect(() => {
  fetch("/api/market")
    .then((res) => res.json())
    .then((data) => setData(data));
}, []); // Llamar API cuando página carga
```

---

### **4. fetch() - Llamar APIs**

```javascript
// Básico
fetch("/api/market")
  .then((response) => response.json()) // Convertir a JSON
  .then((data) => console.log(data)); // Usar datos

// Con async/await (moderno)
async function getData() {
  const response = await fetch("/api/market");
  const data = await response.json();
  console.log(data);
}
```

---

### **5. Interactividad sin Recarga**

**Input de Búsqueda**:

```javascript
const [searchTerm, setSearchTerm] = useState("");

<input
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)} // ← Actualiza instantáneamente
/>;
```

**Filtrado Local**:

```javascript
const filtered = data?.transfers.filter((t) =>
  t.comprador.includes(searchTerm)
);
```

Cada vez que `searchTerm` cambia → React filtra de nuevo → Actualiza tabla

**Todo sin llamar a la API o recargar la página** ✨

---

### **6. Ordenar Tabla (Click)**

```javascript
const [sortBy, setSortBy] = useState("fecha");
const [sortOrder, setSortOrder] = useState("desc");

function handleSort(column) {
  if (sortBy === column) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc"); // Toggle
  } else {
    setSortBy(column);
  }
}

<th onClick={() => handleSort("precio")}>
  Precio {sortBy === "precio" && (sortOrder === "asc" ? "↑" : "↓")}
</th>;
```

**Click en columna → Ordena → Sin recarga**

---

## 🧪 Cómo Probar

### **1. Abre la API directamente**

```
http://localhost:3000/api/market
```

Verás el JSON crudo. Esto es lo que el frontend consume.

---

### **2. Abre la página Market**

```
http://localhost:3000/market
```

Verás:

- KPIs arriba
- Búsqueda interactiva
- Tabla de transferencias

---

### **3. Prueba la Interactividad**

1. **Búsqueda**: Escribe un nombre → Tabla filtra instantáneamente
2. **Ordenar**: Click en "Precio" o "Fecha" → Tabla reordena
3. **Refresh**: Click botón "Actualizar" → Vuelve a llamar API

**Observa que NO hay flash blanco ni recarga de página** ✅

---

## 🆚 Comparación: Flask vs Next.js

### **Flask** (tu código actual)

```python
# app.py
@app.route('/market')
def market():
    data = get_market_data()  # DB
    return render_template('market.html', data=data)  # HTML
```

```html
<!-- market.html -->
<table>
  {% for transfer in data %}
  <tr>
    ...
  </tr>
  {% endfor %}
</table>

<!-- Para filtrar -->
<form action="/market" method="GET">
  <input name="search" />
  <button>Buscar</button> ← Recarga página
</form>
```

**Problemas**:

- ❌ Cada filtro = recarga completa
- ❌ Backend y frontend mezclados
- ❌ No reutilizable

---

### **Next.js** (código nuevo)

```javascript
// API (backend)
export async function GET() {
  const data = getMarketData();
  return Response.json({ data });
}

// Page (frontend)
'use client';
function Market() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/market').then(...);
  }, []);

  const filtered = data.filter(t => t.name.includes(filter));

  return (
    <input onChange={e => setFilter(e.target.value)} />  ← Sin recarga
  );
}
```

**Ventajas**:

- ✅ Filtros instantáneos
- ✅ Backend separado (API reutilizable)
- ✅ Mejor UX

---

## 🎯 Próximos Pasos

Ahora que entiendes lo básico, puedes:

1. **Añadir más filtros** (por rango de precio, fecha, etc.)
2. **Agregar gráficos** con Chart.js
3. **Crear APIs para Porras y Usuarios**
4. **Añadir paginación** (ver 50 de 1000)

---

## 💡 Conceptos Clave para Recordar

| Concepto              | Qué hace                      | Ejemplo                           |
| --------------------- | ----------------------------- | --------------------------------- |
| `'use client'`        | Convierte en Client Component | Primera línea del archivo         |
| `useState`            | Datos que cambian             | `const [x, setX] = useState(0)`   |
| `useEffect`           | Código al cargar              | `useEffect(() => {...}, [])`      |
| `fetch()`             | Llamar API                    | `fetch('/api/market')`            |
| API Route             | Backend endpoint              | `src/app/api/market/route.js`     |
| `NextResponse.json()` | Devolver JSON                 | `return NextResponse.json({...})` |

---

**¡Felicidades!** Has creado tu primera API + página interactiva con Next.js 🎉
