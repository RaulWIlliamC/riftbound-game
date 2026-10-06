// Terrain contact stays in world space; only the decal is foreshortened.
const COLORS={neutral:'#b58be0',fire:'#ff9145',earth:'#b6a477',water:'#80deed',wind:'#9de4c7',lightning:'#b5bcff'};
export function drawSurfaceContact(ctx,{x,y,element,aim=0,radius=32,alpha=1,trail=0}){
  ctx.save();ctx.translate(x,y);ctx.scale(1,.38);ctx.rotate(aim);
  ctx.globalAlpha*=alpha;
  ctx.fillStyle='#101820';ctx.globalAlpha*=.2;
  ctx.beginPath();ctx.ellipse(-trail*.25,0,radius+trail*.35,radius*.65,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha/= .2;ctx.globalCompositeOperation='screen';
  const color=COLORS[element]||COLORS.neutral;
  const g=ctx.createRadialGradient(0,0,0,0,0,radius*1.6);
  g.addColorStop(0,color+'55');g.addColorStop(.45,color+'22');g.addColorStop(1,color+'00');
  ctx.fillStyle=g;ctx.fillRect(-radius*1.6,-radius*1.6,radius*3.2,radius*3.2);
  if(trail){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha*=.18;
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-trail,i*radius*.45);ctx.quadraticCurveTo(-trail*.4,i*radius*.7,0,i*radius*.3);ctx.stroke();}
  }
  ctx.restore();
}
