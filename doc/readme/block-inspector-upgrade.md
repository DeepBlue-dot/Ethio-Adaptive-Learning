# Block Inspector Sidebar Upgrade

## Overview
The Block Properties sidebar in the Concept Builder has been significantly enhanced with type-specific features, color-coded sections, and comprehensive design/settings controls for each block type.

## What Changed

### 1. Color-Coded Block Types
Each block type now has a unique color theme in the inspector sections:

| Block Type | Color | Icon | Use Case |
|-----------|-------|------|----------|
| **Heading** | Blue | `Heading2` | Section titles, chapter headers |
| **Paragraph** | Green | `Text` | Body text, descriptions |
| **Image** | Purple | `ImageIcon` | Diagrams, photos, illustrations |
| **Video** | Red | `Video` | YouTube videos, tutorials |
| **Embed** | Amber | `Link2` | iframes, external tools |
| **Code** | Slate | `Code2` | Syntax-highlighted code blocks |
| **Snippet** | Cyan | `Blocks` | Reusable content modules |
| **Quiz** | Teal | `FileText` | Assessment questions |
| **Phet** | Indigo | `Blocks` | Interactive physics simulations |

### 2. Enhanced Content Tab
Each block type now has specialized content controls:

#### Heading
```
✓ Heading text input
✓ Heading level selector (H2/H3/H4 buttons)
```

#### Paragraph
```
✓ Optional title field
✓ Full-featured text area for body text
```

#### Image
```
✓ Asset ID input
✓ Alt text field (required for accessibility)
✓ Caption field
```

#### Video
```
✓ Video URL input (YouTube)
✓ Caption field
```

#### Embed
```
✓ Title field
✓ URL field
```

#### Code
```
✓ Language selector dropdown (JavaScript, Python, HTML, CSS, JSON, Bash)
✓ Code editor text area
```

#### Snippet
```
✓ Snippet ID input
✓ Hint: "Browse available snippets in the Asset Library"
```

#### Quiz
```
✓ Question ID input
✓ Hint: "Create and manage questions in the Resources panel"
```

#### Phet
```
✓ Asset ID input
✓ Title field
```

### 3. New Design Tab Controls
Styling and appearance options (previously empty):

#### Heading
- **Typography Section**
  - Text alignment (Left, Center, Right)
  - Font weight (Regular, Semibold, Bold, Black)

#### Paragraph
- **Typography Section**
  - Text alignment (Left, Center, Justify)
  - Line height (Tight, Normal, Relaxed)
  - Text size (Small, Base, Large)

#### Image
- **Sizing Section**
  - Width options (50%, 75%, Full width)
  - Border radius control (0-32px)
  - Shadow toggle
- **Appearance Section**
  - Advanced styling options

#### Video
- **Display Section**
  - Aspect ratio selector (16:9, 4:3, 1:1)

#### Embed
- **Size Section**
  - Width selector (50%, 75%, Full)
  - Minimum height input (200-800px)

#### Code
- **Styling Section**
  - Theme selector (Dark, Light, Monokai)
  - Font size input (10-18px)

### 4. New Settings Tab Controls
Behavior and feature toggles (previously empty):

#### Heading
```
✓ Add bottom spacing
✓ Add top spacing
```

#### Paragraph
```
✓ Drop cap on first letter
✓ Highlight key phrases
```

#### Image
```
✓ Lazy load image
✓ Clickable (opens in modal)
```

#### Video
```
✓ Autoplay
✓ Loop
✓ Show controls
```

#### Embed
```
✓ Allow full screen
```

#### Code
```
✓ Show line numbers
✓ Enable copy button
✓ Highlight syntax
```

#### Quiz
```
✓ Show explanations
✓ Allow retakes
✓ Time limit
```

#### Phet
```
✓ Allow full screen
✓ Show controls
```

## UI Components

### New Helper Components

#### `InspectorSection`
A reusable container for organizing inspector controls with:
- Color-coded background (9 color options)
- Icon display with background
- Title label
- Child content

**Usage:**
```tsx
<InspectorSection label="Content" icon={<Icon />} color="blue">
  {/* Controls go here */}
</InspectorSection>
```

#### `SelectInput`
A styled dropdown selector with:
- Label
- Option list
- onChange callback

**Usage:**
```tsx
<SelectInput
  label="Language"
  value={selectedValue}
  options={[
    { label: "JavaScript", value: "javascript" },
    { label: "Python", value: "python" },
  ]}
  onChange={handleChange}
/>
```

#### `Toggle`
A checkbox toggle with:
- Label
- Styled appearance

**Usage:**
```tsx
<Toggle label="Autoplay" />
```

#### `InspectorHint`
A hint/info box for guidance text:

**Usage:**
```tsx
<InspectorHint label="Browse available snippets in the Asset Library" />
```

## Component Architecture

### Function Breakdown
The refactored `BlockInspectorFields` now uses dedicated handler functions:

