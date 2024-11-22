import { create } from "zustand";
import {
  Stroke,
  strokeColorsEnum,
  Mode,
  ModeEnum,
  doesIntersect,
  eraseTextStrokes,
} from "@/lib/utils";
import { calculateGlobalBoundingBox } from "@/hooks/selectionBox";
import { BoundingBox } from "@/hooks/selectionBox";
import axios from "axios";

interface StrokesState {
  mode: Mode;
  strokes: Stroke[];
  undoneStrokes: Stroke[];
  cursorStyle: string;
  strokeColor: strokeColorsEnum;
  strokeWidth: number;
  strokeTaper: number;
  scale: number;
  panOffset: { x: number; y: number };
  canvasRef: React.RefObject<HTMLCanvasElement>;
  boundingBox: BoundingBox | null;
  apiResponse: any; // Thêm trường để lưu kết quả API
  setApiResponse: (response: any) => void; // Hàm để cập nhật apiResponse

  updateCursorStyle: (cursorStyle: string) => void;
  updateMode: (mode: Mode) => void;
  addStroke: (newStroke: Stroke) => void;
  undoStroke: () => void;
  redoStroke: () => void;
  eraseStroke: (erasePoints: number[][]) => void;
  updateStrokeColor: (strokeColor: strokeColorsEnum) => void;
  updateStrokeWidth: (strokeWidth: number) => void;
  handleZoom: (zoomIn: boolean) => void;
  updatePanOffset: (newOffset: { x: number; y: number }) => void;
  updateScale: (newScale: number) => void;
  clearCanvas: () => void;
  updateStrokeTaper: (strokeTaper: number) => void;
  updateStroke: (updatedStroke: Stroke) => void;
  setBoundingBox: (box: BoundingBox | null) => void;
  setStrokes: (newStrokes: Stroke[]) => void;
  computemodule: (toast: (message: string) => void) => void;
}

