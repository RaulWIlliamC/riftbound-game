import {NO_COOLDOWNS} from './testing.js?v=progression-1';
export const FIRST_SPELL_DAMAGE=55;
export const BASE_ATTACK_COOLDOWN=.3;
export const CHARGED_M1_COOLDOWN=.75;
export const DASH_COOLDOWN=1;
// Normal-mode values. Ultimate entries are saved for future implementation.
export const SPELL_COOLDOWNS=Object.freeze({
 fire:Object.freeze([3,6,17.5]),
 earth:Object.freeze([3,3.5,20]),
 water:Object.freeze([2.5,5,17.5]),
 lightning:Object.freeze([3,5,17.5]),
 wind:Object.freeze([2.5,7,20])
});
export const effectiveCooldown=(seconds,noCooldowns=NO_COOLDOWNS)=>noCooldowns?0:seconds;
export const attackCooldown=(noCooldowns=NO_COOLDOWNS)=>effectiveCooldown(BASE_ATTACK_COOLDOWN,noCooldowns);
export const chargedAttackCooldown=(noCooldowns=NO_COOLDOWNS)=>effectiveCooldown(CHARGED_M1_COOLDOWN,noCooldowns);
export const firstSpellCooldown=(element,noCooldowns=NO_COOLDOWNS)=>effectiveCooldown(SPELL_COOLDOWNS[element]?.[0]??3,noCooldowns);
export const secondSpellCooldown=(element,noCooldowns=NO_COOLDOWNS)=>effectiveCooldown(SPELL_COOLDOWNS[element]?.[1]??5,noCooldowns);
export const ultimateCooldown=(element,noCooldowns=NO_COOLDOWNS)=>effectiveCooldown(SPELL_COOLDOWNS[element]?.[2]??17.5,noCooldowns);
