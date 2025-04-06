
import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { findRegions } from "@/lib/sequenceUtils";

interface SequenceEditorProps {
  sequence: string;
  setSequence: (sequence: string) => void;
  onRangeSelect: (range: { start: number; end: number } | null) => void;
  sequenceType: "dna" | "rna" | "protein" | "unknown";
}

export function SequenceEditor({ 
  sequence, 
  setSequence, 
  onRangeSelect,
  sequenceType
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

  return (
    <div className="space-y-2">
      <div className="flex justify-end space-x-2 mb-2">
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
      <Textarea
        ref={textareaRef}
        value={formattedSequence}
        onChange={handleChange}
        onSelect={handleSelect}
        placeholder="Paste or type your DNA, RNA, or protein sequence here..."
        className="font-mono resize-none h-60 sequence-editor"
        spellCheck="false"
      />
    </div>
  );
}
