function Fan({y}:{y:number}){
 return <g transform={`matrix(.86 -.29 0 1 300 ${y})`}><circle cx="34" cy="33" r="28" fill="#dce8ed" stroke="#a4bdc9" strokeWidth="2"/>{Array.from({length:8},(_,i)=><path key={i} d="M34 30C23 26 18 18 26 12L34 27Z" fill="#94b3c2" transform={`rotate(${i*45} 34 33)`}/>)}<circle cx="34" cy="33" r="10" fill="#eff6f8" stroke="#c37b6c" strokeWidth="3"/></g>;
}
export default function PcIllustration(){
 return <svg className="pc-illustration" viewBox="0 0 460 460" fill="none" aria-hidden="true">
  <path d="M57 382C57 358 137 338 236 338S415 358 415 382V395C415 419 335 439 236 439S57 419 57 395Z" fill="#bdd1da"/>
  <ellipse cx="236" cy="382" rx="179" ry="44" fill="#dae7ec"/>
  <ellipse cx="237" cy="365" rx="134" ry="25" fill="#b0c7d2" opacity=".6"/>
  <path d="M120 333L139 337V352L120 348ZM272 363L291 367V383L272 379ZM345 345L361 339V355L345 361Z" fill="#68899a"/>
  <path d="M102 74L292 112V372L102 334Z" fill="#3c5869" stroke="#a7c0cc" strokeWidth="5" strokeLinejoin="round"/>
  <g transform="matrix(1 .2 0 1 112 86)">
   <rect x="17" y="17" width="132" height="165" fill="#2c485b" stroke="#648799" strokeWidth="4"/>
   <path d="M39 87V107H111M36 42H19M93 58H112V114" stroke="#7797a9" strokeWidth="2"/>
   <rect x="39" y="36" width="58" height="58" fill="#789aaa" stroke="#a6bfca" strokeWidth="5"/>
   <rect x="55" y="52" width="26" height="26" rx="2" stroke="#355d73" strokeWidth="3"/>
   <path d="M61 46V52M69 46V52M77 46V52M61 78V84M69 78V84M77 78V84M49 58H55M49 66H55M49 74H55M81 58H87M81 66H87M81 74H87" stroke="#355d73" strokeWidth="2"/>
   <rect x="118" y="27" width="7" height="91" fill="#b0cbd8"/><rect x="130" y="27" width="7" height="91" fill="#b0cbd8"/>
   <path d="M118 27H125M130 27H137" stroke="#dc806a" strokeWidth="6"/>
   <rect x="7" y="124" width="148" height="38" rx="2" fill="#adc6d1" stroke="#658799" strokeWidth="4"/>
   <circle cx="31" cy="143" r="12" fill="#527487"/><circle cx="31" cy="143" r="6" stroke="#95b2c0" strokeWidth="3"/>
   <path d="M52 137H94M52 144H94M52 151H82" stroke="#829eac" strokeWidth="2"/>
   <text x="111" y="146" fill="#507184" fontSize="7" fontFamily="Arial">RTX</text>
   <path d="M11 191H155V228H11Z" fill="#617f91"/><text x="47" y="214" fill="#c9dce5" fontSize="10" fontFamily="Arial">650 W</text>
  </g>
  <path d="M108 82L285 117V363L108 328Z" stroke="#d9e8ef" strokeOpacity=".35" strokeWidth="2"/>
  <path d="M123 86L153 92L279 276V316Z" fill="#e8f5fa" opacity=".09"/>
  <path d="M188 100L210 104L283 211V240Z" fill="#e8f5fa" opacity=".08"/>
  <path d="M292 112L367 86V346L292 372Z" fill="#e5eff3" stroke="#afc7d2" strokeWidth="5" strokeLinejoin="round"/>
  <path d="M300 121L359 101V339L300 359Z" fill="#f2f7f9"/>
  <Fan y={128}/><Fan y={207}/><Fan y={286}/>
  <path d="M102 74L177 48L367 86L292 112Z" fill="#dce9ef" stroke="#b0c7d2" strokeWidth="5" strokeLinejoin="round"/>
  <path d="M134 74L180 59L322 87L278 102Z" fill="#c9dce5" opacity=".65"/>
  <path d="M191 63L271 79M181 68L261 84M171 73L251 89" stroke="#a3bdcb" strokeWidth="2"/>
  <circle cx="349" cy="117" r="2.4" fill="#d47c66"/>
  <path d="M309 342L348 329" stroke="#b4c9d3" strokeWidth="2"/>
 </svg>;
}
