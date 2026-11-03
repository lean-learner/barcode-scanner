'use strict';
const $=id=>document.getElementById(id);
let stream=null, reader=null, running=false, busy=false, generation=0, facing='environment', latest='', lastAt=0, history=[];
function status(message){$('status').textContent=message;}
function stop(){generation++;running=false;if(reader){reader.reset();reader=null;}if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}$('video').srcObject=null;busy=false;ui(false);}
function ui(on){$('start').disabled=on||busy;$('stop').disabled=!on;$('switch').disabled=!on;$('placeholder').hidden=on;document.querySelector('.laser').hidden=!on;$('badge').textContent=on?'SCANNING':'CAMERA OFF';}
// One record per barcode and format, with an explicit quantity for imports.
let batchId=crypto.randomUUID();
const seenAt=new Map();
function renderCollection(){
  const total=history.reduce((sum,item)=>sum+item.quantity,0);
  $('count').textContent=total+' scan'+(total===1?'':'s');
  $('clear').disabled=!history.length;
  $('download').disabled=!history.length;
  $('history').replaceChildren(...history.slice(0,30).map(item=>{
    const li=document.createElement('li'),v=document.createElement('span'),t=document.createElement('small');
    v.textContent=item.barcode;
    t.textContent='×'+item.quantity+' · '+item.format;
    li.append(v,t);return li;
  }));
  if(!history.length)$('history').innerHTML='<li class="muted">No scans yet. Let’s find something.</li>';
}
function capture(value,format){
  if(!value)return;
  const now=Date.now();
  const normalized=format.toLowerCase().replaceAll(' ','_');
  const key=JSON.stringify([value,normalized]);
  const previous=seenAt.get(key);
  seenAt.set(key,now);
  // A barcode must leave the camera view for three seconds before counting again.
  if(previous!==undefined&&now-previous<3000)return;
  latest=value;lastAt=now;
  const timestamp=new Date(now).toISOString();
  const existing=history.find(item=>item.barcode===value&&item.format===normalized);
  if(existing){existing.quantity++;existing.last_scanned_at=timestamp;history.splice(history.indexOf(existing),1);history.unshift(existing);}
  else history.unshift({id:crypto.randomUUID(),barcode:value,format:normalized,quantity:1,first_scanned_at:timestamp,last_scanned_at:timestamp});
  $('empty').hidden=true;$('result').hidden=false;$('value').textContent=value;
  $('format').textContent=normalized.replaceAll('_',' ').toUpperCase();$('copy').textContent='Copy value ↗';
  renderCollection();status('Barcode added. Move it out of view before scanning the same code again.');
}
function exportCollection(){
  return {schema_version:'1.0',batch_id:batchId,exported_at:new Date().toISOString(),total_scans:history.reduce((sum,item)=>sum+item.quantity,0),unique_barcodes:history.length,items:history.map(item=>({...item}))};
}
$('download').onclick=()=>{
  if(!history.length)return;
  const data=exportCollection();
  const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='pocket-scan-'+data.exported_at.replaceAll(':','-')+'.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('JSON download requested. Your collection is still available.');
};
async function start(){if(busy||running)return;busy=true;$('start').disabled=true;status('Requesting camera access…');const current=++generation;try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera access requires HTTPS and a supported browser.');let detector=null;if('BarcodeDetector' in window){try{const formats=await BarcodeDetector.getSupportedFormats();if(formats.length)detector=new BarcodeDetector({formats});}catch{}}
if(!detector&&!window.ZXing)throw new Error('Scanner could not load. Check your internet connection and reload this page.');
if(detector){const acquired=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080}},audio:false});if(current!==generation){acquired.getTracks().forEach(t=>t.stop());return;}stream=acquired;$('video').srcObject=stream;await $('video').play();if(current!==generation)return;running=true;busy=false;ui(true);const scan=async()=>{if(!running||current!==generation)return;try{const codes=await detector.detect($('video'));if(current===generation)codes.forEach(code=>capture(code.rawValue,code.format.replaceAll('_',' ').toUpperCase()));}catch{}if(running&&current===generation)setTimeout(scan,180);};scan();}
else{reader=new ZXing.BrowserMultiFormatReader();running=true;await reader.decodeFromConstraints({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1080}}},$('video'),(result)=>{if(result&&running&&current===generation)capture(result.getText(),ZXing.BarcodeFormat[result.getBarcodeFormat()].replaceAll('_',' '));});if(current!==generation)return;busy=false;ui(true);}status('Scanning… Hold a barcode steady inside the frame.');
}catch(error){if(current!==generation)return;stop();status(error.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser settings, then try again.':error.name==='NotFoundError'?'No camera found. Connect a camera and try again.':error.name==='NotReadableError'?'Camera is busy. Close other apps using it and try again.':error.message||'Unable to start the camera. Please try again.');}}
$('start').onclick=start;$('stop').onclick=()=>{stop();status('Camera stopped. Start again whenever you’re ready.');};$('switch').onclick=()=>{stop();facing=facing==='environment'?'user':'environment';start();};$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(latest);$('copy').textContent='Copied ✓';}catch{status('Copy unavailable. Select and copy the barcode value above.');}};$('clear').onclick=()=>{
  if(history.length&&!window.confirm('Clear all collected scans? Download JSON first if you want to keep them.'))return;
  history=[];seenAt.clear();batchId=crypto.randomUUID();latest='';lastAt=0;
  $('result').hidden=true;$('empty').hidden=false;renderCollection();status('Collection cleared. Ready for a new batch.');
};document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();status('Camera paused. Start camera to resume.');}});window.addEventListener('pagehide',stop);
