import {ascendState} from './state.js?v=progression-1';
export class AscendMeter {
  constructor(){
    this.element=document.createElement('div');this.element.className='ascend-meter';
    this.element.innerHTML='<div class="ascend-track" role="progressbar" aria-label="Ascension" aria-valuemin="0" aria-valuemax="100"><span class="ascend-fill"></span></div><div class="ascend-caption"><span class="ascend-label">ASCEND</span><kbd>F</kbd></div>';
    this.track=this.element.querySelector('.ascend-track');this.fill=this.element.querySelector('.ascend-fill');this.label=this.element.querySelector('.ascend-label');
  }
  update(progress,ready){
    const state=ascendState(progress,ready);
    this.element.dataset.ready=state.ready;
    this.fill.style.width=`${state.ratio*100}%`;
    this.track.setAttribute('aria-valuenow',Math.round(state.ratio*100));
    this.track.setAttribute('aria-valuetext',state.ready?'Ascend ready':`${Math.round(state.ratio*100)} percent, Ascend unavailable`);
    this.label.textContent=state.ready?'ASCEND READY':'ASCEND';
  }
}
