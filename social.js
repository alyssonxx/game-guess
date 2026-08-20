(() => {
'use strict';
const $=id=>document.getElementById(id), CORE=()=>window.GameGuessCore, FB=()=>window.GameGuessFirebase;
const KEY='gameGuessArcadeV4';

/* V17: o avatar base foi redesenhado como um mascote 3D arredondado/"bean".
   A roupa galáxia enviada como referência virou um look inicial completo, mas cada
   camada pode ser trocada na loja. */
const SLOT_META={
  hood:{label:'Capuzes',icon:'🪐',base:'Capuz'},
  faceplate:{label:'Faceplate',icon:'🥽',base:'Faceplate'},
  upper:{label:'Trajes',icon:'👕',base:'Traje'},
  sleeves:{label:'Mangas',icon:'🧥',base:'Mangas'},
  gloves:{label:'Luvas',icon:'🧤',base:'Luvas'},
  lower:{label:'Parte inferior',icon:'🩳',base:'Parte inferior'},
  shoes:{label:'Calçados',icon:'🥾',base:'Calçado'},
  chest:{label:'Peitoral',icon:'🌙',base:'Peitoral'},
  head:{label:'Cabeça',icon:'⭐',base:'Acessório'},
  back:{label:'Costas',icon:'🎒',base:'Costas'}
};
const SLOT_ORDER=Object.keys(SLOT_META);
const FAMILIES={
  hood:['Clássico','Galáxia','Astronauta','Oversized','Tech','Royal','Nuvem','Street','Neon','Arcade'],
  faceplate:['Clássico','Dourado','Neon','Cyber','Cristal','Dark','Royal','Holográfico','Pixel','Solar'],
  upper:['Básico','Galáxia','Varsity','Techwear','Royal','Sport','Cosmic','Street','Arcade','Nebulosa'],
  sleeves:['Básicas','Galáxia','Listradas','Puffer','Tech','Armadura','Oversized','Sport','Neon','Cosmic'],
  gloves:['Básicas','Galáxia','Douradas','Tech','Puffer','Arcade','Sport','Robô','Neon','Cosmic'],
  lower:['Básica','Galáxia','Cargo','Sport','Tech','Royal','Arcade','Street','Neon','Cosmic'],
  shoes:['Básicos','Galáxia','Runner','High-top','Botas','Tech','Royal','Arcade','Neon','Cosmic'],
  chest:['Livre','Lua & estrelas','Bolso clássico','Zíper','Badge','Harness','Emblema','Arcade','Royal','Cosmic'],
  head:['Livre','Estrela','Coroa','Halo','Antena','Headset','Orelhas','Boné','Tiara','Planeta'],
  back:['Livre','Mochila','Asas','Capa','Jetpack','Escudo','Cauda','Nuvem','Arcade','Cosmic']
};
const THEMES=['Arcade','Nova','Pixel','Cosmic','Turbo','Dream','Galaxy'];
const RARITY=['Inicial','Comum','Comum','Raro','Raro','Épico','Épico','Lendário'];
const PRIMARY=['#7455df','#9b67dd','#ef76bd','#5f8fe8','#56bde5','#e15f91','#3fc6a0','#f08c4f','#30384d','#eee9f5','#c84cff','#4a74d8'];
const SECONDARY=['#ef8dcc','#b983e8','#6e82ea','#65c8ef','#f3a4d5','#ffbe70','#67dfbf','#7865e8','#4a5267','#d9dded','#f0659f','#4fc2e8'];
const ACCENT=['#ffd56a','#ffe08e','#ffb352','#7af1ff','#ff81ce','#a5ffca','#ffffff','#bba4ff','#ff6e74','#68b8ff'];
const METAL=['#f4c45d','#f7df9e','#dce4ef','#93a9c9','#efb06a','#de87d8','#5ce6ff','#ffffff'];
const FACE=['#fff5eb','#fffaf4','#f0f6ff','#e6f9ff','#f4e9ff','#d9e4ef','#161b29','#f8edf6'];
const STARTER={hood:'hood_02',faceplate:'faceplate_02',upper:'upper_02',sleeves:'sleeves_02',gloves:'gloves_02',lower:'lower_02',shoes:'shoes_02',chest:'chest_02',head:'head_02',back:'back_01'};

function priceFor(n){if(n<=2)return 0;const tier=Math.floor((n-3)/10);return 25+tier*15+((n-3)%5)*5;}
function rarityFor(n){if(n<=2)return 'Inicial';return RARITY[Math.min(7,1+Math.floor((n-3)/10))];}
function makeCatalog(){
  const out=[];
  for(const slot of SLOT_ORDER){
    for(let n=1;n<=70;n++){
      const family=FAMILIES[slot][(n-1)%10],theme=THEMES[Math.floor((n-1)/10)%THEMES.length];
      const isNone=['chest','head','back'].includes(slot)&&n===1;
      out.push({id:`${slot}_${String(n).padStart(2,'0')}`,slot,name:isNone?`Sem ${SLOT_META[slot].label.toLowerCase()}`:`${family} ${theme}`,price:priceFor(n),rarity:rarityFor(n),icon:SLOT_META[slot].icon,variant:n-1,family:(n-1)%10,tier:Math.floor((n-1)/10)});
    }
  }
  return out;
}
const CATALOG=makeCatalog(),CATALOG_BY_ID=new Map(CATALOG.map(x=>[x.id,x]));
const STARTER_IDS=Object.values(STARTER);
const LEGACY_SLOTS={hair:'head',eyes:'faceplate',headwear:'head',face:'faceplate',top:'upper',outerwear:'hood',hands:'gloves',bottom:'lower',shoes:'shoes',back:'back'};

function read(){try{return CORE()?.getProfile?.()||JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
function write(p){CORE()?.replaceProfile?.(p);CORE()?.saveProfile?.();try{FB()?.syncLocalProfile?.(p)}catch{}}
function normalizeAvatar(input={}){
  const old=input?.avatar&&typeof input.avatar==='object'?input.avatar:input||{};
  const a={
    primaryColor:old.primaryColor||old.clothColor||'#7455df',
    secondaryColor:old.secondaryColor||'#ef8dcc',
    accentColor:old.accentColor||'#ffd56a',
    metalColor:old.metalColor||'#f4c45d',
    faceColor:old.faceColor||'#fff5eb',
    eyeColor:old.eyeColor||'#11131a'
  };
  for(const slot of SLOT_ORDER){
    let id=old[slot];
    if(!id){const legacyKey=Object.entries(LEGACY_SLOTS).find(([,to])=>to===slot)?.[0];if(legacyKey&&old[legacyKey])id=STARTER[slot];}
    a[slot]=CATALOG_BY_ID.has(id)?id:STARTER[slot];
  }
  return a;
}
function defaults(p={}){
  const owned=new Set([...(p.avatarOwned||[]).filter(id=>CATALOG_BY_ID.has(id)),...STARTER_IDS]);
  return {...p,avatarOwned:[...owned],nickname:String(p.nickname||''),bio:String(p.bio||'Explorador, jogador e colecionador de desafios.'),favoriteGame:String(p.favoriteGame||'Game Guess'),avatar:normalizeAvatar(p)};
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function item(id){return CATALOG_BY_ID.get(id)||CATALOG[0]}
function variant(a,slot){return item(a[slot]).variant||0}
function family(a,slot){return item(a[slot]).family||0}
function hash(str){let h=2166136261;for(const c of String(str)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}

function svgAvatar(cfg={},size='large'){
  const a=normalizeAvatar(cfg),id=`gg${hash(JSON.stringify(a))}`;
  const upper=family(a,'upper'),hood=family(a,'hood'),fp=family(a,'faceplate'),chest=family(a,'chest'),head=family(a,'head'),back=family(a,'back'),shoe=family(a,'shoes'),glove=family(a,'gloves'),lower=family(a,'lower');
  const fabric=`url(#${id}fabric)`;
  const star=(x,y,s=1)=>`<path d="M${x} ${y-6*s}l${2*s} ${4*s} ${5*s} ${1*s}-${4*s} ${3*s} ${1*s} ${5*s}-${4*s}-${2*s}-${4*s} ${2*s} ${1*s}-${5*s}-${4*s}-${3*s} ${5*s}-${1*s}z" fill="${a.accentColor}" opacity=".9"/>`;
  const sparkles=upper===1||upper===6||upper===9?`${star(85,78,.55)}${star(190,72,.42)}${star(88,188,.38)}${star(176,223,.48)}${star(118,272,.34)}${star(205,180,.32)}<circle cx="70" cy="230" r="2.8" fill="#fff"/><circle cx="205" cy="125" r="2" fill="#fff"/><circle cx="157" cy="60" r="2" fill="#fff"/>`:'';
  const backSvg=back===1?`<rect x="86" y="145" width="108" height="135" rx="42" fill="#28304a" stroke="${a.accentColor}" stroke-width="6"/>`:back===2?`<g fill="#dff8ff" stroke="${a.accentColor}" stroke-width="5"><ellipse cx="60" cy="200" rx="42" ry="70" transform="rotate(-20 60 200)"/><ellipse cx="220" cy="200" rx="42" ry="70" transform="rotate(20 220 200)"/></g>`:back===3?`<path d="M82 154h116l28 164q-86 35-172 0z" fill="${a.secondaryColor}" opacity=".9"/>`:'';
  const headSvg=head===1?`<g transform="translate(69 73) rotate(-20)">${star(0,0,2.8)}</g>`:head===2?`<path d="M96 52l16 16 28-28 28 28 17-16 9 48H87z" fill="${a.accentColor}" stroke="${a.metalColor}" stroke-width="4"/>`:head===3?`<ellipse cx="140" cy="47" rx="62" ry="17" fill="none" stroke="${a.accentColor}" stroke-width="8"/>`:head===4?`<path d="M140 49v-25" stroke="${a.metalColor}" stroke-width="7"/><circle cx="140" cy="18" r="10" fill="${a.accentColor}"/>`:head===5?`<path d="M74 105q3-65 66-65t67 65" fill="none" stroke="#242b42" stroke-width="13"/><rect x="62" y="97" width="23" height="48" rx="10" fill="${a.accentColor}"/><rect x="195" y="97" width="23" height="48" rx="10" fill="${a.accentColor}"/>`:'';
  const pocket=chest===0?'':chest===1?`<path d="M91 218h98l-9 58H100z" fill="${a.primaryColor}" stroke="${a.metalColor}" stroke-width="5"/><path d="M145 232a17 17 0 1 0 14 25 20 20 0 1 1-14-25z" fill="${a.accentColor}"/>${star(168,251,.7)}`:chest===2?`<path d="M89 221h102l-8 55H97z" fill="${a.secondaryColor}" stroke="${a.accentColor}" stroke-width="4"/>`:chest===3?`<path d="M140 187v91" stroke="${a.metalColor}" stroke-width="5"/><circle cx="140" cy="225" r="5" fill="${a.accentColor}"/>`:chest===4?`<circle cx="140" cy="230" r="27" fill="${a.accentColor}"/><text x="140" y="239" text-anchor="middle" font-size="26" font-weight="900" fill="#1a1930">GG</text>`:`<path d="M98 196l84 70M182 196l-84 70" stroke="${a.accentColor}" stroke-width="7" opacity=".9"/>`;
  const faceStroke=fp===2?'#6df0ff':fp===5?'#34394b':fp===6?'#ffe28c':a.metalColor;
  const faceFill=fp===5?'#1b2230':fp===4?'#dff8ff':a.faceColor;
  return `<svg class="gg-avatar-svg ${size}" viewBox="0 0 280 380" role="img" aria-label="Avatar mascote 3D estilizado">
  <defs><linearGradient id="${id}fabric" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a.primaryColor}"/><stop offset=".47" stop-color="${a.secondaryColor}"/><stop offset="1" stop-color="${upper===1?'#65b7ed':a.primaryColor}"/></linearGradient><filter id="${id}shadow"><feGaussianBlur stdDeviation="7"/></filter></defs>
  <ellipse cx="140" cy="350" rx="76" ry="13" fill="#000" opacity=".27" filter="url(#${id}shadow)"/>${backSvg}
  <g>${/* short bean legs */''}<rect x="101" y="290" width="34" height="42" rx="17" fill="${fabric}"/><rect x="145" y="290" width="34" height="42" rx="17" fill="${fabric}"/>
  <rect x="88" y="316" width="54" height="29" rx="14" fill="${shoe===1?fabric:a.primaryColor}" stroke="${a.metalColor}" stroke-width="${shoe===1?4:2}"/><rect x="138" y="316" width="54" height="29" rx="14" fill="${shoe===1?fabric:a.primaryColor}" stroke="${a.metalColor}" stroke-width="${shoe===1?4:2}"/>
  <ellipse cx="140" cy="180" rx="87" ry="137" fill="${fabric}" stroke="rgba(255,255,255,.22)" stroke-width="3"/>${sparkles}
  <rect x="43" y="166" width="38" height="102" rx="20" fill="${family(a,'sleeves')===1?fabric:a.primaryColor}" transform="rotate(10 62 217)"/><rect x="199" y="166" width="38" height="102" rx="20" fill="${family(a,'sleeves')===1?fabric:a.primaryColor}" transform="rotate(-10 218 217)"/>
  <circle cx="57" cy="265" r="21" fill="${glove===1?fabric:a.primaryColor}"/><circle cx="223" cy="265" r="21" fill="${glove===1?fabric:a.primaryColor}"/>
  <path d="M49 235q18 10 35 1M196 236q18 9 35-1" stroke="${a.metalColor}" stroke-width="8" fill="none"/>
  <path d="M64 157q23-32 76-32t77 32" fill="none" stroke="${hood===1?a.secondaryColor:a.primaryColor}" stroke-width="18" stroke-linecap="round"/>
  <ellipse cx="140" cy="113" rx="62" ry="52" fill="${faceFill}" stroke="${faceStroke}" stroke-width="7"/>
  <rect x="111" y="95" width="14" height="35" rx="7" fill="${fp===5?'#f4f8ff':'#11131a'}"/><rect x="155" y="95" width="14" height="35" rx="7" fill="${fp===5?'#f4f8ff':'#11131a'}"/>
  ${headSvg}${pocket}${lower===1?`<path d="M85 286q55 18 110 0" fill="none" stroke="${a.metalColor}" stroke-width="5"/>`:''}
  ${hood===1?`<path d="M115 157v38M165 157v38" stroke="${a.metalColor}" stroke-width="5"/><circle cx="115" cy="196" r="8" fill="${a.accentColor}"/><circle cx="165" cy="196" r="8" fill="${a.accentColor}"/>`:''}</g></svg>`;
}

let avatar3D=null,avatarMotion='idle';
function disposeMaterial(m){if(!m)return;(Array.isArray(m)?m:[m]).forEach(x=>{x.map?.dispose?.();x.dispose?.()})}
function dispose3D(){if(!avatar3D)return;try{cancelAnimationFrame(avatar3D.raf);avatar3D.ro?.disconnect?.();avatar3D.renderer?.dispose?.();avatar3D.scene?.traverse?.(n=>{n.geometry?.dispose?.();disposeMaterial(n.material)});avatar3D.host?.replaceChildren();}catch{}avatar3D=null;}
function fabricTexture(THREE,a,seed=1,style=1){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,256,256);g.addColorStop(0,a.primaryColor);g.addColorStop(.5,a.secondaryColor);g.addColorStop(1,style===1?'#5ab8e8':a.primaryColor);x.fillStyle=g;x.fillRect(0,0,256,256);
  if([1,6,9].includes(style)){let s=(seed+17)*92821;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};for(let i=0;i<34;i++){const px=rnd()*256,py=rnd()*256,r=1+rnd()*2.8;x.globalAlpha=.55+rnd()*.4;x.fillStyle=i%4===0?a.accentColor:'#fff';x.beginPath();x.arc(px,py,r,0,Math.PI*2);x.fill();if(i%7===0){x.fillRect(px-5,py-.8,10,1.6);x.fillRect(px-.8,py-5,1.6,10)}}x.globalAlpha=1;}
  if(style===2||style===7){x.globalAlpha=.18;x.fillStyle=a.accentColor;for(let y=0;y<256;y+=34)x.fillRect(0,y,256,8);x.globalAlpha=1}
  if(style===3){x.globalAlpha=.2;x.strokeStyle=a.accentColor;x.lineWidth=4;for(let i=-256;i<256;i+=36){x.beginPath();x.moveTo(i,0);x.lineTo(i+256,256);x.stroke()}x.globalAlpha=1}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
function renderAvatar3D(cfg={}){
  const host=$('avatarPreview');if(!host)return;
  if(!window.THREE){host.innerHTML=`${svgAvatar(cfg)}<small class="avatar-3d-fallback">Prévia 2D ativa • WebGL não carregou</small>`;return;}
  const THREE=window.THREE,a=normalizeAvatar(cfg);
  try{
    if(!avatar3D){
      host.innerHTML='';const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.8,window.devicePixelRatio||1));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.domElement.setAttribute('aria-label','Avatar 3D girável');host.appendChild(renderer.domElement);
      const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.1,100);camera.position.set(0,.35,8.4);camera.lookAt(0,.15,0);scene.add(new THREE.HemisphereLight(0xf3eaff,0x171027,2.5));const key=new THREE.DirectionalLight(0xffffff,3.4);key.position.set(4,6,7);key.castShadow=true;scene.add(key);const fill=new THREE.DirectionalLight(0x8edcff,2.0);fill.position.set(-4,2,4);scene.add(fill);const rim=new THREE.DirectionalLight(0xff7edb,2.0);rim.position.set(-3,4,-4);scene.add(rim);const root=new THREE.Group();scene.add(root);
      const ground=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2.05,.18,48),new THREE.MeshStandardMaterial({color:0x3a2d72,roughness:.35,metalness:.2}));ground.position.y=-1.78;ground.receiveShadow=true;scene.add(ground);
      const resize=()=>{const r=host.getBoundingClientRect(),w=Math.max(300,Math.round(r.width||440)),h=Math.max(430,Math.round(r.height||610));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()};resize();const ro=new ResizeObserver(resize);ro.observe(host);
      let dragging=false,lastX=0,targetY=.25;renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;targetY+=(e.clientX-lastX)*.012;lastX=e.clientX});renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.innerHTML=svgAvatar(a);dispose3D();});
      const animate=()=>{if(!avatar3D)return;const t=performance.now()/1000,parts=avatar3D.parts||{};root.rotation.y+=(targetY-root.rotation.y)*.08;root.position.y=0;root.rotation.z=0;if(parts.leftArm){parts.leftArm.rotation.z=parts.leftArm.userData.baseZ||0;parts.rightArm.rotation.z=parts.rightArm.userData.baseZ||0}
        if(avatarMotion==='idle')root.position.y=Math.sin(t*2.2)*.035;
        if(avatarMotion==='wave'&&parts.rightArm){root.position.y=Math.sin(t*2.2)*.025;parts.rightArm.rotation.z=-1.45+Math.sin(t*7)*.25}
        if(avatarMotion==='jump'){root.position.y=Math.max(0,Math.sin(t*3.2))*.72;root.rotation.z=Math.sin(t*3.2)*.06}
        if(avatarMotion==='celebrate'&&parts.leftArm){parts.leftArm.rotation.z=1.55+Math.sin(t*5)*.18;parts.rightArm.rotation.z=-1.55-Math.sin(t*5)*.18;root.position.y=Math.abs(Math.sin(t*4))*.15}
        renderer.render(scene,camera);avatar3D.raf=requestAnimationFrame(animate)};
      avatar3D={host,renderer,scene,camera,root,ro,raf:0,parts:{}};animate();
    }
    const root=avatar3D.root;while(root.children.length){const o=root.children.pop();o.traverse?.(n=>{n.geometry?.dispose?.();disposeMaterial(n.material)})}
    const mat=(color,rough=.52,metal=.05)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
    const fabric=(slot)=>{const v=variant(a,slot),fam=family(a,slot),m=new THREE.MeshStandardMaterial({map:fabricTexture(THREE,a,v,fam),roughness:.5,metalness:.03});return m};
    const gold=mat(a.metalColor,.3,.55),white=mat(a.faceColor,.42,.02),black=mat('#101218',.24,.12),primary=mat(a.primaryColor),secondary=mat(a.secondaryColor),accent=mat(a.accentColor,.35,.18),dark=mat('#252a3c',.55,.08);
    const add=(geo,m,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,parent=root)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx,ry,rz);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
    const sphere=(r,m,x,y,z,sx=1,sy=1,sz=1,parent=root)=>add(new THREE.SphereGeometry(r,32,24),m,x,y,z,sx,sy,sz,0,0,0,parent);
    const capsule=(r,len,m,x,y,z,rx=0,ry=0,rz=0,parent=root)=>add(new THREE.CapsuleGeometry(r,len,8,20),m,x,y,z,1,1,1,rx,ry,rz,parent);
    const box=(w,h,d,m,x,y,z,rx=0,ry=0,rz=0,parent=root)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z,1,1,1,rx,ry,rz,parent);
    const torus=(R,r,m,x,y,z,rx=0,ry=0,rz=0,parent=root,arc=Math.PI*2)=>add(new THREE.TorusGeometry(R,r,12,48,arc),m,x,y,z,1,1,1,rx,ry,rz,parent);
    const starGeo=(outer=.3,inner=.14,depth=.07)=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const an=-Math.PI/2+i*Math.PI/5,rr=i%2?inner:outer;const xx=Math.cos(an)*rr,yy=Math.sin(an)*rr;i?s.lineTo(xx,yy):s.moveTo(xx,yy)}s.closePath();return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.02,bevelSegments:2})};
    const upperM=fabric('upper'),hoodM=fabric('hood'),sleeveM=fabric('sleeves'),gloveM=fabric('gloves'),lowerM=fabric('lower'),shoeM=fabric('shoes');
    const back=family(a,'back');if(back===1){box(1.35,1.65,.42,dark,0,-.05,-.72,0,0,0);box(.92,.12,.47,accent,0,.35,-.94)}else if(back===2){for(const x of [-1,1])sphere(.92,mat('#dff8ff',.38),x*.94,.15,-.56,.45,1.15,.18)}else if(back===3){const cape=box(1.52,2.55,.08,secondary,0,-.15,-.82,-.09);cape.material.transparent=true;cape.material.opacity=.9}else if(back===4){for(const x of [-.42,.42]){capsule(.22,.75,dark,x,-.22,-.82);sphere(.19,accent,x,-.86,-.82)}}
    // Body: one continuous rounded mascot silhouette.
    sphere(1.05,upperM,0,.05,0,1.02,1.36,.88);sphere(.86,hoodM,0,1.04,-.02,1.07,1.02,.9);
    // Short legs and chunky footwear.
    for(const x of [-.38,.38]){capsule(.23,.28,lowerM,x,-1.18,.02);const s=sphere(.39,shoeM,x,-1.48,.2,1.18,.62,1.45);if(family(a,'shoes')===1)torus(.32,.045,gold,x,-1.48,.34,Math.PI/2)}
    // Arms & gloves.
    const left=capsule(.24,.68,sleeveM,-1.02,-.05,.02,0,0,.18),right=capsule(.24,.68,sleeveM,1.02,-.05,.02,0,0,-.18);left.userData.baseZ=.18;right.userData.baseZ=-.18;avatar3D.parts={leftArm:left,rightArm:right};
    sphere(.29,gloveM,-1.13,-.68,.04,1,1,1);sphere(.29,gloveM,1.13,-.68,.04,1,1,1);if([1,2,5].includes(family(a,'gloves'))){torus(.27,.055,gold,-1.09,-.5,.03,Math.PI/2);torus(.27,.055,gold,1.09,-.5,.03,Math.PI/2)}
    // Hood collar / drawstrings.
    const hf=family(a,'hood');torus(.82,hf===1?.11:.08,hf===1?secondary:primary,0,.34,.02,Math.PI/2);if(hf===1||hf===3){for(const x of [-.24,.24]){capsule(.025,.38,gold,x,.07,.78);sphere(.075,accent,x,-.16,.78)}}
    // Faceplate and eyes exactly in the large clean oval language from the reference.
    const ff=family(a,'faceplate'),faceMat=ff===5?dark:white,ring=ff===2?mat('#63efff',.2,.35):ff===6?accent:gold;sphere(.69,faceMat,0,.92,.78,1.08,.84,.16);torus(.705,.06,ring,0,.92,.88);for(const x of [-.25,.25])sphere(.12,ff===5?mat('#f7fbff'):black,x,.94,.965,.58,1.45,.25);
    // Chest clothing details.
    const cf=family(a,'chest');if(cf===1){box(1.05,.55,.09,primary,0,-.42,.82,0,0,0);torus(.16,.055,gold,-.02,-.42,.9,0,0,.45,root,Math.PI*1.45);add(starGeo(.11,.05,.04),gold,.33,-.39,.89,1,1,1,0,0,.2)}else if(cf===2){box(1.12,.48,.1,secondary,0,-.43,.83)}else if(cf===3){box(.055,1.15,.055,gold,0,-.13,.86)}else if(cf===4){add(starGeo(.27,.13,.06),accent,0,-.3,.86,1,1,1,0,0,.1)}else if(cf>=5){box(.07,1.45,.055,accent,-.35,-.18,.84,0,0,-.45);box(.07,1.45,.055,accent,.35,-.18,.84,0,0,.45)}
    // Head accessories.
    const hd=family(a,'head');if(hd===1){add(starGeo(.34,.16,.08),gold,-.72,1.46,.5,1,1,1,0,-.35,-.12)}else if(hd===2){const crown=new THREE.Group();root.add(crown);box(1.05,.24,.1,gold,0,1.76,.03,0,0,0,crown);for(const x of [-.36,0,.36])add(new THREE.ConeGeometry(.13,.38,8),accent,x,2.02,.03,1,1,1,0,0,0,crown)}else if(hd===3){torus(.72,.045,accent,0,1.95,0,Math.PI/2)}else if(hd===4){capsule(.035,.34,gold,0,1.92,.0);sphere(.1,accent,0,2.14,.0)}else if(hd===5){torus(1.0,.07,dark,0,1.05,-.05,0,0,0,root,Math.PI);box(.22,.55,.28,accent,-.94,.93,.02);box(.22,.55,.28,accent,.94,.93,.02)}else if(hd===6){for(const x of [-.55,.55])sphere(.36,hoodM,x,1.72,-.05,.7,1.1,.5)}else if(hd===9){sphere(.2,accent,-.72,1.48,.54);torus(.32,.05,gold,-.72,1.48,.54,0,0,0,root)}
    // Extra silhouette changes for selected layers.
    if(family(a,'sleeves')===3){sphere(.38,sleeveM,-.98,.18,.0,1,1.25,1);sphere(.38,sleeveM,.98,.18,.0,1,1.25,1)}
    if(family(a,'lower')===4)torus(.86,.09,dark,0,-.72,.02,Math.PI/2);else if(family(a,'lower')===1)torus(.83,.055,gold,0,-.76,.03,Math.PI/2);
    root.rotation.y=.25;
  }catch(e){console.error('Avatar 3D V17:',e);dispose3D();host.innerHTML=`${svgAvatar(a)}<small class="avatar-3d-fallback">Prévia 2D de segurança • ${esc(e?.message||'WebGL indisponível')}</small>`;}
}

