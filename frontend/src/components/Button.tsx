import React from 'react';

export const Button: React.FC<{ onClick?: () => void; children: React.ReactNode, highlighted?: boolean }> = ({ onClick, children, highlighted }) => (
  <button
    type="button"
    className={`duration-100 rounded-xl px-2 border-border hover:bg-dark p-2 border flex items-center ${highlighted ? "bg-blue-500" : ""}`}
    onClick={onClick}
  >
    {children}
  </button>
);
