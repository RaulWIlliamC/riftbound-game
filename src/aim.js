// Facing can use the character center; projectile trajectories must use the muzzle.
export function aimFrom(origin,target,fallback=0){
 const dx=target.x-origin.x,dy=target.y-origin.y;
 return Math.hypot(dx,dy)<1e-8?fallback:Math.atan2(dy,dx);
}
