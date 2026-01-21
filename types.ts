
export interface Pixel {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  glow: string;
  isHeavy?: boolean;
  outsideSince?: number; // Timestamp when pixel first went out of bounds
}

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

export interface VacuumState {
  active: boolean;
  x: number;
  y: number;
}

export interface Upgrades {
  power: number;
  size: number;
}

export interface GameState {
  level: number;
  coins: number;
  upgrades: Upgrades;
  turboCost?: number;
}

export interface AnnouncementState {
  show: boolean;
  level: number;
}
