import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useSettings } from './useSettings';
import { useSavedColors, colorToHex } from './savedColors';
import { ColorCopyFormat, PaletteType, DEFAULT_SETTINGS } from './types';
import {
  generateAnyPalette,
  PALETTE_THEORIES,
  parseRgbColor,
  rgbToHex,
  rgbToHsl
} from '../ui/utils/color-utils';
import { LensPreview } from './LensPreview';

// ============ Styled Components ============

const PageWrapper = styled.div`
  min-height: 100vh;
  padding: 48px 24px;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 32px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const MainColumn = styled.div`
  min-width: 0;
`;

const SideColumn = styled.div`
  position: sticky;
  top: 24px;

  @media (max-width: 900px) {
    position: static;
    order: -1;
  }
`;

const Header = styled.header`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #f4f4f5;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Logo = styled.img`
  width: 40px;
  height: 40px;
`;

const Subtitle = styled.p`
  font-size: 15px;
  color: #a1a1aa;
`;

// Tabs
const TabContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 32px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => (props.$active ? '#f4f4f5' : '#71717a')};
  background: ${(props) =>
    props.$active ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? '#0ea5e9' : 'transparent')};
  cursor: pointer;
  transition: all 0.15s ease;
  margin-bottom: -1px;

  &:hover {
    color: #e4e4e7;
    background: rgba(255, 255, 255, 0.03);
  }
`;

const Section = styled.section`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #71717a;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionIcon = styled.span`
  font-size: 16px;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
`;

const SettingInfo = styled.div`
  flex: 1;
  padding-right: 24px;
`;

const SettingLabel = styled.label`
  font-size: 15px;
  font-weight: 500;
  color: #e4e4e7;
  display: block;
  margin-bottom: 4px;
`;

const SettingDescription = styled.p`
  font-size: 13px;
  color: #71717a;
  line-height: 1.4;
`;

// Toggle Switch
const ToggleContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background: #0ea5e9;
  }

  &:checked + span:before {
    transform: translateX(22px);
  }

  &:focus + span {
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 26px;
  transition: all 0.2s ease;

  &:before {
    position: absolute;
    content: '';
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: all 0.2s ease;
  }
`;

// Slider
const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
`;

const SliderInput = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.15);
  outline: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0ea5e9;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.1);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #0ea5e9;
    cursor: pointer;
    border: none;
  }
`;

const SliderValue = styled.span`
  min-width: 48px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: #a1a1aa;
  font-family: 'Monaco', 'Menlo', monospace;
`;

// Select dropdown
const Select = styled.select`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: #e4e4e7;
  cursor: pointer;
  min-width: 140px;
  outline: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.25);
  }

  &:focus {
    border-color: #0ea5e9;
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
  }

  option {
    background: #1a1a2e;
    color: #e4e4e7;
  }
`;

// Footer
const Footer = styled.footer`
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Version = styled.span`
  font-size: 13px;
  color: #71717a;
`;

const ResetButton = styled.button`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #71717a;
  font-size: 15px;
`;

// ============ Saved Colors Styles ============

const SavedColorsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SavedColorCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
`;

const SavedColorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
`;

const LargeColorSwatch = styled.div<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: ${(props) => props.$color};
  border: 2px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
`;

const ColorInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ColorLabelInput = styled.input`
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 16px;
  font-weight: 500;
  color: #f4f4f5;
  width: 100%;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
    border-color: #0ea5e9;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ColorHex = styled.span`
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #71717a;
  padding-left: 8px;
`;

const ColorActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid
    ${(props) =>
      props.$danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.15)'};
  background: ${(props) =>
    props.$danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${(props) => (props.$danger ? '#ef4444' : '#a1a1aa')};

  &:hover {
    background: ${(props) =>
      props.$danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${(props) => (props.$danger ? '#f87171' : '#e4e4e7')};
  }
`;

const PaletteRow = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 8px;
`;

const PaletteLabel = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #52525b;
  margin-right: 8px;
  min-width: 60px;
`;

