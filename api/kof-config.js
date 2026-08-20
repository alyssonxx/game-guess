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
  res.status(200).json({ok:true,version:'16.1.0',netplayServer,iceServers,turnConfigured:Boolean(turnUrl)});
}
