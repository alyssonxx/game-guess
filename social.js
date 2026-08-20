(() => {
'use strict';
const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, FB=()=>window.GameGuessFirebase;
const KEY='gameGuessArcadeV4';
const SLOT_META={
  hair:{label:'Cabelos',icon:'💇',base:'Cabelo'},
  eyes:{label:'Olhos',icon:'👁️',base:'Olhos'},
  headwear:{label:'Cabeça',icon:'🧢',base:'Acessório'},
  face:{label:'Rosto',icon:'🕶️',base:'Rosto'},
  top:{label:'Camisetas',icon:'👕',base:'Camiseta'},
  outerwear:{label:'Casacos',icon:'🧥',base:'Casaco'},
  hands:{label:'Mãos',icon:'🧤',base:'Luvas'},
  bottom:{label:'Parte de baixo',icon:'👖',base:'Calça'},
  shoes:{label:'Calçados',icon:'👟',base:'Tênis'},
  back:{label:'Costas',icon:'🎒',base:'Costas'}
};
const SLOT_ORDER=Object.keys(SLOT_META);
const ADJ=['Arcade','Neon','Pixel','Cosmic','Turbo','Street','Galaxy','Royal','Cyber','Solar'];
const NOUNS={
  hair:['Casual','Spike','Lateral','Rebelde','Coque','Ondulado','Curto'],
  eyes:['Brilhantes','Estrela','Cyber','Focados','Doces','Ninja','Anime'],
  headwear:['Livre','Boné','Gorro','Coroa','Chapéu','Headset','Tiara'],
  face:['Livre','Óculos','Máscara','Visor','Bandana','Monóculo','Pintura'],
  top:['GG','Esportiva','Oversized','Gamer','College','Tech','Retro'],
  outerwear:['Livre','Moletom','Jaqueta','Colete','Parka','Bomber','Capa'],
  hands:['Livres','Luvas','Munhequeira','Bracelete','Manopla','Manga','Pulseira'],
  bottom:['Casual','Cargo','Short','Jogger','Saia','Techwear','Esportiva'],
  shoes:['Básico','Runner','High-top','Street','Bota','Slip-on','Neon'],
  back:['Livre','Mochila','Asas','Capa','Jetpack','Escudo','Cauda']
};
const RARITY=['Inicial','Comum','Comum','Raro','Raro','Épico','Épico','Lendário'];
const SKINS=['#f7d6be','#edc4a6','#dda57e','#ca8b64','#ad704d','#895335','#653821','#3e2618'];
const HAIR_COLORS=['#10131b','#30201b','#573624','#83552d','#b77d3e','#d8b66a','#e4e5e8','#d85b72','#764fff','#2d9fc7','#28a36a','#cb4937'];
const EYE_COLORS=['#151724','#225fb7','#2f9f75','#6e43bd','#b86632','#d23f67','#55cfe8','#d6b243'];
const CLOTH_COLORS=['#171d31','#5d3fd3','#1875c9','#0a9c75','#bd3b5e','#e58a27','#e7e7ea','#252525','#d84f3d','#75429c','#4a85d9','#3d9661'];
const ACCENT_COLORS=['#63e7ff','#ffdc65','#ff76b7','#7cf0a8','#ff8d66','#b39cff','#ffffff','#a6b4cb','#ff5252','#5cffd1'];
const legacyMap={
  hair_basic:'hair_01',hair_spike:'hair_02',hair_side:'hair_03',hair_messy:'hair_04',hair_bun:'hair_05',hair_mohawk:'hair_06',
  eye_round:'eyes_01',eye_star:'eyes_02',eye_cyber:'eyes_03',top_basic:'top_01',top_hoodie:'outerwear_02',top_jacket:'outerwear_03',top_sport:'top_02',
  bottom_basic:'bottom_01',bottom_short:'bottom_03',bottom_cargo:'bottom_02',shoes_basic:'shoes_01',shoes_runner:'shoes_02',shoes_neon:'shoes_07',
  acc_none:'headwear_01',acc_glasses:'face_02',acc_headset:'headwear_06',acc_cap:'headwear_02',acc_wings:'back_03',acc_mask:'face_03'
};
function priceFor(n){if(n===1)return 0;const tier=Math.floor((n-2)/10);return 20+tier*15+((n-2)%5)*5;}
function rarityFor(n){if(n===1)return 'Inicial';return RARITY[Math.min(7,1+Math.floor((n-2)/10))];}
function makeCatalog(){
  const out=[];
  for(const slot of SLOT_ORDER){
    for(let n=1;n<=70;n++){
      const noun=NOUNS[slot][(n-1)%NOUNS[slot].length],adj=ADJ[Math.floor((n-1)/NOUNS[slot].length)%ADJ.length];
      const isNone=['headwear','face','outerwear','hands','back'].includes(slot)&&n===1;
      out.push({id:`${slot}_${String(n).padStart(2,'0')}`,slot,name:isNone?`Sem ${SLOT_META[slot].label.toLowerCase()}`:`${noun} ${adj}`,price:priceFor(n),rarity:rarityFor(n),icon:SLOT_META[slot].icon,variant:n-1});
    }
  }
  return out;
}
const CATALOG=makeCatalog();
const CATALOG_BY_ID=new Map(CATALOG.map(x=>[x.id,x]));
const STARTER=SLOT_ORDER.map(s=>`${s}_01`);
function read(){try{return CORE()?.getProfile?.()||JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function write(p){CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();try{FB()?.syncLocalProfile?.(p)}catch{}}
function migrateAvatar(p={}){
  const old=p.avatar||{},a={...old};
  a.bodyType=a.bodyType==='feminino'?'feminino':'masculino';
  a.skin=a.skin||'#f7d6be';a.hairColor=a.hairColor||'#15151d';a.eyeColor=a.eyeColor||'#225fb7';a.clothColor=a.clothColor||'#5d3fd3';a.accentColor=a.accentColor||'#63e7ff';
  a.hair=legacyMap[a.hair]||a.hair||'hair_01';a.eyes=legacyMap[a.eyes]||a.eyes||'eyes_01';a.top=legacyMap[a.top]||a.top||'top_01';a.bottom=legacyMap[a.bottom]||a.bottom||'bottom_01';a.shoes=legacyMap[a.shoes]||a.shoes||'shoes_01';
  a.headwear=a.headwear||legacyMap[old.accessory]||'headwear_01';
  a.face=a.face||((old.accessory&&legacyMap[old.accessory]?.startsWith('face_'))?legacyMap[old.accessory]:'face_01');
  a.back=a.back||((old.accessory&&legacyMap[old.accessory]?.startsWith('back_'))?legacyMap[old.accessory]:'back_01');
  a.outerwear=a.outerwear||((old.top&&legacyMap[old.top]?.startsWith('outerwear_'))?legacyMap[old.top]:'outerwear_01');
  a.hands=a.hands||'hands_01';
  for(const s of SLOT_ORDER)if(!CATALOG_BY_ID.has(a[s]))a[s]=`${s}_01`;
  return a;
}
function defaults(p={}){
  const migratedOwned=(p.avatarOwned||[]).map(id=>legacyMap[id]||id).filter(id=>CATALOG_BY_ID.has(id));
  const owned=new Set([...migratedOwned,...STARTER]);
  return {...p,avatarOwned:[...owned],nickname:String(p.nickname||''),bio:String(p.bio||'Explorador, jogador e colecionador de desafios.'),favoriteGame:String(p.favoriteGame||'Game Guess'),avatar:migrateAvatar(p)};
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function item(id){return CATALOG_BY_ID.get(id)||CATALOG[0]}
function variant(a,slot){return item(a[slot]).variant||0}
function svgAvatar(cfg={},size='large'){
  const a=migrateAvatar({avatar:cfg}),f=a.bodyType==='feminino',hv=variant(a,'hair'),ev=variant(a,'eyes'),tv=variant(a,'top'),ov=variant(a,'outerwear'),bv=variant(a,'bottom'),sv=variant(a,'shoes'),head=variant(a,'headwear'),face=variant(a,'face'),back=variant(a,'back');
  const bodyW=f?104:114,hipW=f?108:96;
  const hair=hv%7===4?`<circle cx="190" cy="70" r="26" fill="${a.hairColor}"/><path d="M70 118q7-70 70-70t70 70q-40-30-140 0z" fill="${a.hairColor}"/>`:hv%7===1?`<path d="M69 118L82 58l21 18 11-40 27 31 22-40 10 44 32-25-7 72q-61-32-129 0z" fill="${a.hairColor}"/>`:`<path d="M69 118q10-70 71-70t71 70q-55-27-142 0z" fill="${a.hairColor}"/>`;
  const eyes=ev%4===1?`<text x="91" y="158" font-size="36" fill="${a.eyeColor}">★</text><text x="157" y="158" font-size="36" fill="${a.eyeColor}">★</text>`:`<ellipse cx="108" cy="148" rx="17" ry="21" fill="#fff"/><ellipse cx="172" cy="148" rx="17" ry="21" fill="#fff"/><ellipse cx="108" cy="151" rx="9" ry="13" fill="${a.eyeColor}"/><ellipse cx="172" cy="151" rx="9" ry="13" fill="${a.eyeColor}"/>`;
  const glasses=face%7===1?`<g fill="none" stroke="#e9f7ff" stroke-width="5"><rect x="85" y="134" width="44" height="31" rx="12"/><rect x="151" y="134" width="44" height="31" rx="12"/><path d="M129 146h22"/></g>`:face%7===2?`<path d="M100 169q40 20 80 0v28q-40 22-80 0z" fill="#171d2d"/><path d="M116 180h48" stroke="${a.accentColor}" stroke-width="4"/>`:'';
  const hat=head%7===1?`<path d="M75 93q18-48 67-48t64 48q-65-18-131 0z" fill="${a.accentColor}"/><path d="M137 91q49-10 81 6-29 16-71 11z" fill="#233d74"/>`:head%7===3?`<path d="M89 58l18 24 31-37 30 37 20-24 10 51H80z" fill="${a.accentColor}"/>`:'';
  const backShape=back%7===2?`<path d="M82 238Q25 200 29 275q24-24 60-8M198 238q57-38 53 37-24-24-60-8" fill="#eafaff" stroke="${a.accentColor}" stroke-width="4"/>`:back%7===1?`<rect x="92" y="218" width="96" height="105" rx="28" fill="#26354d" stroke="${a.accentColor}" stroke-width="5"/>`:'';
  const outer=ov===0?'':ov%5===1?`<path d="M${140-bodyW/2} 221q8-37 ${bodyW/2} -40q${bodyW/2} 3 ${bodyW/2} 40v88H${140-bodyW/2}z" fill="none" stroke="${a.accentColor}" stroke-width="12"/>`:ov%5===2?`<path d="M92 215q48-45 96 0l-13 28h-70z" fill="#20283c"/>`:'';
  return `<svg class="gg-avatar-svg ${size}" viewBox="0 0 280 380" role="img" aria-label="Avatar estilizado"><ellipse cx="140" cy="360" rx="78" ry="12" fill="#000" opacity=".26"/><g>${backShape}<rect x="${140-hipW/2}" y="277" width="${hipW}" height="59" rx="25" fill="${bv%5===2?a.accentColor:'#26395e'}"/><rect x="102" y="320" width="30" height="38" rx="14" fill="${a.skin}"/><rect x="148" y="320" width="30" height="38" rx="14" fill="${a.skin}"/><ellipse cx="115" cy="353" rx="29" ry="15" fill="${sv%6===0?'#171b26':a.accentColor}"/><ellipse cx="165" cy="353" rx="29" ry="15" fill="${sv%6===0?'#171b26':a.accentColor}"/><rect x="${140-bodyW/2}" y="205" width="${bodyW}" height="111" rx="50" fill="${a.clothColor}"/><path d="M105 244h70" stroke="${a.accentColor}" stroke-width="${6+(tv%4)*2}" stroke-linecap="round" opacity=".9"/>${outer}<ellipse cx="79" cy="254" rx="20" ry="49" fill="${a.clothColor}" transform="rotate(10 79 254)"/><ellipse cx="201" cy="254" rx="20" ry="49" fill="${a.clothColor}" transform="rotate(-10 201 254)"/><circle cx="73" cy="297" r="18" fill="${a.skin}"/><circle cx="207" cy="297" r="18" fill="${a.skin}"/><ellipse cx="140" cy="139" rx="82" ry="88" fill="${a.skin}"/><ellipse cx="140" cy="120" rx="56" ry="42" fill="#fff" opacity=".12"/>${eyes}<path d="M129 185q11 10 22 0" fill="none" stroke="#8b4f47" stroke-width="4" stroke-linecap="round"/>${hair}${glasses}${hat}</g></svg>`;
}
let avatar3D=null;
function dispose3D(){if(!avatar3D)return;try{cancelAnimationFrame(avatar3D.raf);avatar3D.ro?.disconnect?.();avatar3D.renderer?.dispose?.();avatar3D.host?.replaceChildren();}catch{}avatar3D=null;}
function renderAvatar3D(cfg={}){
  const host=$('avatarPreview');if(!host||!window.THREE){if(host)host.innerHTML=svgAvatar(cfg);return;}
  const THREE=window.THREE,a=migrateAvatar({avatar:cfg}),f=a.bodyType==='feminino';
  if(!avatar3D){
    host.innerHTML='';const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(29,1,.1,100);camera.position.set(0,.9,9.2);camera.lookAt(0,.45,0);scene.add(new THREE.HemisphereLight(0xd6f3ff,0x23162f,2.3));const key=new THREE.DirectionalLight(0xffffff,3.4);key.position.set(4,7,7);key.castShadow=true;scene.add(key);const rim=new THREE.DirectionalLight(0x7b5cff,2.6);rim.position.set(-5,3,-4);scene.add(rim);const group=new THREE.Group();scene.add(group);
    const resize=()=>{const r=host.getBoundingClientRect(),w=Math.max(260,r.width),h=Math.max(400,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();const ro=new ResizeObserver(resize);ro.observe(host);let dragging=false,lastX=0,targetY=0;renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;targetY+=(e.clientX-lastX)*.012;lastX=e.clientX});renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
    const animate=()=>{if(!avatar3D)return;group.rotation.y+=(targetY-group.rotation.y)*.08;group.position.y=Math.sin(performance.now()/900)*.025;renderer.render(scene,camera);avatar3D.raf=requestAnimationFrame(animate)};avatar3D={host,renderer,scene,camera,group,ro,raf:0};animate();
  }
  const g=avatar3D.group;while(g.children.length){const o=g.children.pop();o.traverse?.(n=>{n.geometry?.dispose?.();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose?.())}})}
  const mat=(color,rough=.62,metal=.04,transparent=false,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,transparent,opacity});
  const skin=mat(a.skin,.72),hair=mat(a.hairColor,.77),cloth=mat(a.clothColor,.6),accent=mat(a.accentColor,.45,.12),dark=mat('#171d2d',.72),white=mat('#f7fbff',.5),eye=mat(a.eyeColor,.3,.08);
  const add=(geo,m,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,parent=g)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
  const sphere=(r,m,x,y,z,sx=1,sy=1,sz=1,parent=g)=>add(new THREE.SphereGeometry(r,32,24),m,x,y,z,sx,sy,sz,0,0,0,parent);
  const cyl=(rt,rb,h,m,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,parent=g)=>add(new THREE.CylinderGeometry(rt,rb,h,24),m,x,y,z,sx,sy,sz,rx,ry,rz,parent);
  const box=(w,h,d,m,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,parent=g)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,sx,sy,sz,rx,ry,rz,parent);
  const hv=variant(a,'hair'),ev=variant(a,'eyes'),head=variant(a,'headwear'),face=variant(a,'face'),tv=variant(a,'top'),ov=variant(a,'outerwear'),handv=variant(a,'hands'),bv=variant(a,'bottom'),sv=variant(a,'shoes'),back=variant(a,'back');
  // Costas primeiro para ficarem atrás do corpo.
  if(back>0){const t=back%6;if(t===1){box(1.35,1.55,.45,dark,0,-.35,-.72,1,1,1,.05);box(.9,.09,.18,accent,0,.25,-.98)}else if(t===2){for(const x of [-1,1])sphere(.85,white,x*.98,-.15,-.62,.45,1.3,.2)}else if(t===3){const cape=box(1.55,2.35,.08,accent,0,-.45,-.77,1,1,1,-.08);cape.material.transparent=true;cape.material.opacity=.85}else if(t===4){for(const x of [-.42,.42]){cyl(.22,.25,1.1,dark,x,-.38,-.8);sphere(.19,accent,x,-1.0,-.8)}}else if(t===5){sphere(.9,dark,0,-.25,-.75,1,.85,.28);sphere(.55,accent,0,-.25,-.95,1,.85,.18)}}
  // Pernas compactas e pés grandes, linguagem visual de party-platformer.
  const legY=-1.45;for(const x of [-.37,.37]){cyl(.25,.28,.85,skin,x,legY,0,.95,1,1);const shoeMat=sv===0?dark:(sv%4===0?accent:mat(['#edf2f8','#262b38',a.accentColor,'#d85a4b'][sv%4],.5));sphere(.42,shoeMat,x,-1.93,.28,1.18,.55,1.5);if(sv%5===2)box(.55,.09,.72,accent,x,-2.12,.34)}
  // Quadril/parte inferior.
  if(bv%6===4){cyl(.88,.98,.55,accent,0,-.88,0,1,1,.86)}else{sphere(.82,bv%5===2?accent:dark,0,-.92,0,f?1.18:1.05,.66,.82);if(bv%5===1){for(const x of [-.58,.58])box(.34,.38,.16,accent,x,-.87,.68)}}
  // Corpo arredondado.
  sphere(1.05,cloth,0,-.06,0,f?.96:1.08,1.2,.84);sphere(.8,cloth,0,-.68,0,f?1.14:1.02,.7,.82);
  if(tv%7===1)box(1.45,.12,.1,accent,0,.0,.86);else if(tv%7===2){const badge=cyl(.25,.25,.04,white,0,-.18,.88,1,1,1,Math.PI/2);badge.rotation.x=Math.PI/2;}else if(tv%7===3){for(const x of [-.38,0,.38])box(.09,1.2,.06,accent,x,-.1,.85)}else if(tv%7===4){box(1.2,.42,.06,accent,0,-.05,.86);box(.18,.18,.08,white,0,-.05,.93)}
  // Casacos / sobreposições.
  if(ov>0){const t=ov%6;if(t===1){const collar=new THREE.TorusGeometry(.63,.11,10,30,Math.PI*1.25);add(collar,dark,0,.48,-.05,1,1,1,Math.PI/2,0,-.4)}else if(t===2){box(.08,1.65,.08,white,0,-.08,.88);for(const x of [-.43,.43])box(.45,.22,.06,dark,x,-.42,.88)}else if(t===3){cyl(.98,1.02,1.55,dark,0,-.1,0,1,1,.9);box(.07,1.35,.08,accent,0,-.1,.91)}else if(t===4){const collar=new THREE.TorusGeometry(.8,.16,10,36,Math.PI*1.3);add(collar,accent,0,.48,.0,1,1,1,Math.PI/2,0,-.48)}else if(t===5){for(const x of [-.75,.75])box(.22,1.45,.12,accent,x,-.12,.62,1,1,1,0,0,x<0?.15:-.15)}}
  // Braços e mãos.
  for(const x of [-1,1]){cyl(.2,.24,1.15,cloth,x*.96,-.25,0,1,1,1,0,0,x<0?.22:-.22);sphere(.28,handv===0?skin:accent,x*1.08,-.82,.03,1,1,1);if(handv>0&&handv%4===2)cyl(.3,.3,.25,dark,x*1.04,-.66,.02,1,1,1)}
  // Cabeça maior, suave e amigável.
  sphere(1.23,skin,0,1.36,.02,1.02,.96,.92);sphere(.2,skin,-1.18,1.32,0);sphere(.2,skin,1.18,1.32,0);
  // Olhos.
  if(ev%5===2){for(const x of [-.43,.43])box(.58,.28,.09,eye,x,1.42,1.08)}else{for(const x of [-.43,.43]){sphere(.27,white,x,1.43,1.04,1,.92,.35);sphere(.16,eye,x,1.41,1.23,1,1,.3);if(ev%5===1)add(new THREE.OctahedronGeometry(.075,0),white,x,1.44,1.32)}}
  // Boca.
  const mouth=new THREE.Mesh(new THREE.TorusGeometry(.17,.024,8,24,Math.PI),mat('#8e4b53',.65));mouth.position.set(0,.98,1.15);mouth.rotation.z=Math.PI;g.add(mouth);
  // Cabelo procedural: 70 itens = 10 famílias x 7 silhuetas/variações.
  sphere(1.25,hair,0,1.75,-.08,1,.56,.95);const cone=new THREE.ConeGeometry(.22,.66,12);const spike=(x,y,z,rz=0,s=.9)=>add(cone,hair,x,y,z,s,s,s,0,0,rz);
  const ht=hv%7;if(ht===1||ht===3||ht===5){const count=ht===5?5:8;for(let i=0;i<count;i++){const q=i-(count-1)/2;spike(q*(ht===5?.16:.27),2.18-Math.abs(q)*.04,.1,-q*.1,.86+(hv%10)*.012)}}else if(ht===2){for(let i=0;i<5;i++)spike(-.72+i*.3,1.93,1.0,-.55+i*.15,.7)}else if(ht===4){sphere(.42,hair,.84,2.13,-.15);if(hv>34)sphere(.32,hair,-.82,2.03,-.1)}else if(ht===6){for(const x of [-.72,.72]){sphere(.34,hair,x,1.62,.08);cyl(.2,.12,.75,hair,x,1.14,.08)}}else{for(let i=0;i<4;i++)spike(-.48+i*.32,1.94,1.02,-.34+i*.2,.63)}
  // Cabeça: boné, gorro, coroa, chapéu, headset, tiara...
  if(head>0){const t=head%7;if(t===1){sphere(1.27,accent,0,1.96,.0,1,.35,.95);box(1.05,.09,.48,dark,.36,1.91,1.0,1,1,1,0,.12)}else if(t===2){sphere(1.28,accent,0,2.0,-.02,1,.4,.95);sphere(.24,white,0,2.42,-.02)}else if(t===3){const crown=new THREE.Group();g.add(crown);box(1.35,.28,.1,accent,0,2.15,.05,1,1,1,0,0,0,crown);for(const x of [-.48,0,.48])spike(x,2.48,.04,0,.65)}else if(t===4){cyl(.85,1.02,.55,dark,0,2.13,0);cyl(1.38,1.38,.08,accent,0,1.88,.02)}else if(t===5){const tor=new THREE.TorusGeometry(1.28,.09,10,40,Math.PI);add(tor,accent,0,1.55,-.05);box(.24,.65,.32,dark,-1.2,1.43,.02);box(.24,.65,.32,dark,1.2,1.43,.02)}else if(t===6){const tor=new THREE.TorusGeometry(1.22,.05,8,36,Math.PI);add(tor,accent,0,1.92,.0)}}
  // Rosto: óculos, máscara, visor, bandana etc.
  if(face>0){const t=face%7;if(t===1){const tor=new THREE.TorusGeometry(.34,.035,10,32);add(tor,dark,-.43,1.42,1.3,1,1,.28);add(tor,dark,.43,1.42,1.3,1,1,.28);box(.24,.04,.04,dark,0,1.42,1.32)}else if(t===2){box(.9,.38,.12,dark,0,1.02,1.08,1,1,1,.1);box(.58,.04,.04,accent,0,1.05,1.16)}else if(t===3){box(1.55,.42,.08,mat(a.eyeColor,.28,.18,true,.68),0,1.42,1.28)}else if(t===4){box(1.36,.24,.1,accent,0,1.08,1.15,1,1,1,.05)}else if(t===5){const tor=new THREE.TorusGeometry(.38,.04,10,32);add(tor,accent,.45,1.43,1.29,1,1,.28);box(.05,.62,.05,accent,.8,1.08,1.18,1,1,1,0,0,.2)}else if(t===6){for(const x of [-.72,.72])sphere(.12,accent,x,1.1,1.1,1,.45,.2)}}
  g.rotation.y=0;
}
function inject(){
 const main=document.querySelector('main.shell');if(!main||$('profileScreen'))return;
 const top=document.querySelector('.top-actions');if(top){const b=document.createElement('button');b.className='mini-pill';b.id='profileButton';b.title='Meu perfil';b.innerHTML='🧑 <b>Perfil</b>';top.insertBefore(b,$('achievementsButton'));const a=document.createElement('button');a.className='mini-pill';a.id='avatarButton';a.title='Avatar e loja';a.innerHTML='✨ <b>Avatar</b>';top.insertBefore(a,b);}
 const home=$('homeScreen');if(home){const banner=document.createElement('section');banner.className='social-home-banner';banner.innerHTML=`<div class="social-home-avatar" id="homeAvatarPreview"></div><div><p class="eyebrow">👤 SEU JOGADOR</p><h2>Perfil, avatar e coleção</h2><p>Monte um avatar arredondado e estilizado, combine peças e desbloqueie um catálogo enorme.</p></div><div class="social-home-actions"><button class="primary-btn" id="homeProfileButton">ABRIR PERFIL</button><button class="secondary-btn" id="homeAvatarButton">PERSONALIZAR AVATAR</button></div>`;const q=home.querySelector('.quiz-home-banner');home.insertBefore(banner,q||home.firstChild);}
 main.insertAdjacentHTML('beforeend',`<section class="screen profile-screen" id="profileScreen"><div class="section-heading"><button class="back-link" id="profileBack">← Voltar</button><div><p class="eyebrow">👤 PERFIL DO JOGADOR</p><h2>Seu espaço no Game Guess</h2><p>Visual, recordes e identidade da sua conta.</p></div></div><div class="profile-v15-layout"><section class="profile-v15-hero"><div id="profileAvatarHero" class="profile-avatar-hero"></div><div class="profile-v15-id"><span class="online-dot">● ONLINE</span><h2 id="profileNickLabel">Jogador</h2><p id="profileBioLabel"></p><div class="profile-favorite">🎮 Favorito: <b id="profileFavLabel">Game Guess</b></div><button class="secondary-btn" id="profileEditAvatar">✨ Editar avatar</button></div></section><section class="profile-edit-card"><h3>✏️ Identidade</h3><label>Nickname<input id="profileNickInput" maxlength="22" placeholder="Seu nickname"></label><label>Bio<textarea id="profileBioInput" maxlength="120"></textarea></label><label>Jogo favorito<select id="profileFavoriteInput"><option>Game Guess</option><option>GeoGuess Arena</option><option>Quiz Mundial</option><option>Termo Arcade</option><option>KOF 2002 Magic Plus II</option><option>Multiverso</option><option>Arena Online</option></select></label><button class="primary-btn" id="profileSave">SALVAR PERFIL</button></section><section class="profile-stat-grid" id="profileStatGrid"></section><section class="profile-showcase"><div><h3>🏆 Destaques</h3><div id="profileHighlights" class="profile-highlight-grid"></div></div><div><h3>🎒 Visual equipado</h3><div id="profileEquipped" class="profile-equipped"></div></div></section></div></section>
 <section class="screen avatar-screen" id="avatarScreen"><div class="section-heading"><button class="back-link" id="avatarBack">← Voltar</button><div><p class="eyebrow">✨ AVATAR LAB</p><h2>Crie seu personagem</h2><p>Visual 3D arredondado, corpo masculino/feminino e 70 itens em cada categoria.</p></div><div class="avatar-wallet">⭐ <b id="avatarCoins">0</b> pontos</div></div><div class="avatar-v15-layout"><section class="avatar-studio"><div class="avatar-preview-stage"><div class="avatar-preview-badge">ARRASTE PARA GIRAR</div><div id="avatarPreview"></div></div><div class="avatar-color-panel"><h3>Base</h3><div class="avatar-body-toggle" id="avatarBodyToggle"><button data-body-type="masculino">Masculino</button><button data-body-type="feminino">Feminino</button></div><div><b>Pele</b><div id="skinSwatches" class="avatar-swatches"></div></div><div><b>Cabelo</b><div id="hairSwatches" class="avatar-swatches"></div></div><div><b>Olhos</b><div id="eyeSwatches" class="avatar-swatches"></div></div><div><b>Roupa</b><div id="clothSwatches" class="avatar-swatches"></div></div><div><b>Detalhes</b><div id="accentSwatches" class="avatar-swatches"></div></div><button class="primary-btn" id="avatarSave">✓ SALVAR AVATAR</button><button class="secondary-btn" id="avatarRandom">🎲 ALEATÓRIO</button></div></section><section class="avatar-shop"><div class="avatar-shop-head"><div><p class="eyebrow">🛍️ LOJA</p><h2>Catálogo de 700 itens</h2><small>70 peças em cada uma das 10 categorias</small></div><div class="avatar-wallet">⭐ <b id="shopCoins">0</b></div></div><div class="shop-tools"><input id="shopSearch" placeholder="Buscar item nesta categoria"><span id="shopCount">70 itens</span></div><div class="shop-tabs" id="shopTabs"></div><div class="shop-grid" id="shopGrid"></div><div class="shop-pager"><button id="shopPrev">←</button><span id="shopPageLabel">1 / 6</span><button id="shopNext">→</button></div></section></div></section>`);
}
let shopSlot='hair',shopPage=0,shopQuery='';const PAGE_SIZE=12;
function renderSwatches(id,vals,key,p){const el=$(id);if(!el)return;el.innerHTML=vals.map(v=>`<button class="avatar-swatch${p.avatar[key]===v?' active':''}" data-color-key="${key}" data-color="${v}" style="--sw:${v}" aria-label="${v}"></button>`).join('');}
function renderShop(p){
 const tabs=$('shopTabs');if(tabs)tabs.innerHTML=SLOT_ORDER.map(k=>`<button class="${shopSlot===k?'active':''}" data-shop-slot="${k}">${SLOT_META[k].icon} ${SLOT_META[k].label}</button>`).join('');
 const owned=new Set(p.avatarOwned||[]),q=shopQuery.trim().toLowerCase();let rows=CATALOG.filter(x=>x.slot===shopSlot&&(!q||x.name.toLowerCase().includes(q)||x.rarity.toLowerCase().includes(q)));
 const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));shopPage=Math.max(0,Math.min(shopPage,pages-1));const shown=rows.slice(shopPage*PAGE_SIZE,(shopPage+1)*PAGE_SIZE),grid=$('shopGrid');
 if($('shopCount'))$('shopCount').textContent=`${rows.length} de 70 itens`;
 if(grid)grid.innerHTML=shown.map(x=>{const eq=p.avatar[x.slot]===x.id;return `<article class="shop-item ${eq?'equipped':''}" data-rarity="${x.rarity}"><div class="shop-item-icon"><span>${x.icon}</span><b>#${String(x.variant+1).padStart(2,'0')}</b></div><div><b>${esc(x.name)}</b><small>${x.rarity} • ${SLOT_META[x.slot].label}</small></div><button data-shop-item="${x.id}" ${eq?'disabled':''}>${eq?'EQUIPADO':owned.has(x.id)?'EQUIPAR':`⭐ ${x.price}`}</button></article>`}).join('')||'<div class="shop-empty">Nenhum item encontrado.</div>';
 if($('shopPageLabel'))$('shopPageLabel').textContent=`${shopPage+1} / ${pages}`;if($('shopPrev'))$('shopPrev').disabled=shopPage<=0;if($('shopNext'))$('shopNext').disabled=shopPage>=pages-1;
}
function stats(p){const played=Number(p.gamesPlayed||0),wins=Number(p.gamesWon||0);return [['⭐','Pontos',p.coins||0],['🏆','Maior pontuação',p.highScore||0],['🔥','Melhor sequência',p.bestStreak||0],['🎮','Partidas',played],['✅','Vitórias',wins],['🎯','Aproveitamento',played?`${Math.round(wins/played*100)}%`:'0%'],['⚔️','Vitórias Arena',p.duelWins||0],['🌍','GeoGuess vitórias',p.geoWins||0]];}
function renderProfile(){const p=defaults(read()),u=FB()?.getUser?.();$('profileAvatarHero').innerHTML=svgAvatar(p.avatar);$('profileNickLabel').textContent=p.nickname||u?.displayName||u?.email?.split('@')[0]||'Jogador';$('profileBioLabel').textContent=p.bio;$('profileFavLabel').textContent=p.favoriteGame;$('profileNickInput').value=p.nickname||'';$('profileBioInput').value=p.bio;$('profileFavoriteInput').value=p.favoriteGame;$('profileStatGrid').innerHTML=stats(p).map(([i,l,v])=>`<div><span>${i}</span><small>${l}</small><b>${v}</b></div>`).join('');const level=Math.max(1,Math.floor((Number(p.gamesPlayed||0)+Number(p.gamesWon||0)*2)/10)+1);$('profileHighlights').innerHTML=`<div>🎖️ <b>Nível ${level}</b><span>Experiência geral</span></div><div>🌟 <b>${(p.avatarOwned||[]).length}</b><span>Itens desbloqueados</span></div><div>🧠 <b>${p.termBestStreak||p.bestStreak||0}</b><span>Sequência destaque</span></div><div>🥊 <b>${p.kofRating||1000}</b><span>Elo KOF</span></div>`;$('profileEquipped').innerHTML=SLOT_ORDER.map(k=>{const it=item(p.avatar[k]);return `<span title="${esc(it.name)}">${it.icon}<small>${esc(it.name)}</small></span>`}).join('');}
function renderAvatar(){const p=defaults(read());renderAvatar3D(p.avatar);$('avatarCoins').textContent=p.coins||0;$('shopCoins').textContent=p.coins||0;renderSwatches('skinSwatches',SKINS,'skin',p);renderSwatches('hairSwatches',HAIR_COLORS,'hairColor',p);renderSwatches('eyeSwatches',EYE_COLORS,'eyeColor',p);renderSwatches('clothSwatches',CLOTH_COLORS,'clothColor',p);renderSwatches('accentSwatches',ACCENT_COLORS,'accentColor',p);document.querySelectorAll('[data-body-type]').forEach(b=>b.classList.toggle('active',b.dataset.bodyType===p.avatar.bodyType));renderShop(p);const h=$('homeAvatarPreview');if(h)h.innerHTML=svgAvatar(p.avatar,'mini');}
function setAvatarValue(key,val){const p=defaults(read());p.avatar[key]=val;write(p);renderAvatar();}
function buyEquip(id){const it=item(id),p=defaults(read()),owned=new Set(p.avatarOwned||[]);if(!owned.has(id)){if(Number(p.coins||0)<it.price)return CORE()?.toast?.('Pontos insuficientes',`Você precisa de ${it.price} pontos para ${it.name}.`,'error');p.coins=Math.max(0,Number(p.coins||0)-it.price);p.avatarSpent=Number(p.avatarSpent||0)+it.price;owned.add(id);p.avatarOwned=[...owned];CORE()?.playSound?.('coin');}p.avatar[it.slot]=it.id;write(p);renderAvatar();CORE()?.toast?.('Visual atualizado',`${it.name} equipado.`);}
function openProfile(){CORE()?.showScreen?.('profileScreen');renderProfile()}
function openAvatar(){CORE()?.showScreen?.('avatarScreen');renderAvatar()}
function bind(){
 inject();renderAvatar();$('profileButton')?.addEventListener('click',openProfile);$('avatarButton')?.addEventListener('click',openAvatar);$('homeProfileButton')?.addEventListener('click',openProfile);$('homeAvatarButton')?.addEventListener('click',openAvatar);$('profileBack')?.addEventListener('click',()=>CORE()?.showScreen?.('homeScreen'));$('avatarBack')?.addEventListener('click',()=>{dispose3D();CORE()?.showScreen?.('homeScreen')});$('profileEditAvatar')?.addEventListener('click',openAvatar);
 $('profileSave')?.addEventListener('click',()=>{const p=defaults(read());p.nickname=String($('profileNickInput').value||'').trim().slice(0,22);p.bio=String($('profileBioInput').value||'').trim().slice(0,120);p.favoriteGame=$('profileFavoriteInput').value;write(p);renderProfile();CORE()?.toast?.('Perfil salvo','Suas alterações foram sincronizadas.');});
 $('avatarScreen')?.addEventListener('click',e=>{const sw=e.target.closest('[data-color-key]');if(sw)return setAvatarValue(sw.dataset.colorKey,sw.dataset.color);const body=e.target.closest('[data-body-type]');if(body)return setAvatarValue('bodyType',body.dataset.bodyType);const tab=e.target.closest('[data-shop-slot]');if(tab){shopSlot=tab.dataset.shopSlot;shopPage=0;shopQuery='';if($('shopSearch'))$('shopSearch').value='';return renderAvatar()}const it=e.target.closest('[data-shop-item]');if(it)return buyEquip(it.dataset.shopItem);});
 $('shopSearch')?.addEventListener('input',e=>{shopQuery=e.target.value;shopPage=0;renderShop(defaults(read()))});$('shopPrev')?.addEventListener('click',()=>{shopPage--;renderShop(defaults(read()))});$('shopNext')?.addEventListener('click',()=>{shopPage++;renderShop(defaults(read()))});
 $('avatarSave')?.addEventListener('click',()=>{write(defaults(read()));CORE()?.toast?.('Avatar salvo','Seu novo visual foi salvo na conta.');});
 $('avatarRandom')?.addEventListener('click',()=>{const p=defaults(read()),owned=CATALOG.filter(x=>(p.avatarOwned||[]).includes(x.id));for(const slot of SLOT_ORDER){const pool=owned.filter(x=>x.slot===slot);if(pool.length)p.avatar[slot]=pool[Math.floor(Math.random()*pool.length)].id;}p.avatar.bodyType=Math.random()>.5?'feminino':'masculino';p.avatar.skin=SKINS[Math.floor(Math.random()*SKINS.length)];p.avatar.hairColor=HAIR_COLORS[Math.floor(Math.random()*HAIR_COLORS.length)];p.avatar.eyeColor=EYE_COLORS[Math.floor(Math.random()*EYE_COLORS.length)];p.avatar.clothColor=CLOTH_COLORS[Math.floor(Math.random()*CLOTH_COLORS.length)];p.avatar.accentColor=ACCENT_COLORS[Math.floor(Math.random()*ACCENT_COLORS.length)];write(p);renderAvatar();});
 window.addEventListener('gameguess:authchange',()=>{renderAvatar();if($('profileScreen')?.classList.contains('active'))renderProfile()});
}
window.GameGuessSocial={openProfile,openAvatar,renderAvatar,svgAvatar,CATALOG,SLOT_ORDER};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
