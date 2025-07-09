// components/Button.tsx
import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

export default function Button({ children, onClick }: ButtonProps) {
  return (
    <button onClick={onClick} data-testid="btn">
      {children}
    </button>
  );
}
