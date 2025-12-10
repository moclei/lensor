import React, { useRef, useEffect, useState, useCallback } from 'react';
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

const CANVAS_SIZE = 400;
const DRAWER_HEIGHT = 326; // Pull tab (26px) + Panel (300px)
const DRAWER_WIDTH = 260;
const DRAWER_MARGIN = 10; // Small buffer from viewport edges
const DRAWER_HALF_HEIGHT = DRAWER_HEIGHT / 2; // For vertical centering check on side positions

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

  // Drawer state - uses module-level variable to persist through capture cycles
  const [drawerOpen, setDrawerOpenState] = useState(persistedDrawerOpen);
  const setDrawerOpen = useCallback((value: boolean) => {
    persistedDrawerOpen = value;
    setDrawerOpenState(value);
  }, []);

  const { useStateItem } = useLensorState();
  const [lensePosition, setLensePosition] = useStateItem('lensePosition');

  const [colorPalette, setColorPalette] = useStateItem('colorPalette');
  const [materialPalette, setMaterialPalette] = useStateItem('materialPalette');
  const [hoveredColor, setHoveredColor] = useStateItem('hoveredColor');

  const [gridOn, setGridOn] = useStateItem('showGrid');
  const [fisheyeOn, setFisheyeOn] = useStateItem('showFisheye');
  const [zoom, setZoom] = useStateItem('zoom');
  const [active] = useStateItem('active');

  console.log('[Lense] active state:', active);

  const { debugMode } = useDebugMode();
  const { debugInfo, setDebugInfo } = useDebugInfo();

  const {
    imageBitmap: currentImage,
    isCapturing,
    captureFrame,
    error
  } = useMediaCapture();

  console.log('[Lense] Media capture state:', {
    hasImage: !!currentImage,
    isCapturing,
    hasError: !!error
  });

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
    onInitialize: () => {
      console.log('[Lense] Canvas initialization callback executed');
      if (gridOn) drawGrid();
      drawCrosshairs();
    },
    onDrawComplete: (canvasCenter) => {
      console.log(
        '[Lense] Canvas draw complete callback, center:',
        canvasCenter
      );
    }
  });

  console.log('[Lense] Canvas lifecycle state:', {
    canvasesVisible,
    initialized,
    canvasesReady,
    initialDrawComplete
  });

  const { lastChangeTimestamp, lastScrollPosition } = usePageObservers(
    () => {
      if (active && !isCapturing) {
        console.log(
          '[Lense] Page observer detected change, calling captureFrame'
        );
        captureFrame();
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
    },
    initialPosition: lensePosition,
    onDragEnd: setLensePosition,
    borderWidth: 0
  });

  const { contrastColor, updateSelectedColor } = useColorDetection(
    setColorPalette,
    setMaterialPalette,
    setHoveredColor
  );

  useEffect(() => {
    console.log('[Lense] Canvas update effect triggered:', {
      canvasesReady,
      hasCurrentImage: !!currentImage,
      hasMainCanvas: !!mainCanvasRef.current
    });

    if (canvasesReady && currentImage && mainCanvasRef.current) {
      console.log('[Lense] Updating canvas and detecting color');
      const updatedColor = updateCanvas();
      console.log('[Lense] updateCanvas result:', updatedColor);

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

  // Control drawer callbacks
  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(!drawerOpen);
  }, [drawerOpen, setDrawerOpen]);

  const handleGridToggle = useCallback(() => {
    setGridOn(!gridOn);
  }, [gridOn, setGridOn]);

  const handleFisheyeToggle = useCallback(() => {
    setFisheyeOn(!fisheyeOn);
  }, [fisheyeOn, setFisheyeOn]);

  const handleZoomChange = useCallback(
    (newZoom: number) => {
      setZoom(newZoom);
    },
    [setZoom]
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
    console.log('[Lense] Grid effect triggered');
    drawGrid();
    drawCrosshairs({ color: gridContrastColor });
  }, [gridOn, scale, zoom, drawGrid, drawCrosshairs, gridContrastColor]);

  if (!active) return;
  if (isCapturing) return;

  return (
    <LenseContainer ref={containerRef} initialPosition={lensePosition}>
      <MainCanvas
        ref={mainCanvasRef}
        id="lensor-main-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        borderColor={hoveredColor}
        visible={canvasesVisible}
        shadowColor={hexToRgba(materialPalette?.[400] || '#000000', 0.2)}
      />
      <GridCanvas
        id="lensor-grid-canvas"
        ref={gridCanvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        visible={canvasesVisible}
        shadowColor={hexToRgba(materialPalette?.[400] || '#000000', 0.2)}
      />
      <GlassOverlay visible={canvasesVisible} />
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
      <Handle
        ref={ringHandleRef}
        id="lensor-ring-handle"
        className="circle-ring"
        canvasSize={CANVAS_SIZE}
        borderSize={60}
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
        patternOpacity={0.25}
        style={{ display: canvasesVisible ? 'block' : 'none' }}
      />
      {canvasesVisible && (
        <ControlDrawer
          canvasSize={CANVAS_SIZE}
          accentColor={materialPalette?.[500] || hoveredColor}
          position={drawerPosition}
          isOpen={drawerOpen}
          gridOn={gridOn}
          fisheyeOn={fisheyeOn}
          zoom={zoom}
          hoveredColor={hoveredColor}
          colorPalette={colorPalette}
          materialPalette={materialPalette}
          onToggle={handleDrawerToggle}
          onGridToggle={handleGridToggle}
          onFisheyeToggle={handleFisheyeToggle}
          onZoomChange={handleZoomChange}
        />
      )}
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
