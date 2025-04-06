
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadButtonProps {
  onUpload: (content: string) => void;
}

export function UploadButton({ onUpload }: UploadButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    
    try {
      // Check if file type is supported
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (fileExt !== 'txt' && fileExt !== 'fasta' && fileExt !== 'fa' && fileExt !== 'gb') {
        toast.error("Unsupported file type. Please upload .txt, .fasta, .fa, or .gb files.");
        setIsLoading(false);
        return;
      }
      
      // Read the file content
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onUpload(content);
        } else {
          toast.error("Failed to read file");
        }
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        toast.error("Error reading file");
        setIsLoading(false);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      setIsLoading(false);
    }
    
    // Clear the input value to allow uploading the same file again
    e.target.value = '';
  };

  return (
    <div className="relative">
      <input
        type="file"
        id="file-upload"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
        accept=".txt,.fasta,.fa,.gb"
        disabled={isLoading}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isLoading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
