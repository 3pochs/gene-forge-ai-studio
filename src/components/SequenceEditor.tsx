
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { findRegions } from "@/lib/sequenceUtils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SequenceEditorProps {
  sequence: string;
  setSequence: (sequence: string) => void;
  onRangeSelect: (range: { start: number; end: number } | null) => void;
  sequenceType: "dna" | "rna" | "protein" | "unknown";
  notes?: Array<{
    title: string;
    content: string;
    start: number;
    end: number;
    createdAt: string;
  }>;
}

export function SequenceEditor({ 
  sequence, 
  setSequence, 
  onRangeSelect,
  sequenceType,
  notes = []
}: SequenceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [formattedSequence, setFormattedSequence] = useState<string>(sequence);
  const [displayMode, setDisplayMode] = useState<"raw" | "triplet">("raw");
  
  // Regions to highlight
  const [regions, setRegions] = useState<{
    startCodons: { start: number; end: number }[];
    stopCodons: { start: number; end: number }[];
    restrictionSites: { start: number; end: number }[];
    promoters: { start: number; end: number }[];
  }>({
    startCodons: [],
    stopCodons: [],
    restrictionSites: [],
    promoters: []
  });

  // Format the sequence when it changes or display mode changes
  useEffect(() => {
    if (sequence) {
      let formatted = sequence;
      if (displayMode === "triplet" && (sequenceType === "dna" || sequenceType === "rna")) {
        // Add a space after every three characters
        formatted = sequence.replace(/(.{3})/g, "$1 ").trim();
      }
      setFormattedSequence(formatted);
      
      // Only search for highlighted regions if it's DNA
      if (sequenceType === "dna") {
        const foundRegions = findRegions(sequence);
        setRegions(foundRegions);
      }
    }
  }, [sequence, displayMode, sequenceType]);

  // Handle selection within the textarea
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const selStart = target.selectionStart;
    const selEnd = target.selectionEnd;
    
    if (selStart !== selEnd) {
      // Adjust for display mode if needed
      let adjustedStart = selStart;
      let adjustedEnd = selEnd;
      
      if (displayMode === "triplet") {
        // Remove spaces to get the actual positions in the raw sequence
        const textBeforeStart = formattedSequence.substring(0, selStart);
        const spacesBeforeStart = (textBeforeStart.match(/ /g) || []).length;
        
        const textBeforeEnd = formattedSequence.substring(0, selEnd);
        const spacesBeforeEnd = (textBeforeEnd.match(/ /g) || []).length;
        
        adjustedStart -= spacesBeforeStart;
        adjustedEnd -= spacesBeforeEnd;
      }
      
      onRangeSelect({ start: adjustedStart, end: adjustedEnd });
    } else {
      onRangeSelect(null);
    }
  };

  // Handle sequence changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Remove formatting for storage
    let cleanValue = newValue;
    if (displayMode === "triplet") {
      cleanValue = newValue.replace(/\s+/g, "");
    }
    
    setSequence(cleanValue);
  };

  // Function to add common sequence elements
  const addSequenceElement = (element: string) => {
    // If there's a selection, replace it with the element
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      const newSequence = 
        sequence.substring(0, start) + 
        element + 
        sequence.substring(end);
      
      setSequence(newSequence);
      
      // Set cursor after the inserted element
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + element.length, start + element.length);
        }
      }, 0);
    } else {
      // If no selection, append to the end
      setSequence(sequence + element);
    }
  };

  // Add DNA/RNA/Protein common elements
  const getCommonElements = () => {
    if (sequenceType === "dna") {
      return [
        { name: "Start (ATG)", sequence: "ATG" },
        { name: "Stop (TAA)", sequence: "TAA" },
        { name: "EcoRI", sequence: "GAATTC" },
        { name: "BamHI", sequence: "GGATCC" },
        { name: "HindIII", sequence: "AAGCTT" }
      ];
    } else if (sequenceType === "rna") {
      return [
        { name: "Start (AUG)", sequence: "AUG" },
        { name: "Stop (UAA)", sequence: "UAA" },
        { name: "poly-A", sequence: "AAAAAAAAAAAA" }
      ];
    } else if (sequenceType === "protein") {
      return [
        { name: "His-Tag", sequence: "HHHHHH" },
        { name: "FLAG", sequence: "DYKDDDDK" },
        { name: "HA", sequence: "YPYDVPDYA" }
      ];
    }
    return [];
  };

  // Render notes as tooltips where applicable
  const renderNotes = () => {
    if (!notes.length) return null;
    
    return (
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
        {notes.map((note, index) => {
          // Calculate position based on textarea dimensions
          const textareaHeight = textareaRef.current?.offsetHeight || 0;
          const textareaWidth = textareaRef.current?.offsetWidth || 0;
          
          // Simplified calculation for demo purposes
          // In a real app, you'd calculate exact positions based on character metrics
          const position = {
            top: (note.start / sequence.length) * textareaHeight,
            left: 10 + (index * 5), // Stagger slightly to avoid complete overlap
          };
          
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className="absolute w-4 h-4 bg-yellow-400 rounded-full pointer-events-auto z-10 cursor-pointer"
                    style={{ top: `${position.top}px`, left: `${position.left}px` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <h4 className="font-bold">{note.title}</h4>
                    <p className="text-xs">{note.content}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Position: {note.start + 1}-{note.end}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setDisplayMode("raw")}
            className={`px-2 py-1 text-xs rounded ${
              displayMode === "raw" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => setDisplayMode("triplet")}
            className={`px-2 py-1 text-xs rounded ${
              displayMode === "triplet" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            Triplet
          </button>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {getCommonElements().map((element, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 text-xs px-2"
                    onClick={() => addSequenceElement(element.sequence)}
                  >
                    {element.name}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Insert {element.name}: {element.sequence}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={formattedSequence}
          onChange={handleChange}
          onSelect={handleSelect}
          placeholder="Paste or type your DNA, RNA, or protein sequence here..."
          className="font-mono resize-none h-60 sequence-editor"
          spellCheck="false"
        />
        {renderNotes()}
      </div>
    </div>
  );
}
