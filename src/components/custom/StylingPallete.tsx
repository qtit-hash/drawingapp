import { useStrokesStore } from "@/store/strokesStore";
import { strokeColors, strokeTaperValues, strokeWidths } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";

type props = {
  setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const StylingPallete: React.FC<props> = ({ setIsPopoverOpen }) => {
  const {
    updateStrokeColor,
    strokeColor,
    updateStrokeWidth,
    strokeWidth,
    strokeTaper,
    updateStrokeTaper,
  } = useStrokesStore();

  const [customColor, setCustomColor] = useState(strokeColor);
  const [isValidColor, setIsValidColor] = useState(true);

  // Validate hex color
  const isValidHexColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  // Handle custom color input change
  const handleCustomColorChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomColor(value);
    
    // Add # if user starts typing without it
    if (value.length > 0 && !value.startsWith('#')) {
      setCustomColor('#' + value);
      return;
    }

    // Validate color as user types
    setIsValidColor(value === '' || isValidHexColor(value));
  };

  // Handle custom color submission
  const handleCustomColorSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValidHexColor(customColor)) {
      updateStrokeColor(customColor);
    }
  };

  // Update custom color input when strokeColor changes
  useEffect(() => {
    setCustomColor(strokeColor);
  }, [strokeColor]);

  return (
    <div
      className="flex gap-4 flex-col"
      onMouseLeave={() => {
        setIsPopoverOpen(false);
      }}
    >
      {/* stroke color */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm mb-1">Stroke Color</h3>
        <div className="flex gap-2">
          {strokeColors.map((color) => (
            <span
              className="w-8 h-8 rounded-md cursor-pointer flex justify-center items-center"
              style={{ backgroundColor: color }}
              key={color}
              onClick={() => {
                updateStrokeColor(color);
              }}
            >
              {strokeColor === color && (
                <CheckCircle className="w-5 h-5 bg-inherit text-white" />
              )}
            </span>
          ))}
        </div>
        
        {/* Custom color input */}
        <form onSubmit={handleCustomColorSubmit} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColorChange}
              placeholder="#000000"
              className={`w-full px-2 py-1 border rounded text-sm ${
                !isValidColor ? 'border-red-500' : ''
              }`}
              maxLength={7}
            />
            {!isValidColor && (
              <span className="absolute -bottom-5 left-0 text-xs text-red-500">
                Please enter a valid hex color
              </span>
            )}
          </div>
          <div 
            className="w-8 h-8 rounded-md border"
            style={{ 
              backgroundColor: isValidColor ? customColor : '#ffffff',
              cursor: isValidColor ? 'pointer' : 'not-allowed'
            }}
            onClick={() => {
              if (isValidColor && isValidHexColor(customColor)) {
                updateStrokeColor(customColor);
              }
            }}
          >
            {strokeColor === customColor && (
              <CheckCircle className="w-5 h-5 m-auto mt-1.5 bg-inherit text-white" />
            )}
          </div>
        </form>
      </div>

      <div className="flex flex-col">
        <h3 className="text-sm mb-1">Stroke Width</h3>
        <div className="flex gap-2">
          {strokeWidths.map((width) => (
            <span
              className={`w-8 h-8 rounded-md cursor-pointer border flex justify-center items-center ${
                width === strokeWidth ? "bg-primary" : ""
              }`}
              key={width}
              onClick={() => {
                updateStrokeWidth(width);
              }}
            >
              {width}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col">
        <h3 className="text-sm mb-1">Edge Sharpness</h3>
        <div className="flex gap-2">
          {strokeTaperValues.map((width) => (
            <span
              className={`w-8 h-8 rounded-md cursor-pointer border flex justify-center items-center ${
                width === strokeTaper ? "bg-primary" : ""
              }`}
              key={width}
              onClick={() => {
                updateStrokeTaper(width);
              }}
            >
              {width}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StylingPallete;