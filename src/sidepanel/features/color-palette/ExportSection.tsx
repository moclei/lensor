import React from 'react';
import styled from 'styled-components';

const ExportContainer = styled.div`
  width: 100%;
  padding: 16px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ExportTitle = styled.h4`
  font-size: 12px;
  font-weight: 600;
  color: white;
  opacity: 0.7;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ExportButtons = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ExportButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.6;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    opacity: 0.8;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
`;

interface ExportSectionProps {}

const ExportSection: React.FC<ExportSectionProps> = () => {
  const handleExportStub = (format: string) => {
    console.log(`Export ${format} - Coming soon!`);
  };

  return (
    <ExportContainer>
      <ExportTitle>Export Options</ExportTitle>
      <ExportButtons>
        <ExportButton
          onClick={() => handleExportStub('CSS')}
          disabled
          title="Coming soon"
        >
          CSS
        </ExportButton>
        <ExportButton
          onClick={() => handleExportStub('JSON')}
          disabled
          title="Coming soon"
        >
          JSON
        </ExportButton>
        <ExportButton
          onClick={() => handleExportStub('Adobe')}
          disabled
          title="Coming soon"
        >
          Adobe
        </ExportButton>
        <ExportButton
          onClick={() => handleExportStub('Figma')}
          disabled
          title="Coming soon"
        >
          Figma
        </ExportButton>
      </ExportButtons>
    </ExportContainer>
  );
};

export default ExportSection;
