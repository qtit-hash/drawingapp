import React, { useCallback, useEffect, useState } from "react";
import { useStrokesStore } from "@/store/strokesStore";
import { Mode, ModeEnum } from "@/lib/utils";
import {
  Pencil,
  Type,
  Eraser,
  Move,
  Download,
  LucideIcon,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import StylingPallete from "./StylingPallete";

interface ModeConfig {
  mode: Mode;
  icon: LucideIcon;
  cursorStyle: string;
  label: string;
  shortcut: string;
  disabled?: boolean;
  special?: 'palette';  // Special flag for palette button
}

const modeConfigs: ModeConfig[] = [
  {
    mode: ModeEnum.DRAW,
    icon: Pencil,
    cursorStyle: "crosshair",
    label: "Draw",
    shortcut: "1",
  },
  {
    special: 'palette',  // Add palette button right after draw mode
    mode: 'palette' as Mode,
    icon: Palette,
    cursorStyle: "default",
    label: "Color Palette",
    shortcut: "c",
  },
  {
    mode: ModeEnum.WRITE,
    icon: Type,
    cursorStyle: "text",
    label: "Write",
    shortcut: "2",
  },
  {
    mode: ModeEnum.ERASE,
    icon: Eraser,
    cursorStyle: "pointer",
    label: "Erase",
    shortcut: "3",
  },
  {
    mode: ModeEnum.SCROLL,
    icon: Move,
    cursorStyle: "grab",
    label: "Move",
    shortcut: "4",
  },
  {
    mode: ModeEnum.DOWNLOAD,
    icon: Download,
    cursorStyle: "default",
    label: "Download",
    shortcut: "d",
  }
];

interface ModeButtonProps {
  config: ModeConfig;
  isActive: boolean;
  onClick: () => void;
}

const ModeButton: React.FC<ModeButtonProps> = ({ config, isActive, onClick }) => {
  const { boundingBox, canvasRef } = useStrokesStore();
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

  const downloadRegion = () => {
    if (!canvasRef?.current || !boundingBox) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;

    tempCanvas.width = boundingBox.width;
    tempCanvas.height = boundingBox.height;

    tempCtx.drawImage(
      canvasRef.current,
      boundingBox.x,
      boundingBox.y,
      boundingBox.width,
      boundingBox.height,
      0,
      0,
      boundingBox.width,
      boundingBox.height
    );

    const link = document.createElement('a');
    link.download = 'canvas-region.png';
    
    tempCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  // Render palette button
  if (config.special === 'palette') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost"
                  className="shadow-none h-8 w-8 rounded p-2 flex items-center justify-center"
                >
                  <Palette className="w-4 h-4 bg-inherit" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-fit">
                <StylingPallete setIsPopoverOpen={setIsPopoverOpen} />
              </PopoverContent>
            </Popover>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {config.label} (Press {config.shortcut})
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Render normal mode buttons
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "ghost"}
            onClick={config.mode === ModeEnum.DOWNLOAD ? downloadRegion : onClick}
            size="icon"
            className="shadow-none h-8 w-8 rounded p-2 flex items-center justify-center"
          >
            <config.icon className="w-4 h-4 bg-inherit" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {config.label} (Press {config.shortcut})
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Toolbar: React.FC = () => {
  const { updateMode, mode, updateCursorStyle } = useStrokesStore();

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === "TEXTAREA") return;

      const config = modeConfigs.find((c) => c.mode === newMode);
      if (config) {
        updateMode(config.mode);
        updateCursorStyle(config.cursorStyle);
      }
    },
    [updateMode, updateCursorStyle]
  );

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const config = modeConfigs.find((c) => 
        c.shortcut.toLowerCase() === event.key.toLowerCase()
      );
      if (config && !config.disabled) {
        handleModeChange(config.mode);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleModeChange]);

  return (
    <nav className="z-5 mt-3 flex items-center border p-1 shadow-sm md:rounded-xl">
      <ul className="flex max-w-full flex-wrap items-center gap-2 rounded-lg p-1">
        {modeConfigs.map((config) => (
          <li key={config.mode} className="relative">
            <ModeButton
              config={config}
              isActive={mode === config.mode}
              onClick={() => handleModeChange(config.mode)}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Toolbar;