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
  MainCanvas,
  PixelScalingIndicator,
  RingHandle
} from './Lense.styles';
import { useLenseCanvasUpdate } from '@/ui/hooks/useLenseCanvasUpdate';
import { useGrid } from '@/ui/hooks/useGrid';
import { DebugOverlay } from './DebugOverlay';
import { useDebugInfo, useDebugMode } from '@/ui/utils/debug-utils';

const CANVAS_SIZE = 400;

interface LenseProps {
  imageBitmap: ImageBitmap | null;
  onStop: () => void;
  onClose: () => void;
  onRequestNewCapture: () => void;
}

const Lense: React.FC<LenseProps> = ({
  imageBitmap,
  onStop,
  onClose,
  onRequestNewCapture
}) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fisheyeCanvasRef = useRef<HTMLCanvasElement>(null);
  const interCanvasRef = useRef<HTMLCanvasElement>(null);
  const ringHandleRef = useRef<HTMLDivElement>(null);
  const infoScrollRef = useRef<HTMLDivElement>(null);

  const [currentImage, setCurrentImage] = React.useState<ImageBitmap | null>(
    imageBitmap
  );
  const [canvasesVisible, setCanvasesVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [canvasesReady, setCanvasesReady] = useState(false);
  const [initialDrawComplete, setInitialDrawComplete] = useState(false);
  const [captureKey, setCaptureKey] = useState(0);

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

  const { updateCanvas, effectiveZoom } = useLenseCanvasUpdate({
    imageBitmap: currentImage,
    mainCanvasRef,
    interCanvasRef,
    fisheyeCanvasRef,
    zoom,
    pixelScalingEnabled,
    fisheyeOn,
    setDebugInfo
  });

  const { drawGrid, drawCrosshairs } = useGrid({
    canvasRef: gridCanvasRef,
    isGridVisible: gridOn,
    gridSpacing: scale * effectiveZoom,
    canvasSize: CANVAS_SIZE,
    zoom,
    pixelScalingEnabled
  });

  const { hoveredColor, contrastColor, updateSelectedColor } =
    useColorDetection();

  // Listen for image updates from outside React
  React.useEffect(() => {
    const handleImageUpdate = (event: CustomEvent) => {
      console.log('Received new image in Lense component');
      setCurrentImage(event.detail.imageBitmap);
    };

    // Add event listener to the shadow root
    const shadowRoot = document.querySelector('div')?.shadowRoot;
    console.log('Lense, shadowRoot: ', shadowRoot);
    shadowRoot?.addEventListener(
      'lensor:image-update',
      handleImageUpdate as EventListener
    );

    return () => {
      shadowRoot?.removeEventListener(
        'lensor:image-update',
        handleImageUpdate as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (active && currentImage && !initialDrawComplete) {
      console.log('Initialize lense graphics');
      const canvasCenter = getCanvasCenter();
      setScale(currentImage.width / window.innerWidth);
      setDebugInfo({
        ...debugInfo,
        mousePosition: { x: canvasCenter.x, y: canvasCenter.y },
        scaleWidth: currentImage.width / window.innerWidth,
        scaleHeight: currentImage.height / window.innerHeight
      });
      console.log('Initialize lense graphics');
      drawGrid();
      drawCrosshairs();
      showCanvases(true);
      setCanvasesReady(true);
      setMousePos(canvasCenter);
      setInitialDrawComplete(true);
    }
  }, [active, currentImage, debugInfo, initialDrawComplete, captureKey]);

  const getCanvasCenter = useCallback((): { x: number; y: number } => {
    const canvas = mainCanvasRef.current;
    if (!canvas) {
      console.error('getCanvasCenter, canvas not initialized');
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setDebugInfo({
      ...debugInfo,
      lensCenter: { x: centerX, y: centerY }
    });
    console.log('getCanvasCenter, returning: ', { x: centerX, y: centerY });
    return { x: centerX, y: centerY };
  }, [debugInfo]);

  useEffect(() => {
    if (canvasesReady && currentImage && mainCanvasRef.current) {
      const updatedColor = updateCanvas(mousePos);
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

  useEffect(() => {
    if (effectiveZoom !== debugInfo.effectiveZoom) {
      console.log('useEffect, effectiveZoom', effectiveZoom);
      setDebugInfo((prevState) => ({
        ...prevState,
        effectiveZoom
      }));
    }
  }, [effectiveZoom, debugInfo, setDebugInfo]);

  const showCanvases = useCallback(
    (visible: boolean) => {
      setCanvasesVisible(visible);
      if (visible) {
        updateCanvas(mousePos);
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
    // post({ action: 'settings_clicked', payload: {} });
  }, [isSidepanelShown, setIsSidepanelShown]);

  const { simulateDrag } = useDraggable({
    handleRef: ringHandleRef,
    dragItemsRefs: [mainCanvasRef, gridCanvasRef, infoScrollRef],
    offset: 8,
    updateCanvas: (coords: { x: number; y: number }) => {
      setMousePos({ x: coords.x, y: coords.y });
      setDebugInfo({
        ...debugInfo,
        mousePosition: { x: coords.x, y: coords.y }
      });
    },
    drawCanvas: () => updateCanvas(mousePos),
    borderWidth: 0
  });

  useEffect(() => {
    console.log('useEffect, drawGrid');
    drawGrid();
  }, [gridOn, scale, effectiveZoom]);

  if (!active) return;

  return (
    <>
      <MainCanvas
        ref={mainCanvasRef}
        id="lensor-main-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        borderColor={hoveredColor}
        style={{ display: canvasesVisible ? 'block' : 'none' }}
      />
      <GridCanvas
        ref={gridCanvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ display: canvasesVisible ? 'block' : 'none' }}
      />
      <HiddenCanvas
        ref={fisheyeCanvasRef}
        id="lensor-fisheye-canvas"
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
      />
      <HiddenCanvas
        ref={interCanvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
      />
      <RingHandle
        ref={ringHandleRef}
        id="lensor-ring"
        className="circle-ring"
        backgroundColor={hoveredColor}
        style={{ display: canvasesVisible ? 'block' : 'none' }}
      >
        <ButtonSegment id="lensor-btn-segment">
          <GearButton onClick={handleGearClick}>
            <FaGripVertical color={contrastColor} />
          </GearButton>
        </ButtonSegment>
      </RingHandle>
      {debugMode && (
        <DebugOverlay imageBitmap={currentImage} debugInfo={debugInfo} />
      )}
      {pixelScalingEnabled && (
        <PixelScalingIndicator>
          True Pixel Mode ({window.devicePixelRatio.toFixed(1)}x)
        </PixelScalingIndicator>
      )}
    </>
  );
};

export default Lense;
