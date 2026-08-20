export default function handler(req,res){
  if(req.method!=='GET'){res.status(405).json({ok:false,error:'method_not_allowed'});return;}
  const netplayServer=String(process.env.KOF_NETPLAY_SERVER||'https://netplay.emulatorjs.org/').trim();
  const iceServers=[
    {urls:'stun:stun.l.google.com:19302'},
    {urls:'stun:stun1.l.google.com:19302'}
  ];
  const turnUrl=String(process.env.KOF_TURN_URL||'').trim();
  if(turnUrl){
    const turn={urls:turnUrl};
    const username=String(process.env.KOF_TURN_USERNAME||'').trim();
    const credential=String(process.env.KOF_TURN_CREDENTIAL||'').trim();
    if(username)turn.username=username;
    if(credential)turn.credential=credential;
    iceServers.push(turn);
  }
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({
    ok:true,
    version:'18.6.0',
    emulatorTrainingVersion:'4.2.1',
    emulatorOnlineVersion:'4.3.0-pre',
    core:'fbneo',
    romLayout:'full-non-merged',
    gameUrl:'/roms/v178/kf2k2mp2.zip',
    expectedGameBytes:86694745,
    expectedGameSha256:'2cb16b649819f8168701f01ddd4642dc3678283c112cd89e79103ed45f4a1a4d',
    parentUrl:null,
    biosUrl:null,
    netplayServer,
    netplayMode:'webrtc-auto-room',
    iceServers,
    turnConfigured:Boolean(turnUrl)
  });
}
