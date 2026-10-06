import {artPoint,ART} from './layout.js';
const center=artPoint(798,190),entrance=artPoint(791,293);
export function nearRift(player){return Math.hypot(player.x-entrance.x,player.y-entrance.y)<120*ART.scale;}
export function hitsRift(point){return ((point.x-center.x)/(110*ART.scale))**2+((point.y-center.y)/(130*ART.scale))**2<=1;}
export function approachRift(current,near,dt){return current+((near?1:0)-current)*(1-Math.exp(-8*dt));}
