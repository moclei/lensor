import styled from 'styled-components';
import { patterns, getPattern } from '@/ui/styles/patterns';
import React, { forwardRef } from 'react';

export interface RingHandleStyleProps {
  visible?: boolean;
  canvasSize: number;
  borderSize: number;
  contrastColor: string;
  contrastColor2: string;
  hoveredColor: string;
  patternName?: keyof typeof patterns;
  shadowColor?: string;
}

export const StyledRingHandle = styled.div<RingHandleStyleProps>`
  z-index: 5;
  position: absolute;
  width: ${(props) => props.canvasSize + props.borderSize}px;
  height: ${(props) => props.canvasSize + props.borderSize}px;
  top: ${(props) => '-' + props.borderSize / 2}px;
  left: ${(props) => '-' + props.borderSize / 2}px;
  border-radius: 50%;
  cursor: grab;
  overflow: hidden;
  display: block;
  pointer-events: auto;
  background-color: transparent;

  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    pointer-events: auto;

    ${(props) =>
      getPattern(props.patternName || 'diamonds', {
        baseColor: props.hoveredColor,
        contrastColor: props.contrastColor2
      })}
  }
`;

export const ButtonSegment = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
`;

export const GearButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    opacity: 0.7;
  }

  &:focus {
    outline: none;
  }
`;

export interface RingHandleProps extends RingHandleStyleProps {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Handle = forwardRef<HTMLDivElement, RingHandleProps>(
  (props, ref) => {
    const {
      id,
      className,
      style,
      children,
      canvasSize,
      borderSize,
      contrastColor,
      contrastColor2,
      hoveredColor,
      patternName = 'diamonds',
      visible,
      shadowColor,
      ...restProps
    } = props;

    return (
      <StyledRingHandle
        ref={ref}
        id={id}
        className={className}
        style={style}
        canvasSize={canvasSize}
        borderSize={borderSize}
        contrastColor={contrastColor}
        contrastColor2={contrastColor2}
        hoveredColor={hoveredColor}
        patternName={patternName}
        shadowColor={shadowColor}
        {...restProps}
      >
        {children}
      </StyledRingHandle>
    );
  }
);

export default Handle;

// Usage example in your Lense component
// This part shows how to update your Lense component to use the new RingHandle
/*
import RingHandle from './RingHandle';
import { ButtonSegment, GearButton } from './RingHandle.styles';

// In your Lense component's render:
<RingHandle
  ref={ringHandleRef}
  id="lensor-ring-handle"
  className="circle-ring"
  canvasSize={CANVAS_SIZE}
  borderSize={60}
  contrastColor={hexToRgba(
    convertToGrayscalePreservingFormat(
      materialPalette?.[800] || '#000000'
    ),
    1
  )}
  contrastColor2={colorPalette[1]}
  hoveredColor={hoveredColor}
  patternName="diamonds" // You can dynamically change this
  style={{ display: canvasesVisible ? 'block' : 'none' }}
>
  <ButtonSegment id="lensor-btn-segment">
    <GearButton onClick={handleGearClick}>
      <FaGripVertical
        size={'lg'}
        color={materialPalette?.[900] || '#000000'}
      />
    </GearButton>
  </ButtonSegment>
</RingHandle>
*/