const MiniSwatch = styled.button<{ $color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: ${(props) => props.$color};
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.1s ease;

  &:hover {
    transform: scale(1.15);
    border-color: white;
    z-index: 1;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #71717a;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
`;

const EmptyStateText = styled.p`
  font-size: 15px;
  line-height: 1.6;
`;

const ClearAllButton = styled.button`
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: auto;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const ColorCount = styled.span`
  font-size: 12px;
  color: #52525b;
  margin-left: auto;
`;

// ============ Palette Selection Styles ============

const PaletteCheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const PaletteCheckboxItem = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: ${(props) =>
    props.$disabled
      ? 'rgba(255, 255, 255, 0.02)'
      : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.$disabled
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(255, 255, 255, 0.06)'};
  }
`;

const PaletteCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #0ea5e9;
  cursor: inherit;
`;

const PaletteInfo = styled.div`
  flex: 1;
`;

const PaletteName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #e4e4e7;
  display: block;
`;

const PaletteDescription = styled.span`
  font-size: 12px;
  color: #71717a;
`;

const SelectedCount = styled.span`
  font-size: 12px;
  color: #0ea5e9;
  margin-left: auto;
`;

// ============ Redesigned Saved Color Card Styles ============

const ColorCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
`;

const ColorCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
`;

const ColorCardLabelInput = styled.input`
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 16px;
  font-weight: 500;
  color: #f4f4f5;
  flex: 1;
  min-width: 0;
  transition: all 0.15s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
    border-color: #0ea5e9;
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ColorCardActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ExportDropdownContainer = styled.div`
  position: relative;
`;

const ExportButton = styled.button`
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.05);
  color: #a1a1aa;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e4e4e7;
  }
`;

const ExportDropdown = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 4px;
  min-width: 180px;
  z-index: 100;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  visibility: ${(props) => (props.$visible ? 'visible' : 'hidden')};
  transform: ${(props) =>
    props.$visible ? 'translateY(0)' : 'translateY(-8px)'};
  transition: all 0.15s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`;

const ExportOption = styled.button`
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  color: #e4e4e7;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.1s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ExportIcon = styled.span`
  font-size: 14px;
  opacity: 0.7;
`;

const SwatchContainer = styled.div`
  display: flex;
  padding: 16px;
  gap: 2px;
  background: rgba(0, 0, 0, 0.2);
`;

const TallSwatch = styled.button<{ $color: string; $isMain?: boolean }>`
  flex: 1;
  height: 120px;
  background: ${(props) => props.$color};
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 8px;
  ${(props) => (props.$isMain ? 'border: 2px solid white;' : '')}

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-radius: 0 8px 8px 0;
  }

  &:hover {
    transform: scaleY(1.05);
    z-index: 1;
  }
`;

const SwatchLabel = styled.span<{ $dark?: boolean }>`
  font-size: 9px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
  color: ${(props) =>
    props.$dark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)'};
  text-shadow: ${(props) =>
    props.$dark
      ? '0 1px 2px rgba(255, 255, 255, 0.5)'
      : '0 1px 3px rgba(0, 0, 0, 0.8)'};
  background: ${(props) =>
    props.$dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
  padding: 2px 4px;
  border-radius: 3px;
  opacity: 0;
  transition: opacity 0.15s ease;

  ${TallSwatch}:hover & {
    opacity: 1;
  }
`;

const CopyIcon = styled.span`
  font-size: 12px;
  opacity: 0;
  position: absolute;
  top: 8px;
  right: 8px;
  transition: opacity 0.15s ease;

  ${TallSwatch}:hover & {
    opacity: 0.8;
  }
`;

const PaletteSection2 = styled.div`
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
`;

const PaletteHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const PaletteLabel2 = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #52525b;
`;

const FormatDropdown = styled.select`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 10px;
  color: #a1a1aa;
  cursor: pointer;
  margin-left: auto;

  &:focus {
    outline: none;
    border-color: #0ea5e9;
  }

  option {
    background: #1a1a2e;
  }
`;

const MiniSwatchRow = styled.div`
  display: flex;
  gap: 4px;
`;

const MiniSwatch2 = styled.button<{ $color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background: ${(props) => props.$color};
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.1s ease;

  position: relative;

  &:hover {
    transform: scale(1.15);
    border-color: white;
    z-index: 1;
  }
`;

// ============ Redesigned Saved Color Layout ============

// Main saved color display area
const SavedColorDisplay = styled.div`
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.15);
  align-items: flex-start;
`;

// Large single color swatch for the saved color
const MainColorSwatch = styled.button<{ $color: string }>`
  width: 80px;
  height: 80px;
  border-radius: 12px;
  background: ${(props) => props.$color};
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 6px;

  &:hover {
    transform: scale(1.05);
    border-color: white;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
`;

const MainColorLabel = styled.span<{ $dark?: boolean }>`
  font-size: 10px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: ${(props) =>
    props.$dark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)'};
  text-shadow: ${(props) =>
    props.$dark
      ? '0 1px 2px rgba(255, 255, 255, 0.4)'
      : '0 1px 3px rgba(0, 0, 0, 0.8)'};
  background: ${(props) =>
    props.$dark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'};
  padding: 3px 6px;
  border-radius: 4px;
`;

const MainColorCopyIcon = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.15s ease;

  ${MainColorSwatch}:hover & {
    opacity: 0.9;
  }
`;

// Container for all palettes
const PalettesContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

// Unified palette row - same size for all palettes
const UnifiedPaletteRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const UnifiedPaletteLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const UnifiedPaletteName = styled.span`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #71717a;
`;

// Medium-sized swatches - fixed width, taller height
const MediumSwatchRow = styled.div`
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
`;

const MediumSwatch = styled.button<{ $color: string }>`
  width: 56px;
  max-width: 120px;
  height: 64px;
  background: ${(props) => props.$color};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s ease;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
  flex-shrink: 0;

  &:hover {
    transform: scale(1.05);
    z-index: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const MediumSwatchLabel = styled.span<{ $dark?: boolean }>`
  font-size: 8px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: ${(props) =>
    props.$dark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
  background: ${(props) =>
    props.$dark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
  padding: 1px 3px;
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.12s ease;

  ${MediumSwatch}:hover & {
    opacity: 1;
  }
`;

const CopyFeedbackToast = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%)
    ${(props) => (props.$visible ? 'translateY(0)' : 'translateY(20px)')};
  background: #1a1a2e;
  border: 1px solid rgba(14, 165, 233, 0.3);
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  color: #0ea5e9;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  visibility: ${(props) => (props.$visible ? 'visible' : 'hidden')};
  transition: all 0.2s ease;
  z-index: 1000;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
`;

// ============ Collapsible Section Styles ============

// ============ Colors Tab Two-Column Layout ============

const ColorsTabLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ColorsMainColumn = styled.div`
  min-width: 0;
`;

const ColorsSideColumn = styled.div`
  position: sticky;
  top: 24px;

  @media (max-width: 900px) {
    position: static;
    order: -1;
  }
`;

const PaletteSidePanel = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
`;

const PaletteSidePanelTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #e4e4e7;
  margin: 0 0 4px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaletteSidePanelSubtitle = styled.p`
  font-size: 12px;
  color: #71717a;
  margin: 0 0 16px 0;
  line-height: 1.4;
`;

const PaletteOptionCompact = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: ${(props) =>
    props.$disabled
      ? 'rgba(255, 255, 255, 0.01)'
      : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
  transition: all 0.15s ease;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background: ${(props) =>
      props.$disabled
        ? 'rgba(255, 255, 255, 0.01)'
        : 'rgba(255, 255, 255, 0.05)'};
  }
`;

const PaletteOptionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const PaletteOptionName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #e4e4e7;
  display: block;
`;

const PaletteOptionDesc = styled.span`
  font-size: 11px;
  color: #71717a;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ============ Component ============

type TabType = 'settings' | 'colors';
type ColorFormat = 'hex' | 'rgb' | 'hsl';

// Helper to format color
function formatColorValue(color: string, format: ColorFormat): string {
  let r = 0,
    g = 0,
    b = 0;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    const rgb = parseRgbColor(color);
    if (rgb) {
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    }
  }

  switch (format) {
    case 'hex':
      return rgbToHex(r, g, b).toUpperCase();
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`;
    case 'hsl': {
      const [h, s, l] = rgbToHsl(r, g, b);
      return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
    }
    default:
      return rgbToHex(r, g, b).toUpperCase();
  }
}

// Get whether text should be dark (true) or light (false) for a background color
function shouldUseDarkText(bgColor: string): boolean {
  let r = 0,
    g = 0,
    b = 0;

  if (bgColor.startsWith('#')) {
    const hex = bgColor.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else {
    const rgb = parseRgbColor(bgColor);
    if (rgb) {
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    }
  }

  // Use a slightly lower threshold to favor light text more often (easier to read)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6; // true = dark text on bright bg, false = light text on dark bg
}

export const SettingsApp: React.FC = () => {
  const { settings, isLoading, updateSetting, resetSettings } = useSettings();
  const {
    savedColors,
    isLoading: colorsLoading,
    updateLabel,
    deleteColor,
    clearAll
  } = useSavedColors();
  const [version, setVersion] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [openExportId, setOpenExportId] = useState<string | null>(null);
  const [cardFormats, setCardFormats] = useState<Record<string, ColorFormat>>(
    {}
  );

  React.useEffect(() => {
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);
  }, []);

  // Close export dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenExportId(null);
    if (openExportId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openExportId]);

  const handleReset = () => {
    if (showResetConfirm) {
      resetSettings();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAll();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  const copyColor = useCallback(
    async (color: string, format: ColorFormat = 'hex') => {
      const formatted = formatColorValue(color, format);
      await navigator.clipboard.writeText(formatted);
      setCopyFeedback(`Copied ${formatted}`);
      setTimeout(() => setCopyFeedback(null), 1500);
    },
    []
  );

  // Export functions
  const exportAsCSS = useCallback((colors: string[], label: string) => {
    const cssVars = colors
      .map(
        (c, i) =>
          `  --${label.toLowerCase().replace(/\s+/g, '-')}-${i + 1}: ${colorToHex(c)};`
      )
      .join('\n');
    navigator.clipboard.writeText(`:root {\n${cssVars}\n}`);
    setCopyFeedback('Copied as CSS Variables');
    setTimeout(() => setCopyFeedback(null), 1500);
  }, []);

  const exportAsSCSS = useCallback((colors: string[], label: string) => {
    const scssVars = colors
      .map(
        (c, i) =>
          `$${label.toLowerCase().replace(/\s+/g, '-')}-${i + 1}: ${colorToHex(c)};`
      )
      .join('\n');
    navigator.clipboard.writeText(scssVars);
    setCopyFeedback('Copied as SCSS Variables');
    setTimeout(() => setCopyFeedback(null), 1500);
  }, []);

  const exportAsTailwind = useCallback((colors: string[], label: string) => {
    const name = label.toLowerCase().replace(/\s+/g, '-');
    const obj = colors.reduce(
      (acc, c, i) => ({ ...acc, [(i + 1) * 100]: colorToHex(c) }),
      {}
    );
    navigator.clipboard.writeText(`'${name}': ${JSON.stringify(obj, null, 2)}`);
    setCopyFeedback('Copied as Tailwind Config');
    setTimeout(() => setCopyFeedback(null), 1500);
  }, []);

  const exportAsJSON = useCallback((colors: string[], label: string) => {
    const obj = { name: label, colors: colors.map((c) => colorToHex(c)) };
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopyFeedback('Copied as JSON');
    setTimeout(() => setCopyFeedback(null), 1500);
  }, []);

  // Generate palettes for a saved color based on user's preferences
  const getSelectedPalettes = useCallback(
    (color: string) => {
      const selectedPalettes =
        settings.drawerPalettes?.length > 0
          ? settings.drawerPalettes
          : (['monochromatic', 'material'] as PaletteType[]);

      return selectedPalettes.map((paletteId) => {
        const theory = PALETTE_THEORIES.find((t) => t.id === paletteId);
        return {
          type: paletteId,
          name: theory?.name || paletteId,
          colors: generateAnyPalette(color, paletteId)
        };
      });
    },
    [settings.drawerPalettes]
  );

  if (isLoading || colorsLoading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>Loading...</LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Container>
        <Header>
          <Title>
            <Logo src="../images/lensor-icon-48.png" alt="Lensor" />
            Lensor
          </Title>
          <Subtitle>Configure your lens experience</Subtitle>
        </Header>

        <TabContainer>
          <Tab
            $active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </Tab>
          <Tab
            $active={activeTab === 'colors'}
            onClick={() => setActiveTab('colors')}
          >
            🎨 Saved Colors{' '}
            {savedColors.length > 0 && `(${savedColors.length})`}
          </Tab>
        </TabContainer>

        {activeTab === 'settings' && (
          <TwoColumnLayout>
            <MainColumn>
              {/* Defaults Section */}
              <Section>
                <SectionTitle>
                  <SectionIcon>🔍</SectionIcon>
                  Defaults
                </SectionTitle>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Default Zoom Level</SettingLabel>
                    <SettingDescription>
                      Starting magnification when opening the lens
                    </SettingDescription>
                  </SettingInfo>
                  <SliderContainer>
                    <SliderInput
                      type="range"
                      min={1}
                      max={16}
                      value={settings.defaultZoom}
                      onChange={(e) =>
                        updateSetting('defaultZoom', parseInt(e.target.value))
                      }
                    />
                    <SliderValue>{settings.defaultZoom}×</SliderValue>
                  </SliderContainer>
                </SettingRow>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Default Grid</SettingLabel>
                    <SettingDescription>
                      Show pixel grid overlay when opening
                    </SettingDescription>
                  </SettingInfo>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings.defaultGrid}
                      onChange={(e) =>
                        updateSetting('defaultGrid', e.target.checked)
                      }
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </SettingRow>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Default Fisheye</SettingLabel>
                    <SettingDescription>
                      Enable fisheye effect when opening
                    </SettingDescription>
                  </SettingInfo>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings.defaultFisheye}
                      onChange={(e) =>
                        updateSetting('defaultFisheye', e.target.checked)
                      }
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </SettingRow>
              </Section>

              {/* Appearance Section */}
              <Section>
                <SectionTitle>
                  <SectionIcon>🎨</SectionIcon>
                  Appearance
                </SectionTitle>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Animations</SettingLabel>
                    <SettingDescription>
                      Enable entrance and transition animations
                    </SettingDescription>
                  </SettingInfo>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings.animationsEnabled}
                      onChange={(e) =>
                        updateSetting('animationsEnabled', e.target.checked)
                      }
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </SettingRow>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Flash Effect</SettingLabel>
                    <SettingDescription>
                      Show screen flash when capturing the page
                    </SettingDescription>
                  </SettingInfo>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings.flashEffectEnabled}
                      onChange={(e) =>
                        updateSetting('flashEffectEnabled', e.target.checked)
                      }
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </SettingRow>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Handle Texture</SettingLabel>
                    <SettingDescription>
                      Show knurling pattern on the lens handle
                    </SettingDescription>
                  </SettingInfo>
                  <ToggleContainer>
                    <ToggleInput
                      type="checkbox"
                      checked={settings.handleTextureEnabled}
                      onChange={(e) =>
                        updateSetting('handleTextureEnabled', e.target.checked)
                      }
                    />
                    <ToggleSlider />
                  </ToggleContainer>
                </SettingRow>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Handle Opacity</SettingLabel>
                    <SettingDescription>
                      Visibility of the lens handle ring
                    </SettingDescription>
                  </SettingInfo>
                  <SliderContainer>
                    <SliderInput
                      type="range"
                      min={20}
                      max={100}
                      value={settings.handleOpacity}
                      onChange={(e) =>
                        updateSetting('handleOpacity', parseInt(e.target.value))
                      }
                    />
                    <SliderValue>{settings.handleOpacity}%</SliderValue>
                  </SliderContainer>
                </SettingRow>
              </Section>

              {/* Color Section */}
              <Section>
                <SectionTitle>
                  <SectionIcon>🎯</SectionIcon>
                  Color
                </SectionTitle>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Copy Format</SettingLabel>
                    <SettingDescription>
                      Format used when copying colors to clipboard
                    </SettingDescription>
                  </SettingInfo>
                  <Select
                    value={settings.colorCopyFormat}
                    onChange={(e) =>
                      updateSetting(
                        'colorCopyFormat',
                        e.target.value as ColorCopyFormat
                      )
                    }
                  >
                    <option value="hex">HEX (#FF5733)</option>
                    <option value="rgb">RGB (255, 87, 51)</option>
                    <option value="hsl">HSL (11, 100%, 60%)</option>
                  </Select>
                </SettingRow>
              </Section>

              {/* Behavior Section */}
              <Section>
                <SectionTitle>
                  <SectionIcon>⚙️</SectionIcon>
                  Behavior
                </SectionTitle>

                <SettingRow>
                  <SettingInfo>
                    <SettingLabel>Inactivity Timeout</SettingLabel>
                    <SettingDescription>
                      Auto-close lens after period of no activity (stops screen
                      capture indicator)
                    </SettingDescription>
                  </SettingInfo>
                  <Select
                    value={settings.inactivityTimeoutMinutes}
                    onChange={(e) =>
                      updateSetting(
                        'inactivityTimeoutMinutes',
                        parseInt(e.target.value)
                      )
                    }
                  >
                    <option value={0}>Disabled</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                  </Select>
                </SettingRow>
              </Section>

              <Footer>
                <Version>Lensor v{version}</Version>
                <ResetButton onClick={handleReset}>
                  {showResetConfirm
                    ? 'Click again to confirm'
                    : 'Reset to Defaults'}
                </ResetButton>
              </Footer>
            </MainColumn>

            <SideColumn>
              <LensPreview settings={settings} />
            </SideColumn>
          </TwoColumnLayout>
        )}

        {activeTab === 'colors' && (
          <ColorsTabLayout>
            {/* Main column - Saved Colors */}
            <ColorsMainColumn>
              <Section>
                <SectionHeader>
                  <SectionIcon>💾</SectionIcon>
                  <SectionTitle
                    style={{ margin: 0, padding: 0, border: 'none' }}
                  >
                    Saved Colors
                  </SectionTitle>
                  <ColorCount>{savedColors.length} / 50 colors</ColorCount>
                  {savedColors.length > 0 && (
                    <ClearAllButton onClick={handleClearAll}>
                      {showClearConfirm ? 'Confirm clear all' : 'Clear all'}
                    </ClearAllButton>
                  )}
                </SectionHeader>

                {savedColors.length === 0 ? (
                  <EmptyState>
                    <EmptyStateIcon>🎨</EmptyStateIcon>
                    <EmptyStateText>
                      No saved colors yet.
                      <br />
                      Click the heart icon in the lens drawer to save colors.
                    </EmptyStateText>
                  </EmptyState>
                ) : (
                  <SavedColorsList>
                    {savedColors.map((savedColor) => {
                      const palettes = getSelectedPalettes(savedColor.color);
                      const mainPalette = palettes[0]; // First selected palette as main display
                      const cardFormat = cardFormats[savedColor.id] || 'hex';

                      return (
                        <ColorCard key={savedColor.id}>
                          {/* Card Header */}
                          <ColorCardHeader>
                            <ColorCardLabelInput
                              value={savedColor.label}
                              onChange={(e) =>
                                updateLabel(savedColor.id, e.target.value)
                              }
                              placeholder="Name this color..."
                            />
                            <ColorCardActions>
                              <FormatDropdown
                                value={cardFormat}
                                onChange={(e) =>
                                  setCardFormats((prev) => ({
                                    ...prev,
                                    [savedColor.id]: e.target
                                      .value as ColorFormat
                                  }))
                                }
                                style={{ marginRight: 4 }}
                              >
                                <option value="hex">HEX</option>
                                <option value="rgb">RGB</option>
                                <option value="hsl">HSL</option>
                              </FormatDropdown>
                              <ExportDropdownContainer
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExportButton
                                  onClick={() =>
                                    setOpenExportId(
                                      openExportId === savedColor.id
                                        ? null
                                        : savedColor.id
                                    )
                                  }
                                >
                                  Export ▾
                                </ExportButton>
                                <ExportDropdown
                                  $visible={openExportId === savedColor.id}
                                >
                                  <ExportOption
                                    onClick={() => {
                                      exportAsCSS(
                                        palettes[0]?.colors || [],
                                        savedColor.label
                                      );
                                      setOpenExportId(null);
                                    }}
                                  >
                                    <ExportIcon>📋</ExportIcon> Copy as CSS
                                    Variables
                                  </ExportOption>
                                  <ExportOption
                                    onClick={() => {
                                      exportAsSCSS(
                                        palettes[0]?.colors || [],
                                        savedColor.label
                                      );
                                      setOpenExportId(null);
                                    }}
                                  >
                                    <ExportIcon>📋</ExportIcon> Copy as SCSS
                                    Variables
                                  </ExportOption>
                                  <ExportOption
                                    onClick={() => {
                                      exportAsTailwind(
                                        palettes[0]?.colors || [],
                                        savedColor.label
                                      );
                                      setOpenExportId(null);
                                    }}
                                  >
                                    <ExportIcon>🎨</ExportIcon> Copy as Tailwind
                                    Config
                                  </ExportOption>
                                  <ExportOption
                                    onClick={() => {
                                      exportAsJSON(
                                        palettes[0]?.colors || [],
                                        savedColor.label
                                      );
                                      setOpenExportId(null);
                                    }}
                                  >
                                    <ExportIcon>{}</ExportIcon> Copy as JSON
                                  </ExportOption>
                                </ExportDropdown>
                              </ExportDropdownContainer>
                              <ActionButton
                                $danger
                                onClick={() => deleteColor(savedColor.id)}
                              >
                                Delete
                              </ActionButton>
                            </ColorCardActions>
                          </ColorCardHeader>

                          {/* Main Color + Palettes Display */}
                          <SavedColorDisplay>
                            {/* Large single saved color swatch */}
                            <MainColorSwatch
                              $color={savedColor.color}
                              onClick={() =>
                                copyColor(savedColor.color, cardFormat)
                              }
                              title={`Click to copy ${formatColorValue(savedColor.color, cardFormat)}`}
                            >
                              <MainColorCopyIcon>📋</MainColorCopyIcon>
                              <MainColorLabel
                                $dark={shouldUseDarkText(savedColor.color)}
                              >
                                {formatColorValue(savedColor.color, cardFormat)}
                              </MainColorLabel>
                            </MainColorSwatch>

                            {/* All palettes at uniform size */}
                            <PalettesContainer>
                              {palettes.map((palette) => (
                                <UnifiedPaletteRow key={palette.type}>
                                  <UnifiedPaletteLabel>
                                    <UnifiedPaletteName>
                                      {palette.name}
                                    </UnifiedPaletteName>
                                  </UnifiedPaletteLabel>
                                  <MediumSwatchRow>
                                    {palette.colors
                                      .slice(0, 6)
                                      .map((color, i) => {
                                        const useDarkText =
                                          shouldUseDarkText(color);
                                        return (
                                          <MediumSwatch
                                            key={i}
                                            $color={color}
                                            onClick={() =>
                                              copyColor(color, cardFormat)
                                            }
                                            title={`Click to copy ${formatColorValue(color, cardFormat)}`}
                                          >
                                            <MediumSwatchLabel
                                              $dark={useDarkText}
                                            >
                                              {formatColorValue(
                                                color,
                                                cardFormat
                                              ).slice(0, 7)}
                                            </MediumSwatchLabel>
                                          </MediumSwatch>
                                        );
                                      })}
                                  </MediumSwatchRow>
                                </UnifiedPaletteRow>
                              ))}
                            </PalettesContainer>
                          </SavedColorDisplay>
                        </ColorCard>
                      );
                    })}
                  </SavedColorsList>
                )}
              </Section>

              <Footer>
                <Version>Lensor v{version}</Version>
              </Footer>
            </ColorsMainColumn>

            {/* Side column - Palette Settings */}
            <ColorsSideColumn>
              <PaletteSidePanel>
                <PaletteSidePanelTitle>
                  🎨 Drawer Palettes
                </PaletteSidePanelTitle>
                <PaletteSidePanelSubtitle>
                  Choose up to 3 palettes to show in the lens drawer and saved
                  color cards.
                </PaletteSidePanelSubtitle>

                {PALETTE_THEORIES.map((palette) => {
                  const isSelected =
                    settings.drawerPalettes?.includes(palette.id) || false;
                  const isDisabled =
                    !isSelected && (settings.drawerPalettes?.length || 0) >= 3;

                  return (
                    <PaletteOptionCompact
                      key={palette.id}
                      $disabled={isDisabled}
                    >
                      <PaletteCheckbox
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={(e) => {
                          const currentPalettes = settings.drawerPalettes || [
                            'monochromatic',
                            'material'
                          ];
                          if (e.target.checked) {
                            if (currentPalettes.length < 3) {
                              updateSetting('drawerPalettes', [
                                ...currentPalettes,
                                palette.id
                              ]);
                            }
                          } else {
                            if (currentPalettes.length > 1) {
                              updateSetting(
                                'drawerPalettes',
                                currentPalettes.filter((p) => p !== palette.id)
                              );
                            }
                          }
                        }}
                      />
                      <PaletteOptionInfo>
                        <PaletteOptionName>{palette.name}</PaletteOptionName>
                        <PaletteOptionDesc>
                          {palette.description}
                        </PaletteOptionDesc>
                      </PaletteOptionInfo>
                    </PaletteOptionCompact>
                  );
                })}
              </PaletteSidePanel>
            </ColorsSideColumn>

            {/* Copy feedback toast */}
            <CopyFeedbackToast $visible={!!copyFeedback}>
              {copyFeedback}
            </CopyFeedbackToast>
          </ColorsTabLayout>
        )}
      </Container>
    </PageWrapper>
  );
};
