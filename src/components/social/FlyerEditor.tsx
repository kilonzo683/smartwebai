import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, FabricImage, FabricText, Rect, Circle } from "fabric";
import {
  Crop, Type, Square, CircleIcon, Undo2, Redo2, Download, 
  ZoomIn, ZoomOut, RotateCw, Trash2, Check, X, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface FlyerEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
}

const COLORS = [
  "#000000", "#FFFFFF", "#EF4444", "#F97316", "#EAB308", 
  "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"
];

export function FlyerEditor({ isOpen, onClose, imageUrl, onSave }: FlyerEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "rectangle" | "circle" | "crop">("select");
  const [activeColor, setActiveColor] = useState("#000000");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [textInput, setTextInput] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [isLoading, setIsLoading] = useState(true);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<Rect | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !imageUrl) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#f0f0f0",
      selection: true,
    });

    setFabricCanvas(canvas);
    setIsLoading(true);

    // Load the image
    FabricImage.fromURL(imageUrl, { crossOrigin: "anonymous" })
      .then((img) => {
        // Scale image to fit canvas while maintaining aspect ratio
        const maxWidth = 800;
        const maxHeight = 600;
        const scale = Math.min(maxWidth / img.width!, maxHeight / img.height!);
        
        img.scale(scale);
        img.set({
          left: (maxWidth - img.width! * scale) / 2,
          top: (maxHeight - img.height! * scale) / 2,
          selectable: true,
          hasControls: true,
        });

        canvas.add(img);
        canvas.renderAll();
        saveToHistory(canvas);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error loading image:", err);
        toast.error("Failed to load image for editing");
        setIsLoading(false);
      });

    return () => {
      canvas.dispose();
      setFabricCanvas(null);
      setHistory([]);
      setHistoryIndex(-1);
    };
  }, [isOpen, imageUrl]);

  const saveToHistory = useCallback((canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, json];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (!fabricCanvas || historyIndex <= 0) return;
    const prevState = history[historyIndex - 1];
    fabricCanvas.loadFromJSON(prevState).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(prev => prev - 1);
    });
  }, [fabricCanvas, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!fabricCanvas || historyIndex >= history.length - 1) return;
    const nextState = history[historyIndex + 1];
    fabricCanvas.loadFromJSON(nextState).then(() => {
      fabricCanvas.renderAll();
      setHistoryIndex(prev => prev + 1);
    });
  }, [fabricCanvas, history, historyIndex]);

  const handleAddText = useCallback(() => {
    if (!fabricCanvas || !textInput.trim()) return;
    
    const text = new FabricText(textInput, {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fill: activeColor,
      fontFamily: "Arial",
      fontWeight: "bold",
    });
    
    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    saveToHistory(fabricCanvas);
    setTextInput("");
    toast.success("Text added!");
  }, [fabricCanvas, textInput, fontSize, activeColor, saveToHistory]);

  const handleAddShape = useCallback((shape: "rectangle" | "circle") => {
    if (!fabricCanvas) return;

    if (shape === "rectangle") {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: activeColor,
        width: 100,
        height: 80,
        opacity: 0.8,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: activeColor,
        radius: 50,
        opacity: 0.8,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    }
    
    fabricCanvas.renderAll();
    saveToHistory(fabricCanvas);
  }, [fabricCanvas, activeColor, saveToHistory]);

  const handleStartCrop = useCallback(() => {
    if (!fabricCanvas) return;
    
    setIsCropping(true);
    setActiveTool("crop");
    
    // Add crop overlay rectangle
    const rect = new Rect({
      left: 100,
      top: 100,
      width: 400,
      height: 300,
      fill: "transparent",
      stroke: "#3B82F6",
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      hasControls: true,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
    setCropRect(rect);
    toast.info("Adjust the crop area and click Apply Crop");
  }, [fabricCanvas]);

  const handleApplyCrop = useCallback(async () => {
    if (!fabricCanvas || !cropRect) return;

    const cropBounds = cropRect.getBoundingRect();
    fabricCanvas.remove(cropRect);
    
    // Get the cropped area as data URL
    const dataUrl = fabricCanvas.toDataURL({
      left: cropBounds.left,
      top: cropBounds.top,
      width: cropBounds.width,
      height: cropBounds.height,
      format: "png",
      multiplier: 1,
    });

    // Clear canvas and load cropped image
    fabricCanvas.clear();
    
    FabricImage.fromURL(dataUrl)
      .then((img) => {
        const scale = Math.min(800 / img.width!, 600 / img.height!);
        img.scale(scale);
        img.set({
          left: (800 - img.width! * scale) / 2,
          top: (600 - img.height! * scale) / 2,
        });
        fabricCanvas.add(img);
        fabricCanvas.renderAll();
        saveToHistory(fabricCanvas);
      });

    setIsCropping(false);
    setCropRect(null);
    setActiveTool("select");
    toast.success("Image cropped!");
  }, [fabricCanvas, cropRect, saveToHistory]);

  const handleCancelCrop = useCallback(() => {
    if (!fabricCanvas || !cropRect) return;
    fabricCanvas.remove(cropRect);
    fabricCanvas.renderAll();
    setIsCropping(false);
    setCropRect(null);
    setActiveTool("select");
  }, [fabricCanvas, cropRect]);

  const handleRotate = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + 90);
      fabricCanvas.renderAll();
      saveToHistory(fabricCanvas);
    }
  }, [fabricCanvas, saveToHistory]);

  const handleDelete = useCallback(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
      activeObjects.forEach(obj => fabricCanvas.remove(obj));
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      saveToHistory(fabricCanvas);
      toast.success("Deleted!");
    }
  }, [fabricCanvas, saveToHistory]);

  const handleZoom = useCallback((direction: "in" | "out") => {
    if (!fabricCanvas) return;
    const newZoom = direction === "in" ? zoom * 1.1 : zoom / 1.1;
    setZoom(Math.max(0.5, Math.min(3, newZoom)));
    fabricCanvas.setZoom(newZoom);
    fabricCanvas.renderAll();
  }, [fabricCanvas, zoom]);

  const handleSave = useCallback(() => {
    if (!fabricCanvas) return;
    
    // Remove crop rect if present
    if (cropRect) {
      fabricCanvas.remove(cropRect);
    }
    
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2, // Higher resolution
    });
    
    onSave(dataUrl);
    toast.success("Flyer saved!");
  }, [fabricCanvas, cropRect, onSave]);

  const handleDownload = useCallback(() => {
    if (!fabricCanvas) return;
    
    const dataUrl = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement("a");
    link.download = `flyer-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Flyer downloaded!");
  }, [fabricCanvas]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-[1000px]">
        <DialogHeader>
          <DialogTitle>Edit Flyer</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/50 rounded-lg">
            {/* History */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Crop */}
            <div className="flex gap-1 border-r pr-2">
              {isCropping ? (
                <>
                  <Button variant="default" size="sm" onClick={handleApplyCrop}>
                    <Check className="w-4 h-4 mr-1" />
                    Apply
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelCrop}>
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant={activeTool === "crop" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={handleStartCrop}
                  title="Crop"
                >
                  <Crop className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Shapes */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAddShape("rectangle")}
                title="Add Rectangle"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleAddShape("circle")}
                title="Add Circle"
              >
                <CircleIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Text */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Add Text">
                  <Type className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Text</Label>
                    <Input
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Size: {fontSize}px</Label>
                    <Slider
                      value={[fontSize]}
                      onValueChange={([v]) => setFontSize(v)}
                      min={12}
                      max={72}
                      step={2}
                    />
                  </div>
                  <Button onClick={handleAddText} className="w-full" disabled={!textInput.trim()}>
                    Add Text
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Color Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Color">
                  <div
                    className="w-5 h-5 rounded border-2 border-border"
                    style={{ backgroundColor: activeColor }}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto">
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 transition-all ${
                        activeColor === color ? "border-primary scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setActiveColor(color)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Transform */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="icon" onClick={handleRotate} title="Rotate 90°">
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} title="Delete Selected">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Zoom */}
            <div className="flex gap-1 border-r pr-2">
              <Button variant="ghost" size="icon" onClick={() => handleZoom("out")} title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground self-center w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="ghost" size="icon" onClick={() => handleZoom("in")} title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check className="w-4 h-4 mr-1" />
                Use This
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={containerRef}
            className="relative border rounded-lg overflow-auto bg-muted/20 flex items-center justify-center"
            style={{ height: "60vh" }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            )}
            <canvas ref={canvasRef} />
          </div>

          {/* Instructions */}
          <p className="text-xs text-muted-foreground text-center">
            Click to select objects • Drag to move • Use handles to resize • Press Delete to remove
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
