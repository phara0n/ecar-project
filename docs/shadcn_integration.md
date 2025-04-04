# ShadCN UI Integration Guide for ECAR Admin

## Overview
The ECAR admin interface uses ShadCN UI, a collection of reusable UI components built on top of Tailwind CSS v4. ShadCN is not a traditional component library but a collection of reusable components that can be copied into your project and customized to match your design system.

This document outlines our implementation and provides guidelines for adding new components.

## Current Implementation

### Setup Details
- **Project Base**: React 19 + Vite 6.2.0 + TypeScript 5.7.2
- **Styling System**: Tailwind CSS v4.1.3 with @tailwindcss/vite
- **Theme Style**: New York
- **Color Format**: OKLCH for better perceptual uniformity
- **Icon Library**: Lucide React

### Directory Structure
```
src/
├── components/
│   └── ui/         # ShadCN components live here
│       └── button.tsx  # First ShadCN component
├── lib/
│   └── utils.ts    # Utility functions including cn() for class merging
└── index.css       # Contains Tailwind directives and theme variables
```

### Theming System
We've implemented a comprehensive theming system using CSS variables:

1. **Light/Dark Modes**:
   - Light mode variables defined in `:root`
   - Dark mode variables defined in `.dark` class
   - Uses OKLCH color format for better color transitions

2. **CSS Variables**:
   - Component styles reference these variables
   - All accessible through the Tailwind CSS classes

3. **Theme Components**:
   - Main theme (light/dark)
   - Sidebar theme (can differ from main theme)
   - Chart colors for data visualization

## Adding New ShadCN Components

### Step-by-Step Process
1. **Select Component**: Visit [ShadCN UI](https://ui.shadcn.com/docs/components) to select component
2. **Installation**:
   ```
   cd ecar_project/web-admin
   npx shadcn-ui@latest add [component-name]
   ```
   
3. **Component Customization**:
   - Modify colors to use our CSS variables
   - Adjust styling to match our design system
   - Ensure responsive behavior

4. **Integration**:
   - Import component where needed
   - Use Tailwind CSS for layout and spacing

### Example: Button Component
The Button component was installed as our first ShadCN component:

```tsx
// Sample usage
import { Button } from "@/components/ui/button"

function MyComponent() {
  return (
    <Button variant="default" size="default">
      Click Me
    </Button>
  )
}
```

### Variants & Props
ShadCN components use Class Variance Authority (CVA) for variant management:

```tsx
// Button variants example
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90...",
        // Other variants...
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        // Other sizes...
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

## Upcoming Components

Priority components to add next:

1. **Form Elements**:
   - Input
   - Textarea
   - Select
   - Checkbox
   - Radio Group
   - Form component with validation

2. **Layout Components**:
   - Card
   - Sheet
   - Tabs
   - Dialog
   - Dropdown Menu

3. **Feedback Components**:
   - Toast
   - Alert
   - Progress

## Best Practices

1. **Keep Components Pure**:
   - Don't mix business logic with UI components
   - Use composition for complex components

2. **Consistent Naming**:
   - Follow ShadCN's naming conventions
   - Use clear, descriptive names for custom components

3. **Accessibility**:
   - Maintain ARIA attributes from original components
   - Test keyboard navigation and screen readers
   - Ensure sufficient color contrast

4. **Performance**:
   - Lazy load complex components
   - Use React.memo for pure components
   - Keep bundle size in mind

## Troubleshooting

### Common Issues
- **Component Not Found**: Ensure path aliases are correctly set up in tsconfig.json
- **Styling Issues**: Check for CSS conflicts with existing styles
- **Type Errors**: Verify the proper import of types from libraries

## Resources
- [ShadCN UI Documentation](https://ui.shadcn.com/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Class Variance Authority](https://cva.style/docs)
- [OKLCH Color Format](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) 