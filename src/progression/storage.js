import {validateProgression} from './progression.js';
const KEY='riftbound.progression.v1';
// Each browser saves its own character, including host-authoritative guest updates.
export class ProfileStore{
 constructor(storage){this.storage=storage;this.status='Loading profile…';this.revision=-1;}
 getStorage(){return this.storage||globalThis.localStorage;}
 async load(){
  try{const raw=this.getStorage().getItem(KEY);let value;try{value=JSON.parse(raw);}catch{}this.status='Progress saved';return validateProgression(value);}
  catch{this.status='Saving unavailable · progress lasts this session';return validateProgression(null);}
 }
 flush(progression){
  try{this.getStorage().setItem(KEY,JSON.stringify(progression));this.revision=progression.revision;this.status='Progress saved';}
  catch{this.status='Saving unavailable · progress lasts this session';}
 }
 async save(progression){if(this.revision!==progression.revision)this.flush(progression);}
}
