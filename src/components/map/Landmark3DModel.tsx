/**
 * Premium Landmark 3D Model Component
 * 
 * Integrates real 3D landmark assets (GLB/glTF) with MapLibre GL
 * Using Three.js custom layer for NVIDIA Omniverse style rendering
 * 
 * Features:
 * - Geographic positioning
 * - Synchronized camera/pitch/bearing
 * - Dark architectural visualization
 * - Performance optimized
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import maplibregl from 'maplibre-gl';

export interface Landmark3DConfig {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  modelUrl: string;
  height?: number; // Real height in meters for scaling
  rotation?: number; // Rotation in degrees
  scale?: number; // Additional scale multiplier
  baseHeight?: number; // Ground elevation offset
}

interface LandmarkLayerState {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  model: THREE.Group | null;
  loaded: boolean;
}

/**
 * Create Three.js custom layer for MapLibre GL
 * This integrates 3D models directly into the MapLibre rendering pipeline
 */
export function createLandmark3DLayer(
  config: Landmark3DConfig,
  map: maplibregl.Map
): maplibregl.CustomLayerInterface {
  
  const layerState: LandmarkLayerState = {
    scene: new THREE.Scene(),
    camera: new THREE.Camera(),
    renderer: null as any,
    model: null,
    loaded: false
  };

  // MapLibre mercator coordinates
  const modelOrigin = config.coordinates;
  const modelAltitude = config.baseHeight || 0;
  const modelRotate = [Math.PI / 2, 0, (config.rotation || 0) * (Math.PI / 180)];
  
  // Calculate scale based on real height
  // MapLibre uses meters, so we scale the model to match real height
  const defaultModelHeight = 100; // Assume default model is 100 units
  const realHeight = config.height || 435; // Real landmark height
  const scaleMultiplier = config.scale || 1;
  const modelScale = (realHeight / defaultModelHeight) * scaleMultiplier;

  // Convert mercator to world coordinates
  const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );

  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z || 0,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * modelScale
  };

  return {
    id: config.id,
    type: 'custom',
    renderingMode: '3d',

    onAdd(map: maplibregl.Map, gl: WebGLRenderingContext) {
      // Create Three.js camera matching MapLibre projection
      layerState.camera = new THREE.Camera();
      
      // Create Three.js renderer using MapLibre's WebGL context
      layerState.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      
      layerState.renderer.autoClear = false;
      layerState.renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Lighting for NVIDIA Omniverse style (minimal, architectural)
      const ambientLight = new THREE.AmbientLight(0x2d4a62, 0.4); // Dark blue ambient
      layerState.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0x4a6b84, 0.3); // Soft directional
      directionalLight.position.set(1, 3, 2);
      layerState.scene.add(directionalLight);

      // Load GLTF model
      const loader = new GLTFLoader();
      loader.load(
        config.modelUrl,
        (gltf) => {
          layerState.model = gltf.scene;
          
          // Apply dark architectural materials (NVIDIA Omniverse style)
          layerState.model.traverse((node: any) => {
            if (node.isMesh) {
              // Replace with dark graphite material
              node.material = new THREE.MeshStandardMaterial({
                color: 0x11263c, // Dark architectural navy
                metalness: 0.6,
                roughness: 0.4,
                emissive: 0x0d1d2e,
                emissiveIntensity: 0.05
              });
              
              node.castShadow = true;
              node.receiveShadow = true;
            }
          });

          layerState.scene.add(layerState.model);
          layerState.loaded = true;
          
          console.log(`✅ Loaded landmark 3D model: ${config.id}`);
          map.triggerRepaint();
        },
        (progress) => {
          console.log(`⏳ Loading ${config.id}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
        },
        (error) => {
          console.error(`❌ Failed to load landmark ${config.id}:`, error);
        }
      );
    },

    render(_gl: WebGLRenderingContext | WebGL2RenderingContext, options: maplibregl.CustomRenderMethodInput) {
      if (!layerState.loaded || !layerState.model) return;

      // Extract modelViewProjectionMatrix from the new API
      const matrix = options.modelViewProjectionMatrix;

      // Create transformation matrix
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      layerState.camera.projectionMatrix = m.multiply(l);
      
      // Render scene
      layerState.renderer.resetState();
      layerState.renderer.render(layerState.scene, layerState.camera);
      
      // Trigger continuous repaint for animations
      (map as any).triggerRepaint();
    },

    onRemove() {
      // Cleanup resources
      if (layerState.model) {
        layerState.model.traverse((node: any) => {
          if (node.isMesh) {
            node.geometry?.dispose();
            node.material?.dispose();
          }
        });
      }
      
      layerState.scene.clear();
      console.log(`🗑️ Removed landmark layer: ${config.id}`);
    }
  };
}

/**
 * React Hook for adding landmark 3D models to map
 */
export function useLandmark3D(
  map: maplibregl.Map | null,
  config: Landmark3DConfig,
  enabled: boolean = true
) {
  const layerRef = useRef<maplibregl.CustomLayerInterface | null>(null);

  useEffect(() => {
    if (!map || !enabled) return;

    // Wait for map to load
    const onLoad = () => {
      try {
        // Create and add custom layer
        layerRef.current = createLandmark3DLayer(config, map);
        
        if (!map.getLayer(config.id)) {
          map.addLayer(layerRef.current);
          console.log(`🏗️ Added landmark 3D layer: ${config.id}`);
        }
      } catch (error) {
        console.error(`Failed to add landmark layer ${config.id}:`, error);
      }
    };

    if (map.loaded()) {
      onLoad();
    } else {
      map.once('load', onLoad);
    }

    // Cleanup on unmount
    return () => {
      if (map && layerRef.current && map.getLayer(config.id)) {
        map.removeLayer(config.id);
        console.log(`🗑️ Cleaned up landmark: ${config.id}`);
      }
    };
  }, [map, config, enabled]);

  return layerRef;
}

export default useLandmark3D;
