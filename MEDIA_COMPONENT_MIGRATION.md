# Media Component Standardization

## Overview

The app currently renders images and audio in **10 different locations** with **7+ inconsistent implementations**. This creates maintenance burden and UX inconsistency.

**Solution**: `MediaPresenter` component - a single, unified component for all media display.

---

## Current Media Rendering Locations

| Location | Component | Current Impl | Issue |
|----------|-----------|--------------|-------|
| 1. | `src/components/inference/image-result.tsx` | `<img>` + download | Doesn't support fullscreen |
| 2. | `src/components/inference/audio-result.tsx` | `<audio controls>` | Native HTML player, limited styling |
| 3. | `src/components/gallery/gallery-grid.tsx` (ImageCard) | `<img>` + hover zoom | Card-specific, no fullscreen |
| 4. | `src/components/gallery/gallery-grid.tsx` (AudioCard) | JavaScript Audio API | Custom player, different from audio-result |
| 5. | `src/components/gallery/gallery-grid.tsx` (lightbox) | `<img>` + dark overlay | Separate fullscreen impl, duplicated logic |
| 6. | `src/components/history/inference-history-card.tsx` (image) | `<img>` thumbnail | No fullscreen, small display |
| 7. | `src/components/history/inference-history-card.tsx` (audio) | InlineAudioPlayer | Different custom player |
| 8. | `src/components/dashboard/user-dashboard.tsx` (MediaGridItem) | `<img>` + hover | No fullscreen integration |
| 9. | `src/components/dashboard/user-dashboard.tsx` (ImageViewer) | `<img>` + navigation | Separate fullscreen, different nav |
| 10. | `src/components/gallery/public-result-view.tsx` | Conditional result components | Uses image/audio-result |

---

## Migration Path

### Phase 1: Image Result Components

**File**: `src/components/inference/image-result.tsx`
```tsx
// BEFORE: Uses custom <img> rendering
// AFTER: Use MediaPresenter with variant="full"
import { MediaPresenter } from "@/components/media/media-presenter";

export function ImageResult({ item }: Props) {
  return (
    <MediaPresenter
      item={item}
      variant="full"
      allowFullscreen={true}
      showDetailsOverlay={true}
    />
  );
}
```

**File**: `src/components/inference/audio-result.tsx`
```tsx
// BEFORE: Uses <audio controls>
// AFTER: Use MediaPresenter with variant="full"
import { MediaPresenter } from "@/components/media/media-presenter";

export function AudioResult({ item }: Props) {
  return (
    <MediaPresenter
      item={item}
      variant="full"
      allowFullscreen={false}
      showDetailsOverlay={true}
    />
  );
}
```

### Phase 2: Gallery Components

**File**: `src/components/gallery/gallery-grid.tsx`
```tsx
// BEFORE: Multiple card types (ImageCard, AudioCard) + separate lightbox
// AFTER: Single MediaPresenter for grid, removes lightbox duplicate logic
import { MediaPresenter } from "@/components/media/media-presenter";

// Remove: ImageCard, AudioCard, Lightbox components
// Add: Single loop
{items.map((item) => (
  <MediaPresenter
    key={item.id}
    item={item}
    variant="thumbnail"
    allowFullscreen={true}
    showDetailsOverlay={true}
  />
))}
```

### Phase 3: History/Dashboard Components

**File**: `src/components/history/inference-history-card.tsx`
```tsx
// BEFORE: Custom <img> + InlineAudioPlayer
// AFTER: Use MediaPresenter with variant="compact"
import { MediaPresenter } from "@/components/media/media-presenter";

export function InferenceHistoryCard({ item }: Props) {
  return (
    <Link href={`/history/${item.id}`}>
      <MediaPresenter
        item={item}
        variant="compact"
        allowFullscreen={true}
        showDetailsOverlay={true}
      />
    </Link>
  );
}
```

**File**: `src/components/dashboard/user-dashboard.tsx`
```tsx
// BEFORE: MediaGridItem + ImageViewer (duplicated fullscreen logic)
// AFTER: Use MediaPresenter with variant="thumbnail"
import { MediaPresenter } from "@/components/media/media-presenter";

{imageItems.map((item) => (
  <MediaPresenter
    key={item.id}
    item={item}
    variant="thumbnail"
    allItems={imageItems}
    onChangeItem={setCurrentItem}
    allowFullscreen={true}
    showDetailsOverlay={true}
  />
))}
```

---

## MediaPresenter API

### Props

