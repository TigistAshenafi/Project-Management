# Shared CSS System

This directory contains the unified CSS styling system for all modules in the Project Management application.

## Overview

The shared CSS system provides consistent styling across all components while maintaining flexibility for component-specific customizations. It uses CSS custom properties (variables) for consistent theming and includes comprehensive responsive design patterns.

## Files

- `shared-styles.css` - Main shared styles file containing all common styles
- `README.md` - This documentation file

## Features

### 🎨 **Design System**
- **Color Palette**: Consistent color scheme with primary, secondary, success, warning, and danger colors
- **Typography**: Unified font hierarchy and spacing
- **Shadows**: Three-tier shadow system for depth
- **Border Radius**: Consistent border radius values
- **Transitions**: Smooth animations and hover effects

### 📱 **Responsive Design**
- Mobile-first approach
- Breakpoints at 768px and 480px
- Flexible grid systems
- Adaptive layouts for all screen sizes

### 🧩 **Component Library**
- **Forms**: Consistent input styling with focus states
- **Buttons**: Multiple button variants with hover effects
- **Tables**: Responsive table designs
- **Cards**: Flexible card layouts
- **Status Badges**: Color-coded status indicators
- **Pagination**: Consistent pagination controls

### 🎭 **Interactive Elements**
- Hover effects and transformations
- Focus states for accessibility
- Loading animations
- Smooth transitions

## Usage

### 1. Import Shared Styles

The shared styles are automatically imported in `src/styles.css`:

```css
@import './styles/shared-styles.css';
```

### 2. Use CSS Variables

All components can use the predefined CSS variables:

```css
.my-component {
  background: var(--primary-color);
  color: var(--text-primary);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-md);
}
```

### 3. Apply Shared Classes

Use the shared utility classes in your components:

```html
<div class="module-container">
  <h2>Component Title</h2>
  <form class="module-form">
    <div class="form-group">
      <label>Label</label>
      <input class="form-input" type="text">
    </div>
    <button class="btn btn-primary">Submit</button>
  </form>
</div>
```

## CSS Variables

### Colors
```css
--primary-color: #1976d2
--primary-light: #42a5f5
--primary-dark: #1565c0
--success-color: #28a745
--warning-color: #ffc107
--danger-color: #dc3545
--info-color: #17a2b8
--text-primary: #333
--text-secondary: #666
--text-muted: #999
```

### Spacing & Layout
```css
--border-radius: 8px
--border-radius-lg: 16px
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1)
--shadow-md: 0 4px 10px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.1)
```

### Transitions
```css
--transition: all 0.2s ease
```

## Component-Specific Styling

### Module Container
```css
.module-container {
  /* Main container with gradient background and shadow */
}
```

### Forms
```css
.module-form {
  /* Form container with glassmorphism effect */
}

.form-group {
  /* Form field wrapper */
}

.form-input, .form-textarea, .form-select {
  /* Input field styling */
}
```

### Buttons
```css
.btn {
  /* Base button styles */
}

.btn-primary, .btn-secondary, .btn-success, .btn-danger, .btn-warning {
  /* Button variants */
}
```

### Tables
```css
.table-container {
  /* Table wrapper with shadow */
}

/* Table inherits from shared table styles */
```

### Cards
```css
.module-card {
  /* Card component with hover effects */
}

.card-grid {
  /* Responsive card grid layout */
}
```

## Responsive Breakpoints

### Desktop (Default)
- Full layout with sidebar
- Multi-column grids
- Hover effects enabled

### Tablet (≤768px)
- Single-column layouts
- Stacked navigation
- Reduced padding and margins

### Mobile (≤480px)
- Minimal spacing
- Touch-friendly button sizes
- Simplified layouts

## Best Practices

### 1. **Inherit Shared Styles**
```css
/* ✅ Good - Inherit shared styles */
.my-component {
  /* Inherits from .module-container */
}

/* ❌ Avoid - Duplicate shared styles */
.my-component {
  max-width: 1200px;
  margin: 2rem auto;
  /* ... */
}
```

### 2. **Use CSS Variables**
```css
/* ✅ Good - Use CSS variables */
.my-button {
  background: var(--primary-color);
  color: white;
}

/* ❌ Avoid - Hard-coded values */
.my-button {
  background: #1976d2;
  color: white;
}
```

### 3. **Component-Specific Overrides**
```css
/* ✅ Good - Component-specific customization */
.employee-form .form-input {
  /* Employee-specific input styling */
}

/* ❌ Avoid - Global overrides */
.form-input {
  /* This affects ALL form inputs */
}
```

### 4. **Responsive Design**
```css
/* ✅ Good - Mobile-first approach */
.my-component {
  padding: 1rem;
}

@media (min-width: 768px) {
  .my-component {
    padding: 2rem;
  }
}
```

## Adding New Components

### 1. **Create Component CSS File**
```css
/* my-component.component.css */
.my-component {
  /* Inherits from .module-container */
}

.my-component-form {
  /* Inherits from .module-form */
}
```

### 2. **Use Shared Classes**
```html
<div class="module-container my-component">
  <form class="module-form my-component-form">
    <!-- Form content -->
  </form>
</div>
```

### 3. **Add Component-Specific Styles**
```css
/* Component-specific overrides */
.my-component-special {
  background: var(--success-color);
  color: white;
}
```

## Maintenance

### Updating Shared Styles
- Modify `shared-styles.css` for global changes
- Test across all components
- Update documentation for new variables or classes

### Adding New Variables
- Add to `:root` section in `shared-styles.css`
- Document in this README
- Use semantic names (e.g., `--spacing-large` not `--margin-20`)

### Component Updates
- Keep component-specific styles minimal
- Inherit from shared styles when possible
- Test responsive behavior

## Browser Support

- **Modern Browsers**: Full support for CSS variables and modern features
- **IE11+**: Limited support (consider fallbacks for critical features)
- **Mobile Browsers**: Full responsive support

## Performance

- CSS variables are lightweight and performant
- Shared styles reduce duplicate CSS
- Responsive design uses efficient media queries
- Minimal JavaScript dependencies

## Accessibility

- High contrast color combinations
- Focus states for keyboard navigation
- Semantic HTML structure
- Screen reader friendly

---

For questions or contributions to the shared CSS system, please refer to the project documentation or contact the development team.
