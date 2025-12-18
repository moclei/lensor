import React from 'react';
import styled from 'styled-components';
import { useSettings } from './useSettings';
import { useSavedColors, colorToHex } from './savedColors';
import { ColorCopyFormat, DEFAULT_SETTINGS } from './types';
import {
  generatePalette,
  generateMaterialPalette,
  parseRgbColor,
  rgbToHex
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

// ============ Component ============

type TabType = 'settings' | 'colors';

export const SettingsApp: React.FC = () => {
  const { settings, isLoading, updateSetting, resetSettings } = useSettings();
  const {
    savedColors,
    isLoading: colorsLoading,
    updateLabel,
    deleteColor,
    clearAll
  } = useSavedColors();
  const [version, setVersion] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<TabType>('settings');
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [copyFeedback, setCopyFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    const manifest = chrome.runtime.getManifest();
    setVersion(manifest.version);
  }, []);

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

  const copyColor = async (color: string) => {
    const hex = colorToHex(color);
    await navigator.clipboard.writeText(hex);
    setCopyFeedback(hex);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  // Generate palettes for a color
  const getPalettes = (color: string) => {
    const harmony = generatePalette(color);
    const material = generateMaterialPalette(color);
    return { harmony, material };
  };

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
            🎨 Saved Colors {savedColors.length > 0 && `(${savedColors.length})`}
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
                  {showResetConfirm ? 'Click again to confirm' : 'Reset to Defaults'}
                </ResetButton>
              </Footer>
            </MainColumn>

            <SideColumn>
              <LensPreview settings={settings} />
            </SideColumn>
          </TwoColumnLayout>
        )}

      {activeTab === 'colors' && (
        <>
          <Section>
            <SectionHeader>
              <SectionIcon>💾</SectionIcon>
              <SectionTitle style={{ margin: 0, padding: 0, border: 'none' }}>
                Saved Colors
              </SectionTitle>
              <ColorCount>
                {savedColors.length} / 50 colors
              </ColorCount>
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
                  const { harmony, material } = getPalettes(savedColor.color);
                  const materialEntries = Object.entries(material)
                    .map(([weight, color]) => ({
                      weight: parseInt(weight),
                      color
                    }))
                    .sort((a, b) => a.weight - b.weight)
                    .slice(0, 6);

                  return (
                    <SavedColorCard key={savedColor.id}>
                      <SavedColorHeader>
                        <LargeColorSwatch $color={savedColor.color} />
                        <ColorInfo>
                          <ColorLabelInput
                            value={savedColor.label}
                            onChange={(e) =>
                              updateLabel(savedColor.id, e.target.value)
                            }
                            placeholder="Enter label..."
                          />
                          <ColorHex>{colorToHex(savedColor.color)}</ColorHex>
                        </ColorInfo>
                        <ColorActions>
                          <ActionButton
                            onClick={() => copyColor(savedColor.color)}
                          >
                            {copyFeedback === colorToHex(savedColor.color)
                              ? 'Copied!'
                              : 'Copy'}
                          </ActionButton>
                          <ActionButton
                            $danger
                            onClick={() => deleteColor(savedColor.id)}
                          >
                            Delete
                          </ActionButton>
                        </ColorActions>
                      </SavedColorHeader>

                      {/* Harmony palette */}
                      <PaletteRow>
                        <PaletteLabel>Harmony</PaletteLabel>
                        {harmony.slice(0, 5).map((color, i) => (
                          <MiniSwatch
                            key={i}
                            $color={color}
                            onClick={() => copyColor(color)}
                            title={`Click to copy ${colorToHex(color)}`}
                          />
                        ))}
                      </PaletteRow>

                      {/* Material palette */}
                      <PaletteRow>
                        <PaletteLabel>Material</PaletteLabel>
                        {materialEntries.map(({ weight, color }) => (
                          <MiniSwatch
                            key={weight}
                            $color={color}
                            onClick={() => copyColor(color)}
                            title={`${weight} - Click to copy ${colorToHex(color)}`}
                          />
                        ))}
                      </PaletteRow>
                    </SavedColorCard>
                  );
                })}
              </SavedColorsList>
            )}
          </Section>

          <Footer>
            <Version>Lensor v{version}</Version>
          </Footer>
        </>
      )}
      </Container>
    </PageWrapper>
  );
};