```tsx
interface MediaPresenterProps {
  /** The inference item to display */
  item: InferenceHistoryItem;

  /** All items for navigation (optional) */
  allItems?: InferenceHistoryItem[];

  /** Callback when navigating between items */
  onChangeItem?: (item: InferenceHistoryItem) => void;

  /** Show inference details overlay on hover/secondary area */
  showDetailsOverlay?: boolean; // default: true

  /** Display variant:
   *  - "thumbnail": Grid display with aspect ratio, hover overlay
   *  - "compact": List/card with side-by-side layout
   *  - "full": Dedicated page with full details panel
   */
  variant?: "thumbnail" | "compact" | "full"; // default: "full"

  /** Allow fullscreen mode for images */
  allowFullscreen?: boolean; // default: true

  /** Custom click handler */
  onClick?: () => void;

  /** CSS classes */
  className?: string;
}
```

### Variants

#### `thumbnail` - Grid Display
- Aspect-square container
- Hover effects with gradient overlay
- Fullscreen button on hover
- Status badge
- **Use in**: Gallery, dashboard, media grids

#### `compact` - List Display
- Side-by-side layout
- Metadata inline
- Fullscreen button
- **Use in**: History cards, search results, lists

#### `full` - Dedicated Page
- Large media display
- Inference info below
- Fullscreen button
- **Use in**: Result pages, detail pages

---

## Features Included

✅ **Image Display**
- Lazy loading
- Responsive sizing
- Hover zoom effect (thumbnail variant)

✅ **Audio Display**
- Custom HTML5 audio player
- Play/pause controls
- Progress bar with seek
- Mute button
- Time display
- Consistent styling

✅ **Fullscreen**
- Image fullscreen with navigation
- Audio fullscreen with player
- Close button
- Keyboard support (ESC to close)
- Image download button
- Prev/next between items

✅ **Media Info**
- Task type label
- Model name
- Response time
- Status badge
- Prompt (truncated in thumbnail, full in full variant)

✅ **Responsive**
- Mobile-optimized
- Touch-friendly buttons
- Adaptive layouts

---

## Benefits of Migration

| Issue | Current | With MediaPresenter |
|-------|---------|-------------------|
| Code duplication | 7+ audio player implementations | 1 unified AudioPlayer |
| Inconsistent fullscreen | Multiple lightbox impls | Single FullscreenViewer |
| Styling inconsistency | Different CSS per location | One consistent style |
| Maintenance burden | Update 10+ files for UI changes | Update 1 component |
| Image navigation | Manual prev/next in dashboard | Automatic via allItems |
| Audio controls | HTML5 vs custom | Unified custom player |
| Responsive design | Scattered media queries | Built-in responsive variants |

---

## Migration Order (Recommended)

1. **Image Result** (`image-result.tsx`) - Simplest
2. **Audio Result** (`audio-result.tsx`) - Simple
3. **History Card** (`inference-history-card.tsx`) - Removes InlineAudioPlayer
4. **Public Result View** (`public-result-view.tsx`) - Uses image/audio-result
5. **Dashboard** (`user-dashboard.tsx`) - Removes MediaGridItem + ImageViewer
6. **Gallery Grid** (`gallery-grid.tsx`) - Most complex, removes card types + lightboxes

---

## Files to Create/Update

### Create
- ✅ `src/components/media/media-presenter.tsx` - Main component

### Update (in order)
- `src/components/inference/image-result.tsx` - Use MediaPresenter
- `src/components/inference/audio-result.tsx` - Use MediaPresenter
- `src/components/inference/text-result.tsx` - No changes (not media)
- `src/components/history/inference-history-card.tsx` - Replace custom implementations
- `src/components/gallery/public-result-view.tsx` - Will use updated result components
- `src/components/dashboard/user-dashboard.tsx` - Replace MediaGridItem + ImageViewer
- `src/components/gallery/gallery-grid.tsx` - Replace ImageCard, AudioCard, Lightbox

### Delete (after migration)
- Remove `InlineAudioPlayer` from `inference-history-card.tsx`
- Remove `ImageCard`, `AudioCard`, lightbox from `gallery-grid.tsx`
- Remove `MediaGridItem`, `ImageViewer` from `user-dashboard.tsx`

---

## Testing Checklist

After each migration:

- [ ] Images render correctly in all variants
- [ ] Audio plays with controls functional
- [ ] Fullscreen works on desktop and mobile
- [ ] Navigation between items works
- [ ] Details overlay shows on hover/tap
- [ ] Responsive design adapts to screen size
- [ ] Status badges display correctly
- [ ] Lazy loading works
- [ ] No layout shifts
- [ ] Touch interactions work on mobile
