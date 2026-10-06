export const COLLISION_DRAFT_KEY='riftbound.ruins.collision.draft.v1';
export const COLLISION_ACTIVE_KEY='riftbound.ruins.collision.active.v1';
const CELL=8;
export const DEFAULT_MAP={id:'whispering-ruins',width:4096,height:4096};
export function collisionStorageKeys(id){return id==='whispering-ruins'?{draft:COLLISION_DRAFT_KEY,active:COLLISION_ACTIVE_KEY}:{draft:`riftbound.maps.${id}.collision.draft.v1`,active:`riftbound.maps.${id}.collision.active.v1`};}
export function encodeCollisionMap(mask,map=DEFAULT_MAP){
 const length=Math.ceil(map.width/CELL)*Math.ceil(map.height/CELL);
 if(!(mask instanceof Uint8Array)||mask.length!==length||mask.some(v=>v!==0&&v!==1))throw Error('Invalid collision grid.');
 const bytes=new Uint8Array(Math.ceil(length/8));for(let i=0;i<length;i++)if(mask[i])bytes[i>>3]|=1<<(i&7);
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return {format:'riftbound-collision-map',version:1,scene:map.id,width:map.width,height:map.height,cellSize:CELL,encoding:'walkable-bits-base64',data:btoa(binary)};
}
export function decodeCollisionMap(value,expected=null){
 if(value?.format!=='riftbound-collision-map'||value.version!==1||typeof value.scene!=='string'||!/^[-a-z0-9]+$/.test(value.scene)||!Number.isInteger(value.width)||!Number.isInteger(value.height)||value.width<40||value.height<40||value.width>8192||value.height>8192||value.cellSize!==CELL||value.encoding!=='walkable-bits-base64'||typeof value.data!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(value.data))throw Error('Choose a collision JSON exported by this editor.');
 if(expected&&(value.scene!==expected.id||value.width!==expected.width||value.height!==expected.height))throw Error('This collision file belongs to a different map. Select that map first.');
 const length=Math.ceil(value.width/CELL)*Math.ceil(value.height/CELL),bytes=Math.ceil(length/8);
 if(value.data.length!==Math.ceil(bytes/3)*4)throw Error('Collision file is incomplete.');
 const binary=atob(value.data);if(binary.length!==bytes)throw Error('Collision file is incomplete.');
 const mask=new Uint8Array(length);for(let i=0;i<length;i++)mask[i]=(binary.charCodeAt(i>>3)>>(i&7))&1;
 return mask;
}
export class CollisionDraft{
 constructor(mask,map=DEFAULT_MAP){this.cols=Math.ceil(map.width/8);this.rows=Math.ceil(map.height/8);this.mask=mask.slice();this.past=[];this.future=[];this.before=null;this.changed=false;this.enemySpawns=[];this.enemyLayoutEdited=false;}
 snapshot(){return {mask:this.mask.slice(),enemySpawns:structuredClone(this.enemySpawns),enemyLayoutEdited:this.enemyLayoutEdited};}
 beginStroke(){this.before=this.snapshot();this.changed=false;}
 paintSegment(ax,ay,bx,by,radius,blocked){
  const left=Math.max(0,Math.floor((Math.min(ax,bx)-radius)/CELL)),right=Math.min(this.cols-1,Math.floor((Math.max(ax,bx)+radius)/CELL));
  const top=Math.max(0,Math.floor((Math.min(ay,by)-radius)/CELL)),bottom=Math.min(this.rows-1,Math.floor((Math.max(ay,by)+radius)/CELL));
  const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy,value=blocked?0:1;
  for(let row=top;row<=bottom;row++)for(let col=left;col<=right;col++){
   const x=col*CELL+CELL/2,y=row*CELL+CELL/2,t=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;
   if((x-ax-t*dx)**2+(y-ay-t*dy)**2<=radius*radius&&this.mask[row*this.cols+col]!==value){this.mask[row*this.cols+col]=value;this.changed=true;}
  }
 }
 endStroke(){if(this.before&&this.changed){this.past.push(this.before);if(this.past.length>40)this.past.shift();this.future=[];}this.before=null;return this.changed;}
 replace(mask,enemySpawns=this.enemySpawns,enemyLayoutEdited=this.enemyLayoutEdited){this.beginStroke();this.mask=mask.slice();this.enemySpawns=structuredClone(enemySpawns);this.enemyLayoutEdited=enemyLayoutEdited;this.changed=true;this.endStroke();}
 undo(){if(!this.past.length)return false;this.future.push(this.snapshot());const state=this.past.pop();this.mask=state.mask;this.enemySpawns=state.enemySpawns;this.enemyLayoutEdited=state.enemyLayoutEdited;return true;}
 redo(){if(!this.future.length)return false;this.past.push(this.snapshot());const state=this.future.pop();this.mask=state.mask;this.enemySpawns=state.enemySpawns;this.enemyLayoutEdited=state.enemyLayoutEdited;return true;}
}
