
import React, { useState, useEffect, useRef } from "react";
import { SeqViz } from "seqviz";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  CircleSlash, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  StickyNote,
  Maximize2,
  Minimize2,
  FastForward,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface VisualizerPanelProps {
  sequence: string;
  annotations: any[];
  selectedRange: { start: number; end: number } | null;
  onRangeSelect: (range: { start: number; end: number } | null) => void;
  setSeqvizRef: (ref: any) => void;
  notes?: Array<{
    title: string;
    content: string;
    start: number;
    end: number;
    createdAt: string;
  }>;
  onScrollToPosition?: (position: number) => void;
}

export function VisualizerPanel({ 
  sequence, 
  annotations, 
  selectedRange,
  onRangeSelect,
  setSeqvizRef,
  notes = [],
  onScrollToPosition
}: VisualizerPanelProps) {
  const [viewer, setViewer] = useState<"circular" | "linear" | "both">("both");
  const [enzymes, setEnzymes] = useState<string[]>([]);
  const [showComplement, setShowComplement] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [showNoteDialog, setShowNoteDialog] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Common restriction enzymes
  const commonEnzymes = ["EcoRI", "BamHI", "HindIII", "XbaI", "PstI", "SalI"];
  
  // Toggle restriction enzymes
  const toggleEnzyme = (enzyme: string) => {
    if (enzymes.includes(enzyme)) {
      setEnzymes(enzymes.filter(e => e !== enzyme));
    } else {
      setEnzymes([...enzymes, enzyme]);
    }
  };
  
  // Reset error state when sequence changes
  useEffect(() => {
    setRenderError(false);
  }, [sequence]);

  // Handle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => toast.error("Fullscreen failed: " + err.message));
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => toast.error("Exit fullscreen failed: " + err.message));
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Handle SeqViz selection
  const handleSelection = (selection: any) => {
    if (selection && selection.start !== undefined && selection.end !== undefined) {
      onRangeSelect({ start: selection.start, end: selection.end });
    } else {
      onRangeSelect(null);
    }
  };
  
  // Handle error in SeqViz
  const handleError = () => {
    setRenderError(true);
    toast.error("Error visualizing sequence. The sequence may be invalid or too complex.");
  };

  // Convert notes to SeqViz highlights for visualization
  const notesToHighlights = () => {
    if (!showNotes || !notes.length) return [];
    
    return notes.map((note, index) => ({
      start: note.start,
      end: note.end,
      color: "#FBBF24", // Amber/yellow for notes
      name: note.title,
      id: `note-${index}`
    }));
  };

  // Open note dialog when a note is clicked
  const handleNoteClick = (event: any) => {
    // Check if the clicked element is a note highlight
    if (event.type === "HIGHLIGHT" && event.name) {
      // Find the corresponding note
      const note = notes.find(n => n.title === event.name);
      if (note) {
        setActiveNote(note);
        setShowNoteDialog(true);
      }
    }
  };

  // Handle clicking on an annotation or feature to navigate to it in the editor
  const handleAnnotationClick = (event: any) => {
    if (!onScrollToPosition) return;
    
    // Handle clicks on annotations or highlights
    if ((event.type === "ANNOTATION" || event.type === "HIGHLIGHT") && event.start !== undefined) {
      // Select the region in the editor
      onRangeSelect({
        start: event.start,
        end: event.end || event.start + 1
      });
      
      // Scroll to the position in the editor
      onScrollToPosition(event.start);
      
      // Show toast to inform the user
      toast.success(`Navigated to ${event.name || "selected region"}`);
    }
  };

  if (!sequence) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20">
        <CircleSlash className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Sequence Available</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Enter a DNA, RNA, or protein sequence in the editor to visualize it here.
        </p>
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Visualization Error</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Unable to visualize this sequence. It may contain invalid characters or be in an unsupported format.
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => setRenderError(false)}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Make sure we have a valid sequence to prevent errors
  // Remove any non-alphanumeric characters to prevent SeqViz errors
  const safeSequence = sequence.replace(/[^a-zA-Z]/g, "");

  // Don't render SeqViz if sequence is empty after cleaning
  if (!safeSequence.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/20">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Invalid Sequence</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          The sequence contains no valid characters. Please enter a valid DNA, RNA, or protein sequence.
        </p>
      </div>
    );
  }

  // Combine annotations and note highlights
  const combinedHighlights = [...notesToHighlights()];

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className={`p-4 border-b ${isFullscreen ? 'bg-background' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">Sequence Visualization</h2>
          <div className="flex items-center space-x-2">
            <Tabs value={viewer} onValueChange={(v) => setViewer(v as any)} className="w-fit">
              <TabsList className="h-8">
                <TabsTrigger value="circular" className="text-xs px-2">Circular</TabsTrigger>
                <TabsTrigger value="linear" className="text-xs px-2">Linear</TabsTrigger>
                <TabsTrigger value="both" className="text-xs px-2">Both</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Button
            variant={showComplement ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setShowComplement(!showComplement)}
          >
            Show Complement
          </Button>
          
          <Button
            variant={showNotes ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Notes ({notes.length})
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Notes
              </>
            )}
          </Button>
          
          {commonEnzymes.map(enzyme => (
            <Button
              key={enzyme}
              variant={enzymes.includes(enzyme) ? "default" : "outline"}
              size="sm"
              className="text-xs h-7"
              onClick={() => toggleEnzyme(enzyme)}
            >
              {enzyme}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="h-full w-full">
          <ErrorBoundary fallback={
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Visualization Error</h3>
              <p className="text-sm text-center max-w-md">
                There was an error displaying this sequence.
              </p>
            </div>
          }>
            <SeqViz
              name="GeneForge Sequence"
              seq={safeSequence}
              annotations={annotations || []}
              highlights={combinedHighlights}
              viewer={viewer}
              showComplement={showComplement}
              enzymes={enzymes}
              style={{ height: "100%", width: "100%" }}
              onSelection={handleSelection}
              onHighlightClick={handleNoteClick}
              onAnnotationClick={handleAnnotationClick}
              selection={selectedRange ? {
                start: selectedRange.start,
                end: selectedRange.end,
              } : undefined}
              ref={setSeqvizRef}
            />

            {/* Note detail dialog */}
            <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{activeNote?.title}</DialogTitle>
                  <DialogDescription>
                    <div className="mt-2">
                      <p className="text-sm">{activeNote?.content}</p>
                      <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                        <StickyNote className="w-3 h-3" />
                        <span>Position: {activeNote?.start + 1}-{activeNote?.end}</span>
                        <span>•</span>
                        <span>{new Date(activeNote?.createdAt || "").toLocaleString()}</span>
                      </div>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// Simple error boundary component to catch SeqViz errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("SeqViz error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
