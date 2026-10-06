// Opt-in UI preview controls. These never mutate the Player or cast abilities.
export function attachHudDebug(root,state){
  if(new URLSearchParams(location.search).get('hudDebug')!=='1')return;
  const panel=document.createElement('aside');panel.className='hud-debug';panel.setAttribute('aria-label','HUD development preview');
  panel.innerHTML=`<strong>HUD PREVIEW · UI ONLY</strong>
    <label>Health <input aria-label="Preview health" type="range" min="0" max="100" value="100"></label>
    <label>Mana <input aria-label="Preview mana" type="range" min="0" max="200" value="200"></label>
    <label>Ascend <input aria-label="Preview Ascend" type="range" min="0" max="100" value="0"></label>
    <label>Ability states <select aria-label="Preview ability states"><option value="unavailable">All unavailable</option><option value="ready">All ready</option><option value="mixed">Ready / cooldown / unavailable</option></select></label>
    <label>Cooldown <input aria-label="Preview cooldown" type="range" min="0" max="10" step="0.1" value="6"></label>
    <p>WASD walk · Shift run · Q dash<br>Mouse aim · M1 click: swing<br>Hold + release M1: magic</p>`;
  const range=(name,update)=>panel.querySelector(`[aria-label="${name}"]`).addEventListener('input',event=>update(Number(event.target.value)));
  range('Preview health',value=>state.currentHealth=value);
  range('Preview mana',value=>state.currentMana=value);
  range('Preview Ascend',value=>{state.ascendProgress=value;state.ascendReady=value===100;});
  panel.querySelector('select').addEventListener('change',event=>{
    const mode=event.target.value,cooldown=Number(panel.querySelector('[aria-label="Preview cooldown"]').value);
    state.abilities=state.abilities.map((ability,i)=>({...ability,available:mode==='ready'||mode==='mixed'&&i<2,
      cooldown:mode==='mixed'&&i===1?cooldown:0,cooldownDuration:10}));
  });
  range('Preview cooldown',value=>{state.abilities[1].cooldown=value;state.abilities[1].cooldownDuration=10;});
  root.append(panel);
}
