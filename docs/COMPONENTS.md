# Component Documentation

Documentation for reusable UI components in Biwenger Stats.

---

## UI Components

### LoadingSkeleton

Animated placeholder for loading states.

**Location:** `src/components/ui/LoadingSkeleton.js`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | string | `''` | Additional CSS classes |

**Variants:**

```jsx
// Basic skeleton
<LoadingSkeleton className="h-4 w-32" />

// Card skeleton
<CardSkeleton />
<CardSkeleton className="h-[400px]" />

// Table row skeleton
<TableRowSkeleton />
```

**Usage Example:**

```jsx
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

function MyCard() {
  const { data, loading } = useApiData('/api/data');

  if (loading) return <CardSkeleton className="h-[300px]" />;

  return <div>{/* content */}</div>;
}
```

---

### StandardCard

Consistent card wrapper with glass morphism styling.

**Location:** `src/components/ui/StandardCard.js`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | - | Card header title |
| `icon` | ReactNode | - | Lucide icon component |
| `children` | ReactNode | - | Card content |
| `className` | string | `''` | Additional classes |

**Usage Example:**

```jsx
import StandardCard from '@/components/ui/StandardCard';
import { Trophy } from 'lucide-react';

function StandingsCard() {
  return (
    <StandardCard title="Clasificación" icon={<Trophy />}>
      <div>Content goes here</div>
    </StandardCard>
  );
}
```

---

### ErrorBoundary

Catches JavaScript errors in child components.

**Location:** `src/components/ui/ErrorBoundary.js`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | Required | Components to wrap |
| `fallback` | ReactNode | Default UI | Custom error UI |

**Usage Example:**

```jsx
import ErrorBoundary from '@/components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <RiskyComponent />
    </ErrorBoundary>
  );
}
```

---

### FadeIn

Fade-in animation wrapper.

**Location:** `src/components/ui/FadeIn.js`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | Required | Content to animate |
| `delay` | number | 0 | Delay in ms |

**Usage Example:**

```jsx
import FadeIn from '@/components/ui/FadeIn';

function Dashboard() {
  return (
    <>
      <FadeIn delay={0}>
        <Card1 />
      </FadeIn>
      <FadeIn delay={100}>
        <Card2 />
      </FadeIn>
      <FadeIn delay={200}>
        <Card3 />
      </FadeIn>
    </>
  );
}
```

---

### UserAvatar

Optimized user avatar with next/image.

**Location:** `src/components/ui/UserAvatar.js`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | string | - | Avatar URL |
| `alt` | string | Required | Alt text |
| `size` | 'sm'/'md'/'lg'/'xl' | 'md' | Size preset |

**Usage Example:**

```jsx
import UserAvatar from '@/components/ui/UserAvatar';

<UserAvatar src={user.icon} alt={user.name} size="lg" />;
```

---

## Dashboard Components

### StreakCard

Shows hot or cold player streaks.

**Location:** `src/components/dashboard/StreakCard.js`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | 'hot' / 'cold' | 'hot' | Streak type |
| `limit` | number | 5 | Players to show |

**Usage Example:**

```jsx
import StreakCard from '@/components/dashboard/StreakCard';

<StreakCard type="hot" limit={5} />
<StreakCard type="cold" limit={3} />
```

---

### StandingsTable

Full standings table with sorting.

**Location:** `src/components/dashboard/StandingsTable.js`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `standings` | array | Required | Standings data |
| `limit` | number | - | Optional row limit |

**Usage Example:**

```jsx
import StandingsTable from '@/components/dashboard/StandingsTable';

<StandingsTable standings={standingsData} limit={5} />;
```

---

## Hooks

### useApiData

Standardized API data fetching hook.

**Location:** `src/lib/hooks/useApiData.js`

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `endpoint` | string/function | API endpoint |
| `options.immediate` | boolean | Fetch on mount (default: true) |
| `options.transform` | function | Transform response data |
| `options.dependencies` | array | Deps to trigger refetch |
| `options.skip` | boolean | Skip fetching |

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `data` | any | Fetched data |
| `loading` | boolean | Loading state |
| `error` | string/null | Error message |
| `refetch` | function | Manually refetch |

**Usage Examples:**

```jsx
// Simple usage
const { data, loading } = useApiData('/api/standings/full');

// With transform
const { data } = useApiData('/api/performance', {
  transform: (d) => d.volatility,
});

// Dynamic endpoint
const { data } = useApiData(`/api/user/${userId}`, {
  dependencies: [userId],
  skip: !userId,
});

// Manual refetch
const { data, refetch } = useApiData('/api/market');
<button onClick={refetch}>Refresh</button>;
```

---

## Component Patterns

### Lazy Loading with Dynamic Import

```jsx
import dynamic from 'next/dynamic';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <CardSkeleton className="h-[400px]" />,
  ssr: false, // Excludes from server bundle
});
```

### Data Fetching Pattern

```jsx
'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import StandardCard from '@/components/ui/StandardCard';

export default function MyCard() {
  const { data, loading, error } = useApiData('/api/my-endpoint');

  if (loading) return <CardSkeleton />;
  if (error) return <div>Error: {error}</div>;
  if (!data?.length) return <div>No data</div>;

  return <StandardCard title="My Card">{/* render data */}</StandardCard>;
}
```

### Empty State Pattern

```jsx
{
  !loading && data.length === 0 ? (
    <div className="text-center text-slate-400 py-8">No hay datos disponibles</div>
  ) : (
    <div>{/* render data */}</div>
  );
}
```
