# CSS Architecture Guide

This document describes the CSS architecture and organization principles used in this project.

## Architecture Principles

1. **Localize styles** - Keep CSS as close as possible to the components they affect
2. **Minimal global CSS** - Only for resets, themes, typography, and design tokens
3. **CSS Modules** - Use CSS Modules for component-specific styles to avoid naming conflicts
4. **Design Tokens** - Single source of truth for colors, spacing, typography
5. **BEM-inspired naming** - Use camelCase for CSS module class names (e.g., `appleNav`, `navContainer`)

## Directory Structure

```
src/
├── styles/
│   ├── tokens.css          # Design tokens (colors, spacing, typography)
│   ├── global.css          # Global resets, base typography, accessibility
│   └── utilities.css       # Reusable utility classes
│
├── components/
│   ├── Navigation/
│   │   ├── Navigation.jsx
│   │   ├── Navigation.module.css
│   │   └── index.js
│   ├── RoleSwitcher/
│   │   ├── RoleSwitcher.jsx
│   │   ├── RoleSwitcher.module.css
│   │   └── index.js
│   └── common/
│       └── index.js        # Re-exports components
│
├── pages/
│   ├── Login/
│   │   ├── Login.jsx
│   │   └── Login.module.css
│   └── ... (other pages)
│
├── index.css               # Main entry point, imports global styles
└── App.js
```

## File Descriptions

### `/src/styles/tokens.css`
**Purpose:** Single source of truth for all design tokens

**Contents:**
- Color palette (brand colors, semantic colors)
- Spacing system (8px base grid)
- Typography scale (font sizes, weights, line heights)
- Border radius values
- Transition timings
- Z-index scale
- Shadow definitions
- Theme variables (light/dark mode)

**Usage:**
```css
/* Access design tokens in any CSS file */
.myComponent {
  color: var(--color-primary);
  padding: var(--space-md);
  font-size: var(--font-size-base);
  border-radius: var(--radius-lg);
}
```

### `/src/styles/global.css`
**Purpose:** Global styles that apply to the entire application

**Contents:**
- CSS Reset (margin, padding, box-sizing)
- Base HTML/body styles
- Typography defaults (h1-h6, p, a)
- Custom scrollbar styling
- Accessibility features (focus-visible, reduced-motion)
- App loading state
- Container class

**Note:** Keep this file minimal. Component-specific styles belong in CSS modules.

### `/src/styles/utilities.css`
**Purpose:** Reusable utility classes for common patterns

**Contents:**
- Layout utilities (flex, grid)
- Common component patterns (card, btn, form-control, table, modal, alert)
- Dashboard grid

**Usage:**
```jsx
<div className="card">
  <button className="btn btn-primary">Click me</button>
</div>
```

### Component CSS Modules (e.g., `Navigation.module.css`)
**Purpose:** Component-specific styles with scoped class names

**Naming Convention:**
- Use camelCase for class names (e.g., `appleNav`, `navContainer`, `brandLink`)
- Matches JavaScript property access: `styles.appleNav`

**Usage in Components:**
```jsx
import styles from './Navigation.module.css';

function Navigation() {
  return (
    <nav className={styles.appleNav}>
      <div className={styles.navContainer}>
        <Link className={styles.brandLink}>Brand</Link>
      </div>
    </nav>
  );
}
```

**Benefits:**
- No naming conflicts (CSS Modules generates unique class names)
- Component encapsulation
- Easy to locate styles (same folder as component)
- Tree-shakable (unused styles can be removed)

## Design Tokens Reference

### Colors
```css
/* Brand Colors */
--avm-royal-blue: #1F4E79
--avm-teal: #1CA9A3
--avm-orange: #F28C28

/* Semantic Colors */
--color-primary: var(--avm-royal-blue)
--color-secondary: var(--avm-teal)
--color-accent: var(--avm-orange)
--color-danger: #dc3545
--color-success: var(--avm-teal)

/* Background Colors */
--bg-primary: #ffffff (light) / #1a1a1a (dark)
--bg-secondary: #F4F4F4 (light) / #2E2E2E (dark)
--bg-overlay: rgba(0, 0, 0, 0.04)
```

