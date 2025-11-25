import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, Entity, EntityType, Vector, Particle, QuizQuestion } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, PLAYER_SPEED, PLAYER_JUMP_FORCE, BULLET_SPEED, FIRE_RATE, ENEMY_SPAWN_RATE, CRATE_SPAWN_RATE, COLORS, BOSS_TRIGGER_SCORE, MAX_SPEED, HEALTH_PACK_HEAL } from '../constants';
import { getBossTaunt } from '../services/geminiService';

// --- Quiz Data ---
const QUIZ_BANK: QuizQuestion[] = [
  { question: "She ___ to school every day.", options: ["go", "goes", "going"], correctIndex: 1 },
  { question: "They ___ playing football.", options: ["like", "likes", "liking"], correctIndex: 0 },
  { question: "He ___ not eat pizza.", options: ["do", "does", "is"], correctIndex: 1 },
  { question: "The sun ___ in the east.", options: ["rise", "rises", "rising"], correctIndex: 1 },
  { question: "We ___ usually sleep late.", options: ["do", "does", "are"], correctIndex: 0 },
  { question: "My cat ___ fish.", options: ["love", "loves", "loving"], correctIndex: 1 },
  { question: "___ you speak English?", options: ["Do", "Does", "Is"], correctIndex: 0 },
  { question: "It ___ rain often here.", options: ["don't", "doesn't", "isn't"], correctIndex: 1 },
  { question: "Where ___ she live?", options: ["do", "does", "is"], correctIndex: 1 },
  { question: "I ___ happy today.", options: ["am", "is", "are"], correctIndex: 0 },
];

const getRandomQuiz = (): QuizQuestion => {
  return QUIZ_BANK[Math.floor(Math.random() * QUIZ_BANK.length)];
};

// --- Rendering Helpers ---

const drawRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
};

const drawPlayer = (ctx: CanvasRenderingContext2D, e: Entity, camX: number) => {
  const x = e.pos.x - camX;
  const y = e.pos.y;
  const w = e.size.x;
  const h = e.size.y;
  const dir = e.facingRight ? 1 : -1;
  const bob = e.state === 'RUN' ? Math.sin(e.frame * 0.5) * 2 : 0;

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(dir, 1);
  ctx.translate(-w / 2, -h / 2);

  // Legs (Animated)
  ctx.fillStyle = COLORS.PLAYER_PANTS;
  if (e.state === 'RUN') {
    const legOffset = Math.sin(e.frame * 0.5) * 10;
    drawRect(ctx, 5 + legOffset, 30, 8, 20, COLORS.PLAYER_PANTS); // Back leg
    drawRect(ctx, 15 - legOffset, 30, 8, 20, COLORS.PLAYER_PANTS); // Front leg
  } else if (e.state === 'JUMP') {
     drawRect(ctx, 5, 25, 8, 15, COLORS.PLAYER_PANTS);
     drawRect(ctx, 15, 32, 8, 15, COLORS.PLAYER_PANTS);
  } else {
    drawRect(ctx, 5, 30, 8, 20, COLORS.PLAYER_PANTS);
    drawRect(ctx, 17, 30, 8, 20, COLORS.PLAYER_PANTS);
  }

  // Torso
  drawRect(ctx, 5, 15 + bob, 20, 18, COLORS.PLAYER_VEST);
  // Belt
  drawRect(ctx, 5, 28 + bob, 20, 4, '#333');

  // Arms & Gun
  // Back arm
  drawRect(ctx, -2, 18 + bob, 8, 8, COLORS.PLAYER_SKIN);
  
  // Heavy Machine Gun
  ctx.fillStyle = '#111';
  drawRect(ctx, 10, 20 + bob, 25, 8, '#111'); // Barrel
  drawRect(ctx, 8, 25 + bob, 10, 6, '#333'); // Body
  drawRect(ctx, 35, 26 + bob, 4, 6, '#000'); // Muzzle
  drawRect(ctx, 15, 28 + bob, 6, 8, '#543'); // Grip

  // Front arm
  drawRect(ctx, 12, 18 + bob, 12, 6, COLORS.PLAYER_SKIN); // Shoulder
  drawRect(ctx, 20, 22 + bob, 8, 6, COLORS.PLAYER_SKIN); // Forearm

  // Head
  drawRect(ctx, 6, 0 + bob, 18, 18, COLORS.PLAYER_SKIN);
  // Bandana
  drawRect(ctx, 6, 2 + bob, 18, 5, COLORS.PLAYER_BANDANA);
  // Bandana tails
  if (e.facingRight) {
     drawRect(ctx, -5 + Math.sin(e.frame) * 3, 2 + bob, 10, 3, COLORS.PLAYER_BANDANA);
  }

  // Face
  ctx.fillStyle = '#000';
  drawRect(ctx, 16, 6 + bob, 2, 2, '#000'); // Eye

  ctx.restore();
};

