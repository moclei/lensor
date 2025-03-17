import * as React from 'react';

export const useDebugMode = () => {
  const [debugMode, setDebugMode] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd') {
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { debugMode, setDebugMode };
};

export interface DebugInfoProps {
  lensCenter: { x: number; y: number };
  mousePosition: { x: number; y: number };
  cropCoordinates: { x: number; y: number; width: number; height: number };
  captureSize: number;
  scaleWidth: number;
  scaleHeight: number;
  effectiveZoom: number;
  imageBitmapInfo: {
    width: number;
    height: number;
  };
  windowRatio: string;
  bitmapRatio: string;
}

export const useDebugInfo = () => {
  const [debugInfo, setDebugInfo] = React.useState<DebugInfoProps>({
    lensCenter: { x: 0, y: 0 },
    cropCoordinates: { x: 0, y: 0, width: 0, height: 0 },
    captureSize: 0,
    scaleWidth: 0,
    scaleHeight: 0,
    effectiveZoom: 0,
    imageBitmapInfo: { width: 0, height: 0 },
    mousePosition: { x: 0, y: 0 },
    windowRatio: '',
    bitmapRatio: ''
  });

  return { debugInfo, setDebugInfo };
};
