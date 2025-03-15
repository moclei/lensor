import * as React from 'react';

export interface DebugInfo {
  lensCenter: { x: number; y: number };
  captureSize: number;
  cropCoords: { x: number; y: number; width: number; height: number };
  scale: number;
}

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

export const useDebugInfo = () => {
  const [debugInfo, setDebugInfo] = React.useState<DebugInfo>({
    lensCenter: { x: 0, y: 0 },
    captureSize: 0,
    cropCoords: { x: 0, y: 0, width: 0, height: 0 },
    scale: 0
  });

  return { debugInfo, setDebugInfo };
};
