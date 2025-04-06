
import { useState, useEffect, useRef } from "react";
import { SeqViz } from "seqviz";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CircleSlash, AlertCircle } from "lucide-react";

interface VisualizerPanelProps {
  sequence: string;
  annotations: any[];
  selectedRange: { start: number; end: number } | null;
  onRangeSelect: (range: { start: number; end: number } | null) => void;
  setSeqvizRef: (ref: any) => void;
}

export function VisualizerPanel({ 
  sequence, 
  annotations, 
  selectedRange,
  onRangeSelect,
  setSeqvizRef
}: VisualizerPanelProps) {
  const [viewer, setViewer] = useState<"circular" | "linear" | "both">("both");
  const [enzymes, setEnzymes] = useState<string[]>([]);
  const [showComplement, setShowComplement] = useState<boolean>(true);
  
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
  
  // Handle SeqViz selection
  const handleSelection = (selection: any) => {
    if (selection && selection.start !== undefined && selection.end !== undefined) {
      onRangeSelect({ start: selection.start, end: selection.end });
    } else {
      onRangeSelect(null);
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

  // Make sure we have a valid sequence to prevent errors
  const safeSequence = sequence || "";

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
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
        {safeSequence.length > 0 ? (
          <div className="h-full w-full">
            <SeqViz
              name="GeneForge Sequence"
              seq={safeSequence}
              annotations={annotations || []}
              viewer={viewer}
              showComplement={showComplement}
              enzymes={enzymes}
              style={{ height: "100%", width: "100%" }}
              onSelection={handleSelection}
              selection={selectedRange ? {
                start: selectedRange.start,
                end: selectedRange.end,
              } : undefined}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-2" />
              <p>No sequence to visualize</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
