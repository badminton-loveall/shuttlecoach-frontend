# ShuttleCoach Design System

Centralized design tokens for consistent spacing, typography, colors, and components across all pages.

## Design Principles

### 1. Spacing Scale
**Scale: 2, 4, 8, 12, 16, 18, 24, 36, 42, 64**

All spacing (padding, margin, gaps) follows this consistent scale:
- `2px` - Minimal spacing
- `4px` - Tight spacing
- `8px` - Small spacing
- `12px` - Medium-small spacing
- `16px` - Base spacing
- `18px` - Medium spacing
- `24px` - Large spacing
- `36px` - Extra large spacing
- `42px` - 2x large spacing
- `64px` - Maximum spacing

Usage in Tailwind:
```jsx
<div className="p-4 gap-6 m-3">  // padding: 16px, gap: 24px, margin: 12px
<div className="px-9 py-6">       // px: 36px, py: 24px
```

### 2. Typography Scale
**Font sizes: 12, 16, 18, 24, 36, 42, 64**

- `64px` - Display (hero text, landing pages)
- `42px` - H1 (page titles)
- `36px` - H2 (major section headers)
- `24px` - H3 (subsection headers)
- `18px` - H4 (small headers, emphasis)
- `16px` - Body (default text)
- `12px` - Small text and labels

Usage in Tailwind:
```jsx
<h1 className="text-h1">Page Title</h1>           // 42px
<h2 className="text-h2">Section Header</h2>      // 36px
<p className="text-body">Regular text</p>         // 16px
<span className="text-small">Caption</span>      // 12px
```

Font Families:
- **Display/Headers**: Plus Jakarta Sans
- **Body**: Inter

### 3. Border Radius Scale
**Rounded corners: 8, 12, 16, 24**

- `8px` (sm) - Small elements, badges
- `12px` (md) - Default (buttons, inputs, cards)
- `16px` (lg) - Large cards, modals
- `24px` (xl) - Hero elements
- `999px` (pill) - Fully rounded buttons

Usage in Tailwind:
```jsx
<button className="rounded-md">Button</button>     // 12px
<div className="rounded-lg">Card</div>            // 16px
<span className="rounded-pill">Badge</span>       // 999px
```

### 4. Color System (WCAG AA Compliant)

All colors meet WCAG AA contrast requirements for accessibility.

**Primary**:
- `#B8E135` - Electric Lime (main brand color)
- `#9ac61a` - Darker shade
- `#d0f766` - Lighter shade

**Semantic Colors** (with accessible backgrounds):
- **Success**: `#22C55E` (green) - bg: `#F0FDF4`, text: `#166534`
- **Warning**: `#F59E0B` (amber) - bg: `#FFFBEB`, text: `#92400E`
- **Danger**: `#EF4444` (red) - bg: `#FEF2F2`, text: `#991B1B`
- **Info**: `#3B82F6` (blue) - bg: `#EFF6FF`, text: `#1E40AF`

**Neutral Slate Palette**:
```css
50:  #F8FAFB  (lightest - card backgrounds)
100: #F1F4F6  (hover states)
200: #E4E9EC  (borders)
300: #D1D9DE
400: #9CA8B3  (tertiary text)
500: #6B7885
600: #4A5662  (secondary text)
700: #333D47
800: #1F262E
900: #131820  (dark mode cards)
950: #0A0D11  (darkest - dark mode background, primary text)
```

Usage:
```jsx
<button className="bg-primary text-slate-950">Primary Button</button>
<div className="bg-danger-bg text-danger-text">Error Message</div>
<span className="text-slate-600">Secondary text</span>
```

### 5. Shadows

- `shadow-card`: Subtle elevation for cards (0 2px 12px)
- `shadow-float`: Higher elevation for dropdowns, modals (0 8px 32px)
- `shadow-focus`: Focus ring for keyboard navigation (0 0 0 3px primary)
- `shadow-overlay`: Maximum elevation for overlays (0 12px 24px)

### 6. Page Layout Standards

All pages follow consistent container and padding patterns:

**Page Container**:
```jsx
<div className="page-container">  
  {/* Desktop: 42px vertical, 36px horizontal */}
  {/* Tablet: 36px vertical, 24px horizontal */}
  {/* Mobile: 24px vertical, 16px horizontal */}
</div>
```

**Card Padding**:
```jsx
<div className="card-padding">     {/* 24px */}
<div className="card-padding-sm">  {/* 16px */}
<div className="card-padding-lg">  {/* 36px */}
```

## Files

### globals.css
- Tailwind CSS initialization
- Font imports (Plus Jakarta Sans, Inter)
- Base HTML element styles (h1-h6, p, a, form elements)
- Dark mode support via `prefers-color-scheme`
- Scrollbar styling
- Accessibility features (focus states, reduced motion)
- Page layout utilities (`.page-container`, `.card-padding`, etc.)
- Responsive utilities

### design-system.css
- CSS custom properties (design tokens)
- Typography utility classes (`.text-h1`, `.text-body`, etc.)
- Component styles (`.card`, `.btn`, `.input`, `.badge`)
- Layout utilities (`.flex`, `.grid`, `.container`)
- Animation keyframes
- Utility classes (`.truncate`, `.line-clamp-2`, etc.)

## Usage Examples

### Consistent Card Component
```jsx
<div className="bg-slate-50 dark:bg-slate-900 rounded-md shadow-card p-6 gap-4 flex flex-col">
  <h3 className="text-h3 text-slate-950 dark:text-slate-50">Card Title</h3>
  <p className="text-body text-slate-600 dark:text-slate-300">Card content with proper spacing</p>
  <button className="btn btn-primary rounded-md px-4 py-3">Action</button>
</div>
```

### Form with Consistent Spacing
```jsx
<form className="flex flex-col gap-6">
  <div className="flex flex-col gap-2">
    <label className="text-label text-slate-700">Username</label>
    <input className="input rounded-md px-4 py-3" />
  </div>
  <button className="btn btn-primary px-6 py-3 rounded-md">Submit</button>
</form>
```

### Page Layout
```jsx
<div className="page-container">
  <h1 className="text-h1 mb-6">Page Title</h1>
  
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="card-padding bg-white rounded-lg shadow-card">
      <h3 className="text-h3 mb-4">Section 1</h3>
      <p className="text-body">Content</p>
    </div>
    {/* More cards... */}
  </div>
</div>
```

## Accessibility Features

1. **WCAG AA Compliant Colors**: All color combinations meet minimum contrast ratios
2. **Keyboard Navigation**: Visible focus states on all interactive elements
3. **Focus Indicators**: Custom focus rings using `--shadow-focus`
4. **Reduced Motion**: Respects `prefers-reduced-motion` user preference
5. **Semantic HTML**: Proper heading hierarchy and landmarks
6. **Screen Reader Support**: `.sr-only` utility for screen reader-only text

## Responsive Breakpoints

```css
sm:  640px   (phones)
md:  768px   (tablets)
lg:  1024px  (small desktops)
xl:  1280px  (desktops)
2xl: 1536px  (large screens)
```

Usage:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop */}
</div>
```

## Best Practices

1. **Always use spacing scale values** - No arbitrary values like `padding: 15px`
2. **Use Tailwind utilities** - Prefer `className="p-6 gap-4"` over custom CSS
3. **Follow the font scale** - Use `text-h1`, `text-body`, etc. classes
4. **Maintain consistent border radius** - Use `rounded-md` (12px) as default
5. **Apply proper semantic colors** - Use `bg-danger` for errors, `bg-success` for confirmations
6. **Test contrast** - Use WebAIM Contrast Checker for any custom color combinations
7. **Mobile-first responsive design** - Design for mobile, enhance for desktop

## Dark Mode

Dark mode is automatically supported via `prefers-color-scheme: dark`:

```jsx
<div className="bg-white dark:bg-slate-950 text-slate-950 dark:text-slate-50">
  Content adapts to system preference
</div>
```

Variables automatically switch in dark mode:
- Backgrounds become darker
- Text colors invert
- Borders adjust
- Card surfaces change
