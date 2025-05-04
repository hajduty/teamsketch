// components/TextEditor.tsx
import React, { useEffect, useRef } from 'react';
import { Html } from 'react-konva-utils';

type TextEditorProps = {
  textNode: any;
  onClose: () => void;
  onChange: (text: string) => void;
};

export const TextEditor: React.FC<TextEditorProps> = ({ textNode, onClose, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !textNode) return;
  
    const stage = textNode.getStage();
    const stageBox = stage.container().getBoundingClientRect();
  
    const absPos = textNode.getAbsolutePosition();
    const scale = stage.scaleX();
  
    const stageOffset = stage.position();
  
    const x = (absPos.x - stageOffset.x) / scale + stageBox.left;
    const y = (absPos.y - stageOffset.y) / scale + stageBox.top;
  
    textarea.style.position = "absolute";
    textarea.style.top = `${y}px`;
    textarea.style.left = `${x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.height = `${textNode.height() - textNode.padding() * 2 + 5}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.lineHeight = `${textNode.lineHeight()}`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.color = textNode.fill();
    textarea.style.transform = `rotate(${textNode.rotation()}deg)`;
    textarea.style.transformOrigin = "top left";
    textarea.style.padding = "0px";
    textarea.style.margin = "0px";
    textarea.style.border = "none";
    textarea.style.background = "transparent";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.overflow = "hidden";
    textarea.style.whiteSpace = "pre-wrap";
  
    textarea.value = textNode.text();
    textarea.focus();
  
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onChange(textarea.value);
      } else if (e.key === "Escape") {
        onClose();
      }
    };
  
    const handleClickOutside = (e: MouseEvent) => {
      if (!textarea.contains(e.target as Node)) {
        onChange(textarea.value);
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [textNode, onChange, onClose]);
  
  return (
    <Html>
      <textarea
        ref={textareaRef}
        style={{
          minHeight: '1em',
          position: 'absolute',
        }}
      />
    </Html>
  );
};