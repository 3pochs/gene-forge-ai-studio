
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dna, Github, Code, Leaf } from "lucide-react";

interface AboutDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function AboutDialog({ isOpen, setIsOpen }: AboutDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            About GeneForge AI
          </DialogTitle>
          <DialogDescription>
            An open-source AI-powered gene editor for synthetic biology.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" /> 
              Built with modern technologies
            </h3>
            <p className="text-sm text-muted-foreground">
              React, TailwindCSS, shadcn/ui, and SeqViz for DNA visualization.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" /> 
              Features
            </h3>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Interactive DNA sequence editor with syntax highlighting</li>
              <li>AI-powered sequence analysis and annotation</li>
              <li>Circular and linear plasmid visualization</li>
              <li>Local storage for your projects</li>
              <li>No account required, completely free</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium flex items-center gap-2">
              <Github className="h-4 w-4 text-primary" /> 
              Open Source
            </h3>
            <p className="text-sm text-muted-foreground">
              GeneForge AI is open-source software. Contributions are welcome!
            </p>
          </div>
          
          <div className="border-t border-border pt-3 mt-6 text-xs text-muted-foreground">
            Version 1.0.0 &copy; 2024 GeneForge AI
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