const drawEnemy = (ctx: CanvasRenderingContext2D, e: Entity, camX: number) => {
  const x = e.pos.x - camX;
  const y = e.pos.y;
  const w = e.size.x;
  const h = e.size.y;
  const dir = e.facingRight ? 1 : -1;
  const bob = Math.abs(Math.sin(e.frame * 0.3) * 2);

  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(dir, 1);
  ctx.translate(-w / 2, -h / 2);

  // Legs
  ctx.fillStyle = COLORS.ENEMY_UNIFORM;
  if (e.state === 'RUN') {
      const legO = Math.sin(e.frame * 0.3) * 8;
      drawRect(ctx, 8 + legO, 30, 8, 20, '#2f3e46');
      drawRect(ctx, 18 - legO, 30, 8, 20, '#2f3e46');
  } else {
      drawRect(ctx, 8, 30, 8, 20, '#2f3e46');
      drawRect(ctx, 18, 30, 8, 20, '#2f3e46');
  }

  // Body
  drawRect(ctx, 8, 15 + bob, 18, 18, COLORS.ENEMY_UNIFORM);
  // Backpack
  drawRect(ctx, 2, 16 + bob, 6, 14, '#222');

  // Head
  drawRect(ctx, 10, 2 + bob, 14, 14, COLORS.ENEMY_SKIN);
  // Helmet
  drawRect(ctx, 8, 0 + bob, 18, 6, COLORS.ENEMY_HELMET);
  drawRect(ctx, 9, -2 + bob, 16, 3, COLORS.ENEMY_HELMET);
  
  // Gun (Rifle)
  ctx.fillStyle = '#111';
  drawRect(ctx, 5, 22 + bob, 25, 4, '#000');
  drawRect(ctx, 10, 26 + bob, 4, 6, '#543'); // Grip

  ctx.restore();
};

const drawBoss = (ctx: CanvasRenderingContext2D, e: Entity, camX: number) => {
    const x = e.pos.x - camX;
    const y = e.pos.y;
    const dir = e.facingRight ? 1 : -1;
    
    ctx.save();
    ctx.translate(x + e.size.x / 2, y + e.size.y / 2);
    ctx.scale(dir, 1);
    ctx.translate(-e.size.x / 2, -e.size.y / 2);

    // Big Samurai Armor
    // Legs
    ctx.fillStyle = '#111';
    drawRect(ctx, 10, 60, 15, 30, '#111'); // Back
    drawRect(ctx, 35, 60, 15, 30, '#111'); // Front
    
    // Thigh Armor
    ctx.fillStyle = COLORS.BOSS_ARMOR_MAIN;
    drawRect(ctx, 8, 55, 19, 15, COLORS.BOSS_ARMOR_MAIN);
    drawRect(ctx, 33, 55, 19, 15, COLORS.BOSS_ARMOR_MAIN);

    // Torso Armor
    drawRect(ctx, 10, 20, 40, 40, COLORS.BOSS_ARMOR_MAIN);
    drawRect(ctx, 15, 25, 30, 30, COLORS.BOSS_ARMOR_SEC); // Gold inlay

    // Shoulders
    drawRect(ctx, 0, 15, 15, 20, COLORS.BOSS_ARMOR_MAIN);
    drawRect(ctx, 45, 15, 15, 20, COLORS.BOSS_ARMOR_MAIN);

    // Head/Helmet
    drawRect(ctx, 20, -5, 20, 25, '#000'); // Shadow face
    // Kabuto Helmet
    drawRect(ctx, 15, -15, 30, 15, COLORS.BOSS_ARMOR_MAIN);
    drawRect(ctx, 10, -5, 40, 5, COLORS.BOSS_ARMOR_SEC); // Rim
    // Horns
    drawRect(ctx, 25, -25, 10, 10, COLORS.BOSS_ARMOR_SEC); // Crest

    // Katana
    if (e.state === 'ATTACK') {
        // Swing
        ctx.fillStyle = '#eee';
        drawRect(ctx, -20, 40, 80, 5, '#fff'); // Blade blur
    } else {
        // Holding
        drawRect(ctx, 40, 40, 60, 4, '#ccc'); // Blade
        drawRect(ctx, 40, 38, 5, 8, COLORS.BOSS_ARMOR_SEC); // Tsuba
        drawRect(ctx, 30, 40, 10, 4, '#000'); // Hilt
    }

    ctx.restore();
};

