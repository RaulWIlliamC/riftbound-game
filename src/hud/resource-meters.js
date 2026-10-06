import {resourceRatio} from './state.js?v=progression-1';
export class ResourceMeters {
  constructor(){
    this.element=document.createElement('div');this.element.className='hud-resources';
    this.bars=['Health','Mana'].map((name,i)=>{
      const bar=document.createElement('div');bar.className=`resource-meter ${i?'mana-meter':'health-meter'}`;
      bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',`Local player ${name.toLowerCase()}`);
      bar.setAttribute('aria-valuemin','0');
      bar.innerHTML=`<span class="resource-fill"></span><span class="resource-caption"><span>${i?'MANA':'HP'}</span><span class="resource-value"></span></span>`;
      this.element.append(bar);
      return {name,bar,fill:bar.querySelector('.resource-fill'),value:bar.querySelector('.resource-value')};
    });
  }
  update(values){
    for(const {name,bar,fill,value} of this.bars){
      const max=Math.max(0,Number.isFinite(values[`max${name}`])?values[`max${name}`]:0);
      const ratio=resourceRatio(values[`current${name}`],max),current=Math.round(ratio*max);
      fill.style.width=`${ratio*100}%`;
      value.textContent=`${current} / ${max}`;
      bar.setAttribute('aria-valuemax',max);bar.setAttribute('aria-valuenow',current);
    }
  }
}