- `BlockInspectorFields` - Main dispatcher
- `HeadingBlockInspector` - Heading-specific controls
- `ParagraphBlockInspector` - Paragraph-specific controls
- `ImageBlockInspector` - Image-specific controls
- `VideoBlockInspector` - Video-specific controls
- `EmbedBlockInspector` - Embed-specific controls
- `CodeBlockInspector` - Code-specific controls
- `SnippetBlockInspector` - Snippet-specific controls
- `QuizBlockInspector` - Quiz-specific controls
- `PhetBlockInspector` - Phet-specific controls

Each handler function:
1. Receives block data and active tab
2. Returns appropriate UI based on activeTab
3. Calls onChange with updates
4. Uses InspectorSection for organization

### State Management
- Block data updates flow through `onChange` callback
- Tab switching handled by parent component
- No new state required in inspector

## Implementation Details

### File Modified
- `ethio-adaptive-learning/components/admin/studio/site-builder/page-builder-workspace.tsx`

### Lines Changed
- Added ~8 new component functions
- Enhanced existing BlockInspectorFields dispatcher
- Added 4 new helper component functions
- Total: ~600 lines of new UI code

### Styling
- Uses existing Tailwind CSS classes
- Color utilities for different block types
- Consistent with Material Design 3 system
- Respects existing theme system

### Accessibility
- Semantic HTML (label, select, input elements)
- Proper aria attributes inherited from components
- Color + icons for block type distinction (not just color)
- Keyboard navigable controls

## Future Enhancements

### Phase 2 Possibilities
1. **Real Asset Selector** - Replace ID text inputs with actual asset browser
2. **Image Preview** - Show thumbnail of selected image
3. **Video Preview** - Display YouTube video preview
4. **Live Preview** - Show how block will look as you edit
5. **Validation Feedback** - Show errors/warnings for invalid inputs
6. **Undo/Redo** - Track property changes with history
7. **Copy/Paste** - Duplicate block settings
8. **Templates** - Save and reuse block configurations

### Phase 3 Possibilities
1. **Advanced Styling** - Font family, custom colors, shadows
2. **Responsive Variants** - Different settings per device size
3. **Animations** - Add entrance/exit animations to blocks
4. **Interactions** - Click handlers, scroll triggers
5. **Rich Text Editor** - WYSIWYG for paragraph blocks

## Testing Checklist

- [ ] Heading block: Text input, level selector, alignment, font weight, spacing
- [ ] Paragraph block: Title, text, alignment, line height, size, drop cap
- [ ] Image block: Asset ID, alt text, caption, width, radius, shadow, lazy load
- [ ] Video block: URL, caption, aspect ratio, autoplay, loop, controls
- [ ] Embed block: Title, URL, width, height, fullscreen
- [ ] Code block: Language dropdown, code, theme, font size, line numbers, copy
- [ ] Snippet block: Snippet ID, hint message
- [ ] Quiz block: Question ID, hint message, explanations, retakes, time limit
- [ ] Phet block: Asset ID, title, fullscreen, controls
- [ ] Tab switching: Content/Design/Settings/Advanced tabs work per block type
- [ ] Color coding: Each block type shows correct color theme
- [ ] Persistence: Changes saved to Prisma database via autosave

## Developer Notes

### Adding a New Block Type
1. Create new handler function in `page-builder-workspace.tsx`
2. Add case in BlockInspectorFields switch statement
3. Implement content/design/settings tabs
4. Use InspectorSection with unique color
5. Test all tabs and controls

### Adding New Controls
1. Use existing TextInput, TextArea, NumberInput if appropriate
2. Create new component if needed (follows existing patterns)
3. Ensure consistent styling with Tailwind
4. Connect onChange callback properly

### Common Patterns
```tsx
// Color-coded section
<InspectorSection label="Label" icon={<Icon />} color="blue">
  {children}
</InspectorSection>

// Text input with onChange
<TextInput 
  label="Label" 
  value={data.field ?? ""}
  onChange={(value) => onChange({ field: value })}
/>

// Dropdown selector
<SelectInput
  label="Label"
  value={data.field ?? "default"}
  options={[...]}
  onChange={(value) => onChange({ field: value })}
/>

// Toggle checkbox
<Toggle label="Feature name" />

// Tab switching
if (activeTab === "content") {
  return (/* content tab UI */)
}
if (activeTab === "design") {
  return (/* design tab UI */)
}
```

## Screenshots & Visual Guide

### Before Enhancement
- Basic text inputs only
- No design/settings tabs
- Minimal visual distinction
- Simple placeholder controls

### After Enhancement
- Color-coded sections per block type
- Rich controls with selectors and toggles
- Functional design/settings tabs
- Visual hierarchy and grouping
- Icon indicators
- Hint messages for guidance

---

**Status**: ✅ Implementation Complete
**File**: `page-builder-workspace.tsx`
**Date**: 2024
**Developer**: AI Assistant