const drawCrate = (ctx: CanvasRenderingContext2D, e: Entity, camX: number) => {
    const x = e.pos.x - camX;
    const y = e.pos.y;
    
    ctx.fillStyle = COLORS.CRATE;
    drawRect(ctx, x, y, e.size.x, e.size.y, COLORS.CRATE);
    
    // Wood details
    ctx.fillStyle = COLORS.CRATE_DETAIL;
    drawRect(ctx, x, y, e.size.x, 4, COLORS.CRATE_DETAIL); // Top border
    drawRect(ctx, x, y + e.size.y - 4, e.size.x, 4, COLORS.CRATE_DETAIL); // Bottom border
    drawRect(ctx, x, y, 4, e.size.y, COLORS.CRATE_DETAIL); // Left border
    drawRect(ctx, x + e.size.x - 4, y, 4, e.size.y, COLORS.CRATE_DETAIL); // Right border
    
    // Cross
    ctx.beginPath();
    ctx.moveTo(x + 4, y + 4);
    ctx.lineTo(x + e.size.x - 4, y + e.size.y - 4);
    ctx.moveTo(x + e.size.x - 4, y + 4);
    ctx.lineTo(x + 4, y + e.size.y - 4);
    ctx.strokeStyle = COLORS.CRATE_DETAIL;
    ctx.lineWidth = 4;
    ctx.stroke();
};

const drawHealthPack = (ctx: CanvasRenderingContext2D, e: Entity, camX: number) => {
  const x = e.pos.x - camX;
  const y = e.pos.y;
  
  // White Box
  ctx.fillStyle = COLORS.HEALTH_PACK;
  drawRect(ctx, x, y, e.size.x, e.size.y, COLORS.HEALTH_PACK);
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, e.size.x, e.size.y);

  // Red Cross
  ctx.fillStyle = COLORS.HEALTH_PACK_CROSS;
  const cw = e.size.x * 0.6;
  const ch = e.size.y * 0.2;
  const cx = x + (e.size.x - cw) / 2;
  const cy = y + (e.size.y - ch) / 2;
  
  drawRect(ctx, cx, cy, cw, ch, COLORS.HEALTH_PACK_CROSS); // Horiz
  drawRect(ctx, x + (e.size.x - ch)/2, y + (e.size.y - cw)/2, ch, cw, COLORS.HEALTH_PACK_CROSS); // Vert
};

const drawEnvironment = (ctx: CanvasRenderingContext2D, camX: number) => {
    // Sky
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, COLORS.SKY_GRADIENT);
    gradient.addColorStop(1, COLORS.SKY);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Distant Jungle (Parallax slow)
    ctx.fillStyle = '#1e3a3a';
    for (let i = 0; i < 20; i++) {
        const x = (i * 100 - (camX * 0.2)) % (CANVAS_WIDTH + 200);
        const h = 100 + Math.sin(i) * 50;
        ctx.fillRect(x - 100, CANVAS_HEIGHT - h - 50, 120, h + 50);
    }

    // Mid Jungle (Parallax medium)
    ctx.fillStyle = '#2d4d3d';
    for (let i = 0; i < 15; i++) {
        const x = (i * 150 - (camX * 0.5)) % (CANVAS_WIDTH + 300);
        const h = 80 + Math.cos(i * 1.5) * 40;
        ctx.beginPath();
        ctx.moveTo(x - 50, CANVAS_HEIGHT - 50);
        ctx.lineTo(x + 20, CANVAS_HEIGHT - h - 50);
        ctx.lineTo(x + 90, CANVAS_HEIGHT - 50);
        ctx.fill();
    }

    // Ground
    ctx.fillStyle = COLORS.GROUND_TOP;
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 10);
    ctx.fillStyle = COLORS.GROUND_BODY;
    ctx.fillRect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
    
    // Grass detail
    ctx.fillStyle = '#4a7c59';
    for(let i=0; i<CANVAS_WIDTH; i+=20) {
        const offset = (camX % 20);
        drawRect(ctx, i - offset, CANVAS_HEIGHT - 54, 4, 4, '#4a7c59');
    }
};

const checkCollision = (r1: Entity, r2: Entity) => {
  return (
    r1.pos.x < r2.pos.x + r2.size.x &&
    r1.pos.x + r1.size.x > r2.pos.x &&
    r1.pos.y < r2.pos.y + r2.size.y &&
    r1.pos.y + r1.size.y > r2.pos.y
  );
};