function inject(){
 const main=document.querySelector('main.shell');if(!main||$('profileScreen'))return;
 const top=document.querySelector('.top-actions');if(top){const b=document.createElement('button');b.className='mini-pill';b.id='profileButton';b.title='Meu perfil';b.innerHTML='🧑 <b>Perfil</b>';top.insertBefore(b,$('achievementsButton'));const a=document.createElement('button');a.className='mini-pill';a.id='avatarButton';a.title='Avatar e loja';a.innerHTML='✨ <b>Avatar</b>';top.insertBefore(a,b);}
 const home=$('homeScreen');if(home){const banner=document.createElement('section');banner.className='social-home-banner';banner.innerHTML=`<div class="social-home-avatar" id="homeAvatarPreview"></div><div><p class="eyebrow">👤 SEU JOGADOR</p><h2>Perfil, avatar e coleção</h2><p>Seu mascote 3D agora usa roupas, acessórios e cores em camadas.</p></div><div class="social-home-actions"><button class="primary-btn" id="homeProfileButton">ABRIR PERFIL</button><button class="secondary-btn" id="homeAvatarButton">PERSONALIZAR AVATAR</button></div>`;const q=home.querySelector('.quiz-home-banner');home.insertBefore(banner,q||home.firstChild);}
 main.insertAdjacentHTML('beforeend',`<section class="screen profile-screen" id="profileScreen"><div class="section-heading"><button class="back-link" id="profileBack">← Voltar</button><div><p class="eyebrow">👤 PERFIL DO JOGADOR</p><h2>Seu espaço no Game Guess</h2><p>Visual, recordes e identidade da sua conta.</p></div></div><div class="profile-v15-layout"><section class="profile-v15-hero"><div id="profileAvatarHero" class="profile-avatar-hero"></div><div class="profile-v15-id"><span class="online-dot">● ONLINE</span><h2 id="profileNickLabel">Jogador</h2><p id="profileBioLabel"></p><div class="profile-favorite">🎮 Favorito: <b id="profileFavLabel">Game Guess</b></div><button class="secondary-btn" id="profileEditAvatar">✨ Editar avatar</button></div></section><section class="profile-edit-card"><h3>✏️ Identidade</h3><label>Nickname<input id="profileNickInput" maxlength="22" placeholder="Seu nickname"></label><label>Bio<textarea id="profileBioInput" maxlength="120"></textarea></label><label>Jogo favorito<select id="profileFavoriteInput"><option>Game Guess</option><option>GeoGuess Arena</option><option>Quiz Mundial</option><option>Termo Arcade</option><option>KOF 2002 Magic Plus II</option><option>Multiverso</option><option>Arena Online</option></select></label><button class="primary-btn" id="profileSave">SALVAR PERFIL</button></section><section class="profile-stat-grid" id="profileStatGrid"></section><section class="profile-showcase"><div><h3>🏆 Destaques</h3><div id="profileHighlights" class="profile-highlight-grid"></div></div><div><h3>🎒 Visual equipado</h3><div id="profileEquipped" class="profile-equipped"></div></div></section></div></section>
 <section class="screen avatar-screen" id="avatarScreen"><div class="section-heading"><button class="back-link" id="avatarBack">← Voltar</button><div><p class="eyebrow">✨ AVATAR LAB V17</p><h2>Monte seu mascote 3D</h2><p>Corpo bean fixo + roupas, capuzes, acessórios e 700 peças adaptadas ao novo modelo.</p></div><div class="avatar-wallet">⭐ <b id="avatarCoins">0</b> pontos</div></div><div class="avatar-v15-layout"><section class="avatar-studio"><div class="avatar-preview-stage"><div class="avatar-preview-badge">ARRASTE PARA GIRAR • VISUAL 360°</div><div id="avatarPreview"></div><div class="avatar-motion-bar" id="avatarMotionBar"><button class="active" data-avatar-action="idle">PARADO</button><button data-avatar-action="wave">ACENAR</button><button data-avatar-action="jump">PULAR</button><button data-avatar-action="celebrate">COMEMORAR</button></div></div><div class="avatar-color-panel"><h3>Paleta do traje</h3><p class="avatar-panel-note">O corpo do mascote não muda. A personalização acontece nas roupas e acessórios.</p><div><b>Cor principal</b><div id="primarySwatches" class="avatar-swatches"></div></div><div><b>Cor secundária</b><div id="secondarySwatches" class="avatar-swatches"></div></div><div><b>Detalhes</b><div id="accentSwatches" class="avatar-swatches"></div></div><div><b>Metais</b><div id="metalSwatches" class="avatar-swatches"></div></div><div><b>Faceplate</b><div id="faceSwatches" class="avatar-swatches"></div></div><button class="primary-btn" id="avatarSave">✓ SALVAR VISUAL</button><button class="secondary-btn" id="avatarRandom">🎲 ALEATÓRIO</button></div></section><section class="avatar-shop"><div class="avatar-shop-head"><div><p class="eyebrow">🛍️ LOJA V17</p><h2>700 peças de roupa e acessórios</h2><small>70 itens reais em cada uma das 10 categorias; cada card mostra o mascote usando a peça.</small></div><div class="avatar-wallet">⭐ <b id="shopCoins">0</b></div></div><div class="shop-tools"><input id="shopSearch" placeholder="Buscar peça nesta categoria"><span id="shopCount">70 itens</span></div><div class="shop-tabs" id="shopTabs"></div><div class="shop-grid" id="shopGrid"></div><div class="shop-pager"><button id="shopPrev">←</button><span id="shopPageLabel">1 / 6</span><button id="shopNext">→</button></div></section></div></section>`);
}

