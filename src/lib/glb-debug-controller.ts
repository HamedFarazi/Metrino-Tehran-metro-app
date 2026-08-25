/**
 * GLB Debug Controller
 * Interactive control panel for adjusting GLB model transform in real-time
 * Hotkey: Shift+D
 */

export interface GLBTransform {
  lng: number;
  lat: number;
  height: number;
  altitude: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
}

export function createGLBDebugController(
  map: any,
  model: any,
  modelHeight: number,
  modelTransform: any,
  maplibregl: any,
  miladLog: any
) {
  let debugMode = false;
  let debugPanel: HTMLDivElement | null = null;
  
  const debugTransform: GLBTransform = {
    lng: modelTransform.lng || 51.37532,
    lat: modelTransform.lat || 35.74484,
    height: modelTransform.height || 650,
    altitude: modelTransform.altitude || 0,
    rotateX: modelTransform.rotateX || Math.PI / 2,
    rotateY: modelTransform.rotateY || 0,
    rotateZ: modelTransform.rotateZ || 0
  };
  
  const applyDebugTransform = () => {
    // Update scale
    const newMetersPerUnit = debugTransform.height / modelHeight;
    model.scale.setScalar(newMetersPerUnit);
    
    // Update position by recalculating Mercator coordinates
    const newMercator = maplibregl.MercatorCoordinate.fromLngLat(
      [debugTransform.lng, debugTransform.lat],
      debugTransform.altitude
    );
    
    modelTransform.translateX = newMercator.x;
    modelTransform.translateY = newMercator.y;
    modelTransform.translateZ = newMercator.z;
    modelTransform.rotateX = debugTransform.rotateX;
    modelTransform.rotateY = debugTransform.rotateY;
    modelTransform.rotateZ = debugTransform.rotateZ;
    
    map.triggerRepaint();
    miladLog.info("🔧 Transform updated:", {
      position: [debugTransform.lng.toFixed(5), debugTransform.lat.toFixed(5)],
      height: debugTransform.height,
      altitude: debugTransform.altitude
    });
  };
  
  const createDebugPanel = () => {
    if (debugPanel) return;
    
    debugPanel = document.createElement('div');
    debugPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #16a34a;
      border-radius: 12px;
      padding: 20px;
      color: #fff;
      font-family: monospace;
      font-size: 13px;
      z-index: 10000;
      min-width: 380px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;
    
    debugPanel.innerHTML = `
      <div style="margin-bottom: 15px; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
        <strong style="color: #16a34a; font-size: 16px;">🗼 GLB DEBUG MODE</strong>
        <div style="font-size: 11px; color: #888; margin-top: 5px;">Press Shift+D to close</div>
      </div>
      
      <div style="margin-bottom: 15px; padding: 10px; background: rgba(22,163,74,0.1); border-radius: 6px;">
        <div style="color: #10b981; font-size: 11px; margin-bottom: 5px;">📍 Current Position</div>
        <div style="font-size: 10px; color: #888;">
          Lng: <span id="debug-lng-display">${debugTransform.lng.toFixed(5)}</span><br>
          Lat: <span id="debug-lat-display">${debugTransform.lat.toFixed(5)}</span>
        </div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; color: #16a34a; margin-bottom: 5px;">Longitude (شرق/غرب):</label>
        <input type="range" id="debug-lng" min="51.370" max="51.380" step="0.00001" value="${debugTransform.lng}" 
          style="width: 100%; margin-bottom: 5px;">
        <div id="debug-lng-value" style="text-align: right; color: #10b981;">${debugTransform.lng.toFixed(5)}</div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; color: #16a34a; margin-bottom: 5px;">Latitude (شمال/جنوب):</label>
        <input type="range" id="debug-lat" min="35.740" max="35.750" step="0.00001" value="${debugTransform.lat}" 
          style="width: 100%; margin-bottom: 5px;">
        <div id="debug-lat-value" style="text-align: right; color: #10b981;">${debugTransform.lat.toFixed(5)}</div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; color: #16a34a; margin-bottom: 5px;">Height (ارتفاع مدل):</label>
        <input type="range" id="debug-height" min="200" max="1200" step="10" value="${debugTransform.height}" 
          style="width: 100%; margin-bottom: 5px;">
        <div id="debug-height-value" style="text-align: right; color: #10b981;">${debugTransform.height}m</div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; color: #16a34a; margin-bottom: 5px;">Altitude (فاصله از زمین):</label>
        <input type="range" id="debug-altitude" min="-50" max="100" step="1" value="${debugTransform.altitude}" 
          style="width: 100%; margin-bottom: 5px;">
        <div id="debug-altitude-value" style="text-align: right; color: #10b981;">${debugTransform.altitude}m</div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; color: #16a34a; margin-bottom: 5px;">Rotation X:</label>
        <input type="range" id="debug-rotX" min="0" max="6.28" step="0.01" value="${debugTransform.rotateX}" 
          style="width: 100%; margin-bottom: 5px;">
        <div id="debug-rotX-value" style="text-align: right; color: #10b981;">${debugTransform.rotateX.toFixed(2)} rad</div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; color: #16a34a; margin-bottom: 5px;">Rotation Y:</label>
        <input type="range" id="debug-rotY" min="0" max="6.28" step="0.01" value="${debugTransform.rotateY}" 
          style="width: 100%; margin-bottom: 5px;">
        <div id="debug-rotY-value" style="text-align: right; color: #10b981;">${debugTransform.rotateY.toFixed(2)} rad</div>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; color: #16a34a; margin-bottom: 5px;">Rotation Z:</label>
        <input type="range" id="debug-rotZ" min="0" max="6.28" step="0.01" value="${debugTransform.rotateZ}" 
          style="width: 100%; margin-bottom: 5px;">
        <div id="debug-rotZ-value" style="text-align: right; color: #10b981;">${debugTransform.rotateZ.toFixed(2)} rad</div>
      </div>
      
      <button id="debug-copy" style="
        width: 100%;
        padding: 12px;
        background: #16a34a;
        border: none;
        border-radius: 6px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        margin-top: 10px;
        transition: background 0.2s;
      " onmouseover="this.style.background='#15803d'" onmouseout="this.style.background='#16a34a'">
        📋 Copy Transform Data
      </button>
      
      <div id="debug-output" style="
        margin-top: 15px;
        padding: 10px;
        background: rgba(22, 163, 74, 0.1);
        border: 1px solid #16a34a;
        border-radius: 6px;
        font-size: 11px;
        color: #10b981;
        word-break: break-all;
        display: none;
      "></div>
    `;
    
    document.body.appendChild(debugPanel);
    
    // Event listeners
    const lngSlider = document.getElementById('debug-lng') as HTMLInputElement;
    const latSlider = document.getElementById('debug-lat') as HTMLInputElement;
    const heightSlider = document.getElementById('debug-height') as HTMLInputElement;
    const altitudeSlider = document.getElementById('debug-altitude') as HTMLInputElement;
    const rotXSlider = document.getElementById('debug-rotX') as HTMLInputElement;
    const rotYSlider = document.getElementById('debug-rotY') as HTMLInputElement;
    const rotZSlider = document.getElementById('debug-rotZ') as HTMLInputElement;
    const copyBtn = document.getElementById('debug-copy') as HTMLButtonElement;
    
    lngSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      debugTransform.lng = val;
      document.getElementById('debug-lng-value')!.textContent = val.toFixed(5);
      document.getElementById('debug-lng-display')!.textContent = val.toFixed(5);
      applyDebugTransform();
    });
    
    latSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      debugTransform.lat = val;
      document.getElementById('debug-lat-value')!.textContent = val.toFixed(5);
      document.getElementById('debug-lat-display')!.textContent = val.toFixed(5);
      applyDebugTransform();
    });
    
    heightSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      debugTransform.height = val;
      document.getElementById('debug-height-value')!.textContent = `${val}m`;
      applyDebugTransform();
    });
    
    altitudeSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      debugTransform.altitude = val;
      document.getElementById('debug-altitude-value')!.textContent = `${val}m`;
      applyDebugTransform();
    });
    
    rotXSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      debugTransform.rotateX = val;
      document.getElementById('debug-rotX-value')!.textContent = `${val.toFixed(2)} rad`;
      applyDebugTransform();
    });
    
    rotYSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      debugTransform.rotateY = val;
      document.getElementById('debug-rotY-value')!.textContent = `${val.toFixed(2)} rad`;
      applyDebugTransform();
    });
    
    rotZSlider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      debugTransform.rotateZ = val;
      document.getElementById('debug-rotZ-value')!.textContent = `${val.toFixed(2)} rad`;
      applyDebugTransform();
    });
    
    copyBtn?.addEventListener('click', () => {
      const data = {
        coordinates: [debugTransform.lng, debugTransform.lat],
        height: debugTransform.height,
        altitude: debugTransform.altitude,
        rotation: {
          x: debugTransform.rotateX,
          y: debugTransform.rotateY,
          z: debugTransform.rotateZ
        }
      };
      
      const jsonStr = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(jsonStr);
      
      const output = document.getElementById('debug-output')!;
      output.textContent = '✅ Copied to clipboard!\n\n' + jsonStr;
      output.style.display = 'block';
      
      setTimeout(() => {
        output.style.display = 'none';
      }, 3000);
      
      miladLog.success("📋 Transform data copied:", data);
    });
    
    miladLog.success("🔧 Debug panel created - ALL CONTROLS ACTIVE");
  };
  
  const removeDebugPanel = () => {
    if (debugPanel) {
      debugPanel.remove();
      debugPanel = null;
      miladLog.info("🔧 Debug panel closed");
    }
  };
  
  // Keyboard shortcut: Shift+D
  window.addEventListener('keydown', (e) => {
    if (e.shiftKey && e.key === 'D') {
      e.preventDefault();
      debugMode = !debugMode;
      
      if (debugMode) {
        createDebugPanel();
        miladLog.success("🔧 DEBUG MODE: ON (Full position & rotation control)");
      } else {
        removeDebugPanel();
        miladLog.info("🔧 DEBUG MODE: OFF");
      }
    }
  });
  
  miladLog.info("⌨️  Press Shift+D for interactive GLB control (position, height, rotation)");
}
