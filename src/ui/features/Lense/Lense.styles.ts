import { styled } from 'styled-components';

const LenseContainer = styled.div<{
  initialPosition: { x: number; y: number };
}>`
  position: fixed;
  z-index: 9999990;
  left: ${(props) => props.initialPosition.x}px;
  top: ${(props) => props.initialPosition.y}px;
  width: 400px;
  height: 400px;
  pointer-events: none;
`;

const MainCanvas = styled.canvas<{
  borderColor: string;
  shadowColor: string;
  visible: boolean;
}>`
  position: absolute;
  z-index: 6;
  border-radius: 50%;
  width: 400px;
  height: 400px;
  overflow: hidden;
  opacity: 1;
  box-shadow: inset 0 0 4px 6px ${(props) => props.shadowColor};
  image-rendering: pixelated;
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;

const GridCanvas = styled.canvas<{
  shadowColor: string;
  visible: boolean;
}>`
  position: absolute;
  z-index: 10;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: ${(props) => props.shadowColor} 0px 0px 4px 6px inset;
  display: ${(props) => (props.visible ? 'block' : 'none')};
`;

const HiddenCanvas = styled.canvas`
  display: none;
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
  z-index: 15;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const GearButton = styled.button`
  width: 50px;
  height: 80px;
  border-radius: 10%;
  background-color: transparent;
  padding-left: 23px;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease;
  clip-path: polygon(0 5px, 100% 0, 100% 80px, 0 75px);
  svg {
    width: 24px;
    height: 24px;
  }
  pointer-events: auto;
`;

const StyledDebugOverlay = styled.div<{
  lenseCenter: { x: number; y: number };
}>`
  position: fixed;
  z-index: 9999997;
  background-color: rgba(255, 0, 0, 0.3);
  border: 1px solid red;
  pointer-events: none;
  left: ${(props) => props.lenseCenter.x - 10}px;
  top: ${(props) => props.lenseCenter.y - 10}px;
  width: 20px;
  height: 20px;
`;

const StyledDebugInfo = styled.div`
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

export {
  StyledDebugOverlay,
  StyledDebugInfo,
  MainCanvas,
  GridCanvas,
  HiddenCanvas,
  ButtonSegment,
  GearButton,
  LenseContainer
};
