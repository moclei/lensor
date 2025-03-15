import { styled } from 'styled-components';

const DebugOverlay = styled.div`
  position: fixed;
  z-index: 9999997;
  background-color: rgba(255, 0, 0, 0.3);
  border: 1px solid red;
  pointer-events: none;
`;

const DebugInfo = styled.div`
  position: fixed;
  z-index: 9999999;
  right: 10px;
  bottom: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 300px;
  max-height: 200px;
  overflow: auto;
`;

const MainCanvas = styled.canvas<{ borderColor: string }>`
  position: fixed;
  z-index: 9999998;
  right: 10px;
  top: 10px;
  border-radius: 50%;
  border: 8px solid ${(props) => props.borderColor};
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
    background-color: ${(props) => props.backgroundColor};
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
  clip-path: polygon(0 5px, 100% 0, 100% 80px, 0 75px);

  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }

  svg {
    width: 24px;
    height: 24px;
  }
  pointer-events: auto;
`;

const PixelScalingIndicator = styled.div`
  position: fixed;
  z-index: 9999999;
  right: 10px;
  top: 420px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
`;

export {
  DebugOverlay,
  DebugInfo,
  MainCanvas,
  GridCanvas,
  HiddenCanvas,
  RingHandle,
  ButtonSegment,
  GearButton,
  PixelScalingIndicator
};