const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    gameOver: false,
    victory: false,
    score: 0,
    killCount: 0,
    activeQuiz: null,
    bossActive: false,
    cameraX: 0,
    entities: [],
    particles: [],
    bossDialogue: null
  });

  const stateRef = useRef<GameState>({ ...gameState });
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const requestRef = useRef<number | undefined>(undefined);
  const lastShotTime = useRef<number>(0);
  const frameCount = useRef<number>(0);

  // Initialize Game
  const initGame = useCallback(() => {
    const player: Entity = {
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x: 50, y: 300 },
      vel: { x: 0, y: 0 },
      size: { x: 30, y: 50 },
      hp: 100,
      maxHp: 100,
      facingRight: true,
      state: 'IDLE',
      stateTimer: 0,
      isGrounded: false,
      frame: 0
    };

    stateRef.current = {
      isPlaying: true,
      gameOver: false,
      victory: false,
      score: 0,
      killCount: 0,
      activeQuiz: null,
      bossActive: false,
      cameraX: 0,
      entities: [player],
      particles: [],
      bossDialogue: null
    };
    setGameState({ ...stateRef.current });
    frameCount.current = 0;
  }, []);

  const handleQuizResponse = (choiceIndex: number) => {
    if (!stateRef.current.activeQuiz) return;

    const quiz = stateRef.current.activeQuiz;
    const isCorrect = choiceIndex === quiz.correctIndex;
    const camX = stateRef.current.cameraX;

    if (isCorrect) {
        stateRef.current.score += 1000;
        // Maybe some healing?
        // const player = stateRef.current.entities.find(e => e.type === EntityType.PLAYER);
        // if (player) player.hp = Math.min(player.maxHp, player.hp + 20);
    } else {
        // Spawn 2 extra enemies on wrong answer
        for(let i=0; i<2; i++) {
             stateRef.current.entities.push({
                id: `e-punish-${Math.random()}`,
                type: EntityType.ENEMY_SOLDIER,
                pos: { x: camX + CANVAS_WIDTH + 50 + (i * 40), y: 340 },
                vel: { x: 0, y: 0 },
                size: { x: 30, y: 50 },
                hp: 30, maxHp: 30,
                facingRight: false, state: 'RUN', stateTimer: 0,
                frame: 0, cooldown: 100
            });
        }
    }

    stateRef.current.activeQuiz = null; // Close quiz
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
        keysRef.current[e.code] = true; 

        // Quiz Handling
        if (stateRef.current.activeQuiz) {
            if (e.key === '1') handleQuizResponse(0);
            if (e.key === '2') handleQuizResponse(1);
            if (e.key === '3') handleQuizResponse(2);
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const triggerBossTaunt = async (situation: 'intro' | 'damage' | 'death') => {
    if (Math.random() > 0.4 && situation === 'damage') return; 
    
    const text = await getBossTaunt(stateRef.current.score, situation);
    stateRef.current.bossDialogue = text;
    setTimeout(() => {
        if (stateRef.current.bossDialogue === text) {
            stateRef.current.bossDialogue = null;
        }
    }, 3500);
  };

  const spawnExplosion = (pos: Vector, count: number = 10, large = false) => {
      const numParticles = large ? count * 2 : count;
      for(let i=0; i<numParticles; i++) {
        const size = large ? Math.random() * 8 + 4 : Math.random() * 4 + 2;
        stateRef.current.particles.push({
            id: `p-${Math.random()}`,
            type: EntityType.PARTICLE,
            pos: { x: pos.x + (Math.random() * 20 - 10), y: pos.y + (Math.random() * 20 - 10) },
            vel: { x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 },
            size: { x: size, y: size },
            color: COLORS.EXPLOSION[Math.floor(Math.random() * COLORS.EXPLOSION.length)],
            hp: 0, maxHp: 0, facingRight: true, state: 'IDLE', stateTimer: 0,
            lifetime: 40 + Math.random() * 20,
            frame: 0
        });
      }
  };

  // Main Game Loop
  const update = useCallback((time: number) => {
    if (!stateRef.current.isPlaying || stateRef.current.gameOver || stateRef.current.victory) {
        draw(stateRef.current);
        requestRef.current = requestAnimationFrame(update);
        return;
    }

    // PAUSE if Quiz is Active
    if (stateRef.current.activeQuiz) {
        draw(stateRef.current); // Keep drawing
        requestRef.current = requestAnimationFrame(update);
        return; 
    }

    const state = stateRef.current;
    frameCount.current++;
    
    // --- Spawning Logic ---
    const camX = state.cameraX;
    const player = state.entities.find(e => e.type === EntityType.PLAYER);

    // Spawn Enemies
    if (!state.bossActive && state.score < BOSS_TRIGGER_SCORE && Math.random() < ENEMY_SPAWN_RATE) {
        // Only spawn if less than 6 enemies
        const enemies = state.entities.filter(e => e.type === EntityType.ENEMY_SOLDIER).length;
        if (enemies < 6) {
            const spawnX = camX + CANVAS_WIDTH + 50; // Offscreen right
            state.entities.push({
                id: `e-${Math.random()}`,
                type: EntityType.ENEMY_SOLDIER,
                pos: { x: spawnX, y: 340 }, // Ground level-ish
                vel: { x: 0, y: 0 },
                size: { x: 30, y: 50 },
                hp: 30, maxHp: 30,
                facingRight: false, state: 'RUN', stateTimer: 0,
                frame: 0, cooldown: 100
            });
        }
    }

    // Spawn Crates
    if (!state.bossActive && Math.random() < CRATE_SPAWN_RATE) {
         const spawnX = camX + CANVAS_WIDTH + 100;
         state.entities.push({
             id: `c-${Math.random()}`,
             type: EntityType.CRATE,
             pos: { x: spawnX, y: 350 },
             vel: { x: 0, y: 0 },
             size: { x: 40, y: 40 },
             hp: 10, maxHp: 10,
             facingRight: true, state: 'IDLE', stateTimer: 0, frame: 0
         });
    }

    // Boss Trigger
    if (!state.bossActive && state.score >= BOSS_TRIGGER_SCORE) {
        state.bossActive = true;
        state.entities.push({
            id: 'boss',
            type: EntityType.BOSS,
            pos: { x: camX + CANVAS_WIDTH - 100, y: 290 },
            vel: { x: 0, y: 0 },
            size: { x: 60, y: 90 },
            hp: 500, maxHp: 500,
            facingRight: false, state: 'IDLE', stateTimer: 0,
            frame: 0, cooldown: 150
        });
        triggerBossTaunt('intro');
    }

    if (player) {
        // Animation Frame Counter
        if (frameCount.current % 6 === 0) player.frame++; // Slower animation

        // Movement
        let moving = false;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
            player.vel.x += PLAYER_SPEED;
            player.facingRight = true;
            moving = true;
        }
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
            player.vel.x -= PLAYER_SPEED;
            player.facingRight = false;
            moving = true;
        }
        
        player.state = !player.isGrounded ? 'JUMP' : (moving ? 'RUN' : 'IDLE');

        // Jump Logic Update - Check before physics apply
        if ((keysRef.current['Space'] || keysRef.current['ArrowUp'] || keysRef.current['KeyW']) && player.isGrounded) {
            player.vel.y = PLAYER_JUMP_FORCE;
            player.isGrounded = false;
        }

        // Shooting
        if (keysRef.current['KeyZ'] || keysRef.current['KeyJ']) {
             if (frameCount.current - lastShotTime.current > FIRE_RATE) {
                 lastShotTime.current = frameCount.current;
                 // Recoil
                 player.vel.x += player.facingRight ? -1 : 1;
                 
                 // Shoot Sound effect placeholder
                 state.entities.push({
                     id: `b-${Math.random()}`,
                     type: EntityType.BULLET_PLAYER,
                     pos: { x: player.pos.x + (player.facingRight ? player.size.x : -10), y: player.pos.y + 24 },
                     vel: { x: player.facingRight ? BULLET_SPEED : -BULLET_SPEED, y: 0 }, // Flat trajectory
                     size: { x: 12, y: 6 },
                     hp: 1, maxHp: 1, facingRight: player.facingRight, state: 'IDLE', stateTimer: 0,
                     lifetime: 80, frame: 0
                 });
             }
        }

        // Physics
        player.vel.x *= FRICTION;
        player.vel.y += GRAVITY;
        player.vel.x = Math.max(Math.min(player.vel.x, MAX_SPEED), -MAX_SPEED);

        // Position Updates FIRST
        player.pos.x += player.vel.x;
        player.pos.y += player.vel.y;

        // Then Ground Collision
        if (player.pos.y + player.size.y >= CANVAS_HEIGHT - 50) {
            player.pos.y = CANVAS_HEIGHT - 50 - player.size.y;
            // Only stop downward velocity
            if (player.vel.y > 0) {
                 player.vel.y = 0;
                 player.isGrounded = true;
            }
        } else {
            // In air
             player.isGrounded = false;
        }

        // Camera Logic
        if (player.pos.x > state.cameraX + CANVAS_WIDTH * 0.3) {
            state.cameraX += (player.pos.x - (state.cameraX + CANVAS_WIDTH * 0.3)) * 0.1;
        }
        
        // Bounds
        if (player.pos.x < state.cameraX) player.pos.x = state.cameraX;
    }

    // Entity Updates
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const e = state.entities[i];
        if (e.type === EntityType.PLAYER) continue;

        e.frame++;
        
        // No gravity for bullets
        const isBullet = e.type === EntityType.BULLET_PLAYER || e.type === EntityType.BULLET_ENEMY;
        
        if (e.type !== EntityType.BOSS && !isBullet) { 
             e.vel.y += GRAVITY;
             
             // Ground collision for enemies/crates/items
             if (e.pos.y + e.size.y >= CANVAS_HEIGHT - 50) {
                 e.pos.y = CANVAS_HEIGHT - 50 - e.size.y;
                 e.vel.y = 0;
                 e.isGrounded = true;
             }
             e.pos.x += e.vel.x;
             e.pos.y += e.vel.y;
        } else if (isBullet) {
             e.pos.x += e.vel.x;
             e.pos.y += e.vel.y;
        } else if (e.type === EntityType.BOSS) {
             // Boss logic handled in AI block
             e.vel.y += GRAVITY;
             e.pos.x += e.vel.x;
             e.pos.y += e.vel.y;
             if (e.pos.y + e.size.y >= CANVAS_HEIGHT - 50) {
                 e.pos.y = CANVAS_HEIGHT - 50 - e.size.y;
                 e.vel.y = 0;
             }
        }

        // Enemy AI
        if (e.type === EntityType.ENEMY_SOLDIER && player) {
            const dist = player.pos.x - e.pos.x;
            
            e.facingRight = dist > 0;
            
            // Move if far
            if (Math.abs(dist) > 200) {
                e.vel.x = dist > 0 ? 0.7 : -0.7; // Slower enemies too
                e.state = 'RUN';
            } else {
                e.vel.x = 0;
                e.state = 'IDLE';
                // Shoot
                if (Math.abs(dist) < 300 && frameCount.current % 150 === 0 && Math.random() > 0.3) { // Slower shooting
                     state.entities.push({
                         id: `be-${Math.random()}`,
                         type: EntityType.BULLET_ENEMY,
                         pos: { x: e.pos.x + (e.facingRight ? e.size.x : 0), y: e.pos.y + 20 },
                         vel: { x: e.facingRight ? BULLET_SPEED * 0.8 : -BULLET_SPEED * 0.8, y: 0 },
                         size: { x: 14, y: 8 }, // Larger enemy bullets
                         hp: 1, maxHp: 1, facingRight: e.facingRight, state: 'IDLE', stateTimer: 0,
                         lifetime: 100, frame: 0
                     });
                }
            }
        }

        // Boss AI
        if (e.type === EntityType.BOSS && player) {
             const dist = player.pos.x - e.pos.x;
             e.facingRight = dist > 0;
             e.stateTimer--;

             // Simple pattern: Follow -> Attack -> Wait
             if (e.stateTimer <= 0) {
                 const action = Math.random();
                 if (action < 0.4) { // Charge
                     e.vel.x = dist > 0 ? 2.5 : -2.5;
                     e.state = 'RUN';
                     e.stateTimer = 40;
                 } else if (action < 0.7) { // Jump attack
                     e.vel.y = -8;
                     e.vel.x = dist > 0 ? 2 : -2;
                     e.state = 'ATTACK';
                     e.stateTimer = 60;
                 } else { // Idle
                     e.vel.x = 0;
                     e.state = 'IDLE';
                     e.stateTimer = 50;
                 }
             }
        }

        // Bullet Lifetime
        if (isBullet) {
            e.lifetime = (e.lifetime || 0) - 1;
            if (e.lifetime <= 0) {
                state.entities.splice(i, 1);
                continue;
            }
        }

        // Cleanup Offscreen
        if (e.pos.x < state.cameraX - 100 && e.type !== EntityType.BOSS) {
             state.entities.splice(i, 1);
             continue;
        }
    }

    // Collisions
    const bullets = state.entities.filter(e => e.type === EntityType.BULLET_PLAYER);
    const enemyBullets = state.entities.filter(e => e.type === EntityType.BULLET_ENEMY);
    const targets = state.entities.filter(e => e.type === EntityType.ENEMY_SOLDIER || e.type === EntityType.BOSS || e.type === EntityType.CRATE);
    const healthPacks = state.entities.filter(e => e.type === EntityType.HEALTH_PACK);

    // Player vs Items
    if (player) {
         for (const hp of healthPacks) {
             if (checkCollision(player, hp)) {
                 player.hp = Math.min(player.maxHp, player.hp + HEALTH_PACK_HEAL);
                 state.entities = state.entities.filter(ent => ent.id !== hp.id);
                 // Spawn sparkle
                 spawnExplosion(player.pos, 5); 
             }
         }
    }

    // Player vs Enemy Bullets
    if (player) {
        for (const b of enemyBullets) {
            if (checkCollision(player, b)) {
                player.hp -= 10;
                spawnExplosion(player.pos);
                state.entities = state.entities.filter(ent => ent.id !== b.id);
                if (player.hp <= 0) {
                    state.gameOver = true;
                }
            }
        }
        // Player vs Boss Body
        const boss = state.entities.find(e => e.type === EntityType.BOSS);
        if (boss && checkCollision(player, boss)) {
             if (frameCount.current % 30 === 0) {
                 player.hp -= 15;
                 player.vel.x = -10; // Knockback
                 player.vel.y = -5;
                 if (player.hp <= 0) state.gameOver = true;
             }
        }
    }

    // Player Bullets vs Enemies
    for (const b of bullets) {
        for (const t of targets) {
            if (checkCollision(b, t)) {
                t.hp -= 10;
                spawnExplosion(b.pos); // Small hit effect
                // Remove bullet
                state.entities = state.entities.filter(ent => ent.id !== b.id);
                
                if (t.hp <= 0) {
                    // Entity destroyed
                    spawnExplosion(t.pos, 20, true); // Big boom
                    state.entities = state.entities.filter(ent => ent.id !== t.id);
                    state.score += (t.type === EntityType.BOSS ? 5000 : (t.type === EntityType.CRATE ? 50 : 100));
                    
                    if (t.type === EntityType.ENEMY_SOLDIER) {
                        state.killCount++;
                        // QUIZ TRIGGER: Every 10th kill
                        if (state.killCount % 10 === 0) {
                            state.activeQuiz = getRandomQuiz();
                        }
                    }

                    if (t.type === EntityType.CRATE) {
                        // Chance to drop health
                        if (Math.random() < 0.3) {
                             state.entities.push({
                                 id: `hp-${Math.random()}`,
                                 type: EntityType.HEALTH_PACK,
                                 pos: { x: t.pos.x, y: t.pos.y },
                                 vel: { x: 0, y: 0 },
                                 size: { x: 20, y: 20 },
                                 hp: 1, maxHp: 1, facingRight: true, state: 'IDLE', stateTimer: 0, frame: 0
                             });
                        }
                    }

                    if (t.type === EntityType.BOSS) {
                        state.victory = true;
                        triggerBossTaunt('death');
                    }
                } else {
                    if (t.type === EntityType.BOSS) triggerBossTaunt('damage');
                }
                break; // One bullet hits one target
            }
        }
    }

    // Particles Update
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.vel.y += GRAVITY * 0.5;
        p.lifetime--;
        p.size.x *= 0.95; // shrink
        p.size.y *= 0.95;
        if (p.lifetime <= 0) state.particles.splice(i, 1);
    }

    setGameState({ ...state });
    draw(state);
    requestRef.current = requestAnimationFrame(update);
  }, []);

  // Draw Function
  const draw = useCallback((state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Camera transform
    const camX = state.cameraX;

    // Background
    drawEnvironment(ctx, camX);

    // Entities
    // Draw Crates & Enemies first (behind player usually)
    state.entities.forEach(e => {
        if (e.type === EntityType.CRATE) drawCrate(ctx, e, camX);
        if (e.type === EntityType.HEALTH_PACK) drawHealthPack(ctx, e, camX);
        if (e.type === EntityType.ENEMY_SOLDIER) drawEnemy(ctx, e, camX);
        if (e.type === EntityType.BOSS) drawBoss(ctx, e, camX);
    });

    // Player
    const player = state.entities.find(e => e.type === EntityType.PLAYER);
    if (player) drawPlayer(ctx, player, camX);

    // Bullets
    state.entities.forEach(e => {
        if (e.type === EntityType.BULLET_PLAYER) {
            ctx.fillStyle = COLORS.BULLET;
            ctx.fillRect(e.pos.x - camX, e.pos.y, e.size.x, e.size.y);
        } else if (e.type === EntityType.BULLET_ENEMY) {
            // High visibility enemy bullets
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(e.pos.x - camX, e.pos.y, e.size.x, e.size.y);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(e.pos.x - camX, e.pos.y, e.size.x, e.size.y);
        }
    });

    // Particles
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.pos.x - camX, p.pos.y, p.size.x, p.size.y);
    });

    // --- UI Layer (No camera transform) ---
    // Scanlines
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
      ctx.fillRect(0, i, CANVAS_WIDTH, 2);
    }
    
    // Top Bar Background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 50);

    // Score
    ctx.font = '16px "Press Start 2P"';
    ctx.fillStyle = '#f1c40f';
    ctx.fillText(`SCORE: ${state.score}`, 20, 30);
    
    // Player Health Bar
    if (player) {
        const hpBarW = 200;
        const hpPct = Math.max(0, player.hp / player.maxHp);
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText("HP", 20, 44);

        // Bar Back
        ctx.fillStyle = '#333';
        ctx.fillRect(50, 32, hpBarW, 14);
        
        // Bar Fill
        ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : (hpPct > 0.25 ? '#f39c12' : '#e74c3c');
        ctx.fillRect(52, 34, (hpBarW - 4) * hpPct, 10);
        
        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 32, hpBarW, 14);
    }

    // Boss Health Bar
    if (state.bossActive) {
        const boss = state.entities.find(e => e.type === EntityType.BOSS);
        if (boss) {
            const barWidth = 400;
            const hpPct = Math.max(0, boss.hp / boss.maxHp);
            ctx.fillStyle = '#500';
            ctx.fillRect(CANVAS_WIDTH/2 - barWidth/2, CANVAS_HEIGHT - 40, barWidth, 15);
            ctx.fillStyle = '#f00';
            ctx.fillRect(CANVAS_WIDTH/2 - barWidth/2, CANVAS_HEIGHT - 40, barWidth * hpPct, 15);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(CANVAS_WIDTH/2 - barWidth/2, CANVAS_HEIGHT - 40, barWidth, 15);
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText("SAMURAI WARLORD", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
            ctx.textAlign = 'left';
        }
    }

    // Boss Dialogue Overlay
    if (state.bossDialogue) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(100, 100, CANVAS_WIDTH - 200, 80);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.strokeRect(100, 100, CANVAS_WIDTH - 200, 80);
        ctx.fillStyle = '#f1c40f';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(state.bossDialogue, CANVAS_WIDTH / 2, 145);
        ctx.textAlign = 'left';
    }

    // Quiz Overlay
    if (state.activeQuiz) {
        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);
        
        // Border
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);

        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText("TRANSMISSION INTERCEPTED", CANVAS_WIDTH / 2, 100);
        
        ctx.fillStyle = '#3498db';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText("Complete the sentence to proceed:", CANVAS_WIDTH / 2, 140);
        
        // Question
        ctx.fillStyle = '#f1c40f';
        ctx.font = '18px "Press Start 2P"';
        ctx.fillText(state.activeQuiz.question, CANVAS_WIDTH / 2, 200);

        // Options
        ctx.textAlign = 'left';
        ctx.font = '16px "Press Start 2P"';
        state.activeQuiz.options.forEach((opt, idx) => {
            ctx.fillStyle = '#fff';
            ctx.fillText(`[${idx + 1}] ${opt}`, 200, 260 + (idx * 40));
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = '#e74c3c';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText("PRESS 1, 2, or 3 on your keyboard", CANVAS_WIDTH / 2, 380);
        ctx.textAlign = 'left';
    }

    if (state.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#e74c3c';
        ctx.font = '40px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText("MISSION FAILED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = '16px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.fillText("Press RESTART in the sidebar", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        ctx.textAlign = 'left';
    }

    if (state.victory) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#2ecc71';
        ctx.font = '40px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText("MISSION COMPLETE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = '16px "Press Start 2P"';
        ctx.fillStyle = '#fff';
        ctx.fillText(`Final Score: ${state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        ctx.textAlign = 'left';
    }
  }, []);

  useEffect(() => {
    initGame();
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [initGame, update]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="block bg-black shadow-2xl border-4 border-neutral-800 rounded-lg cursor-none"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {/* Scanline overlay div for extra CRT effect */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-30 rounded-lg"></div>
    </div>
  );
};

export default GameEngine;