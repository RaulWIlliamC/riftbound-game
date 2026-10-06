import {ART} from './layout.js';
export function extractLayer(image,points){
 const left=Math.floor(Math.min(...points.map(p=>p[0]))),top=Math.floor(Math.min(...points.map(p=>p[1])));
 const right=Math.ceil(Math.max(...points.map(p=>p[0]))),bottom=Math.ceil(Math.max(...points.map(p=>p[1])));
 const canvas=document.createElement('canvas');canvas.width=right-left;canvas.height=bottom-top;
 const ctx=canvas.getContext('2d');ctx.translate(-left,-top);ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(image,0,0);
 return{canvas,left,top,width:canvas.width,height:canvas.height};
}
export function drawLayer(ctx,layer){ctx.drawImage(layer.canvas,ART.x+layer.left*ART.scale,ART.y+layer.top*ART.scale,layer.width*ART.scale,layer.height*ART.scale);}
export function cleanGround(image,clean){
 const canvas=document.createElement('canvas');canvas.width=ART.width;canvas.height=ART.height;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0);
 // Only these small removed-dummy floor patches come from the edited image.
 for(const [x,y,w,h] of [[249,678,67,84],[315,698,64,83],[379,729,69,82]]){
  const patch=document.createElement('canvas');patch.width=w;patch.height=h;const p=patch.getContext('2d');p.imageSmoothingEnabled=false;
  p.drawImage(clean,x*clean.width/ART.width,y*clean.height/ART.height,w*clean.width/ART.width,h*clean.height/ART.height,0,0,w,h);
  // A soft three-pixel seam blends floor texture without changing surrounding objects.
  p.globalCompositeOperation='destination-in';
  const gx=p.createLinearGradient(0,0,w,0);gx.addColorStop(0,'transparent');gx.addColorStop(3/w,'#fff');gx.addColorStop(1-3/w,'#fff');gx.addColorStop(1,'transparent');p.fillStyle=gx;p.fillRect(0,0,w,h);
  const gy=p.createLinearGradient(0,0,0,h);gy.addColorStop(0,'transparent');gy.addColorStop(3/h,'#fff');gy.addColorStop(1-3/h,'#fff');gy.addColorStop(1,'transparent');p.fillStyle=gy;p.fillRect(0,0,w,h);
  ctx.drawImage(patch,x,y);
 }
 // Fade only the outermost night border so free camera movement never exposes a hard image edge.
 ctx.globalCompositeOperation='destination-in';
 const gx=ctx.createLinearGradient(0,0,ART.width,0);gx.addColorStop(0,'transparent');gx.addColorStop(24/ART.width,'#fff');gx.addColorStop(1-24/ART.width,'#fff');gx.addColorStop(1,'transparent');ctx.fillStyle=gx;ctx.fillRect(0,0,ART.width,ART.height);
 const gy=ctx.createLinearGradient(0,0,0,ART.height);gy.addColorStop(0,'transparent');gy.addColorStop(20/ART.height,'#fff');gy.addColorStop(1-24/ART.height,'#fff');gy.addColorStop(1,'transparent');ctx.fillStyle=gy;ctx.fillRect(0,0,ART.width,ART.height);
 return canvas;
}
export function trainingLayers(image){
 const shapes=[
  [[278,683],[289,685],[294,695],[289,705],[284,709],[293,711],[303,707],[311,713],[308,721],[295,727],[285,731],[285,747],[293,751],[287,757],[271,755],[267,750],[274,747],[272,734],[263,729],[251,720],[253,711],[263,709],[271,714],[276,708],[270,701],[268,692],[273,685]],
  [[342,704],[354,707],[358,717],[353,728],[346,731],[356,732],[366,729],[374,735],[370,744],[357,748],[351,753],[351,768],[359,771],[354,778],[336,777],[333,772],[339,766],[338,754],[329,749],[318,742],[317,734],[326,728],[336,733],[341,726],[335,718],[336,710]],
  [[405,734],[417,736],[424,746],[419,757],[413,761],[423,760],[434,756],[442,763],[438,772],[427,777],[415,780],[416,794],[423,798],[416,805],[400,804],[394,800],[402,794],[401,781],[389,776],[380,769],[382,760],[391,755],[402,761],[406,755],[399,748],[400,740]]
 ];
 return shapes.map(poly=>extractLayer(image,poly));
}
