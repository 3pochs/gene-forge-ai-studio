
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Wand2, Tag, FlaskConical, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AIAssistantProps {
  sequence: string;
  selectedRange: { start: number; end: number } | null;
  sequenceType: "dna" | "rna" | "protein" | "unknown";
  onAnnotationAdd: (annotation: any) => void;
}

export function AIAssistant({ 
  sequence, 
  selectedRange, 
  sequenceType,
  onAnnotationAdd
}: AIAssistantProps) {
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [annotationName, setAnnotationName] = useState<string>("");
  
  // Mock function to simulate AI analysis
  const analyzeSequence = async () => {
    if (!sequence) {
      toast.error("Please enter a sequence first");
      return;
    }
    
    if (!selectedRange) {
      toast.error("Please select a region of the sequence first");
      return;
    }
    
    setIsLoading(true);
    setAiResponse("");
    
    try {
      // Get the selected subsequence
      const subsequence = sequence.substring(selectedRange.start, selectedRange.end);
      
      // In a real app, this would call an actual AI model API
      // For now, we'll simulate a response based on some basic patterns
      
      setTimeout(() => {
        let response = "";
        
        if (sequenceType === "dna") {
          // Check for common sequence patterns
          if (subsequence.includes("ATGC")) {
            response = "This DNA subsequence appears to contain a start codon followed by potential coding region. It might be part of a gene encoding a protein.\n\nConfidence: Medium (65%)";
          } else if (subsequence.includes("TATA")) {
            response = "This sequence contains a TATA box motif, which is a common promoter element in eukaryotes. It likely functions as a binding site for RNA polymerase II and associated transcription factors.\n\nConfidence: High (85%)";
          } else if (subsequence.includes("AATAAA")) {
            response = "This sequence contains an AATAAA motif, which is a polyadenylation signal in eukaryotes. It marks the site where the pre-mRNA will be cleaved and a poly(A) tail added.\n\nConfidence: High (80%)";
          } else if (subsequence.length >= 30) {
            response = "This appears to be a coding sequence with no immediately recognizable motifs. It may encode part of a protein with unknown function. Further analysis with protein prediction tools is recommended.\n\nConfidence: Low (40%)";
          } else {
            response = "This short DNA sequence doesn't contain any easily recognizable motifs. It could be a regulatory element, a spacer region, or part of a larger functional unit.\n\nConfidence: Very Low (25%)";
          }
        } else if (sequenceType === "protein") {
          response = "This is a protein sequence fragment. To better understand its function, consider running a protein structure prediction algorithm or comparing it against known protein domains.\n\nConfidence: Medium (50%)";
        } else {
          response = "Unable to analyze this sequence type. Please ensure you have selected a valid DNA, RNA, or protein sequence.";
        }
        
        setAiResponse(response);
        setIsLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error("Error analyzing sequence:", error);
      toast.error("Failed to analyze sequence");
      setIsLoading(false);
      setAiResponse("Error: Failed to analyze the sequence. Please try again.");
    }
  };
  
  // Function to handle custom prompts
  const handleCustomPrompt = async () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    if (!sequence) {
      toast.error("Please enter a sequence first");
      return;
    }
    
    setIsLoading(true);
    setAiResponse("");
    
    try {
      // In a real app, this would send the prompt and sequence to an AI API
      setTimeout(() => {
        const responses = [
          "This sequence appears to be a promoter region with moderate activity in E. coli. It contains -10 and -35 elements that are recognized by bacterial RNA polymerase.",
          "Based on codon usage analysis, this sequence is optimized for expression in mammalian cells, particularly human cell lines.",
          "This region contains a ribosome binding site (RBS) that would facilitate protein translation in bacterial systems.",
          "The selected sequence doesn't appear to contain any known regulatory elements or protein-coding regions. It may serve as a spacer or have an unknown function."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setAiResponse(randomResponse);
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error("Error processing custom prompt:", error);
      toast.error("Failed to process prompt");
      setIsLoading(false);
      setAiResponse("Error: Failed to process your prompt. Please try again.");
    }
  };
  
  // Function to add an annotation based on AI analysis
  const handleAddAnnotation = () => {
    if (!selectedRange) {
      toast.error("Please select a sequence region first");
      return;
    }
    
    if (!annotationName.trim()) {
      toast.error("Please provide a name for the annotation");
      return;
    }
    
    // Create a new annotation
    const newAnnotation = {
      name: annotationName,
      start: selectedRange.start,
      end: selectedRange.end,
      direction: 1, // Default forward direction
      color: "#8B5CF6", // Default color (purple)
    };
    
    onAnnotationAdd(newAnnotation);
    setAnnotationName("");
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="analyze">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="analyze">
            <Brain className="w-4 h-4 mr-2" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="annotate">
            <Tag className="w-4 h-4 mr-2" />
            Annotate
          </TabsTrigger>
          <TabsTrigger value="custom">
            <Wand2 className="w-4 h-4 mr-2" />
            Custom
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="analyze" className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Analyze Selected Region</div>
              {selectedRange && (
                <Badge variant="outline">
                  {selectedRange.start + 1}-{selectedRange.end} ({selectedRange.end - selectedRange.start} bp)
                </Badge>
              )}
            </div>
            
            <Button 
              onClick={analyzeSequence} 
              disabled={isLoading || !sequence || !selectedRange}
              className="w-full"
            >
              <Brain className="w-4 h-4 mr-2" />
              {isLoading ? "Analyzing..." : "Analyze Selection"}
            </Button>
          </div>
          
          {aiResponse && (
            <Card className="p-3 bg-muted/30">
              <div className="text-sm whitespace-pre-line">{aiResponse}</div>
            </Card>
          )}
          
          {!selectedRange && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground border border-dashed rounded-md">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              Select a region in the sequence editor to analyze
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="annotate" className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Add Annotation</div>
              {selectedRange && (
                <Badge variant="outline">
                  {selectedRange.start + 1}-{selectedRange.end} ({selectedRange.end - selectedRange.start} bp)
                </Badge>
              )}
            </div>
            
            <Input
              placeholder="Annotation name (e.g., Promoter, CDS, etc.)"
              value={annotationName}
              onChange={(e) => setAnnotationName(e.target.value)}
              disabled={!selectedRange}
            />
            
            <Button 
              onClick={handleAddAnnotation} 
              disabled={!selectedRange || !annotationName.trim()}
              className="w-full"
            >
              <Tag className="w-4 h-4 mr-2" />
              Add Annotation
            </Button>
          </div>
          
          {!selectedRange && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground border border-dashed rounded-md">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              Select a region in the sequence editor to annotate
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="custom" className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="text-sm font-medium">Custom AI Prompt</div>
            
            <Textarea
              placeholder="Enter your prompt (e.g., 'Optimize this sequence for E. coli expression')"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
            
            <Button 
              onClick={handleCustomPrompt} 
              disabled={isLoading || !customPrompt.trim() || !sequence}
              className="w-full"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isLoading ? "Processing..." : "Execute"}
            </Button>
          </div>
          
          {aiResponse && (
            <Card className="p-3 bg-muted/30">
              <div className="text-sm whitespace-pre-line">{aiResponse}</div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="text-xs text-muted-foreground mt-2">
        <FlaskConical className="w-3 h-3 inline mr-1" />
        AI analyses are simulated in this demo version
      </div>
    </div>
  );
}
