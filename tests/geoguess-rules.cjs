const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../geoguess.js'),'utf8');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){}},console,Date,setTimeout,clearTimeout,setInterval,clearInterval};
vm.createContext(sandbox);
const exported=source.replace('window.GameGuessGeo={open,version:GEO_VERSION};',`window.testGeo={applyArenaGuess,formatGeoTime,difficultyFor,advanceArena,setRoom(value){room=value;roomCode='ABCDEF';mode='arena';}};window.GameGuessGeo={open,version:GEO_VERSION};`);
vm.runInContext(exported,sandbox);
const api=sandbox.window.testGeo;
function room(){return {status:'playing',hostUid:'a',roundIndex:0,roundDeadline:301000,config:{rounds:3},players:Object.fromEntries(['a','b','c'].map(uid=>[uid,{uid,submittedRound:-1,score:0}]))};}
function guess(r,uid,now=1000){return api.applyArenaGuess(r,uid,0,{lat:1,lng:2},10,4000,3,now);}
async function main(){
  assert.equal(api.difficultyFor('insane').timerSec,300);
  assert.equal(api.difficultyFor('easy').scoreMultiplier,1);
  assert.equal(api.formatGeoTime(300),'5:00');
  assert.equal(api.formatGeoTime(50),'0:50');
  assert.equal(api.formatGeoTime(-1),'0:00');
  const r=room();
  guess(r,'a');assert.equal(r.roundDeadline,251000);assert.equal(r.players.a.score,4000);
  assert.equal(guess(r,'a'),undefined);assert.equal(r.roundDeadline,251000);assert.equal(r.players.a.score,4000);
  guess(r,'b');assert.equal(r.roundDeadline,201000);
  guess(r,'c');assert.equal(r.roundDeadline,201000);
  const short=room();short.roundDeadline=31000;guess(short,'a');assert.equal(short.roundDeadline,1000);
  assert.equal(guess(short,'b'),undefined);assert.equal(short.players.b.score,0);
  const expired=room();assert.equal(guess(expired,'a',301000),undefined);
  expired.players.a.left=true;assert.equal(guess(expired,'a'),undefined);
  const stale=room();stale.roundIndex=1;assert.equal(guess(stale,'a'),undefined);
  const finished=room();finished.status='finished';assert.equal(guess(finished,'a'),undefined);
  sandbox.window.GameGuessFirebase={getUser:()=>({uid:'a'}),serverNow:()=>1000,mutateGeoRoom:async(code,fn)=>{fn(r,'a');return {committed:true};}};
  api.setRoom(r);await api.advanceArena(0);
  assert.equal(r.roundIndex,1);assert.equal(r.roundDeadline,301000);assert.equal(r.players.a.score,4000);assert.equal(r.players.a.roundScore,0);
  await api.advanceArena(1);assert.equal(r.roundIndex,1,'must wait for every active player');
  r.roundIndex=2;for(const p of Object.values(r.players))p.submittedRound=2;
  await api.advanceArena(2);assert.equal(r.status,'finished');assert.equal(r.winnerUid,'','equal scores draw');
  r.status='playing';r.players.b.score=5000;
  await api.advanceArena(2);assert.equal(r.winnerUid,'b');
  assert.ok(!source.includes('id="geoDifficulty"'));assert.ok(!source.includes('id="geoArenaDifficulty"'));
  console.log('PASS: 5-minute rounds, first two -50s, no duplicates/late guesses, cumulative score, next round, winner and draw.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