export const useStrokesStore = create<StrokesState>((set, get) => ({
  mode: ModeEnum.CURSOR,
  strokes: [],
  undoneStrokes: [],
  cursorStyle: "pointer",
  strokeColor: strokeColorsEnum.BLACK,
  strokeWidth: 10,
  strokeTaper: 0,
  scale: 1,
  panOffset: { x: 0, y: 0 },
  canvasRef: { current: null },
  boundingBox: null,
  apiResponse: null, // Khởi tạo giá trị mặc định là null

  setApiResponse: (response) => set({ apiResponse: response }), // Hàm cập nhật apiResponse

  setBoundingBox: (box) => set(() => ({ boundingBox: box })),
  setStrokes: (newStrokes) => set({ strokes: newStrokes }),

  updateCursorStyle: (cursorStyle: string) => set({ cursorStyle }),
  updateMode: (mode: Mode) => set({ mode }),
  addStroke: (newStroke: Stroke) => set((state) => ({
    strokes: [...state.strokes, newStroke],
    undoneStrokes: []
  })),
  undoStroke: () => set((state) => {
    const lastStroke = state.strokes[state.strokes.length - 1];
    if (!lastStroke) return state;
    return {
      strokes: state.strokes.slice(0, -1),
      undoneStrokes: [...state.undoneStrokes, lastStroke],
    };
  }),
  redoStroke: () => set((state) => {
    const lastUndone = state.undoneStrokes[state.undoneStrokes.length - 1];
    if (!lastUndone) return state;
    return {
      strokes: [...state.strokes, lastUndone],
      undoneStrokes: state.undoneStrokes.slice(0, -1),
    };
  }),
  eraseStroke: (erasePoints: number[][]) => set((state) => ({
    strokes: state.strokes.filter((stroke) => {
      if (stroke.path) return !doesIntersect(stroke.path, erasePoints);
      return eraseTextStrokes(stroke, erasePoints);
    })
  })),
  updateStrokeColor: (strokeColor: strokeColorsEnum) => set({ strokeColor }),
  updateStrokeWidth: (strokeWidth: number) => set({ strokeWidth }),
  updateStrokeTaper: (strokeTaper: number) => set({ strokeTaper }),
  updatePanOffset: (newOffset: { x: number; y: number }) => set({ panOffset: newOffset }),
  updateScale: (newScale: number) => set({ scale: newScale }),

  handleZoom: (zoomIn: boolean) => {
    const { scale, panOffset, canvasRef } = get();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const zoomFactor = 0.05;
    const minScale = 0.5;
    const maxScale = 2.0;
    const newScale = Math.min(Math.max(scale + (zoomIn ? zoomFactor : -zoomFactor), minScale), maxScale);

    if (newScale === scale) return;

    const scaleFactor = newScale / scale;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newPanOffset = {
      x: centerX - (centerX - panOffset.x) * scaleFactor,
      y: centerY - (centerY - panOffset.y) * scaleFactor,
    };

    set({ panOffset: newPanOffset, scale: newScale });
  },

  clearCanvas: () => set({ strokes: [], undoneStrokes: [] }),

  computemodule: async (toast: (message: string) => void): Promise<void> => {
    const { strokes, canvasRef, setApiResponse } = get();
    if (strokes.length === 0) {
      toast("Canvas is empty!");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Tính toán bounding box của tất cả strokes
    const boundingBox = calculateGlobalBoundingBox(strokes);
    if (!boundingBox) {
      toast("No content to download!");
      return;
    }

    // Tạo canvas mới với kích thước của bounding box
    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = boundingBox.width;
    croppedCanvas.height = boundingBox.height;
    const croppedContext = croppedCanvas.getContext("2d");
    if (!croppedContext) return;

    // Vẽ nền trắng cho canvas mới
    croppedContext.fillStyle = "white";
    croppedContext.fillRect(0, 0, boundingBox.width, boundingBox.height);

    // Vẽ các strokes lên canvas mới
    strokes.forEach((stroke) => {
      if (stroke.type === "draw") {
        const path = new Path2D(stroke.path);
        croppedContext.fillStyle = stroke.color;
        croppedContext.translate(-boundingBox.x, -boundingBox.y);
        croppedContext.fill(path);
        croppedContext.translate(boundingBox.x, boundingBox.y);
      } else if (stroke.type === "text" && stroke.position) {
        croppedContext.font = `${stroke.fontSize}px ${stroke.fontFamily}`;
        croppedContext.fillStyle = stroke.color;
        croppedContext.textBaseline = "top";
        croppedContext.fillText(
          stroke.text!,
          stroke.position.x - boundingBox.x,
          stroke.position.y - boundingBox.y
        );
      }
    });

    // Chuyển canvas cắt thành base64
    const imageBase64 = croppedCanvas.toDataURL("image/png");

    const byteString = atob(imageBase64.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    // Tạo một Blob từ buffer
    const blob = new Blob([uint8Array], { type: 'image/png' });
    console.log('sending')
    // Tạo FormData và append file (blob)
    const formData = new FormData();
    formData.append('file', blob, 'canvas-image.png');

    try {
      // Gửi ảnh đến API /predict
      const response = await axios.post('https://3000-01jcw1786zb4s3zn2vdy00tba0.cloudspaces.litng.ai/predict', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Cập nhật global state với kết quả từ API
      setApiResponse(response.data);
      console.log(response.data);  // In ra phản hồi API trong console

    } catch (error) {
      toast("Error sending request to API");
      console.error(error);
    }
  },

  updateStroke: (updatedStroke: Stroke) => set((state) => ({
    strokes: state.strokes.map((stroke) =>
      stroke === updatedStroke ? updatedStroke : stroke
    )
  })),
}));

// Synchronize strokes with localStorage
useStrokesStore.subscribe((state) => {
  localStorage.setItem("strokes", JSON.stringify(state.strokes));
});
``