import { ELEMENTS } from './appearance.js?v=progression-1';

// Quantized, local pixel effects: no persistent particles or gameplay state.
export function drawOrbEffect(ctx, element, time, center, charge=0) {
  if ((!ELEMENTS[element]?.orb && !charge) || !center) return;
  const tick = Math.floor(time * (12+charge*24));
  const t = tick / 12;
  ctx.save();
  ctx.translate(Math.round(center.x), Math.round(center.y));
  ctx.scale(1+charge*1.15,1+charge*1.15);
  if(charge) {
    const color=ELEMENTS[element]?.orb||[193,155,246];
    ctx.fillStyle=`rgba(${color.join(',')},.16)`;
    ctx.fillRect(-5,-5,10,10);ctx.fillRect(-7,-3,14,6);
    for(let i=0;i<6;i++) {
      const a=t*2+i*Math.PI/3,r=7+Math.sin(t*3+i)*2;
      ctx.fillStyle=`rgb(${color.join(',')})`;
      ctx.fillRect(Math.round(Math.cos(a)*r),Math.round(Math.sin(a)*r),1+(i%2),1+(i%2));
    }
  }
  const pixel = (x, y, color, size = 2) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), size, size);
  };
  const line = (x1, y1, x2, y2, color) => {
    const steps = Math.ceil(Math.max(Math.abs(x2-x1), Math.abs(y2-y1)));
    for (let i=0; i<=steps; i++) {
      const f=steps ? i/steps : 0;
      pixel(x1+(x2-x1)*f,y1+(y2-y1)*f,color,1);
    }
  };
  if (element === 'water') {
    // A moving bright wave inside the sphere, with orbiting droplets.
    for(let x=-2;x<=2;x++) pixel(x,Math.sin(t*5+x*.7),'#c0f7ff',1);
    for(let i=0;i<3;i++) {
      const a=t*2.5+i*Math.PI*2/3;
      pixel(Math.cos(a)*6,Math.sin(a)*4,'#60cbed');
      pixel(Math.cos(a)*6,Math.sin(a)*4-1,'#d8fcff',1);
    }
  } else if (element === 'fire') {
    // Three jagged tongues grow and shrink independently above the sphere.
    for(let x=-3;x<=3;x+=2) {
      const height=4+((tick+x*3+30)%4);
      for(let y=0;y<height;y+=2) pixel(x+Math.sin(t*8-y)*1.5,-2-y,y<3?'#ffe6a0':'#ff783e');
    }
    pixel(((tick*3)%9)-4,-7-(tick%4),'#ffd45d',1);
    pixel(0,-2,'#fff3bc');
  } else if (element === 'earth') {
    // Chunky stone fragments orbit slowly, with a mossy pulse in the core.
    pixel(-1,Math.sin(t*2),'#d5e6ac');
    for(let i=0;i<3;i++) {
      const a=t*.9+i*Math.PI*2/3;
      const x=Math.cos(a)*7,y=Math.sin(a)*5;
      pixel(x,y,'#736653',3);pixel(x,y,'#c6bd89',1);
    }
    pixel(Math.sin(t)*4,5-(tick%4),'#a9bd74',1);
  } else if (element === 'wind') {
    // Two broken air ribbons curl around the orb instead of rising like fire.
    for(let ribbon=0;ribbon<2;ribbon++) for(let i=0;i<7;i++) {
      const a=t*4+ribbon*Math.PI+i*.24;
      pixel(Math.cos(a)*8,Math.sin(a)*4,ribbon?'#b3e4da':'#e5fff7',1);
    }
    pixel(-1,0,'#f2fffc',2);
  } else if (element === 'lightning') {
    // Intermittent branching zigzags change direction and length each tick.
    pixel(-1,-1,tick%3?'#fff5ba':'#ffffff',2);
    if(tick%5!==0) {
      const side=tick%2?1:-1;
      line(side*2,-2,side*5,-5,'#fff1a2');
      line(side*5,-5,side*3,-6,'#fff1a2');
      line(side*3,-6,side*7,-9,'#e5d2ff');
      line(-side*2,1,-side*6,3,'#cdb6ff');
      line(-side*6,3,-side*4,5,'#fff1a2');
    }
  }
  ctx.restore();
}
