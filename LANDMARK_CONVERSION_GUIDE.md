# Milad Tower 3D Model Conversion Guide

## Current Status
- SketchUp model location: `F:\Linkdin projects\metroapp\public\miladtower.skp`
- Target location: `public/assets/landmarks/miladtower.glb`

## Conversion Steps

### Method 1: Using Blender (Recommended)

1. **Install Blender** (free, open-source)
   - Download from: https://www.blender.org/download/

2. **Install SketchUp Importer Add-on**
   ```
   Edit → Preferences → Add-ons → Install
   Search for "SketchUp" or install from:
   https://github.com/martijnberger/pysketchup
   ```

3. **Import SKP File**
   ```
   File → Import → SketchUp (.skp)
   Select: miladtower.skp
   ```

4. **Optimize the Model**
   - Select all geometry (A key)
   - Mesh → Clean Up → Decimate Geometry (reduce to ~50K polygons)
   - Remove unnecessary details
   - Ensure tower is vertical (Z-axis up)
   - Center pivot at base of tower

5. **Scale to Real Size**
   - Milad Tower real height: 435 meters
   - Scale model so height = 435 units
   - Base should be at Z=0

6. **Apply Dark Materials** (Optional - can be done in code)
   - Select all
   - Materials → New Material
   - Base Color: Dark gray (#11263c)
   - Metallic: 0.6
   - Roughness: 0.4

7. **Export to GLB**
   ```
   File → Export → glTF 2.0 (.glb/.gltf)
   
   Settings:
   ✓ Format: GLB Binary (.glb)
   ✓ Include: Selected Objects
   ✓ Transform: +Y Up
   ✓ Compression: Draco (if available)
   ✓ Apply Modifiers
   
   Save as: miladtower.glb
   ```

8. **Place in Project**
   ```
   Copy miladtower.glb to:
   public/assets/landmarks/miladtower.glb
   ```

### Method 2: Using Online Converter

1. **Visit AnyConv** or similar service
   - https://anyconv.com/skp-to-glb-converter/

2. **Upload** `miladtower.skp`

3. **Convert** to GLB format

4. **Download** and place in `public/assets/landmarks/`

⚠️ **Note**: Online converters may not preserve scale accurately. Verify and adjust scale parameter in code.

### Method 3: Using SketchUp Pro

1. Open `miladtower.skp` in SketchUp Pro

2. Export as Collada (.dae):
   ```
   File → Export → 3D Model
   Format: COLLADA (.dae)
   ```

3. Use online tool to convert DAE → GLB:
   - https://products.aspose.app/3d/conversion/dae-to-glb

4. Download and place in `public/assets/landmarks/`

## Verification

After conversion, verify:
- ✅ File size < 5MB (preferably < 2MB)
- ✅ Tower is vertical (Z-up)
- ✅ Base at ground level (Z=0)
- ✅ Recognizable silhouette from aerial view
- ✅ No missing geometry

## Model Requirements

**Geometry:**
- Polygon count: 20K-100K triangles
- Height: Scaled to 435 units (meters)
- Orientation: North-facing (adjust rotation in code if needed)
- Pivot: At base center

**Materials:**
- Can be basic gray - will be replaced with dark architectural shader
- No textures required (procedural materials in code)

**File Format:**
- GLB (binary glTF 2.0)
- Draco compression if possible
- Embedded materials

## Testing

Once converted, the model will automatically load at:
- Coordinates: [51.375, 35.745]
- Height: 435 meters
- Dark architectural material (NVIDIA Omniverse style)

The system is already configured - just place the GLB file and refresh the map.
