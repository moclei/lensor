// patterns.ts
import { css } from 'styled-components';

export interface PatternOptions {
  baseColor: string;
  contrastColor: string;
  contrastColor2?: string;
  textureHighlight?: string;
  textureHighlightBright?: string;
  textureHighlightBrightest?: string;
  textureShadow?: string;
}

export type PatternFunction = (
  options: PatternOptions
) => ReturnType<typeof css>;

// Patterns found here: https://www.magicpattern.design/tools/css-backgrounds
export const patterns: Record<string, PatternFunction> = {
  // Pattern: Diamond
  diamonds: ({ baseColor, contrastColor }) => css`
    background-color: ${baseColor};
    opacity: 1;
    background-image:
      linear-gradient(135deg, ${contrastColor} 25%, transparent 25%),
      linear-gradient(225deg, ${contrastColor} 25%, transparent 25%),
      linear-gradient(45deg, ${contrastColor} 25%, transparent 25%),
      linear-gradient(315deg, ${contrastColor} 25%, ${baseColor} 25%);
    background-position:
      10px 0,
      10px 0,
      0 0,
      0 0;
    background-size: 10px 10px;
    background-repeat: repeat;
  `,

  // Pattern: Isometric
  lines: ({ baseColor, contrastColor }) => css`
    background-color: ${baseColor};
    opacity: 0.8;
    background-image:
      linear-gradient(
        30deg,
        ${contrastColor} 12%,
        transparent 12.5%,
        transparent 87%,
        ${contrastColor} 87.5%,
        ${contrastColor}
      ),
      linear-gradient(
        150deg,
        ${contrastColor} 12%,
        transparent 12.5%,
        transparent 87%,
        ${contrastColor} 87.5%,
        ${contrastColor}
      ),
      linear-gradient(
        30deg,
        ${contrastColor} 12%,
        transparent 12.5%,
        transparent 87%,
        ${contrastColor} 87.5%,
        ${contrastColor}
      ),
      linear-gradient(
        150deg,
        ${contrastColor} 12%,
        transparent 12.5%,
        transparent 87%,
        ${contrastColor} 87.5%,
        ${contrastColor}
      ),
      linear-gradient(
        60deg,
        ${contrastColor} 25%,
        transparent 25.5%,
        transparent 75%,
        ${contrastColor} 75%,
        ${contrastColor}
      ),
      linear-gradient(
        60deg,
        ${contrastColor} 25%,
        transparent 25.5%,
        transparent 75%,
        ${contrastColor} 75%,
        ${contrastColor}
      );
    background-size: 20px 35px;
    background-position:
      0 0,
      0 0,
      10px 18px,
      10px 18px,
      0 0,
      10px 18px;
  `,

  // Pattern: Diagonal
  diagonal: ({ baseColor, contrastColor, contrastColor2 }) => css`
    background-color: ${baseColor};
    opacity: 0.8;
    background-size: 10px 10px;
    background-image: repeating-linear-gradient(
      45deg,
      ${contrastColor} 0,
      ${contrastColor} 1px,
      ${contrastColor2} 0,
      ${contrastColor2} 50%
    );
  `,

  // Pattern: Boxes
  boxes: ({ baseColor, contrastColor }) => css`
    background-color: ${baseColor};
    opacity: 0.8;
    background-image:
      linear-gradient(${baseColor} 1px, transparent 1px),
      linear-gradient(to right, ${baseColor} 1px, ${contrastColor} 1px);
    background-size: 20px 20px;
  `,

  // Pattern: Moon
  moon: ({ baseColor, contrastColor }) => css`
    background-color: ${baseColor};
    opacity: 0.8;
    background-image: radial-gradient(
      ellipse farthest-corner at 10px 10px,
      ${baseColor},
      ${baseColor} 50%,
      ${contrastColor} 50%
    );
    background-size: 10px 10px;
  `,

  // Pattern: Knurling - simulates machined metal grip texture
  // Creates crosshatch with 3D embossed effect using highlight/lowlight accents
  knurling: ({
    baseColor,
    textureHighlightBright,
    textureHighlightBrightest,
    textureShadow
  }) => {
    const highlightBright =
      textureHighlightBright || 'rgba(255, 255, 255, 0.3)';
    const highlightBrightest =
      textureHighlightBrightest || 'rgba(255, 255, 255, 0.4)';
    const shadow = textureShadow || 'rgba(0, 0, 0, 0.3)';

    // Pattern dimensions
    const lineSpacing = 6;
    const lineWidth = 4;
    const accentWidth = lineWidth / 3;
    const crissAngle = 30;
    const crossAngle = -30;

    return css`
      background-color: ${baseColor};
      background-image:
        /* knurl2-criss-highlight */
        repeating-linear-gradient(
          ${crissAngle}deg,
          transparent,
          transparent ${lineSpacing}px,
          ${highlightBright} ${lineSpacing}px,
          ${highlightBright} ${lineSpacing + accentWidth}px,
          transparent ${lineSpacing + accentWidth}px,
          transparent ${lineSpacing + lineWidth}px
        ),
        /* knurl2-cross-highlight */
          repeating-linear-gradient(
            ${crossAngle}deg,
            transparent,
            transparent ${lineSpacing}px,
            ${highlightBrightest} ${lineSpacing}px,
            ${highlightBrightest} ${lineSpacing + accentWidth}px,
            transparent ${lineSpacing + accentWidth}px,
            transparent ${lineSpacing + lineWidth}px
          ),
        /* knurl2-cross-lowlight */
          repeating-linear-gradient(
            ${crossAngle}deg,
            transparent,
            transparent ${lineSpacing + accentWidth}px,
            ${shadow} ${lineSpacing + accentWidth * 3}px,
            ${shadow} ${lineSpacing + accentWidth * 2}px,
            transparent ${lineSpacing + accentWidth * 2}px,
            transparent ${lineSpacing + lineWidth}px
          ),
        /* knurl2-cross base */
          repeating-linear-gradient(
            ${crossAngle}deg,
            transparent,
            transparent ${lineSpacing}px,
            ${highlightBright} ${lineSpacing}px,
            ${highlightBright} ${lineSpacing + lineWidth}px
          ),
        /* knurl2-criss-lowlight */
          repeating-linear-gradient(
            ${crissAngle}deg,
            transparent,
            transparent ${lineSpacing + accentWidth}px,
            ${shadow} ${lineSpacing + accentWidth}px,
            ${shadow} ${lineSpacing + accentWidth * 2}px,
            transparent ${lineSpacing + accentWidth * 2}px,
            transparent ${lineSpacing + lineWidth}px
          );
    `;
  }
};

// Utility function to get a pattern by name
export const getPattern = (
  patternName: keyof typeof patterns,
  options: PatternOptions
) => {
  const patternFn = patterns[patternName];
  if (!patternFn) {
    console.warn(`Pattern "${patternName}" not found. Using default pattern.`);
    return patterns.diamonds(options);
  }
  return patternFn(options);
};
