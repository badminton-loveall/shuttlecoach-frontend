# Design Tokens Quick Reference

## Spacing Scale (use these values only!)
```
2px   → 0.5   → gap-0.5, p-0.5, m-0.5
4px   → 1     → gap-1, p-1, m-1
8px   → 2     → gap-2, p-2, m-2
12px  → 3     → gap-3, p-3, m-3  ⭐ Form fields
16px  → 4     → gap-4, p-4, m-4  ⭐ Base unit
18px  → 4.5   → gap-4.5, p-4.5, m-4.5
24px  → 6     → gap-6, p-6, m-6  ⭐ Cards
36px  → 9     → gap-9, p-9, m-9  ⭐ Sections
42px  → 10.5  → gap-10.5, p-10.5, m-10.5  ⭐ Page padding
64px  → 16    → gap-16, p-16, m-16
```

## Typography Scale (use these classes!)
```
64px  → text-display  (Hero sections)
42px  → text-h1       (Page titles)       ⭐
36px  → text-h2       (Section headers)   ⭐
24px  → text-h3       (Subsections)       ⭐
18px  → text-h4       (Small headers)
16px  → text-body     (Default text)      ⭐
12px  → text-small    (Captions, labels)  ⭐
```

## Border Radius (use these!)
```
8px   → rounded-sm
12px  → rounded-md     ⭐ Default
16px  → rounded-lg
24px  → rounded-xl
999px → rounded-pill
```

## Colors (WCAG AA ✓)

### Primary
```jsx
bg-primary           #B8E135  Electric Lime
bg-primary-dark      #9ac61a
text-primary         #B8E135
```

### Semantic (with accessible backgrounds)
```jsx
// Success (Green)
bg-success           #22C55E
bg-success-light     #86EFAC
bg-success-bg        #F0FDF4  (for alerts)
text-success-text    #166534  (on light bg)

// Warning (Amber)
bg-warning           #F59E0B
bg-warning-bg        #FFFBEB
text-warning-text    #92400E

// Danger (Red)
bg-danger            #EF4444
bg-danger-bg         #FEF2F2
text-danger-text     #991B1B

// Info (Blue)
bg-info              #3B82F6
bg-info-bg           #EFF6FF
text-info-text       #1E40AF
```

### Neutrals (Slate)
```jsx
slate-50   #F8FAFB  ⭐ Card backgrounds
slate-100  #F1F4F6    Hover states
slate-200  #E4E9EC  ⭐ Borders
slate-400  #9CA8B3    Tertiary text
slate-600  #4A5662  ⭐ Secondary text
slate-900  #131820    Dark cards
slate-950  #0A0D11  ⭐ Primary text
```

## Common Patterns

### Page Layout
```jsx
<div className="page-container">
  <h1 className="text-h1 mb-6">Title</h1>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* content */}
  </div>
</div>
```

### Card
```jsx
<div className="bg-slate-50 dark:bg-slate-900 rounded-md shadow-card p-6">
  <h3 className="text-h3 mb-4">Title</h3>
  <p className="text-body text-slate-600">Content</p>
</div>
```

### Button
```jsx
<button className="bg-primary hover:bg-primary-dark text-slate-950 
                   px-4 py-3 rounded-md font-semibold">
  Action
</button>
```

### Input
```jsx
<input className="w-full px-4 py-3 rounded-md border border-slate-200 
                  focus:border-primary focus:ring-3 focus:ring-primary/30"
       placeholder="Enter text" />
```

### Alert
```jsx
// Success
<div className="bg-success-bg text-success-text px-4 py-3 rounded-md">
  ✓ Success message
</div>

// Warning
<div className="bg-warning-bg text-warning-text px-4 py-3 rounded-md">
  ⚠ Warning message
</div>

// Danger
<div className="bg-danger-bg text-danger-text px-4 py-3 rounded-md">
  ✕ Error message
</div>
```

### Grid Layouts
```jsx
// 3-column grid with consistent gaps
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 4-column grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

### Flex Layouts
```jsx
// Horizontal with gap
<div className="flex items-center gap-4">

// Vertical stack
<div className="flex flex-col gap-6">

// Space between
<div className="flex items-center justify-between">
```

## ⭐ Most Used Combinations

```jsx
// Standard card padding
className="p-6"

// Form field padding
className="px-4 py-3"

// Section spacing
className="mb-9" or className="space-y-9"

// Grid gaps
className="gap-6" (cards)
className="gap-4" (form elements)

// Text hierarchy
<h1 className="text-h1 mb-6">
<h2 className="text-h2 mb-4">
<h3 className="text-h3 mb-4">
<p className="text-body mb-4">
```

## Don't Use These Values!
❌ 10px, 14px, 15px, 20px, 25px, 30px, 32px, 40px, 48px, 50px

✅ Only use: 2, 4, 8, 12, 16, 18, 24, 36, 42, 64