### Spacing (8px grid)
```css
--space-xs: 4px
--space-sm: 8px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
--space-2xl: 48px
--space-3xl: 64px
```

### Typography
```css
/* Font Sizes */
--font-size-xs: 11px
--font-size-sm: 13px
--font-size-base: 15px
--font-size-lg: 17px
--font-size-xl: 20px
--font-size-2xl: 24px
--font-size-3xl: 32px

/* Font Weights */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### Border Radius
```css
--radius-sm: 6px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 20px
--radius-full: 9999px
```

### Transitions
```css
--transition-fast: 0.15s cubic-bezier(0.28, 0.11, 0.32, 1)
--transition-base: 0.2s cubic-bezier(0.28, 0.11, 0.32, 1)
--transition-slow: 0.3s cubic-bezier(0.28, 0.11, 0.32, 1)
```

## Migration Guide

### Converting Existing Components to CSS Modules

1. **Create component folder:**
   ```bash
   mkdir src/components/MyComponent
   mv src/components/MyComponent.js src/components/MyComponent/MyComponent.jsx
   ```

2. **Rename CSS file:**
   ```bash
   mv src/components/MyComponent.css src/components/MyComponent/MyComponent.module.css
   ```

3. **Update import in component:**
   ```jsx
   // Before
   import './MyComponent.css';

   // After
   import styles from './MyComponent.module.css';
   ```

4. **Convert class names to camelCase in CSS:**
   ```css
   /* Before */
   .my-component-header { }
   .my-component-title { }

   /* After */
   .myComponentHeader { }
   .myComponentTitle { }
   ```

5. **Update className usage in JSX:**
   ```jsx
   // Before
   <div className="my-component">
     <h2 className="my-component-title">Title</h2>
   </div>

   // After
   <div className={styles.myComponent}>
     <h2 className={styles.myComponentTitle}>Title</h2>
   </div>
   ```

6. **Handle conditional classes:**
   ```jsx
   // Before
   <div className={`nav-link ${isActive ? 'active' : ''}`}>

   // After
   <div className={`${styles.navLink} ${isActive ? styles.active : ''}`}>
   ```

7. **Create index file for re-exports:**
   ```js
   // src/components/MyComponent/index.js
   export { default } from './MyComponent';
   ```

## Best Practices

### DO:
✅ Use design tokens for consistent values
✅ Keep component styles in CSS modules
✅ Use semantic variable names
✅ Follow the camelCase naming convention
✅ Leverage utility classes for common patterns
✅ Test dark mode support

### DON'T:
❌ Use inline styles (except for dynamic values)
❌ Duplicate design tokens
❌ Mix global classes with CSS module classes
❌ Use arbitrary values (use tokens instead)
❌ Create deeply nested selectors

### Example Component

```jsx
// src/components/Card/Card.jsx
import styles from './Card.module.css';

function Card({ title, children, variant = 'default' }) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
}

export default Card;
```

```css
/* src/components/Card/Card.module.css */
.card {
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: var(--radius-xl);
  padding: var(--space-lg);
  border: 1px solid var(--glass-border);
  transition: transform var(--transition-base);
}

.card:hover {
  transform: translateY(-4px);
}

.cardTitle {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-md);
}

.cardContent {
  color: var(--text-secondary);
}

/* Variants */
.primary {
  border-color: var(--color-primary);
}

.danger {
  border-color: var(--color-danger);
}
```

## Dark Mode Support

All components automatically support dark mode through CSS variables:

```css
/* Light mode (default) */
:root {
  --bg-primary: #ffffff;
  --text-primary: #2E2E2E;
}

/* Dark mode */
[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}
```

Components using these variables automatically adapt to theme changes.

## Accessibility

The global styles include:
- Focus-visible outlines for keyboard navigation
- Reduced motion support for users with motion sensitivity
- High contrast mode support
- Proper ARIA landmarks

## Resources

- [CSS Modules Documentation](https://github.com/css-modules/css-modules)
- [BEM Methodology](http://getbem.com/)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Design Tokens](https://css-tricks.com/what-are-design-tokens/)
