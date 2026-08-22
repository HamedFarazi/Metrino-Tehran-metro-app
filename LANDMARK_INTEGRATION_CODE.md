# 🔧 Landmark 3D Integration Code

## Prerequisites

Before adding this code, ensure:

1. **Three.js is installed:**
   ```bash
   pnpm add three @types/three
   ```

2. **GLB model exists:**
   - File: `public/assets/landmarks/miladtower.glb`
   - Converted from: `public/miladtower.skp`
   - See: `LANDMARK_CONVERSION_GUIDE.md`

---

## Step 1: Add Import to MapPage.tsx

Add this import at the top of `src/pages/MapPage.tsx`:

```typescript
// Add after the existing maplibre-gl import
import { createLandmark3DLayer, type Landmark3DConfig } from '@/components/map/Landmark3DModel';
```

**Location:** Around line 20, after other imports.

---

## Step 2: Replace Debug Visualization

Find this section in `futuristic3DSetup()` function:

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// 10. PREMIUM LANDMARK 3D SYSTEM - Debug Visualization
// ═══════════════════════════════════════════════════════════════════════════
```

**Replace the entire section** (lines ~3010-3090) with:

```typescript
// ═══════════════════════════════════════════════════════════════════════════
// 10. PREMIUM LANDMARK 3D SYSTEM - Real Milad Tower
// ═══════════════════════════════════════════════════════════════════════════

try {
  // Check if GLB exists before attempting to load
  const miladTowerConfig: Landmark3DConfig = {
    id: 'milad-tower-3d',
    coordinates: [51.375, 35.745], // Milad Tower location
    modelUrl: '/assets/landmarks/miladtower.glb',
    height: 435, // Real height in meters
    rotation: 0, // Adjust if model faces wrong direction
    scale: 1.0, // Fine-tune if needed
    baseHeight: 0 // Ground level
  };

  // Create and add 3D landmark layer
  const landmark3DLayer = createLandmark3DLayer(miladTowerConfig, map);
  
  // Add layer after all other layers (on top of city)
  map.addLayer(landmark3DLayer);

  console.log("✅ Milad Tower 3D Model Loaded");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("📍 Position:", miladTowerConfig.coordinates);
  console.log("📏 Real Height:", miladTowerConfig.height, "meters");
  console.log("🎨 Material: NVIDIA Omniverse architectural style");
  console.log("🔄 Camera: Synchronized with map pitch/bearing/zoom");
  console.log("═══════════════════════════════════════════════════════════");
  
} catch (error) {
  console.error("❌ Failed to load Milad Tower 3D model:", error);
  console.error("Verify:");
  console.error("  1. Three.js is installed: pnpm list three");
  console.error("  2. GLB exists: public/assets/landmarks/miladtower.glb");
  console.error("  3. File is valid GLB format");
}
```

---

## Step 3: Optional - Add Debug Bounding Box

For troubleshooting, add a temporary debug marker **inside the try block**:

```typescript
// Optional: Debug marker (remove after verification)
map.addSource('milad-debug-marker', {
  type: 'geojson',
  data: {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [51.375, 35.745]
    },
    properties: { name: 'Milad Tower Debug' }
  }
});

map.addLayer({
  id: 'milad-debug-circle',
  type: 'circle',
  source: 'milad-debug-marker',
  paint: {
    'circle-radius': 15,
    'circle-color': '#00ff00',
    'circle-opacity': 0.3,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#00ff00'
  }
});

console.log("🟢 Debug: Green circle added at model location");
```

---

## Step 4: Verify Installation

After adding the code:

1. **Check browser console** for:
   - ✅ "Milad Tower 3D Model Loaded"
   - ✅ Position and height logs
   - ⚠️ Any loading progress messages
   - ❌ Any error messages

2. **Visual check:**
   - Navigate to coordinates [51.375, 35.745]
   - Zoom level 14-16 recommended
   - Look for dark architectural tower
   - Verify it rotates with map camera

3. **Debug marker:**
   - If using debug marker, green circle should be visible
   - 3D model should appear at same location
   - Remove debug code after verification

---

## Troubleshooting Guide

### Error: "Cannot find module 'three'"

**Solution:**
```bash
pnpm add three @types/three
```

### Error: "Failed to load GLB"

**Check:**
1. File exists: `f:\Linkdin projects\metroapp\public\assets\landmarks\miladtower.glb`
2. File path in code: `/assets/landmarks/miladtower.glb` (no "public" in path)
3. File is valid GLB format (not SKP)
4. File size < 10MB

### Model not visible

**Try:**
1. Add debug marker (see Step 3)
2. Adjust scale: change `scale: 1.0` to `scale: 5.0` or `scale: 0.1`
3. Adjust rotation: change `rotation: 0` to `rotation: 90` or `rotation: 180`
4. Check console for loading progress
5. Verify coordinates are correct

### Model too small/large

**Adjust scale parameter:**
```typescript
scale: 2.0,  // Double size
// or
scale: 0.5,  // Half size
```

### Model facing wrong direction

**Adjust rotation parameter:**
```typescript
rotation: 90,   // Rotate 90° clockwise
rotation: 180,  // Rotate 180°
rotation: -90,  // Rotate 90° counter-clockwise
```

### Model clipping into ground

**Adjust base height:**
```typescript
baseHeight: 10,  // Lift 10 meters above ground
```

---

## Performance Optimization

If frame rate drops after adding 3D model:

1. **Reduce polygon count** in Blender before export
2. **Enable Draco compression** in GLB export
3. **Simplify geometry:** Target < 50K triangles
4. **Remove hidden faces** in Blender

---

## Adding More Landmarks

Once Milad Tower works, add more landmarks:

```typescript
// Azadi Tower
const azadiTowerConfig: Landmark3DConfig = {
  id: 'azadi-tower-3d',
  coordinates: [51.338, 35.700],
  modelUrl: '/assets/landmarks/azaditower.glb',
  height: 45, // Real height
  rotation: 0,
  scale: 1.0,
  baseHeight: 0
};

const azadiLayer = createLandmark3DLayer(azadiTowerConfig, map);
map.addLayer(azadiLayer);
```

---

## Removing Debug Visualization

Once 3D model is working, remove these debug layers:

```typescript
// Remove these layers (currently showing orange placeholder):
map.removeLayer('milad-3d-placeholder-outer');
map.removeLayer('milad-3d-placeholder-inner');
map.removeLayer('milad-3d-placeholder-label');
map.removeSource('milad-3d-placeholder');
```

---

## Final Checklist

After integration:

- [ ] Three.js installed and imported correctly
- [ ] GLB file exists at correct path
- [ ] Import statement added to MapPage.tsx
- [ ] Integration code added to futuristic3DSetup()
- [ ] No console errors
- [ ] Model visible at Milad Tower location
- [ ] Model rotates with camera
- [ ] Model scale looks correct (435m height)
- [ ] Dark materials match digital twin aesthetic
- [ ] Debug markers removed (if any)
- [ ] Frame rate acceptable (>30 FPS)

---

## Need Help?

See also:
- **Conversion Guide:** `LANDMARK_CONVERSION_GUIDE.md`
- **Status Document:** `LANDMARK_3D_STATUS.md`
- **Component Docs:** `src/components/map/README_LANDMARKS.md`
- **Implementation:** `IMPLEMENTATION_COMPLETE.md`
