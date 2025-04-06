
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Wand2, Tag, FlaskConical, AlertCircle, Edit, StickyNote } from "lucide-react";
import { toast } from "sonner";

interface AIAssistantProps {
  sequence: string;
  selectedRange: { start: number; end: number } | null;
  sequenceType: "dna" | "rna" | "protein" | "unknown";
  onAnnotationAdd: (annotation: any) => void;
  onNoteAdd?: (note: any) => void;
}

// Gemini API configuration
const GEMINI_API_KEY = "AIzaSyBRdGDufM6zU5ZtLEE0-WUy59qPbHiz7nk";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export function AIAssistant({ 
  sequence, 
  selectedRange, 
  sequenceType,
  onAnnotationAdd,
  onNoteAdd
}: AIAssistantProps) {
  const [aiResponse, setAiResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [annotationName, setAnnotationName] = useState<string>("");
  const [noteName, setNoteName] = useState<string>("");
  const [noteContent, setNoteContent] = useState<string>("");
  
  // Function to analyze sequence using Gemini API
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
      
      // Create system prompt based on sequence type
      let systemPrompt = "You are an expert molecular biologist. ";
      
      if (sequenceType === "dna") {
        systemPrompt += "Analyze this DNA sequence and explain its potential function, structure, and any notable features.";
      } else if (sequenceType === "rna") {
        systemPrompt += "Analyze this RNA sequence and explain its potential function, structure, and any notable features.";
      } else if (sequenceType === "protein") {
        systemPrompt += "Analyze this protein sequence and explain its potential function, structure, domains, and any notable features.";
      } else {
        systemPrompt += "Analyze this biological sequence and determine if it's DNA, RNA, or protein. Then explain its potential function.";
      }
      
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemPrompt}\n\nSequence type: ${sequenceType.toUpperCase()}\nSequence: ${subsequence}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        setAiResponse(data.candidates[0].content.parts[0].text);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Error analyzing sequence:", error);
      toast.error("Failed to analyze sequence");
      setAiResponse("Error: Failed to analyze the sequence. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to handle custom prompts with Gemini
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
      // Get the relevant sequence - either selected range or full sequence
      const relevantSequence = selectedRange 
        ? sequence.substring(selectedRange.start, selectedRange.end) 
        : sequence;
      
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: `You are an expert molecular biologist. I'll provide you with a ${sequenceType} sequence and a specific question or request about it. Please respond with accurate, scientific information.

Sequence type: ${sequenceType.toUpperCase()}
Sequence: ${relevantSequence}

My request: ${customPrompt}` }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        setAiResponse(data.candidates[0].content.parts[0].text);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Error processing custom prompt:", error);
      toast.error("Failed to process prompt");
      setAiResponse("Error: Failed to process your prompt. Please try again.");
    } finally {
      setIsLoading(false);
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
    toast.success(`Added annotation: ${annotationName}`);
  };
  
  // Function to add a note to the sequence
  const handleAddNote = () => {
    if (!selectedRange) {
      toast.error("Please select a sequence region first");
      return;
    }
    
    if (!noteName.trim()) {
      toast.error("Please provide a title for the note");
      return;
    }
    
    // Create a new note
    const newNote = {
      title: noteName,
      content: noteContent,
      start: selectedRange.start,
      end: selectedRange.end,
      createdAt: new Date().toISOString(),
    };
    
    if (onNoteAdd) {
      onNoteAdd(newNote);
      setNoteName("");
      setNoteContent("");
      toast.success(`Added note: ${noteName}`);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="analyze">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="analyze">
            <Brain className="w-4 h-4 mr-2" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="annotate">
            <Tag className="w-4 h-4 mr-2" />
            Annotate
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="w-4 h-4 mr-2" />
            Notes
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
        
        <TabsContent value="notes" className="space-y-4 mt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Add Note to Sequence</div>
              {selectedRange && (
                <Badge variant="outline">
                  {selectedRange.start + 1}-{selectedRange.end} ({selectedRange.end - selectedRange.start} bp)
                </Badge>
              )}
            </div>
            
            <Input
              placeholder="Note title"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              disabled={!selectedRange}
              className="mb-2"
            />
            
            <Textarea
              placeholder="Note content..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              disabled={!selectedRange}
              rows={3}
            />
            
            <Button 
              onClick={handleAddNote} 
              disabled={!selectedRange || !noteName.trim()}
              className="w-full"
            >
              <StickyNote className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>
          
          {!selectedRange && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground border border-dashed rounded-md">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              Select a region in the sequence editor to add a note
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
    </div>
  );
}
