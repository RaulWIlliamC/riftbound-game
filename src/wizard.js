import { animationPose, staffSwing, attackReach } from './animation.js?v=progression-1';
import { STAFF_ATTACK_DURATION } from './player.js?v=progression-1';
import {drawSpell} from './spell-art.js?v=progression-1';
import { drawOrbEffect } from './orb-effects.js?v=progression-1';
export const STAFF_RIG = { height:74, grip:{x:0.66,y:0.65}, focus:{x:0.65,y:0.163} };
let sprites;
export function setSprites(loaded) { sprites=loaded; }

export function visualPose(player, atlas=sprites) {
  const pose=animationPose(player);
  // Reuse one anatomical right-hand carry pose per direction. Generated attack
  // frames switch arms, so animate the separated right sleeve instead.
  const frame=atlas.frames[pose.row][0];
  const scale=atlas.bodyScale;
  const side=frame.hand.x<frame.width/2?-1:1;
  pose.carryHand={x:(frame.hand.x-frame.width/2)*scale+pose.lean,
    y:(frame.hand.y-frame.height)*scale+pose.bob};
  pose.shoulder={x:side*frame.width*scale*0.23+pose.lean,
    y:-frame.height*scale*0.44+pose.bob};
  const vertical=pose.facing==='north'||pose.facing==='south';
  const reach=attackReach(pose.progress);
  pose.armOffset={x:0,y:vertical?(pose.facing==='north'?-7:7)*reach:0};
  const swingArm=vertical ? -.65*reach : side*staffSwing(pose.progress)*0.65;
  pose.armAngle=(player.charging ? -side*.55 : player.releaseTime>0 ? side*.35 : 0) + swingArm + (pose.running && pose.progress===1 ? pose.stride*.20 : 0);
  pose.bodyAngle=(player.charging ? side*.06 : 0) + (vertical ? 0 : side*staffSwing(pose.progress)*0.055) + pose.sprintTilt;
  if(pose.casting){
    const strength=pose.castStrength,lift=pose.castLift,aim=player.castAim;
    pose.armAngle=-side*(.78*strength+1.25*lift);
    pose.armOffset={x:Math.cos(aim)*7*strength,y:Math.sin(aim)*6*strength-10*lift};
    pose.bodyAngle=Math.cos(aim)*(.10*strength-.06*lift);
    // Rotate the orb forward only during the authored cast, never while carrying.
    const target=aim+Math.PI/2-pose.bodyAngle;
    const turn=Math.atan2(Math.sin(target-.12),Math.cos(target-.12));
    pose.staffAngle=.12+side*.6*lift+turn*strength;
  }
  if(pose.casting && player.castStyle==='fire'){
    const t=.5-player.castTime;
    const f=Math.min(1,t/.18),strength=f*f*(3-2*f),recovery=t>.34?Math.max(0,(.5-t)/.16):1;
    const target=player.castAim+Math.PI/2;
    const turn=Math.atan2(Math.sin(target+.12),Math.cos(target+.12));
    pose.armAngle=-side*(1.65*(1-strength)+.78*strength)*recovery;
    pose.armOffset={x:(side*2*(1-strength)+Math.cos(player.castAim)*7*strength)*recovery,y:(-12*(1-strength)+Math.sin(player.castAim)*6*strength)*recovery};
    pose.bodyAngle=(side*.04*(1-strength)+Math.cos(player.castAim)*.1*strength)*recovery;
    pose.staffAngle=(-.12+turn*strength-pose.bodyAngle)*recovery+.12*(1-recovery);
  }
  if(player.spellChannel){
    const overhead=player.thirdChannel||player.spellChannel==='fire';
    pose.armAngle=-side*(overhead?1.65:.65);
    pose.armOffset={x:overhead?side*2:Math.cos(player.aim)*5,y:overhead?-12:-4};
    pose.bodyAngle=overhead?side*.04:Math.cos(player.aim)*.08;
    pose.staffAngle=overhead?-.12:player.aim+Math.PI/2-pose.bodyAngle;
    if(player.thirdChannel){const t=Math.min(1,(player.thirdCastAge||0)/.3),spin=Math.sin(t*Math.PI*2);pose.armAngle=-side*(1.65+spin*.35);pose.armOffset={x:side*(2+spin*6),y:-12-Math.sin(t*Math.PI)*8};pose.staffAngle=-.12+spin*.65;}
  }
  const dx=pose.carryHand.x-pose.shoulder.x,dy=pose.carryHand.y-pose.shoulder.y;
  pose.hand={x:pose.shoulder.x+pose.armOffset.x+dx*Math.cos(pose.armAngle)-dy*Math.sin(pose.armAngle),
    y:pose.shoulder.y+pose.armOffset.y+dx*Math.sin(pose.armAngle)+dy*Math.cos(pose.armAngle)};
  pose.staffWidth=STAFF_RIG.height*atlas.staffBounds.width/atlas.staffBounds.height;
  return pose;
}
export function getStaffTipPosition(player, atlas=sprites) {
  if(!atlas) return null;
  const pose=visualPose(player,atlas);
  const x=(STAFF_RIG.focus.x-STAFF_RIG.grip.x)*pose.staffWidth;
  const y=(STAFF_RIG.focus.y-STAFF_RIG.grip.y)*STAFF_RIG.height;
  const tx=pose.hand.x+x*Math.cos(pose.staffAngle)-y*Math.sin(pose.staffAngle);
  const ty=pose.hand.y+x*Math.sin(pose.staffAngle)+y*Math.cos(pose.staffAngle);
  const scale=player.visualScale||1;
  return {x:Math.round(player.x)+scale*(tx*Math.cos(pose.bodyAngle)-ty*Math.sin(pose.bodyAngle)),
    y:Math.round(player.y)+scale*(tx*Math.sin(pose.bodyAngle)+ty*Math.cos(pose.bodyAngle))};
}
function slice(ctx,image,frame,scale,start,end,offsetX,offsetY) {
  ctx.drawImage(image,frame.x,frame.y+frame.height*start,frame.width,frame.height*(end-start),
    -frame.width*scale/2+offsetX,-frame.height*scale*(1-start)+offsetY,
    frame.width*scale,frame.height*scale*(end-start));
}
export function drawWizard(ctx,player,alpha=1,ghost=false,atlas=sprites) {
  if(!atlas) return;
  const pose=visualPose(player,atlas);
  const variant=atlas.variants[player.element] || atlas.variants.neutral;
  const upper=atlas.frames[pose.row][0], lower=atlas.frames[pose.row][pose.column];
  ctx.save(); ctx.globalAlpha=alpha;
  ctx.translate(Math.round(player.x),Math.round(player.y));
  ctx.scale(player.visualScale||1,player.visualScale||1);
  if(!ghost) {ctx.fillStyle='#14131c';if((player.visualScale||1)!==1){ctx.save();ctx.globalAlpha=alpha*.5;ctx.shadowColor='#071b23';ctx.shadowBlur=7;ctx.beginPath();ctx.ellipse(0,1,19,5,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';}else{ctx.fillRect(-17,-2,34,7);ctx.fillRect(-12,-4,24,11);}}
  const staff=(attachment=pose)=>{
    ctx.save();ctx.translate(attachment.hand.x,attachment.hand.y);ctx.rotate(attachment.staffAngle);
    const b=atlas.staffBounds;
    ctx.drawImage(variant.staff,b.x,b.y,b.width,b.height,
      -pose.staffWidth*STAFF_RIG.grip.x,-STAFF_RIG.height*STAFF_RIG.grip.y,pose.staffWidth,STAFF_RIG.height);
    if(player.charging) {
      const grow=1.4+(player.charge||0)*1.3;
      const wobble=Math.sin(player.time*45)*(1+(player.charge||0));
      const orbW=pose.staffWidth*.39,orbH=STAFF_RIG.height*.098;
      const cx=(STAFF_RIG.focus.x-STAFF_RIG.grip.x)*pose.staffWidth+wobble;
      const cy=(STAFF_RIG.focus.y-STAFF_RIG.grip.y)*STAFF_RIG.height;
      ctx.drawImage(variant.staff,b.x+b.width*.46,b.y+b.height*.114,b.width*.39,b.height*.098,
        cx-orbW*grow/2,cy-orbH*grow/2,orbW*grow,orbH*grow);
    }
    ctx.restore();
  };
  const scale=atlas.bodyScale;
  const rig=variant.rigs?.[pose.row];
  const lowerImage=variant.legs||variant.body;
  // Legs remain independent. Torso, sleeve and weapon share the same body turn.
  if(pose.running) {
    // Robe hem stays joined to the torso; boots lift independently underneath.
    slice(ctx,lowerImage,lower,scale,.80,.89,0,pose.bob);
    for(const side of [-1,1]) {
      const lift=Math.max(0,side*pose.stride)*4;
      const offset=side*pose.stride*2;
      const half=lower.width/2;
      ctx.drawImage(lowerImage,lower.x+(side<0?0:half),lower.y+lower.height*.88,half,lower.height*.12,
        (side<0?-half:0)*scale+offset,-lower.height*scale*.12-lift,
        half*scale,lower.height*scale*.12);
    }
  } else slice(ctx,lowerImage,lower,scale,0.80,1,0,pose.bob);
  ctx.save();ctx.rotate(pose.bodyAngle);
  if(rig) {
    ctx.drawImage(rig.body,0,0,upper.width,upper.height*.805,
      -upper.width*scale/2+pose.lean,-upper.height*scale+pose.bob,
      upper.width*scale,upper.height*scale*.805);
    ctx.save();ctx.translate(pose.shoulder.x+pose.armOffset.x,pose.shoulder.y+pose.armOffset.y);ctx.rotate(pose.armAngle);
    ctx.drawImage(rig.arm,0,0,upper.width,upper.height,
      -upper.width*scale/2+pose.lean-pose.shoulder.x,-upper.height*scale+pose.bob-pose.shoulder.y,
      upper.width*scale,upper.height*scale);
    ctx.restore();
  } else slice(ctx,variant.body,upper,scale,0,0.805,pose.lean,pose.bob);
  // Two brief weapon silhouettes show the fast stroke, with no idle/recovery trail.
  if(!ghost && pose.progress>.24 && pose.progress<.60) {
    for(const [lag,opacity] of [[.09,.12],[.045,.23]]) {
      const previous=visualPose({...player,attackTime:STAFF_ATTACK_DURATION*(1-Math.max(.24,pose.progress-lag))},atlas);
      ctx.save();ctx.globalAlpha=alpha*opacity;staff(previous);ctx.restore();
    }
  }
  staff();
  // One closed fist wraps the shaft at the exact staff pivot. The cuff keeps
  // the arm's rotation; the fingers follow the weapon, avoiding duplicate palms.
  ctx.save();ctx.translate(pose.hand.x,pose.hand.y);ctx.rotate(pose.armAngle);
  ctx.fillStyle='#6c3d32';ctx.fillRect(-3,-3,6,7);
  ctx.fillStyle='#dea073';ctx.fillRect(-2,-2,4,6);
  ctx.restore();
  ctx.save();ctx.translate(pose.hand.x,pose.hand.y);ctx.rotate(pose.staffAngle);
  ctx.fillStyle='#633b32';ctx.fillRect(-4,-4,8,8);
  ctx.fillStyle='#df9c70';ctx.fillRect(-3,-3,6,6);
  ctx.fillStyle='#ffd1a0';ctx.fillRect(-3,-3,4,2);
  // Two small finger seams and a thumb make the fist close around the wood.
  ctx.fillStyle='#b97756';ctx.fillRect(-3,0,4,1);ctx.fillRect(-3,2,4,1);
  ctx.fillStyle='#f4bb8b';ctx.fillRect(1,-1,3,3);
  ctx.fillStyle='#754631';ctx.fillRect(1,2,2,1);
  ctx.restore();
  ctx.restore();
  ctx.restore();
  if(!ghost) {
    ctx.save();ctx.globalAlpha=alpha;
    const orb=getStaffTipPosition(player,atlas);
    if(player.element==='wind' && pose.progress>.24 && pose.progress<.64){ctx.save();ctx.translate(orb.x,orb.y);ctx.rotate(player.attackAim);ctx.scale(.4,.4);ctx.globalAlpha*=.6;drawSpell(ctx,'wind',player.time);ctx.restore();}
    drawOrbEffect(ctx,player.element,player.time,orb,player.charging ? .15+(player.charge||0)*.85 : pose.casting ? pose.castLift*.65 : 0);
    ctx.restore();
  }
}
