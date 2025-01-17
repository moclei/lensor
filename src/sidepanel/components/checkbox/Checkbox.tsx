import React from 'react';
import styled from 'styled-components';

interface Props {
    label: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

const CheckboxWrapper = styled.div`
  /* Add any styles for the wrapper here */
`;

const Control = styled.label`
  display: block;
  position: relative;
  padding-left: 30px;
  cursor: pointer;
  font-size: 18px;
`;

const CheckboxInput = styled.input`
  position: absolute;
  z-index: -1;
  opacity: 0;
`;

const Indicator = styled.div`
  position: absolute;
  top: 2px;
  left: 0;
  height: 20px;
  width: 20px;
  background: #e6e6e6;

  ${Control}:hover &,
  ${CheckboxInput}:focus + & {
    background: #ccc;
  }

  ${CheckboxInput}:checked + & {
    background: #2aa1c0;
  }

  ${Control}:hover ${CheckboxInput}:not([disabled]):checked + &,
  ${CheckboxInput}:checked:focus + & {
    background: #0e647d;
  }

  ${CheckboxInput}:disabled + & {
    background: #e6e6e6;
    opacity: 0.6;
    pointer-events: none;
  }

  &:after {
    content: '';
    position: absolute;
    display: none;
  }

  ${CheckboxInput}:checked + &:after {
    display: block;
  }

  ${Control} &::after {
    left: 8px;
    top: 4px;
    width: 3px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  ${Control} ${CheckboxInput}:disabled + &:after {
    border-color: #7b7b7b;
  }
`;

const Checkbox: React.FC<Props> = ({ label, checked, onChange, disabled }) => {
    return (
        <CheckboxWrapper>
            <Control>
                {label}
                <CheckboxInput type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
                <Indicator />
            </Control>
        </CheckboxWrapper>
    );
};

export default Checkbox;