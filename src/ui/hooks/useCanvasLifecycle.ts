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
  const [canvasesVisible, setCanvasesVisible] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [canvasesReady, setCanvasesReady] = useState(false);
  const [initialDrawComplete, setInitialDrawComplete] = useState(false);
  const [scale, setScale] = useState(1);

  // Get canvas center
  const getCanvasCenter = useCallback((): { x: number; y: number } => {
    const canvas = mainCanvasRef.current;
    if (!canvas) {
      console.error('getCanvasCenter, canvas not initialized');
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    return { x: centerX, y: centerY };
  }, [mainCanvasRef]);

  // Show or hide canvases
  const showCanvases = useCallback((visible: boolean) => {
    console.log('showCanvases, visible: ', visible);
    setCanvasesVisible(visible);
  }, []);

  // Initialize canvases
  const initializeCanvases = useCallback(() => {
    if (initialized) return;
    // Optional custom initialization callback
    if (onInitialize) {
      onInitialize();
    }

    setInitialized(true);
  }, [onInitialize]);

  // Canvas initialization effect
  useEffect(() => {
    if (active && imageBitmap) {
      console.log('Initialize lense graphics');

      // Calculate scale
      const newScale = imageBitmap.width / window.innerWidth;
      setScale(newScale);

      // Prepare canvases
      initializeCanvases();
      showCanvases(true);
      setCanvasesReady(true);

      // Get and pass canvas center
      const canvasCenter = getCanvasCenter();

      // Optional draw complete callback
      if (onDrawComplete) {
        onDrawComplete(canvasCenter);
      }
    }
  }, [active, imageBitmap, showCanvases, getCanvasCenter]);

  // Final draw complete effect
  useEffect(() => {
    if (
      canvasesReady &&
      imageBitmap &&
      mainCanvasRef.current &&
      !initialDrawComplete
    ) {
      console.log('Performing initial draw');
      setInitialDrawComplete(true);
    }
  }, [canvasesReady, imageBitmap, mainCanvasRef, initialDrawComplete]);

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
