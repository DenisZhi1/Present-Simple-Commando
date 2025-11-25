export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY_SOLDIER = 'ENEMY_SOLDIER',
  BOSS = 'BOSS',
  BULLET_PLAYER = 'BULLET_PLAYER',
  BULLET_ENEMY = 'BULLET_ENEMY',
  PARTICLE = 'PARTICLE',
  CRATE = 'CRATE',
  HEALTH_PACK = 'HEALTH_PACK'
}

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector;
  vel: Vector;
  size: Vector;
  color?: string;
  hp: number;
  maxHp: number;
  facingRight: boolean;
  state: 'IDLE' | 'RUN' | 'JUMP' | 'ATTACK' | 'DEAD';
  stateTimer: number;
  // Specific properties
  cooldown?: number;
  lifetime?: number; // For particles/bullets
  isGrounded?: boolean;
  frame: number; // For animation cycling
}

export interface Particle extends Entity {
  color: string;
  size: Vector;
  lifetime: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number; // 0, 1, or 2
}

export interface GameState {
  isPlaying: boolean;
  gameOver: boolean;
  victory: boolean;
  score: number;
  killCount: number; // Track kills for quiz
  activeQuiz: QuizQuestion | null; // If not null, game pauses and shows quiz
  bossActive: boolean;
  cameraX: number;
  entities: Entity[];
  particles: Particle[];
  bossDialogue: string | null;
}

export enum GameKeys {
  LEFT = 'ArrowLeft',
  RIGHT = 'ArrowRight',
  UP = 'ArrowUp',
  DOWN = 'ArrowDown',
  JUMP = 'Space',
  SHOOT = 'z',
  SHOOT_ALT = 'x',
}