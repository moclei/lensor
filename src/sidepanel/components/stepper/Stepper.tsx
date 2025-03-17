import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const StepperContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
`;

const StepperLabel = styled.div`
  font-size: 14px;
  color: #e0e0e0;
  min-width: 60px;
`;

const StepperButtonsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StepperButton = styled.button<{ disabled?: boolean }>`
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

const StepperDisplay = styled.div`
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

const StepperInput = styled.input`
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

interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  label?: string;
  formatter?: (value: number) => string;
  incrementAriaLabel?: string;
  decrementAriaLabel?: string;
}

const Stepper: React.FC<StepperProps> = ({
  value,
  onValueChange,
  minValue = 0,
  maxValue = 100,
  step = 1,
  label = 'Value',
  formatter = (val) => val.toFixed(1),
  incrementAriaLabel = 'Increase value',
  decrementAriaLabel = 'Decrease value'
}) => {
  const [inputValue, setInputValue] = useState<string>(formatter(value));
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(formatter(value));
    }
  }, [value, isEditing, formatter]);

  const handleIncrement = () => {
    const newValue = Math.min(maxValue, value + step);
    onValueChange(parseFloat(newValue.toFixed(1)));
  };

  const handleDecrement = () => {
    const newValue = Math.max(minValue, value - step);
    onValueChange(parseFloat(newValue.toFixed(1)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newValue = parseFloat(inputValue);

    if (isNaN(newValue)) {
      newValue = value;
    } else {
      newValue = Math.max(minValue, Math.min(maxValue, newValue));
    }

    onValueChange(parseFloat(newValue.toFixed(1)));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputValue(formatter(value));
      setIsEditing(false);
    }
  };

  return (
    <StepperContainer>
      <StepperLabel>{label}</StepperLabel>

      <StepperButtonsContainer>
        <StepperButton
          onClick={handleDecrement}
          disabled={value <= minValue}
          aria-label={decrementAriaLabel}
        >
          −
        </StepperButton>

        {isEditing ? (
          <StepperInput
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsEditing(true)}
            step={step}
            min={minValue}
            max={maxValue}
            autoFocus
          />
        ) : (
          <StepperDisplay onClick={() => setIsEditing(true)}>
            {inputValue}
          </StepperDisplay>
        )}

        <StepperButton
          onClick={handleIncrement}
          disabled={value >= maxValue}
          aria-label={incrementAriaLabel}
        >
          +
        </StepperButton>
      </StepperButtonsContainer>
    </StepperContainer>
  );
};

export default Stepper;

// Zoom-specific formatter
export const zoomFormatter = (zoom: number) => `${(zoom * 100).toFixed(0)}%`;

// Crop offset formatter
export const cropOffsetFormatter = (offset: number) => offset.toFixed(0);
