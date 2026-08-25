/**
 * GLB Drag Controller
 * Click and drag to reposition GLB model on map
 * Hotkey: Shift+D to toggle drag mode
 */

export interface GLBDragConfig {
  map: any;
  model: any;
  modelHeight: number;
  modelTransform: any;
  maplibregl: any;
  miladLog: any;
  initialPosition: [number, number]; // [lng, lat]
  initialAltitude: number;
  targetHeight: number;
}

export function createGLBDragController(config: GLBDragConfig) {
  const {
    map,
    model,
    modelHeight,
    modelTransform,
    maplibregl,
    miladLog,
    initialPosition,
    initialAltitude,
    targetHeight
  } = config;

  let dragMode = false;
  let isDragging = false;
  let dragIndicator: HTMLDivElement | null = null;
  
  // Current position
  let currentLng = initialPosition[0];
  let currentLat = initialPosition[1];
  let currentAltitude = initialAltitude;
  let currentHeight = targetHeight;
  let currentScaleX = 1.0;
  let currentScaleY = 1.0;
  let currentScaleZ = 1.0;

  const updateGLBPosition = (lng: number, lat: number, altitude?: number) => {
    currentLng = lng;
    currentLat = lat;
    if (altitude !== undefined) currentAltitude = altitude;

    // Recalculate Mercator coordinates
    const newMercator = maplibregl.MercatorCoordinate.fromLngLat(
      [currentLng, currentLat],
      currentAltitude
    );

    modelTransform.translateX = newMercator.x;
    modelTransform.translateY = newMercator.y;
    modelTransform.translateZ = newMercator.z;

    map.triggerRepaint();
  };
  
  const updateGLBScale = () => {
    const baseScale = currentHeight / modelHeight;
    model.scale.set(
      baseScale * currentScaleX,
      baseScale * currentScaleY,
      baseScale * currentScaleZ
    );
    map.triggerRepaint();
  };

  const createDragIndicator = () => {
    if (dragIndicator) return;

    dragIndicator = document.createElement('div');
    dragIndicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(22, 163, 74, 0.95);
      border: 2px solid #16a34a;
      border-radius: 8px;
      padding: 12px 24px;
      color: white;
      font-family: monospace;
      font-size: 14px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      pointer-events: none;
      animation: pulse 2s ease-in-out infinite;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
        50% { opacity: 0.8; transform: translateX(-50%) scale(1.05); }
      }
    `;
    document.head.appendChild(style);

    dragIndicator.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 5px;">🗼 DRAG MODE</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.9);">
          <strong>Click & Drag:</strong> Move position<br>
          <strong>Mouse Wheel:</strong> Change height<br>
          <strong>Arrow Keys:</strong> Adjust scale<br>
          <span style="color: #fbbf24;">↑↓ = Scale Y (height) | ←→ = Scale X/Z (width)</span><br>
          Press <span style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">Shift+D</span> to exit
        </div>
        <div id="drag-coordinates" style="margin-top: 10px; font-size: 11px; color: rgba(255,255,255,0.7); font-family: monospace;">
          ${currentLng.toFixed(5)}, ${currentLat.toFixed(5)}<br>
          H:${currentHeight.toFixed(0)}m | Scale: X${currentScaleX.toFixed(2)} Y${currentScaleY.toFixed(2)} Z${currentScaleZ.toFixed(2)}
        </div>
      </div>
    `;

    document.body.appendChild(dragIndicator);
  };

  const removeDragIndicator = () => {
    if (dragIndicator) {
      dragIndicator.remove();
      dragIndicator = null;
    }
  };

  const updateIndicatorCoordinates = () => {
    if (dragIndicator) {
      const coordElement = document.getElementById('drag-coordinates');
      if (coordElement) {
        coordElement.innerHTML = `
          ${currentLng.toFixed(5)}, ${currentLat.toFixed(5)}<br>
          H:${currentHeight.toFixed(0)}m | Scale: X${currentScaleX.toFixed(2)} Y${currentScaleY.toFixed(2)} Z${currentScaleZ.toFixed(2)}
        `;
      }
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    if (!dragMode) return;
    isDragging = true;
    map.getCanvas().style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragMode) return;
    
    if (!isDragging) {
      map.getCanvas().style.cursor = 'grab';
      return;
    }

    // Get mouse position in map coordinates
    const point = map.unproject([e.clientX, e.clientY]);
    updateGLBPosition(point.lng, point.lat);
    updateIndicatorCoordinates();
  };

  const onMouseUp = () => {
    if (!dragMode) return;
    
    if (isDragging) {
      isDragging = false;
      map.getCanvas().style.cursor = 'grab';
      
      // Copy final position to clipboard
      const data = {
        coordinates: [currentLng, currentLat],
        height: currentHeight,
        altitude: currentAltitude,
        scale: {
          x: currentScaleX,
          y: currentScaleY,
          z: currentScaleZ
        },
        rotation: {
          x: modelTransform.rotateX,
          y: modelTransform.rotateY,
          z: modelTransform.rotateZ
        }
      };
      
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      miladLog.success("📋 Position copied to clipboard:", data);
      
      // Show temporary notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(22, 163, 74, 0.95);
        border: 2px solid #16a34a;
        border-radius: 8px;
        padding: 12px 20px;
        color: white;
        font-family: monospace;
        font-size: 12px;
        z-index: 10001;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
      `;
      notification.innerHTML = `✅ Position copied to clipboard!`;
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 2000);
    }
  };

  const onWheel = (e: WheelEvent) => {
    if (!dragMode) return;
    e.preventDefault();

    // Change height with scroll
    const delta = -e.deltaY * 0.5; // Adjust sensitivity
    currentHeight = Math.max(200, Math.min(1200, currentHeight + delta));

    updateGLBScale();
    updateIndicatorCoordinates();
    
    miladLog.info(`🔧 Height: ${currentHeight.toFixed(0)}m`);
  };
  
  const onKeyDown = (e: KeyboardEvent) => {
    if (!dragMode) return;
    
    const step = 0.05;
    let updated = false;
    
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        currentScaleY = Math.min(3.0, currentScaleY + step);
        updated = true;
        miladLog.info(`📏 Scale Y (height): ${currentScaleY.toFixed(2)}`);
        break;
      case 'ArrowDown':
        e.preventDefault();
        currentScaleY = Math.max(0.5, currentScaleY - step);
        updated = true;
        miladLog.info(`📏 Scale Y (height): ${currentScaleY.toFixed(2)}`);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        currentScaleX = Math.max(0.5, currentScaleX - step);
        currentScaleZ = currentScaleX; // Keep X and Z synchronized
        updated = true;
        miladLog.info(`📏 Scale X/Z (width): ${currentScaleX.toFixed(2)}`);
        break;
      case 'ArrowRight':
        e.preventDefault();
        currentScaleX = Math.min(3.0, currentScaleX + step);
        currentScaleZ = currentScaleX; // Keep X and Z synchronized
        updated = true;
        miladLog.info(`📏 Scale X/Z (width): ${currentScaleX.toFixed(2)}`);
        break;
    }
    
    if (updated) {
      updateGLBScale();
      updateIndicatorCoordinates();
    }
  };

  const enableDragMode = () => {
    dragMode = true;
    createDragIndicator();
    
    // Change cursor
    map.getCanvas().style.cursor = 'grab';
    
    // Disable map drag
    map.dragPan.disable();
    
    // Add event listeners
    map.getCanvas().addEventListener('mousedown', onMouseDown);
    map.getCanvas().addEventListener('mousemove', onMouseMove);
    map.getCanvas().addEventListener('mouseup', onMouseUp);
    map.getCanvas().addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    
    miladLog.success("🗼 DRAG MODE: Click=move | Wheel=height | Arrows=scale");
  };

  const disableDragMode = () => {
    dragMode = false;
    isDragging = false;
    removeDragIndicator();
    
    // Restore cursor
    map.getCanvas().style.cursor = '';
    
    // Re-enable map drag
    map.dragPan.enable();
    
    // Remove event listeners
    map.getCanvas().removeEventListener('mousedown', onMouseDown);
    map.getCanvas().removeEventListener('mousemove', onMouseMove);
    map.getCanvas().removeEventListener('mouseup', onMouseUp);
    map.getCanvas().removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKeyDown);
    
    // Final position log
    const finalData = {
      coordinates: [currentLng, currentLat],
      height: currentHeight,
      altitude: currentAltitude,
      scale: {
        x: currentScaleX,
        y: currentScaleY,
        z: currentScaleZ
      },
      rotation: {
        x: modelTransform.rotateX,
        y: modelTransform.rotateY,
        z: modelTransform.rotateZ
      }
    };
    
    miladLog.info("🗼 DRAG MODE DISABLED");
    miladLog.info("📍 Final transform:", finalData);
  };

  // Keyboard shortcut: Shift+D
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'D') {
      e.preventDefault();
      
      if (dragMode) {
        disableDragMode();
      } else {
        enableDragMode();
      }
    }
  });

  miladLog.info("⌨️  Press Shift+D for DRAG MODE");
  miladLog.info("   Controls: Click=move | Wheel=height | ↑↓=scaleY | ←→=scaleXZ");
  
  return {
    enable: enableDragMode,
    disable: disableDragMode,
    isActive: () => dragMode,
    getCurrentTransform: () => ({ 
      lng: currentLng, 
      lat: currentLat, 
      height: currentHeight, 
      altitude: currentAltitude,
      scaleX: currentScaleX,
      scaleY: currentScaleY,
      scaleZ: currentScaleZ
    })
  };
}
