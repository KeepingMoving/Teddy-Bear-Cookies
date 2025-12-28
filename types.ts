export enum GameState {
  INTRO = 'INTRO',
  PARTY = 'PARTY',
  SHATTER = 'SHATTER',
  DARKNESS = 'DARKNESS',
  REPAIR = 'REPAIR',
  ENDING = 'ENDING'
}

export interface DialogueNode {
  id: string;
  text: string;
  options?: {
    text: string;
    nextId: string;
    action?: 'crack' | 'shatter';
  }[];
}

export interface Shard {
  id: number;
  x: number;
  y: number;
  rotation: number;
  isLocked: boolean;
  targetX: number; // For the puzzle phase
  targetY: number;
  width: number;
  height: number;
  path: string; // SVG path for the shard
  affirmation: string; // Text revealed when collected/placed
}

export interface Point {
  x: number;
  y: number;
}

export interface Firefly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  message: string;
}