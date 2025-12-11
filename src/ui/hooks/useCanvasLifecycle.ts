import { useState, useCallback, useEffect, useRef } from 'react';
import { debug } from '../../lib/debug';

const log = debug.canvas;

interface CanvasLifecycleOptions {
  imageBitmap: ImageBitmap | null;
  mainCanvasRef: React.RefObject<HTMLCanvasElement>;
  active: boolean;
  onInitialize?: () => void;
  onDrawComplete?: (canvasCenter: { x: number; y: number }) => void;
}

export function useCanvasLifecycle({
  imageBitmap,
  mainCanvasRef,
  active,
  onInitialize,
  onDrawComplete
}: CanvasLifecycleOptions) {
  const [canvasesVisible, setCanvasesVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [canvasesReady, setCanvasesReady] = useState(false);
  const [initialDrawComplete, setInitialDrawComplete] = useState(false);
  const [scale, setScale] = useState(1);

  // Reference to track previous active state
  const prevActiveRef = useRef(active);

  // Get canvas center
  const getCanvasCenter = useCallback((): { x: number; y: number } => {
    const canvas = mainCanvasRef.current;
    if (!canvas) {
      console.error('[useCanvasLifecycle] Canvas not initialized');
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return { x: centerX, y: centerY };
  }, [mainCanvasRef]);

  // Show or hide canvases
  const showCanvases = useCallback((visible: boolean) => {
    log('Setting canvas visibility: %s', visible);
    setCanvasesVisible(visible);
  }, []);

  // Initialize canvases
  const initializeCanvases = useCallback(() => {
    if (initialized) return;

    log('Initializing canvases');
    if (onInitialize) {
      onInitialize();
    }

    setInitialized(true);
  }, [onInitialize, initialized]);

  // Reset state when active changes to false
  useEffect(() => {
    const activeChanged = active !== prevActiveRef.current;
    prevActiveRef.current = active;

    if (!active && activeChanged) {
      log('Active became false, resetting state');
      setInitialized(false);
      setCanvasesReady(false);
      setInitialDrawComplete(false);
      setCanvasesVisible(false);
    }

    // Basic initialization when active becomes true, regardless of imageBitmap
    if (active && activeChanged) {
      log('Active became true, initializing');
      showCanvases(true);
      initializeCanvases();
      setCanvasesReady(true);
    }
  }, [active, showCanvases, initializeCanvases]);

  // Canvas initialization effect - for image-dependent operations
  useEffect(() => {
    // Guard: Only run if canvas is actually mounted in the DOM
    // (The component may return early during capture, leaving canvas unmounted)
    if (active && imageBitmap && mainCanvasRef.current) {
      log('Initializing with image bitmap');

      // Calculate scale
      const newScale = imageBitmap.width / window.innerWidth;
      setScale(newScale);

      // Get and pass canvas center
      const canvasCenter = getCanvasCenter();

      // Optional draw complete callback
      if (onDrawComplete) {
        onDrawComplete(canvasCenter);
      }
    }
  }, [active, imageBitmap, mainCanvasRef, getCanvasCenter, onDrawComplete]);

  // Final draw complete effect
  useEffect(() => {
    if (
      canvasesReady &&
      mainCanvasRef.current &&
      !initialDrawComplete &&
      // Make initialDrawComplete set to true even without an image
      (imageBitmap || active)
    ) {
      log('Initial draw complete');
      setInitialDrawComplete(true);
    }
  }, [canvasesReady, imageBitmap, mainCanvasRef, initialDrawComplete, active]);

  return {
    canvasesVisible,
    initialized,
    canvasesReady,
    initialDrawComplete,
    scale,
    getCanvasCenter,
    showCanvases,
    initializeCanvases,
    setInitialized: (value: boolean) => setInitialized(value)
  };
}
