import { ELEMENTS, recolorCloth, recolorOrb } from './appearance.js?v=progression-1';

function opaqueBounds(data, imageWidth, x, y, width, height) {
  const mask=new Uint8Array(width*height);
  for(let py=0;py<height;py++) for(let px=0;px<width;px++) {
    mask[py*width+px]=data[((y+py)*imageWidth+x+px)*4+3]>=100?1:0;
  }
  const components=[];
  for(let i=0;i<mask.length;i++) {
    if(!mask[i]) continue;
    mask[i]=0;const queue=[i];let left=width,top=height,right=0,bottom=0;
    for(let q=0;q<queue.length;q++) {
      const at=queue[q],px=at%width,py=Math.floor(at/width);
      left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const nx=px+dx,ny=py+dy;
        if(nx<0||ny<0||nx>=width||ny>=height)continue;
        const next=ny*width+nx;if(mask[next]){mask[next]=0;queue.push(next);}
      }
    }
    components.push({left,top,right,bottom,count:queue.length});
  }
  components.sort((a,b)=>b.count-a.count);
  if(!components.length)throw new Error('Empty sprite frame');
  const primary=components[0];
  let {left,top,right,bottom}=primary;
  for(const part of components.slice(1)) {
    if(part.count<primary.count*0.025)continue;
    left=Math.min(left,part.left);top=Math.min(top,part.top);right=Math.max(right,part.right);bottom=Math.max(bottom,part.bottom);
  }
  return {x:x+left,y:y+top,width:right-left+1,height:bottom-top+1};
}
// Front and both three-quarter views share the forward right arm. Only the
// back view projects that arm on the opposite side of the screen.
export const RIGHT_HAND_ANCHORS=[{x:.09,y:.68},{x:.09,y:.70},{x:.09,y:.68},{x:.84,y:.67}];
export function handLandmark(data, imageWidth, bounds, row) {
  const width=bounds.width, height=bounds.height;
  const skin=new Uint8Array(width*height);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const i=((bounds.y+y)*imageWidth+bounds.x+x)*4;
    const r=data[i],g=data[i+1],b=data[i+2];
    skin[y*width+x]=data[i+3]>100 && r>160 && g>85 && b>65 && r>g*1.15 && g>b*1.05 && g<b*2.05 ? 1 : 0;
  }
  const clusters=[];
  for(let i=0;i<skin.length;i++) {
    if(!skin[i]) continue;
    skin[i]=0; const queue=[i]; let sumX=0,sumY=0;
    for(let q=0;q<queue.length;q++) {
      const at=queue[q],x=at%width,y=Math.floor(at/width); sumX+=x; sumY+=y;
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if(nx<0||ny<0||nx>=width||ny>=height) continue;
        const next=ny*width+nx;
        if(skin[next]) {skin[next]=0;queue.push(next);}
      }
    }
    const point={x:sumX/queue.length,y:sumY/queue.length};
    if(queue.length>width*height*0.001 && point.y>height*0.56) clusters.push(point);
  }
  const anchor=RIGHT_HAND_ANCHORS[row];
  const target={x:width*anchor.x,y:height*anchor.y};
  clusters.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));
  return clusters[0] || target;
}
async function source(url) {
  const image = new Image(); image.src = url; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width=image.width; canvas.height=image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently:true }); ctx.drawImage(image,0,0);
  return { canvas, ctx, pixels:ctx.getImageData(0,0,image.width,image.height) };
}
async function buildSprites() {
  const [body, staff] = await Promise.all([source('./assets/wizard-animations.png'), source('./assets/wizard-staff.png')]);
  const frames=[];
  for(let row=0;row<4;row++) {
    const line=[];
    for(let column=0;column<6;column++) {
      const x=Math.round(column*body.canvas.width/6), y=Math.round(row*body.canvas.height/4);
      const width=Math.round((column+1)*body.canvas.width/6)-x;
      const height=Math.round((row+1)*body.canvas.height/4)-y;
      const bounds=opaqueBounds(body.pixels.data,body.canvas.width,x,y,width,height);
      bounds.hand=handLandmark(body.pixels.data,body.canvas.width,bounds,row);
      line.push(bounds);
    }
    frames.push(line);
  }
  const staffBounds=opaqueBounds(staff.pixels.data,staff.canvas.width,0,0,staff.canvas.width,staff.canvas.height);
  const variants={};
  for(const element of Object.keys(ELEMENTS)) {
    const tint=(src,fn) => {
      const target=document.createElement('canvas'); target.width=src.canvas.width; target.height=src.canvas.height;
      const ctx=target.getContext('2d'); const rgba=new ImageData(new Uint8ClampedArray(src.pixels.data),target.width,target.height);
      for(let i=0;i<rgba.data.length;i+=4) {
        if(rgba.data[i+3]<100) { rgba.data[i+3]=0; continue; }
        const rgb=fn(rgba.data[i],rgba.data[i+1],rgba.data[i+2],Math.floor(i/4/target.width));
        rgba.data[i]=rgb[0]; rgba.data[i+1]=rgb[1]; rgba.data[i+2]=rgb[2];
      }
      ctx.putImageData(rgba,0,0); return target;
    };
    variants[element]={body:tint(body,(r,g,b)=>recolorCloth(r,g,b,element)),
      staff:tint(staff,(r,g,b,y)=>recolorOrb(r,g,b,element,(y-staffBounds.y)/staffBounds.height))};
  }
  // Split only the outer sleeve, preserving a continuous torso beneath it.
  // Each direction uses its anatomical right arm, never a mirrored whole sprite.
  for (const variant of Object.values(variants)) {
    variant.rigs = frames.map(line => {
      const f=line[0], side=f.hand.x<f.width/2?-1:1;
      const body=document.createElement('canvas'), arm=document.createElement('canvas');
      body.width=arm.width=f.width; body.height=arm.height=f.height;
      const bodyCtx=body.getContext('2d'), armCtx=arm.getContext('2d');
      bodyCtx.drawImage(variant.body,f.x,f.y,f.width,f.height,0,0,f.width,f.height);
      const pixels=bodyCtx.getImageData(0,0,f.width,f.height);
      const sleeve=new ImageData(f.width,f.height);
      for(let y=Math.floor(f.height*.53);y<Math.floor(f.height*.81);y++) {
        // Sloping inner edge follows the sleeve instead of removing a rectangle.
        const edge=Math.round(f.width*(.30-.11*(y/f.height-.53)/.28));
        const inner=side<0?edge:f.width-1-edge;
        const donor=Math.max(0,Math.min(f.width-1,inner-side*3));
        for(let x=0;x<f.width;x++) {
          if(side<0?x>=inner:x<=inner)continue;
          const i=(y*f.width+x)*4;
          sleeve.data.set(pixels.data.slice(i,i+4),i);
          if(!pixels.data[i+3])continue;
          // Extend the robe under the moving shoulder, but not past the torso.
          if(side<0?x>f.width*.18:x<f.width*.82) {
            const d=(y*f.width+donor)*4;
            pixels.data.set(pixels.data.slice(d,d+4),i);
          } else pixels.data[i+3]=0;
        }
      }
      // The grip is drawn once, around the staff shaft. Remove the old fist from
      // the sleeve so it cannot remain underneath as a second rotated palm.
      for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++){
        if(Math.abs(x-f.hand.x)<17 && Math.abs(y-f.hand.y)<17)sleeve.data[(y*f.width+x)*4+3]=0;
      }
      bodyCtx.putImageData(pixels,0,0);armCtx.putImageData(sleeve,0,0);
      return {body,arm};
    });
  }
  // Some generated fists cross the robe/leg seam. Keep those old hand pixels
  // out of the independent lower-body layer when the right arm is raised.
  for(const variant of Object.values(variants)){
    const legs=document.createElement('canvas');legs.width=variant.body.width;legs.height=variant.body.height;
    const ctx=legs.getContext('2d');ctx.drawImage(variant.body,0,0);
    const pixels=ctx.getImageData(0,0,legs.width,legs.height);
    for(const f of frames.flat())for(let y=Math.floor(f.height*.795);y<f.height;y++)for(let x=0;x<f.width;x++){
      if(Math.abs(x-f.hand.x)<17 && Math.abs(y-f.hand.y)<17)pixels.data[((f.y+y)*legs.width+f.x+x)*4+3]=0;
    }
    ctx.putImageData(pixels,0,0);variant.legs=legs;
  }
  const heights=frames.flat().map(f=>f.height).sort((a,b)=>a-b);
  return {frames, staffBounds, variants, bodyScale:80/heights[Math.floor(heights.length/2)]};
}

let spritesPromise;
export function loadSprites(){return spritesPromise??=buildSprites();}
