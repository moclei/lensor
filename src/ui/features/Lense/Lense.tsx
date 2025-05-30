import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FaGripVertical } from 'react-icons/fa6';
import { useLensorState } from '../../hooks/useLensorState';
import { useDraggable } from '@/ui/hooks/useDraggable';
import {
  useColorDetection,
  detectPixelColor
} from '../../hooks/useColorDetection';
import {
  ButtonSegment,
  GearButton,
  GridCanvas,
  HiddenCanvas,
  LenseContainer,
  MainCanvas,
  PixelScalingIndicator
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
  hexToRgba
} from '@/ui/utils/color-utils';
import Handle from './Handle';
const CANVAS_SIZE = 400;

interface LenseProps {
  mediaStreamId: string | null;
  onStop: () => void;
  onClose: () => void;
}

const Lense: React.FC<LenseProps> = ({ mediaStreamId, onStop, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fisheyeCanvasRef = useRef<HTMLCanvasElement>(null);
  const interCanvasRef = useRef<HTMLCanvasElement>(null);
  const ringHandleRef = useRef<HTMLDivElement>(null);
  const infoScrollRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { useStateItem } = useLensorState();
  const [isSidepanelShown, setIsSidepanelShown] =
    useStateItem('isSidepanelShown');
  const [lensePosition, setLensePosition] = useStateItem('lensePosition');

  const [gridOn] = useStateItem('showGrid');
  const [fisheyeOn] = useStateItem('showFisheye');
  const [zoom] = useStateItem('zoom');
  const [active] = useStateItem('active');
  const [pixelScalingEnabled] = useStateItem('pixelScalingEnabled');

  const { debugMode } = useDebugMode();
  const { debugInfo, setDebugInfo } = useDebugInfo();

  const {
    imageBitmap: currentImage,
    isCapturing,
    captureFrame,
    error
  } = useMediaCapture(mediaStreamId, active);

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
      console.log('Lense canvas initialization callback');
      if (gridOn) drawGrid();
      drawCrosshairs();
    },
    onDrawComplete: (canvasCenter) => {
      console.log('Lense canvas draw complete callback', canvasCenter);
      // Additional logic after initialization is complete
    }
  });

  const { lastChangeTimestamp, lastScrollPosition } = usePageObservers(
    () => {
      if (active && mediaStreamId && !isCapturing) {
        console.log(
          'usePageObservers, significant change, calling captureFrame'
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

  const { updateCanvas, effectiveZoom, calculateCropCoordinates } =
    useLenseCanvasUpdate({
      imageBitmap: currentImage,
      containerRef,
      mainCanvasRef,
      interCanvasRef,
      fisheyeCanvasRef,
      zoom,
      pixelScalingEnabled,
      fisheyeOn
    });

  const { drawGrid, drawCrosshairs } = useGrid({
    canvasRef: gridCanvasRef,
    isGridVisible: gridOn,
    gridSpacing: scale * effectiveZoom,
    canvasSize: CANVAS_SIZE,
    zoom,
    pixelScalingEnabled
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

  const {
    hoveredColor,
    contrastColor,
    updateSelectedColor,
    colorPalette,
    materialPalette
  } = useColorDetection();

  useEffect(() => {
    if (canvasesReady && currentImage && mainCanvasRef.current) {
      console.log('Updating canvas with detected color');
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
    updateSelectedColor
  ]);

  const handleGearClick = useCallback(() => {
    console.log(
      'handleGearClick. Setting isSidepanelShown to: ',
      !isSidepanelShown
    );
    setIsSidepanelShown(!isSidepanelShown);
  }, [isSidepanelShown, setIsSidepanelShown]);

  useEffect(() => {
    console.log('useEffect, drawGrid');
    drawGrid();
  }, [gridOn, scale, effectiveZoom]);

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
        patternName="diagonal"
        style={{ display: canvasesVisible ? 'block' : 'none' }}
      >
        <ButtonSegment id="lensor-btn-segment">
          <GearButton onClick={handleGearClick}>
            <FaGripVertical
              size={'lg'}
              color={materialPalette?.[50] || '#000000'}
            />
          </GearButton>
        </ButtonSegment>
      </Handle>
      {debugMode && (
        <DebugOverlay
          imageBitmap={currentImage}
          mousePos={mousePos}
          hoverColor={hoveredColor}
          contrastColor={contrastColor}
          colorPalette={colorPalette}
          materialPalette={materialPalette}
          effectiveZoom={effectiveZoom}
          calculateCropCoordinates={calculateCropCoordinates}
          containerRef={containerRef}
        />
      )}
      {pixelScalingEnabled && (
        <PixelScalingIndicator>
          True Pixel Mode ({window.devicePixelRatio.toFixed(1)}x)
        </PixelScalingIndicator>
      )}
    </LenseContainer>
  );
};

export default Lense;
