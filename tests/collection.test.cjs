const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(){
  let now=Date.parse('2026-11-03T20:00:00Z'),file,clicked=false,confirmation=true;
  const nodes={};
  function element(){return {textContent:'',hidden:false,disabled:false,append(){},replaceChildren(){},remove(){},click(){clicked=true;file=this.download;}};}
  class Clock extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
  const document={getElementById:id=>nodes[id]??=element(),querySelector:()=>element(),createElement:element,addEventListener(){},body:element()};
  let blob;
  const context=vm.createContext({document,Date:Clock,crypto:require('node:crypto').webcrypto,navigator:{},window:{addEventListener(){},confirm:()=>confirmation},Blob,URL:{createObjectURL:b=>{blob=b;return 'blob:test';},revokeObjectURL(){}},setTimeout(){}});
  vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
  return {nodes,run:code=>vm.runInContext(code,context),advance:ms=>now+=ms,cancel:()=>confirmation=false,download:()=>({blob,file,clicked})};
}
test('collection preserves barcode strings, aggregates quantities, and ignores continuously visible codes',()=>{
  const app=setup();app.run('capture("0012345678905","EAN 13")');
  app.advance(2000);app.run('capture("0012345678905","ean_13")');
  app.advance(2000);app.run('capture("0012345678905","EAN 13")');
  assert.equal(app.run('exportCollection().total_scans'),1);
  app.advance(3100);app.run('capture("0012345678905","EAN 13")');
  app.run('capture("other","CODE 128")');
  const data=JSON.parse(app.run('JSON.stringify(exportCollection())'));
  assert.equal(data.schema_version,'1.0');assert.equal(data.total_scans,3);assert.equal(data.unique_barcodes,2);
  const item=data.items.find(i=>i.barcode==='0012345678905');
  assert.equal(item.quantity,2);assert.equal(item.format,'ean_13');assert.notEqual(item.first_scanned_at,item.last_scanned_at);
  assert.ok(item.id);assert.ok(data.batch_id);
  for(let i=0;i<40;i++)app.run(`capture("code${i}","QR CODE")`);
  assert.equal(app.run('exportCollection().items.length'),42);
});
test('download creates valid JSON without clearing the collection',async()=>{
  const app=setup();app.run('capture("<script>example</script>","QR CODE")');app.nodes.download.onclick();
  const {blob,file,clicked}=app.download();assert.ok(clicked);assert.match(file,/\.json$/);assert.equal(blob.type,'application/json');
  const data=JSON.parse(await blob.text());assert.equal(data.items[0].barcode,'<script>example</script>');assert.equal(app.run('history.length'),1);
});
test('clear can be cancelled and a confirmed clear starts a new batch',()=>{
  const app=setup();app.run('capture("123","EAN 13")');const batch=app.run('batchId');app.cancel();app.nodes.clear.onclick();assert.equal(app.run('history.length'),1);
  const other=setup();other.run('capture("123","EAN 13")');const old=other.run('batchId');other.nodes.clear.onclick();
  assert.equal(other.run('history.length'),0);assert.notEqual(other.run('batchId'),old);assert.equal(other.nodes.download.disabled,true);
});
