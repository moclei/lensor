import React from 'react';
import styled from 'styled-components';

const ZoomControlContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
`;

const ZoomLabel = styled.div`
  font-size: 14px;
  color: #e0e0e0;
  min-width: 60px;
`;

const ZoomButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ZoomButton = styled.button<{ disabled?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${(props) => (props.disabled ? '#2c2c2c' : '#3a3a3a')};
  color: ${(props) => (props.disabled ? '#666' : '#e0e0e0')};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition:
    background-color 0.2s,
    transform 0.1s;

  &:hover:not(:disabled) {
    background-color: #4a4a4a;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
    background-color: #555;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(100, 100, 255, 0.3);
  }
`;

const ZoomDisplay = styled.div`
  background-color: #2a2a2a;
  color: #e0e0e0;
  padding: 8px 12px;
  border-radius: 4px;
  min-width: 60px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  border: 1px solid #444;
`;

const ZoomInput = styled.input`
  background-color: #2a2a2a;
  color: #e0e0e0;
  padding: 8px 12px;
  border-radius: 4px;
  width: 60px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  border: 1px solid #444;

  &:focus {
    outline: none;
    border-color: #666;
    box-shadow: 0 0 0 2px rgba(100, 100, 255, 0.2);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  label?: string;
}

const ZoomControl: React.FC<ZoomControlProps> = ({
  zoom = 2,
  onZoomChange,
  minZoom = 1.5,
  maxZoom = 5,
  step = 0.5,
  label = 'Zoom'
}) => {
  const [inputValue, setInputValue] = React.useState<string>(zoom.toString());
  const [isEditing, setIsEditing] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(zoom.toFixed(1));
    }
  }, [zoom, isEditing]);

  const handleIncrement = () => {
    const newZoom = Math.min(maxZoom, zoom + step);
    onZoomChange(parseFloat(newZoom.toFixed(1)));
  };

  const handleDecrement = () => {
    const newZoom = Math.max(minZoom, zoom - step);
    onZoomChange(parseFloat(newZoom.toFixed(1)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newZoom = parseFloat(inputValue);

    if (isNaN(newZoom)) {
      newZoom = zoom;
    } else {
      newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    }

    onZoomChange(parseFloat(newZoom.toFixed(1)));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputValue(zoom.toFixed(1));
      setIsEditing(false);
    }
  };

  const displayZoom = `${(zoom * 100).toFixed(0)}%`;

  return (
    <ZoomControlContainer>
      <ZoomLabel>{label}</ZoomLabel>

      <ZoomButtonsContainer>
        <ZoomButton
          onClick={handleDecrement}
          disabled={zoom <= minZoom}
          aria-label="Decrease zoom"
        >
          −
        </ZoomButton>

        {isEditing ? (
          <ZoomInput
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsEditing(true)}
            step={step}
            min={minZoom}
            max={maxZoom}
            autoFocus
          />
        ) : (
          <ZoomDisplay onClick={() => setIsEditing(true)}>
            {displayZoom}
          </ZoomDisplay>
        )}

        <ZoomButton
          onClick={handleIncrement}
          disabled={zoom >= maxZoom}
          aria-label="Increase zoom"
        >
          +
        </ZoomButton>
      </ZoomButtonsContainer>
    </ZoomControlContainer>
  );
};

export default ZoomControl;
