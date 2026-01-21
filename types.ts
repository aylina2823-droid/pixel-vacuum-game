
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
}

export interface VacuumState {
  active: boolean;
  x: number;
  y: number;
}
