import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, ArrowLeft } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfInstance, setPdfInstance] = useState<jsPDF | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      // Cleanup blob URL when dialog closes
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
      setPdfUrl(null);
      setPdfInstance(null);
      setIsLoading(true);
      setError(null);
      hasGeneratedRef.current = false;
      return;
    }

    // Prevent double generation
    if (hasGeneratedRef.current) return;
    hasGeneratedRef.current = true;

    const generatePreview = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('[ReportPreview] Starting PDF generation...');
        const pdf = await reportGenerator();
        console.log('[ReportPreview] PDF generated, creating blob...');
        setPdfInstance(pdf);
        
        // Create blob with explicit MIME type for browser compatibility
        const rawBlob = pdf.output('blob');
        const typedBlob = new Blob([rawBlob], { type: 'application/pdf' });
        const url = URL.createObjectURL(typedBlob);
        
        console.log('[ReportPreview] Blob URL created:', url);
        pdfUrlRef.current = url;
        setPdfUrl(url);
      } catch (err) {
        console.error('[ReportPreview] Generation error:', err);
        setError('Failed to generate preview. You can still try exporting the report.');
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();

    // Cleanup on unmount using ref
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [open, reportGenerator]);

  const handleExport = () => {
    if (pdfInstance) {
      const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdfInstance.save(filename);
    }
    onClose();
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview: {reportName}</DialogTitle>
          <DialogDescription>
            Review your report before exporting. Use browser controls to navigate pages.
          </DialogDescription>
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-muted/30 rounded-lg min-h-[600px]">
          {isLoading && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <Skeleton className="w-[400px] h-[500px] mx-auto" />
                <p className="text-sm text-muted-foreground">Generating preview...</p>
              </div>
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

          {!isLoading && !error && pdfUrl && (
            <iframe
              src={pdfUrl + '#toolbar=1&navpanes=0'}
              className="w-full h-full rounded-lg border-0"
              title={`Preview: ${reportName}`}
              style={{ minHeight: '600px' }}
            />
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleExport} disabled={isLoading || !pdfInstance}>
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
