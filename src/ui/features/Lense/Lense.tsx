import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Fisheye } from '../../../lib/fisheyegl';
import { FaGripVertical } from 'react-icons/fa6';
import { observeDOMChanges } from '../../../scripts/observable';
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

const CANVAS_SIZE = 400;

interface LenseProps {
  imageBitmap: ImageBitmap | null;
  onStop: () => void;
  onClose: () => void;
}

const Lense: React.FC<LenseProps> = ({ imageBitmap, onStop }) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const fisheyeCanvasRef = useRef<HTMLCanvasElement>(null);
  const interCanvasRef = useRef<HTMLCanvasElement>(null);
  const ringHandleRef = useRef<HTMLDivElement>(null);
  const infoScrollRef = useRef<HTMLDivElement>(null);

  const [canvasesVisible, setCanvasesVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [initialized, setInitialized] = useState(false);
  const [canvasesReady, setCanvasesReady] = useState(false);
  const [initialDrawComplete, setInitialDrawComplete] = useState(false);
  // const [contrastColor, setContrastColor] = useState<string>('#fff');

  const { useStateItem } = useLensorState();
  const [isSidepanelShown, setIsSidepanelShown] =
    useStateItem('isSidepanelShown');
  // const [hoveredColor, setHoveredColor] = useStateItem('hoveredColor');
  const [gridOn, setGridOn] = useStateItem('showGrid');
  const [fisheyeOn, setFisheyeOn] = useStateItem('showFisheye');
  const [zoom, setZoom] = useStateItem('zoom');
  const [active, setActive] = useStateItem('active');
  const [pixelScalingEnabled, setPixelScalingEnabled] = useStateItem(
    'pixelScalingEnabled'
  );
  const { updateCanvas, effectiveZoom } = useLenseCanvasUpdate({
    imageBitmap,
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

  const { hoveredColor, contrastColor, updateSelectedColor } =
    useColorDetection();

  useEffect(() => {
    console.log('Lense mounted');
    if (!initialized) {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (active && imageBitmap) {
      console.log('Initialize lense graphics');
      const canvasCenter = getCanvasCenter();
      setScale(imageBitmap.width / window.innerWidth);
      console.log('Initialize lense graphics');
      drawGrid();
      drawCrosshairs();

      initializeCanvases();
      showCanvases(true);
      setCanvasesReady(true);
      setMousePos(canvasCenter);
    }
  }, [active, imageBitmap]);

  const getCanvasCenter = useCallback((): { x: number; y: number } => {
    const canvas = mainCanvasRef.current;
    if (!canvas) {
      console.error('getCanvasCenter, canvas not initialized');
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    console.log('getCanvasCenter, returning: ', { x: centerX, y: centerY });
    return { x: centerX, y: centerY };
  }, []);

  useEffect(() => {
    console.log('gridOn: ', gridOn);
    drawGrid();
    drawCrosshairs();
  }, [gridOn, effectiveZoom, drawGrid, drawCrosshairs]);

  useEffect(() => {
    if (
      canvasesReady &&
      imageBitmap &&
      mainCanvasRef.current &&
      !initialDrawComplete
    ) {
      console.log('Performing initial draw');
      const updatedColor = updateCanvas(mousePos);
      const detectedColor = detectPixelColor(mainCanvasRef);
      if (updatedColor) {
        updateSelectedColor(updatedColor);
      } else if (detectedColor) {
        updateSelectedColor(detectedColor);
      }
      setInitialDrawComplete(true);
    }
  }, [
    canvasesReady,
    imageBitmap,
    mousePos,
    updateCanvas,
    initialDrawComplete,
    updateSelectedColor
  ]);

  const showCanvases = useCallback(
    (visible: boolean) => {
      setCanvasesVisible(visible);
      if (visible) {
        updateCanvas(mousePos);
      }
    },
    [updateCanvas]
  );

  const initializeCanvases = () => {
    console.log('initializeCanvases');
    drawCrosshairs();
    observeDOMChanges((changeScore: number) => {
      console.log('DOM changed! Score was: ', changeScore);
    });
    setInitialized(true);
  };

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
    },
    drawCanvas: () => updateCanvas(mousePos)
  });

  useEffect(() => {
    console.log('useEffect, drawGrid');
    drawGrid();
  }, [gridOn, scale, effectiveZoom]);

  useEffect(() => {
    if (initialDrawComplete) {
      const updatedColor = updateCanvas(mousePos);
      const detectedColor = detectPixelColor(mainCanvasRef);
      if (updatedColor) {
        updateSelectedColor(updatedColor);
      } else if (detectedColor) {
        updateSelectedColor(detectedColor);
      }
    }
  }, [
    mousePos,
    effectiveZoom,
    fisheyeOn,
    initialDrawComplete,
    updateCanvas,
    updateSelectedColor,
    mainCanvasRef
  ]);

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
      // Then in your render function, add this before the closing tag:
      {pixelScalingEnabled && (
        <PixelScalingIndicator>
          True Pixel Mode ({window.devicePixelRatio.toFixed(1)}x)
        </PixelScalingIndicator>
      )}
    </>
  );
};

export default Lense;
