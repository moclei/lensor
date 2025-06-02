import { useState, useCallback, useEffect, useRef } from 'react';

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
  console.log('[useCanvasLifecycle] Hook called with:', {
    hasImage: !!imageBitmap,
    active
  });

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
      console.error(
        '[useCanvasLifecycle] getCanvasCenter, canvas not initialized'
      );
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return { x: centerX, y: centerY };
  }, [mainCanvasRef]);

  // Show or hide canvases
  const showCanvases = useCallback((visible: boolean) => {
    console.log(
      '[useCanvasLifecycle] showCanvases called with visible:',
      visible
    );
    setCanvasesVisible(visible);
  }, []);

  // Initialize canvases
  const initializeCanvases = useCallback(() => {
    console.log(
      '[useCanvasLifecycle] initializeCanvases called, initialized:',
      initialized
    );
    if (initialized) return;

    // Optional custom initialization callback
    if (onInitialize) {
      console.log('[useCanvasLifecycle] Calling onInitialize callback');
      onInitialize();
    }

    setInitialized(true);
  }, [onInitialize, initialized]);

  // Reset state when active changes to false
  useEffect(() => {
    const activeChanged = active !== prevActiveRef.current;
    console.log('[useCanvasLifecycle] Active state change detected:', {
      prev: prevActiveRef.current,
      current: active,
      changed: activeChanged
    });

    prevActiveRef.current = active;

    if (!active && activeChanged) {
      console.log('[useCanvasLifecycle] Active became false, resetting state');
      setInitialized(false);
      setCanvasesReady(false);
      setInitialDrawComplete(false);
      setCanvasesVisible(false);
    }

    // Basic initialization when active becomes true, regardless of imageBitmap
    if (active && activeChanged) {
      console.log(
        '[useCanvasLifecycle] Active became true, doing basic initialization'
      );
      showCanvases(true);
      initializeCanvases();
      setCanvasesReady(true);
    }
  }, [active, showCanvases, initializeCanvases]);

  // Canvas initialization effect - for image-dependent operations
  useEffect(() => {
    console.log('[useCanvasLifecycle] Initialization effect, conditions:', {
      active,
      hasImage: !!imageBitmap,
      initialized,
      canvasesReady,
      initialDrawComplete
    });

    if (active && imageBitmap) {
      console.log('[useCanvasLifecycle] Initialize lense graphics with image');

      // Calculate scale
      const newScale = imageBitmap.width / window.innerWidth;
      console.log('[useCanvasLifecycle] Setting scale to:', newScale);
      setScale(newScale);

      // Get and pass canvas center
      const canvasCenter = getCanvasCenter();
      console.log('[useCanvasLifecycle] Canvas center:', canvasCenter);

      // Optional draw complete callback
      if (onDrawComplete) {
        console.log('[useCanvasLifecycle] Calling onDrawComplete callback');
        onDrawComplete(canvasCenter);
      }
    }
  }, [active, imageBitmap, getCanvasCenter, onDrawComplete]);

  // Final draw complete effect
  useEffect(() => {
    console.log('[useCanvasLifecycle] Draw complete effect, conditions:', {
      canvasesReady,
      hasImage: !!imageBitmap,
      hasCanvas: !!mainCanvasRef.current,
      initialDrawComplete
    });

    if (
      canvasesReady &&
      mainCanvasRef.current &&
      !initialDrawComplete &&
      // Make initialDrawComplete set to true even without an image
      (imageBitmap || active)
    ) {
      console.log('[useCanvasLifecycle] Performing initial draw');
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
