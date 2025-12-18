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
  textureHighlight?: string;
  textureHighlightBright?: string;
  textureHighlightBrightest?: string;
  textureShadow?: string;
  patternName?: keyof typeof patterns;
  patternOpacity?: number;
  shadowColor?: string;
}

export const StyledRingHandle = styled.div<RingHandleStyleProps>`
  position: absolute;
  width: ${(props) => props.canvasSize + props.borderSize}px;
  height: ${(props) => props.canvasSize + props.borderSize}px;
  top: ${(props) => '-' + props.borderSize / 2}px;
  left: ${(props) => '-' + props.borderSize / 2}px;
  border-radius: 50%;
  cursor: grab;
  overflow: hidden;
  background-color: transparent;

  /* Visibility controlled via opacity for animation capability */
  opacity: ${(props) => (props.visible ? 1 : 0)};
  pointer-events: ${(props) => (props.visible ? 'auto' : 'none')};
  transition: opacity 0.2s ease-out;

  /* Clip out the center to create a ring shape - the center is covered by Lenses anyway,
     but this ensures the Handle never accidentally renders content in the center
     (e.g., during animations before Lenses appear) */
  mask: radial-gradient(
    circle at center,
    transparent ${(props) => props.canvasSize / 2}px,
    black ${(props) => props.canvasSize / 2}px
  );
  -webkit-mask: radial-gradient(
    circle at center,
    transparent ${(props) => props.canvasSize / 2}px,
    black ${(props) => props.canvasSize / 2}px
  );

  /* Solid base color layer (hovered pixel color) with raised/skeuomorphic edges */
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: ${(props) => props.hoveredColor};
    pointer-events: none;
    box-shadow:
      /* Outer drop shadow - element sits above the page */
      3px 4px 8px rgba(0, 0, 0, 0.4),
      1px 2px 3px rgba(0, 0, 0, 0.3),
      /* Outer highlight - top-left edge catches light */ -1px -1px 1px
        rgba(255, 255, 255, 0.15),
      /* Inner edge - shadow at BOTTOM of hole (ring casts shadow down into hole) */
        inset -2px -3px 6px rgba(0, 0, 0, 0.35),
      /* Inner edge - highlight at TOP of hole (light enters from above) */
        inset 1px 2px 3px rgba(255, 255, 255, 0.1);
  }

  /* Pattern overlay layer (with adjustable opacity) */
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    pointer-events: auto;
    opacity: ${(props) => props.patternOpacity ?? 1};
    background-color: transparent;

    ${(props) =>
      getPattern(props.patternName || 'knurling', {
        baseColor: 'transparent',
        contrastColor: props.contrastColor2,
        textureHighlight: props.textureHighlight,
        textureHighlightBright: props.textureHighlightBright,
        textureHighlightBrightest: props.textureHighlightBrightest,
        textureShadow: props.textureShadow
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
      textureHighlight,
      textureHighlightBright,
      textureHighlightBrightest,
      textureShadow,
      patternName = 'knurling',
      patternOpacity = 1,
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
        visible={visible}
        contrastColor={contrastColor}
        contrastColor2={contrastColor2}
        hoveredColor={hoveredColor}
        textureHighlight={textureHighlight}
        textureHighlightBright={textureHighlightBright}
        textureHighlightBrightest={textureHighlightBrightest}
        textureShadow={textureShadow}
        patternName={patternName}
        patternOpacity={patternOpacity}
        shadowColor={shadowColor}
        {...restProps}
      >
        {children}
      </StyledRingHandle>
    );
  }
);

export default Handle;
