import React from 'react';

const Icon: React.FC<{ iconName: string; fontSize?: string; color?: string; }> = ({ iconName, fontSize = '24px', color = 'black' }) => {
  return (
    <span className="material-symbols-outlined font-thin" style={{ fontSize: fontSize, color: color }}>
      {iconName}
    </span>
  );
};

export default Icon;