import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";
import jsPDF from "jspdf";

interface ReportPreviewProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  reportGenerator: () => Promise<jsPDF>;
  reportName: string;
}

export function ReportPreview({
  open,
  onClose,
  onExport,
  reportGenerator,
  reportName
}: ReportPreviewProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setIsLoading(true);
      setPageCount(0);
      setError(null);
      return;
    }

    const generatePreview = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Generate the PDF document
        const pdf = await reportGenerator();
        const numPages = (pdf as any).internal.pages.length - 1; // -1 because first page is metadata
        setPageCount(numPages);

        // Render each page to canvas
        for (let i = 1; i <= numPages; i++) {
          const canvas = canvasRefs.current[i - 1];
          if (!canvas) continue;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          // Set canvas size (A4 proportions at 96 DPI)
          const pageWidth = 794; // ~210mm at 96 DPI
          const pageHeight = 1123; // ~297mm at 96 DPI
          canvas.width = pageWidth;
          canvas.height = pageHeight;

          // Fill white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageWidth, pageHeight);

          // Get PDF page as data URL
          try {
            const imgData = pdf.output('datauristring');
            const img = new Image();
            
            await new Promise<void>((resolve, reject) => {
              img.onload = () => {
                ctx.drawImage(img, 0, 0, pageWidth, pageHeight);
                resolve();
              };
              img.onerror = reject;
              img.src = imgData;
            });
          } catch (err) {
            console.error(`Error rendering page ${i}:`, err);
          }
        }
      } catch (err) {
        console.error('Preview generation error:', err);
        setError('Failed to generate preview. You can still export the report.');
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();
  }, [open, reportGenerator]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleExport = () => {
    onExport();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {reportName}</DialogTitle>
          <DialogDescription>
            Review your report before exporting. Scroll to see all pages.
          </DialogDescription>
        </DialogHeader>

        {/* Zoom Controls */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          {!isLoading && !error && (
            <span className="text-sm text-muted-foreground">
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
          )}
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 min-h-[500px]">
          {isLoading && (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg mx-auto" style={{ width: '210mm', aspectRatio: '210/297' }}>
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="text-center">
                <p className="text-destructive font-medium mb-2">Preview unavailable</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button onClick={handleExport}>
                <FileDown className="h-4 w-4 mr-2" />
                Export Anyway
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-6">
              {Array.from({ length: pageCount }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow-lg mx-auto overflow-hidden"
                  style={{ 
                    width: `${210 * zoom}mm`,
                    maxWidth: '100%'
                  }}
                >
                  <canvas
                    ref={(el) => (canvasRefs.current[i] = el)}
                    className="w-full h-auto"
                    style={{ display: 'block' }}
                  />
                  
                  {/* Page number */}
                  <div className="text-center text-xs text-muted-foreground py-2 border-t">
                    Page {i + 1} of {pageCount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Edit
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
