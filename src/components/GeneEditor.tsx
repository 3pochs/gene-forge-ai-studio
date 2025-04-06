
import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { UploadButton } from "./UploadButton";
import { SequenceEditor } from "./SequenceEditor";
import { SequenceStats } from "./SequenceStats";
import { AIAssistant } from "./AIAssistant";
import { VisualizerPanel } from "./VisualizerPanel";
import { cleanGeneSequence } from "@/lib/sequenceUtils";
import { exampleSequences } from "@/data/exampleSequences";

export function GeneEditor() {
  const [sequence, setSequence] = useState<string>("");
  const [sequenceType, setSequenceType] = useState<"dna" | "rna" | "protein" | "unknown">("unknown");
  const [selectedRange, setSelectedRange] = useState<{start: number, end: number} | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [seqvizRef, setSeqvizRef] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // On mount, check localStorage for saved sequence
  useEffect(() => {
    try {
      const savedSequence = localStorage.getItem("geneforge-sequence");
      if (savedSequence) {
        setSequence(savedSequence);
        detectSequenceType(savedSequence);
      }
    } catch (error) {
      console.error("Error loading saved sequence:", error);
    }
  }, []);

  // Detect sequence type whenever sequence changes
  useEffect(() => {
    if (sequence) {
      detectSequenceType(sequence);
      try {
        localStorage.setItem("geneforge-sequence", sequence);
      } catch (error) {
        console.error("Error saving sequence to localStorage:", error);
      }
    }
  }, [sequence]);

  const detectSequenceType = (seq: string) => {
    if (!seq) {
      setSequenceType("unknown");
      return;
    }
    
    const cleanSeq = seq.replace(/\s+/g, "").toUpperCase();
    
    if (!cleanSeq.length) {
      setSequenceType("unknown");
      return;
    }
    
    // Check if mostly DNA nucleotides
    const dnaRegex = /^[ATGCN]+$/;
    
    // Check if mostly RNA nucleotides
    const rnaRegex = /^[AUGCN]+$/;
    
    // Check if mostly protein amino acids
    const proteinRegex = /^[ACDEFGHIKLMNPQRSTVWY]+$/;
    
    if (dnaRegex.test(cleanSeq)) {
      setSequenceType("dna");
    } else if (rnaRegex.test(cleanSeq)) {
      setSequenceType("rna");
    } else if (proteinRegex.test(cleanSeq)) {
      setSequenceType("protein");
    } else {
      setSequenceType("unknown");
    }
  };

  const addExampleSequence = (example: string) => {
    try {
      const selectedExample = exampleSequences.find(ex => ex.name === example);
      if (selectedExample) {
        setSequence(selectedExample.sequence);
        setAnnotations(selectedExample.annotations || []);
        toast.success(`Loaded example: ${selectedExample.name}`);
      }
    } catch (error) {
      console.error("Error loading example sequence:", error);
      toast.error("Failed to load example sequence");
    }
  };

  const handleFileUpload = (content: string) => {
    try {
      setIsProcessing(true);
      const cleanedSequence = cleanGeneSequence(content);
      setSequence(cleanedSequence);
      toast.success("Sequence uploaded successfully");
    } catch (error) {
      toast.error("Failed to process file");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSequenceChange = (newSequence: string) => {
    try {
      setSequence(newSequence);
    } catch (error) {
      console.error("Error updating sequence:", error);
      toast.error("Error updating sequence");
    }
  };

  const handleRangeSelection = (range: {start: number, end: number} | null) => {
    setSelectedRange(range);
  };

  const handleAnnotationAdd = (annotation: any) => {
    if (!selectedRange) {
      toast.error("Please select a sequence range first");
      return;
    }
    
    const newAnnotation = {
      name: annotation.name || "New Annotation",
      start: selectedRange.start,
      end: selectedRange.end,
      direction: annotation.direction || 1,
      color: annotation.color || "#3B82F6",
      type: annotation.type || "misc"
    };
    
    setAnnotations([...annotations, newAnnotation]);
    toast.success(`Added annotation: ${newAnnotation.name}`);
  };

  // Function to clear the sequence
  const clearSequence = () => {
    setSequence("");
    setAnnotations([]);
    toast.success("Sequence cleared");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
      {/* Left panel: Editor, Sequence, Stats, AI */}
      <div className="flex flex-col gap-4 overflow-y-auto pb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Sequence Editor</h2>
              <div className="flex items-center space-x-2">
                <Badge variant={sequenceType === "unknown" ? "outline" : "secondary"}>
                  {sequenceType === "unknown" ? "Type: Unknown" : `Type: ${sequenceType.toUpperCase()}`}
                </Badge>
                <UploadButton onUpload={handleFileUpload} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSequence}
                  disabled={isProcessing || !sequence}
                >
                  Clear
                </Button>
              </div>
            </div>
            
            <SequenceEditor 
              sequence={sequence} 
              setSequence={handleSequenceChange} 
              onRangeSelect={handleRangeSelection}
              sequenceType={sequenceType}
            />
            
            <div className="mt-2 flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedRange ? 
                  `Selected: ${selectedRange.start + 1}-${selectedRange.end} (${selectedRange.end - selectedRange.start} bp)` : 
                  "No selection"}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addExampleSequence("GFP")}
                  disabled={isProcessing}
                >
                  GFP Example
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => addExampleSequence("pUC19")}
                  disabled={isProcessing}
                >
                  pUC19 Example
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="stats">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="stats">Sequence Stats</TabsTrigger>
            <TabsTrigger value="ai">AI Assistant</TabsTrigger>
          </TabsList>
          <TabsContent value="stats" className="mt-2">
            <Card>
              <CardContent className="p-4 pt-2">
                <SequenceStats 
                  sequence={sequence} 
                  sequenceType={sequenceType} 
                  annotations={annotations}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ai" className="mt-2">
            <Card>
              <CardContent className="p-4 pt-2">
                <AIAssistant 
                  sequence={sequence} 
                  selectedRange={selectedRange} 
                  sequenceType={sequenceType}
                  onAnnotationAdd={handleAnnotationAdd}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right panel: DNA Visualization */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 h-full">
          <VisualizerPanel 
            sequence={sequence} 
            annotations={annotations}
            selectedRange={selectedRange}
            onRangeSelect={handleRangeSelection}
            setSeqvizRef={setSeqvizRef}
          />
        </CardContent>
      </Card>
    </div>
  );
}
