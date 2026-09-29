export interface RotorSearchRequest {
  cipher: string;
  rotors: string;
  allOrders: boolean;
  reflector: string;
  rings: string;
  plugs: string;
}

export interface RotorCandidate {
  rotors: string;
  position: string;
  text: string;
  entropy: number;
  description: string;
}

export interface RotorSearchResult {
  letterCount: number;
  cipherEntropy: number;
  randomEntropy: number;
  searchedSettings: number;
  candidates: RotorCandidate[];
}

export type RotorSearchMessage =
  | { kind: 'progress'; completedOrders: number; totalOrders: number }
  | { kind: 'result'; result: RotorSearchResult }
  | { kind: 'error'; message: string };
