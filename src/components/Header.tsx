
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dna, Save, Download, Upload, Coffee, FileText, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { AboutDialog } from "./AboutDialog";

type HeaderProps = {
  project: {
    name: string;
    lastSaved: Date;
  };
  setProject: (project: { name: string; lastSaved: Date }) => void;
};

export function Header({ project, setProject }: HeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(project.name);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const saveProjectName = () => {
    setProject({ ...project, name: tempTitle });
    setIsEditingTitle(false);
    toast.success("Project name updated");
  };

  const handleTitleClick = () => {
    setTempTitle(project.name);
    setIsEditingTitle(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveProjectName();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const saveProject = () => {
    setProject({ ...project, lastSaved: new Date() });
    localStorage.setItem("geneforge-project", JSON.stringify({ 
      ...project, 
      lastSaved: new Date() 
    }));
    toast.success("Project saved");
  };

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <SheetHeader>
                <SheetTitle>GeneForge AI</SheetTitle>
                <SheetDescription>
                  AI-Powered Gene Editor
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-4">
                <Button variant="ghost" className="justify-start" onClick={saveProject}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Project
                </Button>
                <Button variant="ghost" className="justify-start" onClick={() => setIsAboutOpen(true)}>
                  <Coffee className="mr-2 h-4 w-4" />
                  About
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
          <a href="/" className="flex items-center gap-2 font-bold">
            <Dna className="h-6 w-6 text-primary" />
            <span className="text-lg hidden sm:inline-block">GeneForge AI</span>
          </a>
        </div>
        <div className="flex-1 flex items-center justify-center">
          {isEditingTitle ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProjectName();
              }}
              className="w-full max-w-sm"
            >
              <Input
                autoFocus
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={saveProjectName}
                onKeyDown={handleKeyDown}
                className="h-9"
              />
            </form>
          ) : (
            <Button
              variant="ghost"
              className="text-lg font-medium"
              onClick={handleTitleClick}
            >
              {project.name}
            </Button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden md:flex gap-2">
            <Button variant="outline" size="sm" onClick={saveProject}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsAboutOpen(true)}>
              <Coffee className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <AboutDialog isOpen={isAboutOpen} setIsOpen={setIsAboutOpen} />
    </header>
  );
}
