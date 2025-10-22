# Frontend Structure Documentation

This document describes the organizational structure of the frontend codebase.

## Directory Structure

```
src/
├── assets/
│   └── styles/
│       ├── variables.css      # Design tokens (colors, spacing, typography)
│       ├── global.css          # CSS reset, base styles, accessibility
│       ├── typography.css      # Font families, sizes, text styles
│       └── utilities.css       # Reusable utility classes
│
├── components/
│   ├── Navigation/
│   │   ├── Navigation.jsx
│   │   ├── Navigation.module.css
│   │   └── index.js
│   │
│   ├── RoleSwitcher/
│   │   ├── RoleSwitcher.jsx
│   │   ├── RoleSwitcher.module.css
│   │   └── index.js
│   │
│   ├── Button/
│   │   ├── Button.jsx (to be created)
│   │   └── Button.css
│   │
│   └── common/
│       ├── Button.js
│       ├── DemoDataSeeder.js
│       ├── InviteTenantModal.js
│       ├── ResponsiveTable.js
│       ├── WizardStepper.js
│       └── index.js
│
├── pages/
│   ├── Login/
│   │   ├── Login.js
│   │   └── Login.css
│   │
│   ├── AdminDashboard/
│   │   ├── AdminDashboard.js
│   │   └── AdminDashboard.css
│   │
│   ├── PropertyOwnerDashboard/
│   │   ├── PropertyOwnerDashboard.js
│   │   └── PropertyOwnerDashboard.css
│   │
│   ├── RenterDashboard/
│   │   ├── RenterDashboard.js
│   │   └── RenterDashboard.css
│   │
│   ├── Properties/
│   │   ├── Properties.js
│   │   └── Properties.css
│   │
│   ├── Tenants/
│   │   ├── Tenants.js
│   │   └── Tenants.css
│   │
│   ├── Payments/
│   │   ├── Payments.js
│   │   └── Payments.css
│   │
│   ├── Logout/
│   │   ├── Logout.js
│   │   └── Logout.css
│   │
│   ├── AuthCallback.js
│   ├── TenantOnboarding.js
│   └── index.js
│
├── contexts/
│   └── ThemeContext.js
│
├── services/
│   ├── api.js
│   ├── authService.js
│   └── zitadelAuth.js
│
├── index.css                   # Main entry point (imports from assets/styles/)
├── index.js                    # React app entry point
└── App.js                      # Main app component
```

## File Naming Conventions

### Components
- **Folder Name:** PascalCase (e.g., `Navigation/`, `RoleSwitcher/`)
- **Component File:** PascalCase.jsx (e.g., `Navigation.jsx`, `Button.jsx`)
- **CSS File:**
  - CSS Modules: `ComponentName.module.css` (scoped to component)
  - Regular CSS: `ComponentName.css` (global styles)
- **Index File:** `index.js` (barrel export)

### Pages
- **Folder Name:** PascalCase (e.g., `Login/`, `AdminDashboard/`)
- **Page File:** PascalCase.js (e.g., `Login.js`, `AdminDashboard.js`)
- **CSS File:** PascalCase.css (e.g., `Login.css`, `AdminDashboard.css`)

### Styles
- **Folder:** `assets/styles/`
- **Files:** lowercase with hyphens (e.g., `variables.css`, `global.css`)

## CSS Organization

### 1. Design Tokens (`assets/styles/variables.css`)
Contains all design tokens and CSS variables:
- Color palette
- Spacing system (8px grid)
- Typography scale
- Border radius values
- Shadows
- Transitions
- Z-index scale
- Theme variables (light/dark)

**Usage:**
```css
.my-element {
  color: var(--color-primary);
  padding: var(--space-md);
  font-size: var(--font-size-base);
  border-radius: var(--radius-lg);
}
```

### 2. Global Styles (`assets/styles/global.css`)
Contains:
- CSS Reset
- Base HTML/body styles
- Custom scrollbar
- Accessibility features
- App loading state
- Container utilities