let shopSlot='upper',shopPage=0,shopQuery='';const PAGE_SIZE=12;
function renderSwatches(id,vals,key,p){const el=$(id);if(!el)return;el.innerHTML=vals.map(v=>`<button class="avatar-swatch${p.avatar[key]===v?' active':''}" data-color-key="${key}" data-color="${v}" style="--sw:${v}" aria-label="${v}"></button>`).join('');}
function renderShop(p){
 const tabs=$('shopTabs');if(tabs)tabs.innerHTML=SLOT_ORDER.map(k=>`<button class="${shopSlot===k?'active':''}" data-shop-slot="${k}">${SLOT_META[k].icon} ${SLOT_META[k].label}</button>`).join('');
 const owned=new Set(p.avatarOwned||[]),q=shopQuery.trim().toLowerCase();let rows=CATALOG.filter(x=>x.slot===shopSlot&&(!q||x.name.toLowerCase().includes(q)||x.rarity.toLowerCase().includes(q)));
 const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));shopPage=Math.max(0,Math.min(shopPage,pages-1));const shown=rows.slice(shopPage*PAGE_SIZE,(shopPage+1)*PAGE_SIZE),grid=$('shopGrid');
 if($('shopCount'))$('shopCount').textContent=`${rows.length} de 70 itens`;
 if(grid)grid.innerHTML=shown.map(x=>{const eq=p.avatar[x.slot]===x.id,preview={...p.avatar,[x.slot]:x.id};return `<article class="shop-item ${eq?'equipped':''}" data-rarity="${x.rarity}"><div class="shop-item-icon shop-item-avatar">${svgAvatar(preview,'shop')}<b>#${String(x.variant+1).padStart(2,'0')}</b></div><div><b>${esc(x.name)}</b><small>${x.rarity} • ${SLOT_META[x.slot].label}</small></div><button data-shop-item="${x.id}" ${eq?'disabled':''}>${eq?'EQUIPADO':owned.has(x.id)?'EQUIPAR':`⭐ ${x.price}`}</button></article>`}).join('')||'<div class="shop-empty">Nenhum item encontrado.</div>';
 if($('shopPageLabel'))$('shopPageLabel').textContent=`${shopPage+1} / ${pages}`;if($('shopPrev'))$('shopPrev').disabled=shopPage<=0;if($('shopNext'))$('shopNext').disabled=shopPage>=pages-1;
}
function stats(p){const played=Number(p.gamesPlayed||0),wins=Number(p.gamesWon||0);return [['⭐','Pontos',p.coins||0],['🏆','Maior pontuação',p.highScore||0],['🔥','Melhor sequência',p.bestStreak||0],['🎮','Partidas',played],['✅','Vitórias',wins],['🎯','Aproveitamento',played?`${Math.round(wins/played*100)}%`:'0%'],['⚔️','Vitórias Arena',p.duelWins||0],['🌍','GeoGuess vitórias',p.geoWins||0]];}
function renderProfile(){const p=defaults(read()),u=FB()?.getUser?.();if($('profileAvatarHero'))$('profileAvatarHero').innerHTML=svgAvatar(p.avatar);$('profileNickLabel').textContent=p.nickname||u?.displayName||u?.email?.split('@')[0]||'Jogador';$('profileBioLabel').textContent=p.bio;$('profileFavLabel').textContent=p.favoriteGame;$('profileNickInput').value=p.nickname||'';$('profileBioInput').value=p.bio;$('profileFavoriteInput').value=p.favoriteGame;$('profileStatGrid').innerHTML=stats(p).map(([i,l,v])=>`<div><span>${i}</span><small>${l}</small><b>${v}</b></div>`).join('');const level=Math.max(1,Math.floor((Number(p.gamesPlayed||0)+Number(p.gamesWon||0)*2)/10)+1);$('profileHighlights').innerHTML=`<div>🎖️ <b>Nível ${level}</b><span>Experiência geral</span></div><div>🌟 <b>${(p.avatarOwned||[]).length}</b><span>Itens desbloqueados</span></div><div>🧠 <b>${p.termBestStreak||p.bestStreak||0}</b><span>Sequência destaque</span></div><div>🥊 <b>${p.kofRating||1000}</b><span>Elo KOF</span></div>`;$('profileEquipped').innerHTML=SLOT_ORDER.map(k=>{const it=item(p.avatar[k]);return `<span title="${esc(it.name)}">${it.icon}<small>${esc(it.name)}</small></span>`}).join('');}
function renderAvatar(){const p=defaults(read());if($('avatarCoins'))$('avatarCoins').textContent=p.coins||0;if($('shopCoins'))$('shopCoins').textContent=p.coins||0;renderSwatches('primarySwatches',PRIMARY,'primaryColor',p);renderSwatches('secondarySwatches',SECONDARY,'secondaryColor',p);renderSwatches('accentSwatches',ACCENT,'accentColor',p);renderSwatches('metalSwatches',METAL,'metalColor',p);renderSwatches('faceSwatches',FACE,'faceColor',p);renderShop(p);const h=$('homeAvatarPreview');if(h)h.innerHTML=svgAvatar(p.avatar,'mini');if($('avatarScreen')?.classList.contains('active'))requestAnimationFrame(()=>renderAvatar3D(p.avatar));}
function setAvatarValue(key,val){const p=defaults(read());p.avatar[key]=val;write(p);renderAvatar();}
function buyEquip(id){const it=item(id),p=defaults(read()),owned=new Set(p.avatarOwned||[]);if(!owned.has(id)){if(Number(p.coins||0)<it.price)return CORE()?.toast?.('Pontos insuficientes',`Você precisa de ${it.price} pontos para ${it.name}.`,'error');p.coins=Math.max(0,Number(p.coins||0)-it.price);p.avatarSpent=Number(p.avatarSpent||0)+it.price;owned.add(id);p.avatarOwned=[...owned];CORE()?.playSound?.('coin');}p.avatar[it.slot]=it.id;write(p);renderAvatar();CORE()?.toast?.('Visual atualizado',`${it.name} equipado.`);}
function openProfile(){dispose3D();CORE()?.showScreen?.('profileScreen');renderProfile()}
function openAvatar(){CORE()?.showScreen?.('avatarScreen');requestAnimationFrame(()=>renderAvatar())}
function bind(){
 inject();const p=defaults(read());write(p);const h=$('homeAvatarPreview');if(h)h.innerHTML=svgAvatar(p.avatar,'mini');
 $('profileButton')?.addEventListener('click',openProfile);$('avatarButton')?.addEventListener('click',openAvatar);$('homeProfileButton')?.addEventListener('click',openProfile);$('homeAvatarButton')?.addEventListener('click',openAvatar);$('profileBack')?.addEventListener('click',()=>CORE()?.showScreen?.('homeScreen'));$('avatarBack')?.addEventListener('click',()=>{dispose3D();CORE()?.showScreen?.('homeScreen')});$('profileEditAvatar')?.addEventListener('click',openAvatar);
 $('profileSave')?.addEventListener('click',()=>{const p=defaults(read());p.nickname=String($('profileNickInput').value||'').trim().slice(0,22);p.bio=String($('profileBioInput').value||'').trim().slice(0,120);p.favoriteGame=$('profileFavoriteInput').value;write(p);FB()?.syncPublicProfile?.();renderProfile();CORE()?.toast?.('Perfil salvo','Suas alterações foram sincronizadas.');});
 $('avatarScreen')?.addEventListener('click',e=>{const sw=e.target.closest('[data-color-key]');if(sw)return setAvatarValue(sw.dataset.colorKey,sw.dataset.color);const act=e.target.closest('[data-avatar-action]');if(act){avatarMotion=act.dataset.avatarAction;document.querySelectorAll('[data-avatar-action]').forEach(b=>b.classList.toggle('active',b===act));return}const tab=e.target.closest('[data-shop-slot]');if(tab){shopSlot=tab.dataset.shopSlot;shopPage=0;shopQuery='';if($('shopSearch'))$('shopSearch').value='';return renderAvatar()}const it=e.target.closest('[data-shop-item]');if(it)return buyEquip(it.dataset.shopItem);});
 $('shopSearch')?.addEventListener('input',e=>{shopQuery=e.target.value;shopPage=0;renderShop(defaults(read()))});$('shopPrev')?.addEventListener('click',()=>{shopPage--;renderShop(defaults(read()))});$('shopNext')?.addEventListener('click',()=>{shopPage++;renderShop(defaults(read()))});
 $('avatarSave')?.addEventListener('click',()=>{write(defaults(read()));CORE()?.toast?.('Avatar salvo','Seu visual 3D foi salvo na conta.');});
 $('avatarRandom')?.addEventListener('click',()=>{const p=defaults(read()),owned=CATALOG.filter(x=>(p.avatarOwned||[]).includes(x.id));for(const slot of SLOT_ORDER){const pool=owned.filter(x=>x.slot===slot);if(pool.length)p.avatar[slot]=pool[Math.floor(Math.random()*pool.length)].id;}p.avatar.primaryColor=PRIMARY[Math.floor(Math.random()*PRIMARY.length)];p.avatar.secondaryColor=SECONDARY[Math.floor(Math.random()*SECONDARY.length)];p.avatar.accentColor=ACCENT[Math.floor(Math.random()*ACCENT.length)];p.avatar.metalColor=METAL[Math.floor(Math.random()*METAL.length)];p.avatar.faceColor=FACE[Math.floor(Math.random()*FACE.length)];write(p);renderAvatar();});
 window.addEventListener('gameguess:authchange',()=>{const p=defaults(read());const h=$('homeAvatarPreview');if(h)h.innerHTML=svgAvatar(p.avatar,'mini');if($('profileScreen')?.classList.contains('active'))renderProfile();if($('avatarScreen')?.classList.contains('active'))renderAvatar()});
}
window.GameGuessSocial={openProfile,openAvatar,renderAvatar,svgAvatar,CATALOG,SLOT_ORDER,dispose3D};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
