// One data file is shared by browser combat, Node tests and profile validation.
const url=new URL('./definitions.json',import.meta.url);
const definitions=typeof process!=='undefined'&&process.versions?.node
 ? JSON.parse(await (await import('node:fs/promises')).readFile(url,'utf8'))
 : await fetch(url,{cache:'no-cache'}).then(response=>{if(!response.ok)throw Error('Progression definitions failed to load');return response.json();});
export const {CONFIG,ATTRIBUTES,ELEMENTS,CARDS,RANKS,RANK_LABELS,SPELL_NAMES,FINISHERS,ENHANCEMENTS}=definitions;