### 3. Typography (`assets/styles/typography.css`)
Contains:
- Font families
- Heading styles (h1-h6)
- Paragraph styles
- Link styles
- Code/pre styles
- Text utility classes

### 4. Utilities (`assets/styles/utilities.css`)
Reusable utility classes:
- Layout utilities (flex, grid)
- Common components (card, button, form, modal)
- Dashboard grid
- Table styles

### 5. Component Styles (CSS Modules)
- Component-specific styles with scoped class names
- Use camelCase for class names
- Import as: `import styles from './Component.module.css'`
- Usage: `className={styles.className}`

**Example:**
```jsx
// Navigation.jsx
import styles from './Navigation.module.css';

function Navigation() {
  return <nav className={styles.appleNav}>...</nav>;
}
```

```css
/* Navigation.module.css */
.appleNav {
  /* styles */
}
```

## Import Order

### In Components/Pages:
```jsx
// 1. React imports
import React, { useState } from 'react';

// 2. Third-party imports
import { Link, useLocation } from 'react-router-dom';

// 3. Local component imports
import Navigation from '../Navigation';

// 4. Context/Service imports
import { useTheme } from '../../contexts/ThemeContext';

// 5. Styles (always last)
import styles from './Component.module.css';
// or
import './Component.css';
```

### In index.css:
```css
/* 1. Design tokens */
@import './assets/styles/variables.css';

/* 2. Global reset */
@import './assets/styles/global.css';

/* 3. Typography */
@import './assets/styles/typography.css';

/* 4. Utilities */
@import './assets/styles/utilities.css';

/* 5. Legacy styles (temporary) */
```

## Component Structure

### Standard Component Pattern:
```
ComponentName/
├── ComponentName.jsx       # Component logic
├── ComponentName.module.css # Scoped styles
└── index.js               # Barrel export

// index.js
export { default } from './ComponentName';
```

### Component with Multiple Files:
```
ComponentName/
├── ComponentName.jsx
├── ComponentName.module.css
├── ComponentNameUtils.js   # Helper functions
├── ComponentNameTypes.js   # Type definitions
└── index.js
```

## CSS Modules vs Regular CSS

### Use CSS Modules When:
- ✅ Component is reusable
- ✅ Styles are component-specific
- ✅ Want to avoid global namespace pollution
- ✅ Need automatic scoping

### Use Regular CSS When:
- ✅ Styles are truly global
- ✅ Legacy code (temporary)
- ✅ Third-party library overrides
- ✅ Utility classes

## Best Practices

### DO:
✅ Keep component folders self-contained
✅ Use CSS Modules for component styles
✅ Use design tokens for all values
✅ Follow naming conventions
✅ Add index.js for clean imports
✅ Co-locate styles with components
✅ Use meaningful class names

### DON'T:
❌ Mix component logic across folders
❌ Use inline styles (except dynamic values)
❌ Hardcode colors/spacing (use tokens)
❌ Create deeply nested folder structures
❌ Duplicate styles (use utilities)
❌ Use global CSS for component-specific styles

## Migration Checklist

When adding a new component:

- [ ] Create component folder in `src/components/ComponentName/`
- [ ] Create `ComponentName.jsx` file
- [ ] Create `ComponentName.module.css` file
- [ ] Create `index.js` barrel export
- [ ] Use design tokens from `variables.css`
- [ ] Follow naming conventions (camelCase for CSS Module classes)
- [ ] Add proper imports in order
- [ ] Test in light and dark mode

When adding a new page:

- [ ] Create page folder in `src/pages/PageName/`
- [ ] Create `PageName.js` file
- [ ] Create `PageName.css` file
- [ ] Use design tokens and utilities
- [ ] Add to pages/index.js
- [ ] Add route in App.js
- [ ] Test responsive behavior

## References

- [CSS Modules Documentation](https://github.com/css-modules/css-modules)
- [Design Tokens](https://css-tricks.com/what-are-design-tokens/)
- [Component-Driven Development](https://www.componentdriven.org/)
- See `CSS_STRUCTURE.md` for detailed CSS architecture
- See `CSS_CODE_REVIEW.md` for code quality standards
