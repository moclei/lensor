import React, { useState } from 'react';
import styled from 'styled-components';
import { getTextColorForBackground } from '../../../ui/utils/color-utils';

const ColorBarContainer = styled.div<{
  backgroundColor: string;
  height: number;
  textColor: string;
}>`
  width: 100%;
  height: ${({ height }) => height}px;
  background-color: ${({ backgroundColor }) => backgroundColor};
  color: ${({ textColor }) => textColor};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ColorValue = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const ColorLabel = styled.div`
  font-size: 10px;
  opacity: 0.8;
  text-align: center;
  margin-top: 2px;
`;

const CopyFeedback = styled.div<{ show: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  opacity: ${({ show }) => (show ? 1 : 0)};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

interface ColorBarProps {
  color: string;
  label: string;
  type: 'harmony' | 'material';
}

const ColorBar: React.FC<ColorBarProps> = ({ color, label, type }) => {
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  const height = type === 'harmony' ? 60 : 40;
  const textColor = getTextColorForBackground(color);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(color);
      setShowCopyFeedback(true);
      setTimeout(() => setShowCopyFeedback(false), 1000);
    } catch (err) {
      console.error('Failed to copy color to clipboard:', err);
    }
  };

  return (
    <ColorBarContainer
      backgroundColor={color}
      height={height}
      textColor={textColor}
      onClick={handleClick}
      title={`Click to copy ${color}`}
    >
      <ColorValue>{color.toUpperCase()}</ColorValue>
      {type === 'material' && <ColorLabel>{label}</ColorLabel>}

      <CopyFeedback show={showCopyFeedback}>Copied!</CopyFeedback>
    </ColorBarContainer>
  );
};

export default ColorBar;
