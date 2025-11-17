# AVM Property Management Logo

Professional logo design for the AVM Property Management application.

## Design Concept

The logo features a modern building icon that represents property management and real estate, combined with clean typography. The design uses the brand's signature gradient (Royal Blue #1F4E79 to Teal #1CA9A3) to create a contemporary, professional look.

### Design Elements:

- **Building Icon**: Represents properties, real estate, and multi-level management
- **Gradient Colors**: Uses brand colors (Royal Blue → Teal → Orange)
- **Windows**: Symbolize individual units/tenants
- **Layered Floors**: Represent the multi-layered nature of property management
- **Roof Accent**: Creates visual interest and emphasizes the "property" aspect

## Usage

### React Component

Import and use the Logo component in your React application:

```jsx
import Logo from './components/Logo';

// Full logo with text
<Logo size="medium" showText={true} />

// Icon only
<Logo variant="icon-only" size="large" />

// With subtext
<Logo size="large" showText={true} showSubtext={true} />

// Text only
<Logo variant="text-only" showText={true} showSubtext={true} />
```

### Props

| Prop | Type | Default | Options | Description |
|------|------|---------|---------|-------------|
| `size` | string | `'medium'` | `'small'`, `'medium'`, `'large'`, `'xlarge'` | Size of the logo |
| `showText` | boolean | `true` | `true`, `false` | Show "AVM" text |
| `showSubtext` | boolean | `false` | `true`, `false` | Show "Property Management" subtext |
| `variant` | string | `'full'` | `'full'`, `'icon-only'`, `'text-only'` | Logo display variant |
| `className` | string | `''` | Any string | Additional CSS classes |

### Size Guide

- **small**: 32px icon, 16px text - Use in compact spaces (mobile nav, small buttons)
- **medium**: 48px icon, 24px text - Use in standard navigation bars
- **large**: 64px icon, 32px text - Use in headers, landing pages
- **xlarge**: 96px icon, 48px text - Use in hero sections, splash screens

## Examples

### Navigation Bar

```jsx
// Desktop navigation
<Logo size="medium" showText={true} variant="full" />

// Mobile navigation (compact)
<Logo variant="icon-only" size="small" />
```

### Login Page

```jsx
<Logo size="xlarge" showText={true} showSubtext={true} />
```

### Sidebar

```jsx
// Expanded sidebar
<Logo size="medium" showText={true} />

// Collapsed sidebar
<Logo variant="icon-only" size="small" />
```

### Footer

```jsx
<Logo size="medium" showText={true} showSubtext={true} />
```

## Static SVG Files

Standalone SVG files are available in `/public/` for use outside React:

### Logo Files

1. **`logo-icon.svg`** (64×64px)
   - Icon only, full detail
   - Use for: Social media avatars, app icons, badges

2. **`logo-full.svg`** (240×64px)
   - Icon + AVM text + Property Management subtext
   - Use for: Email signatures, documents, presentations

3. **`logo-favicon.svg`** (32×32px)
   - Simplified icon for small sizes
   - Use for: Browser favicon, mobile home screen icon

### Usage in HTML

```html
<!-- Icon only -->
<img src="/logo-icon.svg" alt="AVM Logo" width="64" height="64" />

<!-- Full logo -->
<img src="/logo-full.svg" alt="AVM Property Management" width="240" height="64" />

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/logo-favicon.svg" />
```

## Brand Colors

The logo uses the official AVM brand colors:

```css
--avm-royal-blue: #1F4E79;  /* Primary */
--avm-teal: #1CA9A3;         /* Secondary */
--avm-orange: #F28C28;       /* Accent */
```

### Gradients

**Primary Gradient** (Royal Blue → Teal):
```css
background: linear-gradient(135deg, #1F4E79 0%, #1CA9A3 100%);
```

**Accent Gradient** (Teal → Orange):
```css
background: linear-gradient(135deg, #1CA9A3 0%, #F28C28 100%);
```

## Dark Mode

The logo automatically adapts to dark mode through CSS variables:

- Light mode: Uses standard brand colors
- Dark mode: Uses lighter tints for better contrast

```css
/* Light mode */
--logo-gradient: linear-gradient(135deg, #1F4E79 0%, #1CA9A3 100%);

/* Dark mode */
--logo-gradient: linear-gradient(135deg, #4a7ba7 0%, #2eb8b1 100%);
```

## Accessibility

- Logo includes proper semantic markup
- SVG includes `title` and `desc` elements for screen readers
- Text has sufficient contrast ratios (WCAG AA compliant)
- Interactive logos include proper focus states

## File Structure

```
/frontend/src/components/Logo/
├── Logo.jsx           # React component
├── Logo.css           # Styles
├── index.js           # Export
└── README.md          # This file

/frontend/public/
├── logo-icon.svg      # Icon only (64×64)
├── logo-full.svg      # Full logo (240×64)
└── logo-favicon.svg   # Favicon (32×32)
```

## Best Practices

### DO ✅

- Use the logo at the recommended sizes
- Maintain aspect ratio when scaling
- Use on backgrounds with sufficient contrast
- Use official brand colors
- Test in both light and dark modes

### DON'T ❌

- Stretch or distort the logo
- Change the gradient colors
- Add effects (drop shadows, glows, etc.)
- Place on busy backgrounds without proper contrast
- Use low-resolution versions for print

## Export Formats

The logo is available in these formats:

- **SVG**: Scalable vector format (recommended for web)
- **React Component**: Interactive JSX component
- **Inline SVG**: Copy/paste SVG code directly

For additional formats (PNG, PDF, etc.), export the SVG files using a tool like:
- Figma: Import SVG and export as PNG
- Inkscape: Open SVG and export to other formats
- ImageMagick: Command-line conversion

### Example PNG Export

```bash
# Install ImageMagick if needed
# Then convert SVG to PNG at different sizes

# Icon - 512x512 (high-res)
convert -background none -density 1200 logo-icon.svg -resize 512x512 logo-512.png

# Icon - 256x256
convert -background none -density 1200 logo-icon.svg -resize 256x256 logo-256.png

# Icon - 128x128
convert -background none -density 1200 logo-icon.svg -resize 128x128 logo-128.png

# Icon - 64x64
convert -background none -density 1200 logo-icon.svg -resize 64x64 logo-64.png

# Icon - 32x32
convert -background none -density 1200 logo-icon.svg -resize 32x32 logo-32.png
```

## Questions or Modifications

To modify the logo:
1. Edit `Logo.jsx` for the React component
2. Edit SVG files in `/public/` for static versions
3. Update brand colors in `variables.css` if needed

---

**Logo Designer**: Claude AI
**Created**: 2025
**Version**: 1.0
**License**: Proprietary - AVM Property Management
