
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { findRegions } from "@/lib/sequenceUtils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Bookmark, 
  BookOpenText, 
  Translate, 
  DNA, 
  Plus, 
  NotebookPen,
  Code
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  onNoteAdd?: (note: any) => void;
  onAnnotationAdd?: (annotation: any) => void;
  selectedRange: { start: number; end: number } | null;
  onScrollToPosition?: (position: number) => void;
}

export function SequenceEditor({ 
  sequence, 
  setSequence, 
  onRangeSelect,
  sequenceType,
  notes = [],
  onNoteAdd,
  onAnnotationAdd,
  selectedRange,
  onScrollToPosition
}: SequenceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [formattedSequence, setFormattedSequence] = useState<string>(sequence);
  const [displayMode, setDisplayMode] = useState<"raw" | "triplet">("raw");
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showAnnotationDialog, setShowAnnotationDialog] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [annotationName, setAnnotationName] = useState("");
  const [annotationColor, setAnnotationColor] = useState("#3B82F6");
  const [annotationType, setAnnotationType] = useState("misc");

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

  // Effect to position cursor at the selected range if needed
  useEffect(() => {
    if (selectedRange && textareaRef.current) {
      let adjustedStart = selectedRange.start;
      let adjustedEnd = selectedRange.end;
      
      if (displayMode === "triplet") {
        // Adjust for spaces in triplet mode
        const textBeforeStart = formattedSequence.substring(0, selectedRange.start + Math.floor(selectedRange.start / 3));
        adjustedStart = textBeforeStart.length;
        
        const textBeforeEnd = formattedSequence.substring(0, selectedRange.end + Math.floor(selectedRange.end / 3));
        adjustedEnd = textBeforeEnd.length;
      }
      
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(adjustedStart, adjustedEnd);
      
      // Scroll to position
      if (onScrollToPosition) {
        onScrollToPosition(selectedRange.start);
      }
    }
  }, [selectedRange, displayMode, formattedSequence]);

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

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Fix for Ctrl+A (Select All) + Backspace
    if ((e.ctrlKey || e.metaKey) && e.key === "a") {
      // Let the browser handle the Select All action
      setTimeout(() => {
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          
          // If text is selected (which it should be after Ctrl+A)
          if (start === 0 && end === textareaRef.current.value.length) {
            onRangeSelect({ start: 0, end: sequence.length });
          }
        }
      }, 0);
    }
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

  // Handle adding a note
  const handleAddNote = () => {
    if (!noteTitle.trim()) {
      toast.error("Please enter a note title");
      return;
    }

    // Determine the range: either selected range or entire sequence
    const range = selectedRange || { start: 0, end: sequence.length };
    
    if (onNoteAdd) {
      onNoteAdd({
        title: noteTitle,
        content: noteContent,
        start: range.start,
        end: range.end
      });
      
      setNoteTitle("");
      setNoteContent("");
      setShowNoteDialog(false);
      toast.success("Note added successfully");
    }
  };

  // Handle adding an annotation
  const handleAddAnnotation = () => {
    if (!annotationName.trim()) {
      toast.error("Please enter an annotation name");
      return;
    }

    if (!selectedRange) {
      toast.error("Please select a sequence range for the annotation");
      return;
    }
    
    if (onAnnotationAdd) {
      onAnnotationAdd({
        name: annotationName,
        color: annotationColor,
        type: annotationType,
        direction: 1
      });
      
      setAnnotationName("");
      setShowAnnotationDialog(false);
      toast.success("Annotation added successfully");
    }
  };

  // Translate DNA to amino acids
  const translateDNA = () => {
    if (sequenceType !== "dna") {
      toast.error("Translation only works for DNA sequences");
      return;
    }

    if (!selectedRange) {
      toast.error("Please select a DNA range to translate");
      return;
    }

    // Get the selected DNA segment
    const dnaSegment = sequence.substring(selectedRange.start, selectedRange.end);
    
    // Basic translation function
    const translateCodon = (codon: string): string => {
      const geneticCode: Record<string, string> = {
        'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
        'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
        'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
        'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
        'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
        'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
        'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
        'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
        'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
        'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
        'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
        'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
        'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
        'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
        'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
        'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
      };
      
      return geneticCode[codon.toUpperCase()] || 'X';
    };
    
    // Perform translation
    let protein = '';
    for (let i = 0; i < dnaSegment.length - 2; i += 3) {
      const codon = dnaSegment.substring(i, i + 3);
      if (codon.length === 3) {
        protein += translateCodon(codon);
      }
    }
    
    // Show the translation result
    toast.success(`Translation: ${protein}`);
    
    // Add as an annotation if significant
    if (protein.length > 5 && onAnnotationAdd) {
      if (window.confirm("Add this translation as an annotation?")) {
        onAnnotationAdd({
          name: `Translation (${protein.length} aa)`,
          color: "#10B981", // emerald color
          type: "CDS",
          direction: 1
        });
      }
    }
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
          
          <div className="flex space-x-1 ml-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowNoteDialog(true)}
                    className="h-6 w-6 p-0"
                  >
                    <NotebookPen className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Note</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAnnotationDialog(true)}
                    className="h-6 w-6 p-0"
                    disabled={!selectedRange}
                  >
                    <Bookmark className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Annotation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={translateDNA}
                    className="h-6 w-6 p-0"
                    disabled={sequenceType !== "dna" || !selectedRange}
                  >
                    <Translate className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Translate DNA</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
          onKeyDown={handleKeyDown}
          placeholder="Paste or type your DNA, RNA, or protein sequence here..."
          className="font-mono resize-none h-60 sequence-editor"
          spellCheck="false"
        />
        {renderNotes()}
      </div>
      
      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>
              {selectedRange ? 
                `Add a note for selection (positions ${selectedRange.start + 1}-${selectedRange.end})` : 
                "Add a note for the entire sequence"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Note content"
                className="h-24"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote}>
              Add Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Annotation Dialog */}
      <Dialog open={showAnnotationDialog} onOpenChange={setShowAnnotationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              {selectedRange ? 
                `Create an annotation for positions ${selectedRange.start + 1}-${selectedRange.end}` :
                "Please select a sequence range first"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={annotationName}
                onChange={(e) => setAnnotationName(e.target.value)}
                placeholder="Annotation name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  id="color"
                  value={annotationColor}
                  onChange={(e) => setAnnotationColor(e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  type="text"
                  value={annotationColor}
                  onChange={(e) => setAnnotationColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={annotationType}
                onChange={(e) => setAnnotationType(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="misc">Miscellaneous</option>
                <option value="gene">Gene</option>
                <option value="CDS">Coding Sequence</option>
                <option value="promoter">Promoter</option>
                <option value="terminator">Terminator</option>
                <option value="RBS">Ribosome Binding Site</option>
                <option value="restriction_site">Restriction Site</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnnotationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAnnotation} disabled={!selectedRange}>
              Add Annotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
