import { STAFF_ATTACK_DURATION, SPELL_CAST_DURATION, SPELL_CAST_WINDUP } from './player.js?v=progression-1';
export const ROWS = { south: 0, east: 1, west: 2, north: 3 };
export function facingForAim(aim) {
  const x = Math.cos(aim), y = Math.sin(aim);
  return Math.abs(x) >= Math.abs(y) ? x >= 0 ? 'east' : 'west' : y >= 0 ? 'south' : 'north';
}
export function staffSwing(progress) {
  if (progress <= 0 || progress >= 1) return 0;
  const ease = t => t * t * (3 - 2 * t);
  if (progress < 0.24) return -0.95 * ease(progress / 0.24);
  if (progress < 0.48) return -0.95 + 3.05 * ease((progress - 0.24) / 0.24);
  if (progress < 0.64) return 2.1;
  return 2.1 * (1 - ease((progress - 0.64) / 0.36));
}
const ease = t => t*t*(3-2*t);
const SWING_POSES = {
  east: {windup:-.95, strike:Math.PI/2},
  west: {windup:.95, strike:-Math.PI/2},
  north: {windup:1.05, strike:0},
  south: {windup:-.75, strike:Math.PI}
};
export function attackReach(progress) {
  if(progress<=.24 || progress>=1)return 0;
  if(progress<.48)return ease((progress-.24)/.24);
  if(progress<.64)return 1;
  return 1-ease((progress-.64)/.36);
}
export function directionalStaffAngle(facing,progress) {
  if(progress<=0 || progress>=1)return .12;
  const {windup,strike}=SWING_POSES[facing];
  if(progress<.24)return .12+(windup-.12)*ease(progress/.24);
  if(progress<.48)return windup+(strike-windup)*ease((progress-.24)/.24);
  if(progress<.64)return strike;
  return strike+(.12-strike)*ease((progress-.64)/.36);
}
export function animationPose(player) {
  const moving = player.state !== 'idle' && (player.state !== 'charging' || Math.hypot(player.visualDirection?.x||0,player.visualDirection?.y||0)>0);
  const dashing = player.state === 'dashing';
  const running = player.state === 'running';
  const attack = player.attackTime > 0;
  const casting=player.castTime>0;
  const castProgress=casting?SPELL_CAST_DURATION-player.castTime:0;
  const castLift=casting && castProgress<SPELL_CAST_WINDUP?Math.sin(Math.PI*castProgress/SPELL_CAST_WINDUP):0;
  const castStrength=casting?(castProgress<.09?0:castProgress<SPELL_CAST_WINDUP?ease((castProgress-.09)/.09):castProgress<.34?1:1-ease((castProgress-.34)/.16)):0;
  const facing = player.spellChannel ? facingForAim(player.aim) : casting ? facingForAim(player.castAim) : attack && player.attackAim !== undefined ? facingForAim(player.attackAim) : player.hasAim ? facingForAim(player.aim) : 'south';
  const column = moving ? Math.sin(player.phase) >= 0 ? 2 : 3 : Math.floor(player.time * 1.6) % 2;
  const progress = player.attackTime > 0 ? 1 - player.attackTime / STAFF_ATTACK_DURATION : 1;
  const direction = player.visualDirection || { x: 0, y: 0 };
  const shake=(player.charging||player.spellChannel) ? Math.sin(Math.floor(player.time*30)*2.4)*(1+(player.charge||0)) : 0;
  const stride = running ? Math.sin(player.phase) : 0;
  return { casting, castStrength, castLift, stride, sprintTilt: running ? direction.x * .13 + stride * .018 : 0, row: ROWS[facing], facing, column, progress, moving, dashing, running,
    lean: Math.round(direction.x * (dashing ? 4 : running ? 3 : 0)+shake),
    bob: ((player.charging||player.spellChannel) ? 3+Math.round(shake*.5) : 0) + (moving ? -Math.abs(Math.sin(player.phase)) * (running ? 4 : 1) : Math.sin(player.time * 2.7) * 0.5),
    // The staff is carried upright. Cursor angle controls facing, never weapon rotation.
    staffAngle: player.charging ? (facing==='west'||facing==='north' ? .45 : -.45) : directionalStaffAngle(facing,progress) };
}
