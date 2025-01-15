import React, { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import FisheyeGl, { Fisheye } from "../../lib/fisheyegl";
import { FaGripVertical } from 'react-icons/fa6';
import { useDraggable } from './useDraggable';
import { observeDOMChanges } from "../../scripts/observable";
import { useLensorState } from '../hook/useLensorState';
import { PorterContext } from 'porter-source';

const CANVAS_SIZE = 400;

const MainCanvas = styled.canvas<{ borderColor: string }>`
  position: fixed;
  z-index: 9999998;
  right: 10px;
  top: 10px;
  border-radius: 50%;
  border: 8px solid ${props => props.borderColor};
  overflow: hidden;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
  image-rendering: pixelated;
`;

const GridCanvas = styled.canvas`
  position: fixed;
  z-index: 9999999;
  right: 18px;
  top: 18px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: rgb(0, 0, 0) 0px 0px 16px inset;
`;

const HiddenCanvas = styled.canvas`
  display: none;
`;

const RingHandle = styled.div<{ backgroundColor: string }>`
  z-index: 9999997;
  position: fixed;
  right: -13px;
  top: -10px;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  cursor: grab;
  overflow: hidden;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background-color: transparent;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${props => props.backgroundColor};
    opacity: 0.56;
    border-radius: 50%;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(7.7px);
    -webkit-backdrop-filter: blur(7.7px);
    border: 1px solid rgba(16, 1, 1, 0.8);
    pointer-events: auto;
  }
`;

const ButtonSegment = styled.div`
position: absolute;
  width: 100%;
  height: 100%;
  background-color: transparent;
  border: none;
  overflow: visible;
  cursor: pointer;
  pointer-events: none;
  z-index: 9999999;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const GearButton = styled.button`
  width: 30px;
  height: 80px;
  border-radius: 10%;
  background-color: transparent;
  padding-left: 10px;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease;
  clip-path: polygon(
    0 5px,
    100% 0,
    100% 80px,
    0 75px
  );

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }

  svg {
    width: 24px;
    height: 24px;
  }
    pointer-events: auto;
