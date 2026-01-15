import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react';
import { useLensorState } from '../../hooks/useLensorState';
import { useDraggable } from '@/ui/hooks/useDraggable';
import {
  useColorDetection,
  detectPixelColor
} from '../../hooks/useColorDetection';
import {
  GridCanvas,
  HiddenCanvas,
  LenseContainer,
  MainCanvas,
  GlassOverlay
} from './Lense.styles';
import { useLenseCanvasUpdate } from '@/ui/hooks/useLenseCanvasUpdate';
import { useGrid } from '@/ui/hooks/useGrid';
import { DebugOverlay } from './DebugOverlay';
import { useDebugInfo, useDebugMode } from '@/ui/utils/debug-utils';
import { useMediaCapture } from '@/ui/hooks/useMediaCapture';
import { usePageObservers } from '@/ui/hooks/usePageObserver';
import { useCanvasLifecycle } from '@/ui/hooks/useCanvasLifecycle';
import {
  convertToGrayscalePreservingFormat,
  hexToRgba,
  getSubtleTextureColor,
  getGridContrastColor
} from '@/ui/utils/color-utils';
import Handle from './Handle';
import ControlDrawer, { DrawerPosition } from './ControlDrawer';
import { debug } from '../../../lib/debug';
import {
  activePreset,
  getAnimationStyle,
  noAnimationStyle
} from '@/ui/animations';
import { useSettings } from '../../../settings/useSettings';

const log = debug.ui;

const CANVAS_SIZE = 400;
const DRAWER_HEIGHT = 326; // Pull tab (26px) + Panel (300px)
const DRAWER_WIDTH = 260;
const DRAWER_MARGIN = 10; // Small buffer from viewport edges
const DRAWER_HALF_HEIGHT = DRAWER_HEIGHT / 2; // For vertical centering check on side positions

// Minimum time between captures (Chrome limits to 2/second, so 600ms is safe)
const CAPTURE_COOLDOWN_MS = 600;

// Minimum time between inactivity timer resets (prevents excessive alarm API calls)
const ACTIVITY_RESET_DEBOUNCE_MS = 10000; // 10 seconds

// Module-level state for drawer - persists across component remounts during capture
let persistedDrawerOpen = false;

interface LenseProps {
  onStop: () => void;
  onClose: () => void;
}

