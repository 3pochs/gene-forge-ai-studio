// Helper function to clean gene sequences
export function cleanGeneSequence(sequence: string): string {
  // Remove whitespace, numbers, and common FASTA header characters
  let cleanedSeq = sequence.replace(/[\s\d>]/g, "");
  
  // Convert to uppercase
  cleanedSeq = cleanedSeq.toUpperCase();
  
  // Remove any other non-DNA/RNA/protein characters
  // This regex keeps only valid DNA/RNA/protein characters
  cleanedSeq = cleanedSeq.replace(/[^ATGCUNRYWSMKHBVDXPLFQZEJI]/gi, "");
  
  return cleanedSeq;
}

// Calculate GC content
export function calculateGCContent(sequence: string): number {
  if (!sequence) return 0;
  
  const cleanSeq = sequence.toUpperCase();
  const gcCount = (cleanSeq.match(/[GC]/g) || []).length;
  
  return (gcCount / cleanSeq.length) * 100;
}

// Count bases in the sequence
export function countBases(sequence: string, type: "dna" | "rna" | "protein" | "unknown"): Record<string, number> {
  if (!sequence) return {};
  
  const cleanSeq = sequence.toUpperCase();
  let counts: Record<string, number> = {};
  
  if (type === "dna") {
    counts = {
      A: 0,
      T: 0,
      G: 0,
      C: 0,
      N: 0, // For unknown bases
      Other: 0
    };
  } else if (type === "rna") {
    counts = {
      A: 0,
      U: 0,
      G: 0,
      C: 0,
      N: 0,
      Other: 0
    };
  } else if (type === "protein") {
    // All 20 standard amino acids + X for unknown
    counts = {
      A: 0, C: 0, D: 0, E: 0, F: 0,
      G: 0, H: 0, I: 0, K: 0, L: 0,
      M: 0, N: 0, P: 0, Q: 0, R: 0,
      S: 0, T: 0, V: 0, W: 0, Y: 0,
      X: 0, // Unknown
      Other: 0
    };
  } else {
    // Unknown sequence type, just count unique characters
    for (const char of cleanSeq) {
      counts[char] = (counts[char] || 0) + 1;
    }
    return counts;
  }
  
  // Count the bases/amino acids
  for (const char of cleanSeq) {
    if (char in counts) {
      counts[char]++;
    } else {
      counts.Other++;
    }
  }
  
  // Filter out zero counts
  return Object.fromEntries(
    Object.entries(counts).filter(([_, count]) => count > 0)
  );
}

// Find regions for highlighting
export function findRegions(sequence: string) {
  if (!sequence) {
    return {
      startCodons: [],
      stopCodons: [],
      restrictionSites: [],
      promoters: []
    };
  }
  
  const cleanSeq = sequence.toUpperCase();
  
  // Find start codons (ATG)
  const startCodons = findAllOccurrences(cleanSeq, "ATG").map(start => ({
    start,
    end: start + 3
  }));
  
  // Find stop codons (TAA, TAG, TGA)
  const stopCodons = [
    ...findAllOccurrences(cleanSeq, "TAA"),
    ...findAllOccurrences(cleanSeq, "TAG"),
    ...findAllOccurrences(cleanSeq, "TGA")
  ].map(start => ({
    start,
    end: start + 3
  }));
  
  // Find common restriction sites
  const restrictionSites = [
    ...findAllOccurrences(cleanSeq, "GAATTC"), // EcoRI
    ...findAllOccurrences(cleanSeq, "GGATCC"), // BamHI
    ...findAllOccurrences(cleanSeq, "AAGCTT"), // HindIII
    ...findAllOccurrences(cleanSeq, "CTGCAG"), // PstI
    ...findAllOccurrences(cleanSeq, "GTCGAC"), // SalI
    ...findAllOccurrences(cleanSeq, "TCTAGA")  // XbaI
  ].map(start => ({
    start,
    end: start + 6 // These are all 6-base cutters
  }));
  
  // Find common promoter elements
  const promoters = [
    ...findAllOccurrences(cleanSeq, "TATAAT"), // -10 box (Pribnow box)
    ...findAllOccurrences(cleanSeq, "TTGACA"), // -35 box
    ...findAllOccurrences(cleanSeq, "TATAAA")  // TATA box
  ].map(start => ({
    start,
    end: start + 6
  }));
  
  return {
    startCodons,
    stopCodons,
    restrictionSites,
    promoters
  };
}

// Helper function to find all occurrences of a pattern in a string
function findAllOccurrences(str: string, pattern: string): number[] {
  const positions: number[] = [];
  let pos = str.indexOf(pattern);
  
  while (pos !== -1) {
    positions.push(pos);
    pos = str.indexOf(pattern, pos + 1);
  }
  
  return positions;
}

// Find Open Reading Frames (ORFs)
export function findORFs(sequence: string): { start: number; end: number; length: number }[] {
  if (!sequence) return [];
  
  const cleanSeq = sequence.toUpperCase();
  const orfs: { start: number; end: number; length: number }[] = [];
  
  // Find all start codons
  const startPositions = findAllOccurrences(cleanSeq, "ATG");
  
  // For each start position, find the next in-frame stop codon
  for (const start of startPositions) {
    // Check if we can have at least one codon
    if (start + 3 > cleanSeq.length) continue;
    
    // Look for stop codons in the correct reading frame
    for (let i = start + 3; i <= cleanSeq.length - 3; i += 3) {
      const codon = cleanSeq.slice(i, i + 3);
      if (codon === "TAA" || codon === "TAG" || codon === "TGA") {
        // Found a stop codon - this is an ORF
        const end = i + 3;
        const length = end - start;
        
        // Only include ORFs of at least 30 bp (10 amino acids)
        if (length >= 30) {
          orfs.push({ start, end, length });
        }
        break;
      }
    }
  }
  
  // Sort by length, longest first
  return orfs.sort((a, b) => b.length - a.length);
}
