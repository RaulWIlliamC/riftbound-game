import {AbilityBar} from './ability-bar.js?v=progression-1';
import {AscendMeter} from './ascend-meter.js?v=progression-1';
import {ResourceMeters} from './resource-meters.js?v=progression-1';
import {PlayerResourceBars} from './resource-bars.js?v=progression-1';
export class CombatHud {
  constructor(root,onAbility){
    this.element=document.createElement('section');this.element.className='combat-hud';this.element.setAttribute('aria-label','Combat HUD');
    this.abilities=new AbilityBar(onAbility);this.ascend=new AscendMeter();this.resourceBars=new PlayerResourceBars();
    this.resources=new ResourceMeters();
    this.element.append(this.abilities.element,this.resources.element,this.ascend.element);root.append(this.element);
  }
  update(values,element){
    const signature=JSON.stringify(values)+element;
    if(signature===this.signature)return;
    this.signature=signature;
    this.abilities.update(values.abilities,element);this.ascend.update(values.ascendProgress,values.ascendReady);
    this.resources.update(values);
  }
  drawLocalResources(ctx,player,values){this.resourceBars.draw(ctx,{...player,resources:values});}
}