const Lense: React.FC<LenseProps> = ({ onStop, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fisheyeCanvasRef = useRef<HTMLCanvasElement>(null);
  const interCanvasRef = useRef<HTMLCanvasElement>(null);
  const ringHandleRef = useRef<HTMLDivElement>(null);
  const infoScrollRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track last capture time to enforce rate limiting (Chrome caps at 2/second)
  const lastCaptureTimeRef = useRef<number>(0);

  // Track if defaults have been applied (only apply once per session)
  const defaultsAppliedRef = useRef(false);

  // Drawer state - uses module-level variable to persist through capture cycles
  const [drawerOpen, setDrawerOpenState] = useState(persistedDrawerOpen);
  const setDrawerOpen = useCallback((value: boolean) => {
    persistedDrawerOpen = value;
    setDrawerOpenState(value);
  }, []);

  // Load user settings
  const { settings, isLoading: settingsLoading } = useSettings();

  const { useStateItem } = useLensorState();
  const [lensePosition, setLensePosition] = useStateItem('lensePosition');

  // Calculate initial position if at default (0,0)
  // Centered horizontally, positioned near top of viewport
  const initialPosition = React.useMemo(() => {
    if (lensePosition.x === 0 && lensePosition.y === 0) {
      const centeredX = (window.innerWidth - CANVAS_SIZE) / 2;
      const topY = window.innerHeight * 0.1; // 10% from top
      return { x: centeredX, y: topY };
    }
    return lensePosition;
  }, [lensePosition]);

  // Save the initial position to state on first render if it was calculated
  useEffect(() => {
    if (lensePosition.x === 0 && lensePosition.y === 0) {
      const centeredX = (window.innerWidth - CANVAS_SIZE) / 2;
      const topY = window.innerHeight * 0.1; // 10% from top
      setLensePosition({ x: centeredX, y: topY });
    }
  }, []); // Only run once on mount

  const [colorPalette, setColorPalette] = useStateItem('colorPalette');
  const [materialPalette, setMaterialPalette] = useStateItem('materialPalette');
  const [hoveredColor, setHoveredColor] = useStateItem('hoveredColor');

  const [gridOn, setGridOn] = useStateItem('showGrid');
  const [fisheyeOn, setFisheyeOn] = useStateItem('showFisheye');
  // autoRefresh is kept for potential future use but not exposed in UI
  // DOM mutation recapture is effectively disabled
  const [zoom, setZoom] = useStateItem('zoom');
  const [active] = useStateItem('active');

  // Apply default settings from user preferences on first activation
  useEffect(() => {
    if (active && !defaultsAppliedRef.current && !settingsLoading) {
      defaultsAppliedRef.current = true;
      setZoom(settings.defaultZoom);
      setGridOn(settings.defaultGrid);
      setFisheyeOn(settings.defaultFisheye);
    }
  }, [active, settings, settingsLoading, setZoom, setGridOn, setFisheyeOn]);

  log('Render, active: %s', active);

  const { debugMode } = useDebugMode();
  const { debugInfo, setDebugInfo } = useDebugInfo();

  // Track last activity reset time to implement debouncing
  const lastActivityResetRef = useRef<number>(0);
  const activityResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Reset inactivity timer - sends message to service worker to reset the alarm
  // Debounced to prevent excessive alarm API calls during rapid interactions
  const resetActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastReset = now - lastActivityResetRef.current;

    // If we haven't reset recently, do it immediately
    if (timeSinceLastReset >= ACTIVITY_RESET_DEBOUNCE_MS) {
      lastActivityResetRef.current = now;
      chrome.runtime.sendMessage({ type: 'resetInactivityTimer' });
      return;
    }

    // Otherwise, schedule a trailing reset if not already scheduled
    if (!activityResetTimeoutRef.current) {
      const delay = ACTIVITY_RESET_DEBOUNCE_MS - timeSinceLastReset;
      activityResetTimeoutRef.current = setTimeout(() => {
        lastActivityResetRef.current = Date.now();
        chrome.runtime.sendMessage({ type: 'resetInactivityTimer' });
        activityResetTimeoutRef.current = null;
      }, delay);
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (activityResetTimeoutRef.current) {
        clearTimeout(activityResetTimeoutRef.current);
      }
    };
  }, []);

  const {
    imageBitmap: currentImage,
    isCapturing,
    captureFrame,
    error
  } = useMediaCapture();

  const {
    canvasesVisible,
    initialized,
    canvasesReady,
    initialDrawComplete,
    scale,
    getCanvasCenter,
    showCanvases,
    initializeCanvases
  } = useCanvasLifecycle({
    imageBitmap: currentImage,
    mainCanvasRef,
    active,
    isCapturing,
    onInitialize: () => {
      if (gridOn) drawGrid();
      drawCrosshairs();
    },
    onDrawComplete: (canvasCenter) => {
      log('Canvas draw complete, center: %o', canvasCenter);
    }
  });

  const { lastChangeTimestamp, lastScrollPosition } = usePageObservers(
    {
      // Scroll and resize recapture: always on (user-initiated actions)
      onScrollOrResizeChange: () => {
        const now = Date.now();
        const timeSinceLastCapture = now - lastCaptureTimeRef.current;

        // Enforce cooldown to avoid hitting Chrome's rate limit (2 captures/second)
        if (
          active &&
          !isCapturing &&
          timeSinceLastCapture >= CAPTURE_COOLDOWN_MS
        ) {
          log('Scroll/resize detected, recapturing');
          lastCaptureTimeRef.current = now;
          captureFrame();
          resetActivity();
        }
      },
      // DOM mutation recapture: disabled for now (too many edge cases)
      // Keeping the infrastructure for potential future use
      onMutationChange: () => {
        // Intentionally disabled - DOM mutations don't trigger recapture
        // Users can manually refresh if needed
      }
    },
    {
      scrollOptions: { debounceTime: 500, threshold: 6 },
      mutationOptions: { debounceTime: 500, threshold: 140 },
      resizeOptions: { debounceTime: 500, threshold: 6 }
    }
  );

  const { updateCanvas, calculateCropCoordinates } = useLenseCanvasUpdate({
    imageBitmap: currentImage,
    containerRef,
    mainCanvasRef,
    interCanvasRef,
    fisheyeCanvasRef,
    zoom,
    fisheyeOn
  });

  const gridContrastColor = getGridContrastColor(hoveredColor);

  const { drawGrid, drawCrosshairs } = useGrid({
    canvasRef: gridCanvasRef,
    isGridVisible: gridOn,
    canvasSize: CANVAS_SIZE,
    zoom,
    gridColor: gridContrastColor
  });

  useDraggable({
    movableElementRef: containerRef,
    dragHandleRef: ringHandleRef,
    updateCanvas: (coords: { x: number; y: number }) => {
      setMousePos({ x: coords.x, y: coords.y });
      // Reset inactivity timer on drag
      resetActivity();
    },
    initialPosition,
    onDragEnd: setLensePosition,
    borderWidth: 0
  });

  const { contrastColor, updateSelectedColor } = useColorDetection(
    setColorPalette,
    setMaterialPalette,
    setHoveredColor
  );

  useEffect(() => {
    if (canvasesReady && currentImage && mainCanvasRef.current) {
      const updatedColor = updateCanvas();

      const detectedColor = detectPixelColor(mainCanvasRef);
      if (updatedColor) {
        updateSelectedColor(updatedColor);
      } else if (detectedColor) {
        updateSelectedColor(detectedColor);
      }
    }
  }, [
    canvasesReady,
    currentImage,
    mousePos,
    updateCanvas,
    updateSelectedColor,
    zoom
  ]);

  // Control drawer callbacks - all reset inactivity timer
  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(!drawerOpen);
    resetActivity();
  }, [drawerOpen, setDrawerOpen, resetActivity]);

  const handleGridToggle = useCallback(() => {
    setGridOn(!gridOn);
    resetActivity();
  }, [gridOn, setGridOn, resetActivity]);

  const handleFisheyeToggle = useCallback(() => {
    setFisheyeOn(!fisheyeOn);
    resetActivity();
  }, [fisheyeOn, setFisheyeOn, resetActivity]);

  const handleManualRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCapture = now - lastCaptureTimeRef.current;

    if (active && !isCapturing && timeSinceLastCapture >= CAPTURE_COOLDOWN_MS) {
      log('Manual refresh triggered');
      lastCaptureTimeRef.current = now;
      captureFrame();
      resetActivity();
    }
  }, [active, isCapturing, captureFrame, resetActivity]);

  const handleZoomChange = useCallback(
    (newZoom: number) => {
      setZoom(newZoom);
      resetActivity();
    },
    [setZoom, resetActivity]
  );

  // Calculate optimal drawer position based on available viewport space
  const calculateDrawerPosition = useCallback((): DrawerPosition => {
    if (!containerRef.current) return 'bottom';

    const containerRect = containerRef.current.getBoundingClientRect();

    // Available space in each direction from the canvas edge
    const spaceBottom = window.innerHeight - containerRect.bottom;
    const spaceRight = window.innerWidth - containerRect.right;
    const spaceLeft = containerRect.left;
    const spaceTop = containerRect.top;

    // For right/left positions, the drawer is vertically centered on the lens.
    // We need to check if there's enough vertical space for the centered drawer.
    // The lens center is at containerRect.top + CANVAS_SIZE/2
    const lensCenterY = containerRect.top + CANVAS_SIZE / 2;
    const spaceAboveCenter = lensCenterY; // space from viewport top to lens center
    const spaceBelowCenter = window.innerHeight - lensCenterY; // space from lens center to viewport bottom

    // For side positions (right/left), we need both:
    // - Enough horizontal space for the drawer width
    // - Enough vertical space above AND below the lens center for half the drawer height
    const canFitVerticallyWhenCentered =
      spaceAboveCenter >= DRAWER_HALF_HEIGHT + DRAWER_MARGIN &&
      spaceBelowCenter >= DRAWER_HALF_HEIGHT + DRAWER_MARGIN;

    // Check in priority order: bottom → right → left → top
    if (spaceBottom >= DRAWER_HEIGHT + DRAWER_MARGIN) {
      return 'bottom';
    }
    if (
      spaceRight >= DRAWER_WIDTH + DRAWER_MARGIN &&
      canFitVerticallyWhenCentered
    ) {
      return 'right';
    }
    if (
      spaceLeft >= DRAWER_WIDTH + DRAWER_MARGIN &&
      canFitVerticallyWhenCentered
    ) {
      return 'left';
    }
    if (spaceTop >= DRAWER_HEIGHT + DRAWER_MARGIN) {
      return 'top';
    }

    // Fallback to bottom if no space is sufficient
    return 'bottom';
  }, []);

  // Recalculate drawer position when lens moves (mousePos changes during drag)
  // useMemo ensures we recalculate whenever mousePos changes
  const drawerPosition = React.useMemo(() => {
    return calculateDrawerPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateDrawerPosition, mousePos]);

  useEffect(() => {
    drawGrid();
    drawCrosshairs({ color: gridContrastColor });
  }, [gridOn, scale, zoom, drawGrid, drawCrosshairs, gridContrastColor]);

  // Helper to apply animation or instant visibility based on settings
  const getStyle = useCallback(
    (animation: typeof activePreset.handle, visible: boolean) => {
      return settings.animationsEnabled
        ? getAnimationStyle(animation, visible)
        : noAnimationStyle(animation, visible);
    },
    [settings.animationsEnabled]
  );

  // Don't render if extension is not active
  if (!active) return;

  // During initial capture (no image yet), don't render
  // During recaptures (we have an image), keep rendering with the previous image
  if (isCapturing && !currentImage) return;

  return (
    <LenseContainer ref={containerRef} initialPosition={initialPosition}>
      {/* DOM order matches visual stacking: Handle (bottom) → MainCanvas → GlassOverlay → GridCanvas (top) */}
      <Handle
        ref={ringHandleRef}
        id="lensor-ring-handle"
        className="circle-ring"
        canvasSize={CANVAS_SIZE}
        borderSize={60}
        visible={canvasesVisible}
        contrastColor={hexToRgba(
          convertToGrayscalePreservingFormat(
            materialPalette?.[800] || '#000000'
          ),
          1
        )}
        contrastColor2={colorPalette[1]}
        hoveredColor={hoveredColor}
        textureHighlight={getSubtleTextureColor(hoveredColor, 5, 25).highlight}
        textureHighlightBright={
          getSubtleTextureColor(hoveredColor, 5, 25).highlightBright
        }
        textureHighlightBrightest={
          getSubtleTextureColor(hoveredColor, 5, 25).highlightBrightest
        }
        textureShadow={getSubtleTextureColor(hoveredColor, 5, 25).shadow}
        patternName="knurling"
        patternOpacity={settings.handleTextureEnabled ? 0.25 : 0}
        style={{
          ...getStyle(activePreset.handle, canvasesVisible),
          opacity: canvasesVisible ? settings.handleOpacity / 100 : 0
        }}
      />
      <MainCanvas
        ref={mainCanvasRef}
        id="lensor-main-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        borderColor={hoveredColor}
        visible={canvasesVisible}
        shadowColor={hexToRgba(materialPalette?.[400] || '#000000', 0.2)}
        style={getStyle(activePreset.lenses, canvasesVisible)}
      />
      <GlassOverlay
        visible={canvasesVisible}
        style={getStyle(activePreset.lenses, canvasesVisible)}
      />
      <GridCanvas
        id="lensor-grid-canvas"
        ref={gridCanvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        visible={canvasesVisible}
        shadowColor={hexToRgba(materialPalette?.[400] || '#000000', 0.2)}
        style={getStyle(activePreset.lenses, canvasesVisible)}
      />
      <HiddenCanvas
        ref={fisheyeCanvasRef}
        id="lensor-fisheye-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
      />
      <HiddenCanvas
        ref={interCanvasRef}
        id="lensor-inter-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
      />
      <ControlDrawer
        canvasSize={CANVAS_SIZE}
        accentColor={materialPalette?.[500] || hoveredColor}
        position={drawerPosition}
        visible={canvasesVisible}
        isOpen={drawerOpen}
        gridOn={gridOn}
        fisheyeOn={fisheyeOn}
        zoom={zoom}
        hoveredColor={hoveredColor}
        onToggle={handleDrawerToggle}
        onGridToggle={handleGridToggle}
        onFisheyeToggle={handleFisheyeToggle}
        onManualRefresh={handleManualRefresh}
        onZoomChange={handleZoomChange}
        style={getStyle(activePreset.drawer, canvasesVisible)}
      />
      {debugMode && (
        <DebugOverlay
          imageBitmap={currentImage}
          mousePos={mousePos}
          hoverColor={hoveredColor}
          contrastColor={contrastColor}
          colorPalette={colorPalette}
          materialPalette={materialPalette}
          calculateCropCoordinates={calculateCropCoordinates}
          containerRef={containerRef}
        />
      )}
    </LenseContainer>
  );
};

export default Lense;
