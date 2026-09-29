(() => {
  'use strict';

  const VERSION='3.0.0';
  const FB=()=>window.GameGuessFirebase;
  const CORE=()=>window.GameGuessCore;
  const $=id=>document.getElementById(id);
  let threePromise=null;
  const instances=new WeakMap();

  const DEFAULT={version:1,body:'classic',skin:'#C98B65',hair:'short',hairColor:'#171717',top:'fighter',topColor:'#335CFF',pants:'fighter',pantsColor:'#171A24',shoes:'classic',gloves:'classic',accent:'#B7FF4A',accessory:'none',aura:'none',pose:'idle'};
  const OPTIONS={
    body:[['classic','Clássico'],['athletic','Atlético'],['compact','Compacto']],
    hair:[['short','Curto'],['spiky','Espetado'],['mohawk','Moicano'],['long','Longo'],['pixel','Pixel','avatar_hair_pixel|avatar_hair_season']],
    top:[['fighter','Fighter'],['jacket','Jaqueta','avatar_jacket_competitor'],['hoodie','Moletom'],['samurai','Ronin'],['cyber','Cyber','avatar_jacket_cyber'],['neon','Neon','avatar_outfit_neon'],['retrowave','Retrowave','avatar_outfit_retrowave'],['season','Season One','avatar_jacket_season']],
    pants:[['fighter','Fighter'],['street','Street'],['samurai','Samurai'],['cyber','Cyber'],['neon','Neon','avatar_outfit_neon']],
    shoes:[['classic','Clássico'],['gold','Golden Fighter','avatar_shoes_gold'],['neon','Neon','avatar_outfit_neon'],['high','Cano alto']],
    gloves:[['classic','Clássicas'],['bronze','Bronze','avatar_gloves_bronze'],['neon','Neon','avatar_outfit_neon'],['cyber','Cyber','avatar_jacket_cyber']],
    accessory:[['none','Nenhum'],['visor','Visor'],['mask','Máscara Shadow','avatar_mask_shadow'],['arcade-mask','Máscara Arcade','avatar_mask_arcade'],['crown','Coroa Grão-Mestre','avatar_crown_grandmaster']],
    aura:[['none','Nenhuma'],['diamond','Diamante','avatar_aura_diamond'],['flame','Chamas de Mestre','effect_flame'],['neon','Neon','avatar_aura_neon'],['season','Season One','avatar_aura_season'],['dragon','Dragão Neon','avatar_dragon_aura']],
    pose:[['idle','Idle'],['guard','Guarda'],['victory','Vitória','avatar_pose_victory'],['master','Mestre','avatar_pose_master']]
  };

  function toast(a,b,t=''){CORE()?.toast?.(a,b,t);}
  function normalize(v={}){return {...DEFAULT,...v,version:1};}
  function hasReq(unlocks,req){if(!req)return true;return String(req).split('|').some(k=>unlocks?.[k]);}
  async function loadThree(){if(!threePromise)threePromise=import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');return threePromise;}
  function disposeObject(root){root?.traverse?.(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else o.material?.dispose?.();});}

  async function renderPreview(target,config={},opts={}){
    if(typeof target==='string')target=$(target);if(!target)return null;
    const previous=instances.get(target);if(previous)previous.destroy();
    const THREE=await loadThree(),cfg=normalize(config);
    target.innerHTML='';
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;target.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.set(0,1.45,5.4);camera.lookAt(0,1.45,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0x20243d,2.15));const key=new THREE.DirectionalLight(0xffffff,2.3);key.position.set(3,6,4);key.castShadow=true;scene.add(key);const rim=new THREE.PointLight(new THREE.Color(cfg.accent),2.2,12);rim.position.set(-3,2.5,2);scene.add(rim);
    const root=new THREE.Group();scene.add(root);
    const mat=(c,rough=.6,metal=.05,emissive=null)=>new THREE.MeshStandardMaterial({color:new THREE.Color(c),roughness:rough,metalness:metal,emissive:emissive?new THREE.Color(emissive):0x000000,emissiveIntensity:emissive ? .8 : 0});
    const mesh=(geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;};
    const skin=mat(cfg.skin,.75),hair=mat(cfg.hairColor,.8),top=mat(cfg.topColor,.55,.1),pants=mat(cfg.pantsColor,.75),accent=mat(cfg.accent,.4,.25,cfg.aura!=='none'?cfg.accent:null),dark=mat('#111522',.65),gold=mat('#F5C451',.35,.55);
    const scale = cfg.body === 'athletic' ? 1.08 : (cfg.body === 'compact' ? .92 : 1); root.scale.set(scale, scale, scale);
    // torso / head
    const torso=mesh(new THREE.BoxGeometry(1.16,1.35,.62),top,0,1.55,0);torso.scale.x = cfg.body === 'athletic' ? 1.1 : (cfg.body === 'compact' ? .9 : 1);
    mesh(new THREE.SphereGeometry(.48,28,20),skin,0,2.62,0);
    // neck
    mesh(new THREE.CylinderGeometry(.18,.2,.28,18),skin,0,2.18,0);
    // legs
    const l1=mesh(new THREE.CylinderGeometry(.22,.25,1.28,16),pants,-.31,.53,0),l2=mesh(new THREE.CylinderGeometry(.22,.25,1.28,16),pants,.31,.53,0);
    const shoeMat=cfg.shoes==='gold'?gold:cfg.shoes==='neon'?accent:dark;mesh(new THREE.BoxGeometry(.5,.25,.85),shoeMat,-.31,-.14,.17);mesh(new THREE.BoxGeometry(.5,.25,.85),shoeMat,.31,-.14,.17);
    // arms
    const makeArm=(x,side)=>{const shoulder=new THREE.Group();shoulder.position.set(x,1.92,0);root.add(shoulder);const arm=new THREE.Mesh(new THREE.CylinderGeometry(.18,.2,.88,14),skin);arm.position.y=-.42;arm.castShadow=true;shoulder.add(arm);const glove=cfg.gloves==='bronze'?gold:cfg.gloves==='neon'?accent:cfg.gloves==='cyber'?accent:cfg.top==='samurai'?dark:top;const hand=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),glove);hand.position.y=-.9;hand.castShadow=true;shoulder.add(hand);return shoulder;};
    const la=makeArm(-.75,-1),ra=makeArm(.75,1);
    if(cfg.pose==='guard'){la.rotation.z=-1.05;ra.rotation.z=1.05;la.rotation.x=-.45;ra.rotation.x=-.45;}else if(cfg.pose==='victory'){la.rotation.z=-2.25;ra.rotation.z=2.25;}else if(cfg.pose==='master'){la.rotation.z=-1.45;ra.rotation.z=.6;ra.rotation.x=-.8;}else{la.rotation.z=-.18;ra.rotation.z=.18;}
    // top variants
    if(['jacket','cyber','neon','retrowave','season'].includes(cfg.top)){mesh(new THREE.BoxGeometry(1.32,.2,.68),accent,0,2.05,0);mesh(new THREE.BoxGeometry(.12,1.05,.7),accent,-.5,1.58,.02);mesh(new THREE.BoxGeometry(.12,1.05,.7),accent,.5,1.58,.02);}
    if(cfg.top==='hoodie'){mesh(new THREE.TorusGeometry(.42,.12,10,24,Math.PI*1.3),top,0,2.27,-.08).rotation.x=Math.PI/2;}
    if(cfg.top==='samurai'){const belt=mesh(new THREE.BoxGeometry(1.28,.2,.72),accent,0,1.16,.02);belt.rotation.z=.02;mesh(new THREE.BoxGeometry(1.65,.65,.55),top,0,.78,-.02).rotation.z=.02;}
    // hair
    if(cfg.hair==='short'){const h=mesh(new THREE.SphereGeometry(.5,22,14,0,Math.PI*2,0,Math.PI/2),hair,0,2.78,0);h.scale.y=.8;}
    if(cfg.hair==='spiky'||cfg.hair==='pixel'){for(let i=0;i<7;i++){const ang=(i/7)*Math.PI*2,cone=mesh(new THREE.ConeGeometry(cfg.hair === 'pixel' ? .13 : .16, .55, 6),hair,Math.cos(ang)*.28,3.02,Math.sin(ang)*.25);cone.rotation.z=-Math.cos(ang)*.35;cone.rotation.x=Math.sin(ang)*.35;}}
    if(cfg.hair==='mohawk'){for(let i=0;i<5;i++)mesh(new THREE.ConeGeometry(.14,.6,6),hair,0,3.0,-.28+i*.14);}
    if(cfg.hair==='long'){const h=mesh(new THREE.SphereGeometry(.53,22,14),hair,0,2.72,-.08);h.scale.set(1,1.16,.9);h.position.z=-.12;}
    // accessories
    if(cfg.accessory==='visor'){const v=mesh(new THREE.BoxGeometry(.78,.16,.08),accent,0,2.68,.45);v.material.emissive=new THREE.Color(cfg.accent);v.material.emissiveIntensity=.7;}
    if(['mask','arcade-mask'].includes(cfg.accessory)){mesh(new THREE.BoxGeometry(.68,.25,.08),cfg.accessory==='arcade-mask'?accent:dark,0,2.46,.46);}
    if(cfg.accessory==='crown'){const c=mesh(new THREE.CylinderGeometry(.38,.46,.22,6),gold,0,3.18,0);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;mesh(new THREE.ConeGeometry(.1,.34,5),gold,Math.cos(a)*.28,3.42,Math.sin(a)*.28);}}
    // aura
    let aura=null;if(cfg.aura!=='none'){const color=cfg.aura==='flame'?'#FF6B3D':cfg.aura==='diamond'?'#65C9FF':cfg.aura==='season'?'#A971FF':cfg.aura==='dragon'?'#76FF7A':cfg.accent;aura=mesh(new THREE.TorusGeometry(1.45,.035,10,80),mat(color,.25,.25,color),0,1.35,-.25);aura.rotation.x=Math.PI/2;const aura2=mesh(new THREE.TorusGeometry(1.75,.02,8,64),mat(color,.25,.25,color),0,1.35,-.35);aura2.rotation.y=Math.PI/2;}
    const floor=new THREE.Mesh(new THREE.CircleGeometry(1.55,48),new THREE.MeshStandardMaterial({color:0x0a1020,roughness:.8,transparent:true,opacity:.65}));floor.rotation.x=-Math.PI/2;floor.position.y=-.28;floor.receiveShadow=true;scene.add(floor);
    let dragging=false,lastX=0,rotY=Number(opts.rotation||0);const down=e=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture?.(e.pointerId)};const move=e=>{if(!dragging)return;rotY+=(e.clientX-lastX)*.012;lastX=e.clientX};const up=e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)};renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',up);
    let raf=0,dead=false,t0=performance.now();function resize(){const w=Math.max(160,target.clientWidth||320),h=Math.max(180,target.clientHeight||320);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}resize();const ro=new ResizeObserver(resize);ro.observe(target);
    const animate=t=>{if(dead)return;const dt=(t-t0)/1000;root.rotation.y=rotY+(opts.autoRotate===false?0:Math.sin(dt*.35)*.12);root.position.y=Math.sin(dt*1.5)*.025;if(aura)aura.rotation.z=dt*.55;renderer.render(scene,camera);raf=requestAnimationFrame(animate)};raf=requestAnimationFrame(animate);
    const api={config:cfg,destroy(){dead=true;cancelAnimationFrame(raf);ro.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);disposeObject(root);floor.geometry.dispose();floor.material.dispose();renderer.dispose();renderer.domElement.remove();instances.delete(target);}};instances.set(target,api);return api;
  }

  function optionHtml(type,current,unlocks){return (OPTIONS[type]||[]).map(([value,label,req])=>`<option value="${value}"${value===current?' selected':''}${hasReq(unlocks,req)?'': ' disabled'}>${label}${hasReq(unlocks,req)?'':' 🔒'}</option>`).join('');}
  async function openEditor(){
    if(!FB()?.getUser?.()){toast('Avatar 3D','Faça login para personalizar seu avatar.','error');FB()?.openAuth?.('login');return;}
    CORE()?.showScreen?.('arcadeAvatar3dScreen');
    let cfg,rewards;try{[cfg,rewards]=await Promise.all([FB()?.getArcadeAvatar3D?.(),FB()?.ensureArcadeRewardProfile?.()]);}catch(e){toast('Avatar 3D',e?.message||String(e),'error');return;}const state=normalize(cfg||{}),unlocks=rewards?.unlocks||{};
    for(const type of ['body','hair','top','pants','shoes','gloves','accessory','aura','pose']){const el=$(`avatar3d_${type}`);if(el){el.innerHTML=optionHtml(type,state[type],unlocks);el.value=state[type];}}
    for(const key of ['skin','hairColor','topColor','pantsColor','accent']){const el=$(`avatar3d_${key}`);if(el)el.value=state[key];}
    const read=()=>{const out={...state};for(const type of ['body','hair','top','pants','shoes','gloves','accessory','aura','pose'])out[type]=$(`avatar3d_${type}`)?.value||out[type];for(const key of ['skin','hairColor','topColor','pantsColor','accent'])out[key]=$(`avatar3d_${key}`)?.value||out[key];return out;};
    let timer=0;const redraw=()=>{clearTimeout(timer);timer=setTimeout(()=>renderPreview($('avatar3dPreview'),read(),{autoRotate:false}),60)};document.querySelectorAll('#arcadeAvatar3dScreen select,#arcadeAvatar3dScreen input[type=color]').forEach(el=>{el.oninput=redraw;el.onchange=redraw});
    try{await renderPreview($('avatar3dPreview'),state,{autoRotate:false});}catch(e){console.warn('Avatar 3D renderer:',e);$('avatar3dPreview').innerHTML='<div class="meta-avatar-fallback">🧍<small>WebGL/Three.js indisponível</small></div>';}
    const save=$('avatar3dSave');if(save)save.onclick=async()=>{save.disabled=true;try{const saved=await FB()?.saveArcadeAvatar3D?.(read());toast('Avatar 3D','Personalização salva.','achievement');window.dispatchEvent(new CustomEvent('gameguess:avatar3d',{detail:saved}));await renderPreview($('avatar3dPreview'),saved,{autoRotate:false});}catch(e){toast('Avatar 3D',e?.message||String(e),'error')}finally{save.disabled=false}};
  }

  window.GameGuessAvatar3D={version:VERSION,DEFAULT,normalize,renderPreview,openEditor};
})();
