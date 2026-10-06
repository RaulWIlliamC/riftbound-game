import {CharacterMenu} from './character-menu.js?v=character-menu-1';
import {CONFIG,ATTRIBUTES,xpRequired,stats,cardDefinition,RANK_LABELS} from '../progression/progression.js';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number.isInteger(n)?n:n.toFixed(2);
function summary(s,key){if(key==='vitality')return `Max HP ${s.hp}`;if(key==='arcana')return `Spell damage ×${number(s.damage)}`;if(key==='focus')return `Mana ${s.mana} · Regen ${number(s.regen)}/s`;if(key==='agility')return `Dash recovery ×${number(s.dash)} · Move ×${number(s.movement)}`;if(key==='control')return `Cooldown ×${number(s.cooldown)} · Charge ×${number(s.charge)}`;return `Damage reduction ${number(s.reduction*100)}% · Slow resistance ${number(s.resistance*100)}%`;}
export class ProgressionHud{
 constructor(root,onRequest,onOpen=()=>{},onElement){this.onRequest=onRequest;this.onOpen=onOpen;this.signature='';this.level=null;this.flash=0;
  this.element=document.createElement('section');this.element.className='progression-hud';this.element.innerHTML='<button class="character-toggle" aria-haspopup="dialog">CHARACTER · C</button><span class="xp-caption"></span><div class="xp-track" role="progressbar" aria-label="Experience"><div class="xp-fill"></div></div><output class="level-feedback" aria-live="polite"></output>';
  root.append(this.element);this.fill=this.element.querySelector('.xp-fill');this.caption=this.element.querySelector('.xp-caption');this.feedback=this.element.querySelector('.level-feedback');this.toggle=this.element.querySelector('button');
  this.panel=document.createElement('dialog');this.panel.id='character-panel';this.panel.className='progression-dialog character-dialog';document.body.append(this.panel);
  this.overlay=document.createElement('dialog');this.overlay.id='upgrade-dialog';this.overlay.className='progression-dialog card-dialog';document.body.append(this.overlay);
  this.menu=new CharacterMenu(this.panel,onRequest,onElement);this.toggle.onclick=()=>this.showPanel();
  this.overlay.addEventListener('click',e=>{const b=e.target.closest('button[data-card]');if(b){this.overlay.querySelectorAll('button').forEach(x=>x.disabled=true);onRequest({type:'choose',key:b.dataset.card});}});
  this.overlay.addEventListener('cancel',e=>e.preventDefault());
  for(const d of [this.overlay,this.panel]){d.addEventListener('keydown',e=>e.stopPropagation());d.addEventListener('keyup',e=>e.stopPropagation());}
  window.addEventListener('keydown',e=>{if(e.code==='KeyC'&&!e.repeat&&!e.target.closest('input,textarea,select,dialog')){e.preventDefault();this.showPanel();}});
 }
 get open(){return this.panel.open||this.overlay.open;}
 showPanel(){if(this.overlay.open)return;if(this.panel.open)this.panel.close();else{this.onOpen();this.menu.render();this.panel.showModal();}}
 update(player,saveStatus){const p=player.progression;if(!p)return;
  if(this.level!==null&&p.level>this.level){this.feedback.textContent=`LEVEL ${p.level} · +${p.level-this.level} ATTRIBUTE POINT${p.level-this.level>1?'S':''}`;clearTimeout(this.feedbackTimer);this.feedbackTimer=setTimeout(()=>this.feedback.textContent='',4000);window.dispatchEvent(new CustomEvent('riftbound:levelup',{detail:{level:p.level}}));}
  this.level=p.level;const required=xpRequired(p.level),cap=p.level===CONFIG.levelCap;this.caption.textContent=`LV ${p.level} · ${cap?'MAX LEVEL':`${p.xp} / ${required} XP`}`;this.fill.style.width=`${cap?100:p.xp/required*100}%`;const track=this.fill.parentElement;track.setAttribute('aria-valuenow',p.xp);track.setAttribute('aria-valuemax',cap?0:required);
  this.toggle.textContent=`CHARACTER${p.points?` · ${p.points} POINT${p.points>1?'S':''}`:' · C'}`;
  this.menu.update(player,saveStatus);
  const signature=JSON.stringify([p,player.element,saveStatus]);if(signature===this.signature)return;this.signature=signature;
  if(p.offer){if(this.panel.open)this.panel.close();const offer=p.offer;this.overlay.innerHTML=`<div class="levelup-heading"><small>LEVEL UP</small><h2>LEVEL ${offer.level}</h2><p>CHOOSE AN UPGRADE</p></div><div class="upgrade-cards">${offer.ids.map(id=>{const c=cardDefinition(id,p);return `<button class="upgrade-card" data-card="${escape(id)}" data-rarity="${c.rarity}"><span class="card-icon" aria-hidden="true">${c.icon}</span><small>${c.category} · ${c.rarity.toUpperCase()}</small><h3>${escape(c.name)}</h3>${c.spell?`<b>${RANK_LABELS[c.rank]} → ${RANK_LABELS[c.next]}</b>`:''}<p>${escape(c.description)}</p><span class="card-select">CHOOSE</span></button>`;}).join('')}</div><p class="card-note">Choose one permanent upgrade.${p.pending.length>1?` ${p.pending.length-1} more selection${p.pending.length>2?'s':''} waiting.`:''} Your character is protected while choosing.</p>`;if(!this.overlay.open){this.onOpen();this.overlay.showModal();}this.overlay.querySelector('button')?.focus();}
  else if(this.overlay.open)this.overlay.close();
 }
}
