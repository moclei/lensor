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

  const [canvasesVisible, setCanvasesVisible] = useState(false);
  // const [containerPosition, setContainerPosition] = useState({ x: 10, y: 10 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [canvasesReady, setCanvasesReady] = useState(false);
  const [initialDrawComplete, setInitialDrawComplete] = useState(false);

  const { useStateItem } = useLensorState();
  const [isSidepanelShown, setIsSidepanelShown] =
    useStateItem('isSidepanelShown');

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

  // Page observers hook
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

  const { lastPositionRef } = useDraggable({
    handleRef: containerRef,
    updateCanvas: (coords: { x: number; y: number }) => {
      setMousePos({ x: coords.x, y: coords.y });
    },
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
    if (active && currentImage && !initialDrawComplete) {
      console.log('Initialize lense graphics');
      setScale(currentImage.width / window.innerWidth);
      drawGrid();
      drawCrosshairs();
      showCanvases(true);
      setCanvasesReady(true);
      // setMousePos(canvasCenter);
      setInitialDrawComplete(true);
    }
  }, [active, currentImage, debugInfo, initialDrawComplete]);

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
    updateSelectedColor
  ]);

  const showCanvases = useCallback(
    (visible: boolean) => {
      setCanvasesVisible(visible);
      if (visible) {
        updateCanvas();
      }
    },
    [updateCanvas]
  );

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
    <LenseContainer
      ref={containerRef}
      initialPosition={lastPositionRef.current}
    >
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
