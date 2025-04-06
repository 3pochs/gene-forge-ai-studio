
import { useState } from "react";
import { GeneEditor } from "@/components/GeneEditor";
import { Header } from "@/components/Header";
import { toast } from "sonner";

const Index = () => {
  const [project, setProject] = useState({
    name: "Untitled Project",
    lastSaved: new Date(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header project={project} setProject={setProject} />
      <main className="flex-1 p-1 md:p-2 lg:p-4 overflow-hidden">
        <GeneEditor />
      </main>
      <footer className="py-2 px-4 border-t border-border/40 text-xs text-muted-foreground">
        <div className="container flex items-center justify-between">
          <div>
            GeneForge AI — Open Source Gene Editor
          </div>
          <div className="flex items-center space-x-2">
            <a 
              href="https://github.com/your-repo/geneforge" 
              target="_blank"
              rel="noreferrer" 
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
