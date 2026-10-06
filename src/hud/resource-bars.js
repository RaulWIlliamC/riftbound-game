import {resourceRatio} from './state.js?v=progression-1';
export class PlayerResourceBars {
  draw(ctx,{playerId,localPlayerId,x,y,resources}) {
    if(playerId!==localPlayerId)return;
    const left=Math.round(x)-21,top=Math.round(y)+11;
    const bar=(offset,height,ratio,color,highlight)=>{
      ctx.fillStyle='#11111c';ctx.fillRect(left,top+offset,42,height);
      ctx.fillStyle='#393340';ctx.fillRect(left+1,top+offset+1,40,height-2);
      const width=Math.floor(40*ratio);
      if(width){ctx.fillStyle=color;ctx.fillRect(left+1,top+offset+1,width,height-2);
        ctx.fillStyle=highlight;ctx.fillRect(left+1,top+offset+1,width,1);}
    };
    bar(0,6,resourceRatio(resources.currentHealth,resources.maxHealth),'#aa3d57','#e77887');
    bar(8,5,resourceRatio(resources.currentMana,resources.maxMana),'#6861c7','#999bf0');
  }
}
