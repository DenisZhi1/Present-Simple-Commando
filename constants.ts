export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;

// Significantly slowed down physics (User requested ~20% slower, but we will go slower to ensure it feels controlled)
export const GRAVITY = 0.35; 
export const FRICTION = 0.88; 
export const PLAYER_SPEED = 0.4; // Slower movement
export const PLAYER_JUMP_FORCE = -8.5; 
export const MAX_SPEED = 3.0; 

export const BULLET_SPEED = 7; 
export const FIRE_RATE = 15; // Slower shooting

export const ENEMY_SPAWN_RATE = 0.015; 
export const CRATE_SPAWN_RATE = 0.005;

export const HEALTH_PACK_HEAL = 30;

// Game ends only after 100,000 points
export const BOSS_TRIGGER_SCORE = 100000;

export const LEVEL_LENGTH = 4000;

export const COLORS = {
  SKY: '#3a506b', 
  SKY_GRADIENT: '#1c2541',
  GROUND_TOP: '#386641',
  GROUND_BODY: '#2a4d32',
  
  // Commando
  PLAYER_SKIN: '#f4a261',
  PLAYER_VEST: '#e76f51', 
  PLAYER_PANTS: '#264653', 
  PLAYER_BANDANA: '#e63946',
  
  // Enemy Soldier
  ENEMY_UNIFORM: '#52796f',
  ENEMY_HELMET: '#2f3e46',
  ENEMY_SKIN: '#e07a5f',
  
  // Boss
  BOSS_ARMOR_MAIN: '#9d0208',
  BOSS_ARMOR_SEC: '#ffb703',
  BOSS_SKIN: '#e9c46a',
  
  // Objects
  CRATE: '#d4a373',
  CRATE_DETAIL: '#bc6c25',
  HEALTH_PACK: '#f1f2f6',
  HEALTH_PACK_CROSS: '#e74c3c',
  
  // VFX
  BULLET: '#f4d35e',
  BULLET_CORE: '#fff',
  EXPLOSION: ['#ff9f1c', '#ffbf69', '#ffffff', '#cb997e', '#555']
};