`;

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
    const distorterRef = useRef<Fisheye | null>(null);

    const [canvasesVisible, setCanvasesVisible] = useState(false);
    const [gridDrawn, setGridDrawn] = useState(false);
    const [zoom, setZoom] = useState(2);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [initialized, setInitialized] = useState(false);
    const [canvasesReady, setCanvasesReady] = useState(false);
    const [initialDrawComplete, setInitialDrawComplete] = useState(false);

    const [contrastColor, setContrastColor] = useState<string>('#fff');

    // const { post, setMessage, isConnected, error } = usePorter();
    const { useStateItem, getState } = useLensorState(PorterContext.React);
    const [isSidepanelShown, setIsSidepanelShown] = useStateItem('isSidepanelShown');
    const [hoveredColor, setHoveredColor] = useStateItem('hoveredColor');
    const [gridOn, setGridOn] = useStateItem('showGrid');
    const [fisheyeOn, setFisheyeOn] = useStateItem('showFisheye');

    const [active, setActive] = useStateItem('active');

    useEffect(() => {
        console.log('Lense mounted');
        if (!initialized) {
            setInitialized(true);
        }
    }, []);

    useEffect(() => {
        console.log('gridOn: ', gridOn);
        drawGrid();
    }, [gridOn]);

    useEffect(() => {
        console.log('fisheyeOn: ', fisheyeOn)
    }, [fisheyeOn]);

    const updateCanvas = useCallback(() => {
        if (!mainCanvasRef.current || !interCanvasRef.current || !imageBitmap) {
            console.log('updateCanvas skipping because not initialized');
            return Date.now();
        }
        console.log("updateCanvas, Mouse position: ", mousePos);

        const ctx = mainCanvasRef.current.getContext('2d');
        const interCtx = interCanvasRef.current.getContext('2d');

        if (!ctx || !interCtx) return Date.now();
        console.log("updateCanvas, drawing. scale: ", scale);

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        interCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const canvasXAdjust = CANVAS_SIZE / (zoom * 2);
        const canvasYAdjust = CANVAS_SIZE / (zoom * 2);

        const cropX = (mousePos.x * scale) - canvasXAdjust;
        const cropY = (mousePos.y * scale) - canvasYAdjust;

        if (fisheyeOn) {
            interCtx.drawImage(imageBitmap, cropX, cropY, CANVAS_SIZE / zoom, CANVAS_SIZE / zoom, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            const fisheyeImageDataUrl = interCanvasRef.current.toDataURL();

            if (!distorterRef.current) {
                distorterRef.current = FisheyeGl({
                    canvas: fisheyeCanvasRef.current,
                    lens: {
                        a: 1,
                        b: 1,
                        Fx: -0.15,
                        Fy: -0.15,
                        scale: 1.05
                    },
                    fov: {
                        x: 1,
                        y: 1
                    },
                });
            }

            distorterRef.current.setImage(fisheyeImageDataUrl);
            ctx.drawImage(distorterRef.current.getCanvas(), 0, 0);
        } else {
            ctx.drawImage(imageBitmap, cropX, cropY, CANVAS_SIZE / zoom, CANVAS_SIZE / zoom, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }

        updateSelectedPixel();
        return Date.now();
    }, [zoom, fisheyeOn, scale, mousePos, imageBitmap]);


    useEffect(() => {
        if (active && imageBitmap) {
            console.log('useEffect(active && imageBitmap), Initialize lense graphics');
            console.log('active && imageBitmap, getCanvasCenter() called: ', getCanvasCenter());

            setScale(imageBitmap.width / window.innerWidth);
            drawGrid();
            initializeCanvases();
            showCanvases(true);
            setCanvasesReady(true);
            //setMousePos({ x: 800, y: 350 });
            // simulateDrag(800, 350);
            console.log('active && imageBitmap, setMousePosition set');
            // updateCanvas();
        } else {
            console.log('useEffect(active && imageBitmap), either was false');
        }
    }, [active, imageBitmap]);


    // Update getCanvasCenter to calculate the actual center
    const getCanvasCenter = useCallback((): { x: number, y: number } => {
        const canvas = mainCanvasRef.current;
        if (!canvas) {
            console.error('getCanvasCenter, canvas not initialized');
            return { x: 0, y: 0 }
        }

        const rect = canvas.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        console.log('getCanvasCenter, returning: ', { x: centerX, y: centerY });
        return { x: centerX, y: centerY };
    }, []);


    useEffect(() => {
        if (canvasesReady && imageBitmap && mainCanvasRef.current && !initialDrawComplete) {
            console.log('Performing initial draw');
            const canvasCenter = getCanvasCenter();
            setMousePos(canvasCenter);
            updateCanvas();
            setInitialDrawComplete(true);

        }
    }, [canvasesReady, imageBitmap, getCanvasCenter, updateCanvas, initialDrawComplete]);


    const showCanvases = useCallback((visible: boolean) => {
        setCanvasesVisible(visible);
        if (visible) {
            updateCanvas();
        }
    }, [updateCanvas]);

    const drawGrid = useCallback(() => {
        if (!gridCanvasRef.current) return;
        console.log('drawGrid');

        const ctx = gridCanvasRef.current.getContext('2d');
        if (!ctx) return;

        const spacing = scale * zoom;

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        if (!gridOn) return;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        ctx.beginPath();

        for (let x = 0; x <= CANVAS_SIZE; x += spacing) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_SIZE);
        }

        for (let y = 0; y <= CANVAS_SIZE; y += spacing) {
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_SIZE, y);
        }

        ctx.stroke();
        setGridDrawn(true);
    }, [gridOn, scale, zoom]);

    const initializeCanvases = () => {
        console.log('initializeCanvases');
        drawCrosshairs();
        observeDOMChanges((changeScore: number) => {
            console.log("DOM changed! Score was: ", changeScore);
        });
        setInitialized(true);
    };

    const getContrastColor = useCallback((color: string): string => {
        const rgbMatch = color.match(/\d+/g);
        if (!rgbMatch || rgbMatch.length !== 3) {
            console.error('Invalid RGB color string:', color);
            return '#ffffff'; // Default to white if parsing fails
        }

        const [r, g, b] = rgbMatch.map(Number);

        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Choose white or black based on luminance
        const contrastColor = luminance > 0.5 ? '#000000' : '#ffffff';
        return contrastColor;

    }, []);

    const updateSelectedPixelColor = useCallback((newColor: string) => {
        // setSelectedPixelColor(newColor);
        setHoveredColor(newColor);
        setContrastColor(getContrastColor(newColor));
    }, [getContrastColor]);


    const updateSelectedPixel = useCallback(() => {
        if (!mainCanvasRef.current) return;

        const ctx = mainCanvasRef.current.getContext('2d');
        if (!ctx) return;

        const pixel = ctx.getImageData(CANVAS_SIZE / 2, CANVAS_SIZE / 2, 1, 1);
        const rgb = `rgb(${pixel.data[0]}, ${pixel.data[1]}, ${pixel.data[2]})`;
        updateSelectedPixelColor(rgb);
    }, [updateSelectedPixelColor]);


    const drawCrosshairs = () => {
        console.log('drawCrosshairs');
        if (!gridCanvasRef.current) return;

        console.log('(drawing crosshairs)');
        const ctx = gridCanvasRef.current.getContext('2d');
        if (!ctx) return;

        const crosshairColor = 'black';
        const crosshairWidth = 2;
        const crosshairLength = 20;

        const centerX = CANVAS_SIZE / 2;
        const centerY = CANVAS_SIZE / 2;

        ctx.save();
        ctx.strokeStyle = crosshairColor;
        ctx.lineWidth = crosshairWidth;

        ctx.beginPath();
        ctx.moveTo(centerX - crosshairLength / 2, centerY);
        ctx.lineTo(centerX + crosshairLength / 2, centerY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, centerY - crosshairLength / 2);
        ctx.lineTo(centerX, centerY + crosshairLength / 2);
        ctx.stroke();

        ctx.restore();
        console.log('drawCrosshairs done');
    };

    const handleGearClick = useCallback(() => {
        console.log('handleGearClick. Setting isSidepanelShown to: ', !isSidepanelShown);
        setIsSidepanelShown(!isSidepanelShown);
        // post({ action: 'settings_clicked', payload: {} });
    }, [isSidepanelShown, setIsSidepanelShown])

    useDraggable({
        handleRef: ringHandleRef,
        dragItemsRefs: [mainCanvasRef, gridCanvasRef, infoScrollRef],
        offset: 8,
        updateCanvas: (coords: { x: number, y: number }) => {
            setMousePos({ x: coords.x, y: coords.y });
        },
        drawCanvas: updateCanvas,
    });

    useEffect(() => {
        console.log('useEffect, drawGrid');
        drawGrid();
    }, [gridOn, scale, zoom]);

    useEffect(() => {
        if (initialDrawComplete) {
            console.log('useEffect, updateCanvas');
            updateCanvas();
        }
    }, [mousePos, zoom, fisheyeOn, initialDrawComplete]);

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
            <HiddenCanvas ref={fisheyeCanvasRef} id="lensor-fisheye-canvas" width={CANVAS_SIZE} height={CANVAS_SIZE} />
            <HiddenCanvas ref={interCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
            <RingHandle
                ref={ringHandleRef}
                id="lensor-ring"
                className="circle-ring"
                backgroundColor={hoveredColor}
                style={{ display: canvasesVisible ? 'block' : 'none' }}
            >
                <ButtonSegment id="lensor-btn-segment">
                    {/* <ButtonSegmentImg
                        id="lensor-btn-segment-img"
                        onClick={() => setInfoScrollOpen(!infoScrollOpen)}
                    /> */}
                    <GearButton onClick={handleGearClick} >
                        <FaGripVertical color={contrastColor} />
                    </GearButton>
                </ButtonSegment>
            </RingHandle>
            {/* <InfoScroll ref={infoScrollRef} isOpen={infoScrollOpen}>
                <label>
                    <input type="checkbox" checked={gridOn} onChange={() => setGridOn(!gridOn)} />
                    Toggle Grid
                </label>
                <label>
                    <input type="checkbox" checked={fisheyeOn} onChange={() => setFisheyeOn(!fisheyeOn)} />
                    Toggle Fisheye
                </label>
            </InfoScroll> */}
        </>
    );
};

export default Lense;