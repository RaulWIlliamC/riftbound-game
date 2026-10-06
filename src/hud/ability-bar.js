import {abilityState,resourceRatio} from './state.js?v=progression-1';
import {abilityIcon} from './icons.js?v=progression-1';
export class AbilitySlot {
  constructor(key,onActivate){
    this.key=key;
    this.element=document.createElement('button');this.element.type='button';this.element.className='ability-slot';
    this.element.addEventListener('click',event=>{if(key===1)onActivate?.(key);else if(event.detail===0)onActivate?.(key,'tap');});
    if(key===2||key===3){
      this.element.addEventListener('pointerdown',event=>{if(event.button!==0||this.element.disabled)return;event.preventDefault();this.element.setPointerCapture(event.pointerId);onActivate?.(key,'start');});
      this.element.addEventListener('pointerup',event=>{event.preventDefault();onActivate?.(key,'release');});
      this.element.addEventListener('pointercancel',()=>onActivate?.(key,'cancel'));
    }
    this.element.innerHTML='<span class="ability-icon"></span><span class="cooldown-shade"></span><span class="cooldown-number"></span><kbd></kbd><span class="ability-rank"></span><span class="ability-lock"></span><span class="slot-status" aria-hidden="true"></span>';
    this.icon=this.element.querySelector('.ability-icon');this.shade=this.element.querySelector('.cooldown-shade');
    this.number=this.element.querySelector('.cooldown-number');this.element.querySelector('kbd').textContent=key;
  }
  update(ability,element){
    const state=abilityState(ability),remaining=Math.max(0,ability?.cooldown||0);
    this.element.dataset.state=state;this.element.disabled=state!=='ready'||ability?.insufficientMana;
    if(this.lastElement!==element){this.icon.innerHTML=abilityIcon(element,this.key);this.lastElement=element;}
    const seconds=remaining>=1?Math.ceil(remaining).toString():remaining.toFixed(1);
    this.number.textContent=state==='cooldown'?seconds:'';
    this.shade.style.height=`${resourceRatio(remaining,ability?.cooldownDuration||remaining)*100}%`;
    const name=ability?.name||`Spell ${this.key}`;
    this.element.querySelector('.ability-rank').textContent=ability?.rank==='Base'?'':ability?.rank||'';this.element.querySelector('.ability-lock').textContent=!ability?.available&&ability?.requiredLevel?`LV ${ability.requiredLevel}`:ability?.insufficientMana?'MANA':'';
    const label=`${name}, key ${this.key}: ${!ability?.available&&ability?.requiredLevel?`unlocks at level ${ability.requiredLevel}`:ability?.insufficientMana?'insufficient mana':state==='cooldown'?`${seconds} seconds cooldown`:state}`;
    this.element.setAttribute('aria-label',label);this.element.title=label;
  }
}
export class AbilityBar {
  constructor(onActivate){
    this.element=document.createElement('div');this.element.className='ability-bar';
    this.element.setAttribute('role','group');this.element.setAttribute('aria-label','Three spell abilities');
    this.slots=[1,2,3].map(key=>new AbilitySlot(key,onActivate));
    this.element.append(...this.slots.map(slot=>slot.element));
  }
  update(abilities,element){this.slots.forEach((slot,i)=>slot.update(abilities?.[i],element));}
}
