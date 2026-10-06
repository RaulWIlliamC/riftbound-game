export class RegionTitle {
 constructor(root=document.body){
  this.element=document.createElement('section');this.element.className='region-title';this.element.hidden=true;
  this.element.setAttribute('role','status');this.element.setAttribute('aria-live','polite');this.element.setAttribute('aria-atomic','true');
  const kicker=document.createElement('span');kicker.className='region-title-kicker';kicker.textContent='Now entering';
  this.name=document.createElement('h2');this.name.className='region-title-name';
  const ornament=document.createElement('span');ornament.className='region-title-ornament';ornament.setAttribute('aria-hidden','true');
  this.element.append(kicker,this.name,ornament);root.append(this.element);this.timer=null;
 }
 show(name){
  clearTimeout(this.timer);this.element.classList.remove('is-visible');this.name.textContent=name;this.element.hidden=false;
  // Restart the entrance when travel happens before the previous title has faded.
  void this.element.offsetWidth;this.element.classList.add('is-visible');
  this.timer=setTimeout(()=>{this.element.hidden=true;this.element.classList.remove('is-visible');},4400);
 }
}
