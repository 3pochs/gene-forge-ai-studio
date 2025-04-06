
import { useState, useEffect } from "react";
import { calculateGCContent, countBases, findORFs } from "@/lib/sequenceUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SequenceStatsProps {
  sequence: string;
  sequenceType: "dna" | "rna" | "protein" | "unknown";
  annotations: any[];
}

export function SequenceStats({ sequence, sequenceType, annotations }: SequenceStatsProps) {
  const [stats, setStats] = useState({
    length: 0,
    gcContent: 0,
    baseCounts: {} as Record<string, number>,
    orfs: [] as { start: number; end: number; length: number }[],
  });

  useEffect(() => {
    if (!sequence) return;
    
    const length = sequence.length;
    let gcContent = 0;
    let baseCounts = {};
    let orfs = [];
    
    if (sequenceType === "dna" || sequenceType === "rna") {
      gcContent = calculateGCContent(sequence);
      baseCounts = countBases(sequence, sequenceType);
      
      if (sequenceType === "dna") {
        orfs = findORFs(sequence);
      }
    } else if (sequenceType === "protein") {
      // Count amino acids
      baseCounts = countBases(sequence, "protein");
    }
    
    setStats({
      length,
      gcContent,
      baseCounts,
      orfs,
    });
  }, [sequence, sequenceType]);

  if (!sequence) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sequence data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-secondary/50 p-3 rounded-lg">
          <div className="text-sm font-medium text-muted-foreground">Length</div>
          <div className="text-2xl font-bold">{stats.length} bp</div>
        </div>
        
        {(sequenceType === "dna" || sequenceType === "rna") && (
          <div className="bg-secondary/50 p-3 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">GC Content</div>
            <div className="text-2xl font-bold">{stats.gcContent.toFixed(1)}%</div>
            <Progress value={stats.gcContent} className="h-1.5 mt-2" />
          </div>
        )}
        
        <div className="bg-secondary/50 p-3 rounded-lg">
          <div className="text-sm font-medium text-muted-foreground">Annotations</div>
          <div className="text-2xl font-bold">{annotations.length}</div>
        </div>
        
        {sequenceType === "dna" && (
          <div className="bg-secondary/50 p-3 rounded-lg">
            <div className="text-sm font-medium text-muted-foreground">ORFs Found</div>
            <div className="text-2xl font-bold">{stats.orfs.length}</div>
          </div>
        )}
      </div>
      
      {/* Base composition */}
      <div>
        <h3 className="text-sm font-medium mb-2">Base Composition</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {Object.entries(stats.baseCounts).map(([base, count]) => {
            const percentage = (count / stats.length) * 100;
            return (
              <div key={base} className="p-2 bg-secondary/30 rounded text-center">
                <div className="text-xs font-medium">{base}</div>
                <div className="text-sm font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">
                  {percentage.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* ORFs for DNA */}
      {sequenceType === "dna" && stats.orfs.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Open Reading Frames</h3>
          <div className="max-h-40 overflow-y-auto rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Length</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.orfs.map((orf, index) => (
                  <TableRow key={index}>
                    <TableCell>{orf.start + 1}</TableCell>
                    <TableCell>{orf.end}</TableCell>
                    <TableCell>{orf.length} bp</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
