import { Button } from "../../../components/Button";
import Icon from "../../../components/Icon";

export const Toolbar = ({ tool, setTool }: { tool: string, setTool: (tool: string) => void; }) => {
  const tools = [
    { name: "select", icon: "arrow_selector_tool" },
    { name: "pen", icon: "edit" },
    { name: "text", icon: "text_fields" },
    { name: "settings", icon: "settings" }
  ];

  return (
    <div className="flex h-6 hover:h-18 w-1/3 rounded-t-2xl bg-neutral-950 fixed bottom-0 left-1/2 -translate-x-1/2 justify-center items-center z-3 transform duration-150 border-t border-r border-l border-border group">
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