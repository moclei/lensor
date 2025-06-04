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
