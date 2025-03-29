import { useState } from "react";
import { Button } from "./Button";
import Icon from "./Icon";

export const Toolbar = () => {
  const [tool, setTool] = useState<string>("");

  const tools = [
    { name: "select", icon: "check_box_outline_blank" },
    { name: "edit", icon: "edit" },
    { name: "text", icon: "text_fields" },
    { name: "settings", icon: "settings" }
  ];

  return (
    <div className="flex h-8 hover:h-18 w-1/3 rounded-t-2xl bg-toolbar fixed bottom-0 left-1/2 -translate-x-1/2 justify-center items-center z-3 transform duration-150 border-t border-r border-l border-border group">
      <div className="flex flex-row justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {tools.map(({ name, icon }) => (
          <Button key={name} onClick={() => setTool(name)} highlighted={tool === name}>
            <Icon iconName={icon} fontSize="22px" color="white" />
          </Button>
        ))}
      </div>
    </div>
  );
};
