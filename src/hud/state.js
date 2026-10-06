// Development presentation values only: this does not implement resources or spells.
export function createHudState() {
  return {currentHealth:100,maxHealth:100,currentMana:200,maxMana:200,
    abilities:[1,2,3].map(key=>({key,name:`Spell ${key}`,available:false,cooldown:0,cooldownDuration:0})),
    ascendProgress:0,ascendReady:false};
}
export function resourceRatio(current,max) {
  if(!Number.isFinite(max)||max<=0)return 0;
  return Math.max(0,Math.min(1,(Number.isFinite(current)?current:0)/max));
}
export function abilityState(ability) {
  if(!ability?.available)return 'unavailable';
  return ability.cooldown>0?'cooldown':'ready';
}
export function ascendState(progress,ready) {
  const ratio=resourceRatio(progress,100);
  return {ratio,ready:ratio===1 && (ready ?? true)};
}
