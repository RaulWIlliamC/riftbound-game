// Gameplay reads intent snapshots, so another input source can replace this adapter.
export class DesktopInput {
  constructor(canvas) {
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, active: false };
    this.dashQueued = false;
    this.abilityQueued = false;
    this.secondQueued=false;this.secondReleased=false;this.thirdQueued=false;this.thirdReleased=false;
    this.attackQueued = false;
    this.attackHeld = false;
    this.attackReleased = false;
    this.attackCancelled = false;
    window.addEventListener('keydown', event => {
      if(document.querySelector?.('#rift-dialog[open],#upgrade-dialog[open],#character-panel[open]')||event.target?.closest?.('input,textarea,select,#multiplayer'))return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'KeyQ', 'Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
        event.preventDefault();
        this.keys.add(event.code);
        if(event.code==='Digit3'&&!event.repeat)this.thirdQueued=true;
        if (event.code === 'Digit2' && !event.repeat) this.secondQueued=true;
        if (event.code === 'Digit1' && !event.repeat) this.abilityQueued = true;
        if (event.code === 'KeyQ' && !event.repeat) this.dashQueued = true;
      }
    });
    window.addEventListener('keyup', event => {if(event.code==='Digit3'&&this.keys.has('Digit3'))this.thirdReleased=true;if(event.code==='Digit2' && this.keys.has('Digit2'))this.secondReleased=true;this.keys.delete(event.code);});
    canvas.addEventListener('pointermove', event => {
      if(document.querySelector?.('#rift-dialog[open],#upgrade-dialog[open],#character-panel[open]'))return;
      const rect = canvas.getBoundingClientRect();
      this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
    });
    canvas.addEventListener('pointerdown', event => {
      if(document.querySelector?.('#rift-dialog[open],#upgrade-dialog[open],#character-panel[open]'))return;
      if (event.button === 0) {
        event.preventDefault();
        if(event.isTrusted && canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
        const rect = canvas.getBoundingClientRect();
        this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
        this.attackQueued = true;
        this.attackHeld = true;
      }
    });
    window.addEventListener('pointerup', event => {
      if(event.button===0 && this.attackHeld) {this.attackHeld=false;this.attackReleased=true;}
    });
    canvas.addEventListener('pointercancel', () => this.reset());
    canvas.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });
  }
  reset() {
    this.attackHeld=false;this.attackReleased=false;this.attackCancelled=true;
    this.secondQueued=false;this.secondReleased=false;this.thirdQueued=false;this.thirdReleased=false;
    this.keys.clear();
    this.dashQueued = false;
    this.abilityQueued = false;
    this.attackQueued = false;
  }
  read() {
    const intent = {
      x: Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA')),
      y: Number(this.keys.has('KeyS')) - Number(this.keys.has('KeyW')),
      run: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'),
      dash: this.dashQueued,
      ability: this.abilityQueued,
      third:this.thirdQueued,thirdHeld:this.keys.has('Digit3'),thirdReleased:this.thirdReleased,
      second:this.secondQueued,secondHeld:this.keys.has('Digit2'),secondReleased:this.secondReleased,
      attack: this.attackQueued,
      attackHeld: this.attackHeld,
      attackReleased: this.attackReleased,
      attackCancelled: this.attackCancelled,
      pointer: this.pointer
    };
    this.dashQueued = false;
    this.abilityQueued = false;
    this.attackQueued = false;
    this.attackReleased=false;this.attackCancelled=false;this.secondQueued=false;this.secondReleased=false;this.thirdQueued=false;this.thirdReleased=false;
    return intent;
  }
}
