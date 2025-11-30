# 🎨 Design Guidelines - BiwengerStats Next.js

> **Last Updated**: 2025-11-26

## 📐 Design Principles

### ✨ **Elegance & Professionalism**

This project prioritizes a **modern, elegant, and professional** aesthetic.

---

## 🚫 **NO EMOJIS**

**IMPORTANT**: Do **NOT** use emojis anywhere in the UI.

**Reason**: Emojis give an unprofessional, "cheap" appearance.

**Instead, use**:

- ✅ SVG icons from Heroicons (already included with Tailwind)
- ✅ Custom SVG graphics
- ✅ Icon libraries (Lucide, Feather Icons, etc.)
- ✅ Typography and spacing for emphasis

**Examples**:

❌ **BAD** (Emoji):

```jsx
<div>💰 Market</div>
<div>🎱 Porras</div>
```

✅ **GOOD** (SVG Icon):

```jsx
<svg className="w-6 h-6" fill="none" stroke="currentColor">
  <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2..." />
</svg>
```

---

## 🎨 Color Palette

### Primary Colors

- **Background**: `slate-900` (#0f172a)
- **Cards**: `slate-800` (#1e293b)
- **Borders**: `slate-700` (#334155)
- **Text**: `white` / `slate-300` / `slate-400`

### Accent Colors

- **Market**: `amber-400` / `amber-500` (Gold/Yellow)
- **Porras**: `purple-400` / `purple-500` (Purple)
- **Usuarios**: `green-400` / `green-500` (Green)
- **Success**: `emerald-500`
- **Error**: `red-500`

---

## 🖋️ Typography

### Font Family

- **Primary**: Inter (from Next.js)
- **Fallback**: System fonts

### Font Sizes

```
Hero Title: text-7xl (72px)
Page Title: text-4xl (36px)
Section Title: text-3xl (30px)
Subsection: text-2xl (24px)
Body: text-base (16px)
Small: text-sm (14px)
```

### Font Weights

- **Bold**: font-bold (700)
- **Semibold**: font-semibold (600)
- **Medium**: font-medium (500)
- **Regular**: font-normal (400)
- **Light**: font-light (300)

---

## 🎭 Visual Effects

### Glassmorphism

Use backdrop blur and semi-transparent backgrounds:

```jsx
className = "bg-slate-800/50 backdrop-blur-xl border border-slate-700/50";
```

### Gradients

Use subtle gradients for emphasis:

```jsx
// Text gradient
className =
  "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent";

// Background gradient (on hover)
className =
  "bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-amber-500/5";
```

### Shadows

Use colored shadows on hover:

```jsx
className = "hover:shadow-2xl hover:shadow-amber-500/20";
```

---

## ✨ Animations & Transitions

### Hover Effects

```jsx
// Scale on hover
className = "transition-all duration-500 hover:scale-105";

// Color change
className = "transition-colors duration-300 hover:text-amber-400";

// Slide animation
className = "transition-all duration-300 group-hover:translate-x-2";
```

### Loading States

Use Tailwind's `animate-spin` for loaders:

```jsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
```

---

## 📏 Spacing & Layout

### Container Sizes

- **Max width**: `max-w-7xl` (1280px)
- **Padding**: `px-4 sm:px-6 lg:px-8`

### Grid Layouts

```jsx
// Responsive grid
className = "grid grid-cols-1 md:grid-cols-3 gap-8";
```

### Card Padding

- Small: `p-4`
- Medium: `p-6`
- Large: `p-8`

---

## 🧩 Component Patterns

### Card Component

```jsx
<div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
  {/* Content */}
</div>
```

### Button Primary

```jsx
<button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
  Action
</button>
```

### Input Field

```jsx
<input className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors" />
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind defaults)

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First Approach

Always design for mobile first, then add larger breakpoints:

```jsx
className = "text-xl md:text-3xl lg:text-4xl";
```

---

## 🎯 Accessibility

### Color Contrast

- Ensure text has sufficient contrast with background
- Use `text-slate-300` or `text-white` on dark backgrounds

### Focus States

Always include focus states for interactive elements:

```jsx
className = "focus:outline-none focus:ring-2 focus:ring-green-500";
```

### Semantic HTML

- Use proper heading hierarchy (h1, h2, h3)
- Use semantic tags (`<nav>`, `<main>`, `<section>`, `<article>`)

---

## 🚀 Performance

### Images

- Use Next.js `<Image>` component for optimization
- Always specify width and height

### Icons

- Prefer inline SVG over icon fonts
- Use Tailwind's size utilities (w-6 h-6, etc.)

---

## 📝 Code Style

### Naming Conventions

- **Components**: PascalCase (`MarketPage`, `KPICard`)
- **Functions**: camelCase (`fetchMarketData`, `handleSort`)
- **CSS Classes**: Tailwind utilities only

### Component Structure

```jsx
'use client'; // If needed

import statements

export default function ComponentName() {
  // State
  const [state, setState] = useState();

  // Effects
  useEffect(() => {}, []);

  // Handlers
  function handleAction() {}

  // Render
  return ();
}

// Sub-components (if any)
function SubComponent() {}
```

---

## ⚠️ Don'ts

### ❌ Never

- Use emojis in UI
- Use inline styles
- Mix Tailwind with custom CSS (unless absolutely necessary)
- Use default browser button/input styles
- Leave hover states undefined
- Use harsh, saturated colors

### ✅ Always

- Use SVG icons instead of emojis
- Use Tailwind utility classes
- Include hover states for interactive elements
- Use smooth transitions (duration-300 or duration-500)
- Test responsive breakpoints
- Keep design consistent across pages

---

## 📚 References

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Heroicons**: https://heroicons.com (for SVG icons)
- **Color Palette**: Tailwind's Slate + Accent colors
- **Inspiration**: Modern SaaS dashboards (Linear, Vercel, etc.)

---

**Remember**: The goal is **elegance, professionalism, and modern aesthetics**. Every design decision should reflect this.

```

```
