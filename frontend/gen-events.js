const https=require("https"),http=require("http"),fs=require("fs"),path=require("path"),{execSync}=require("child_process");
const KEY="sk-OZdWzbWxhrVRm0fCCTvNByksyex2hys5pzPtGSEQBnP8pwLK";
const DIR=path.join(__dirname,"public","images","events");
if(!fs.existsSync(DIR))fs.mkdirSync(DIR,{recursive:true});
const CP={hambazi:"board games and fun activities with friends in a cafe",hamneshin:"warm intimate gathering and friendly meetup",hamsohbat:"deep meaningful conversation over coffee or tea",hampa:"outdoor nature activity hiking or walking together",hamamooz:"educational workshop or learning session together",hamkar:"team collaboration and coworking project work",hamfekr:"brainstorming and creative thinking session",hamteymi:"team sports and athletic activity together",hamghesse:"storytelling reading books in a cozy group",default:"friendly group gathering event"};
function gen(p){return new Promise((ok,no)=>{const b=JSON.stringify({model:"gapgpt/z-image",prompt:p,size:"1024x1024"});const r=https.request({hostname:"api.gapgpt.app",path:"/v1/images/generations",method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+KEY,"Content-Length":Buffer.byteLength(b)}},res=>{let d="";res.on("data",c=>d+=c);res.on("end",()=>{try{const j=JSON.parse(d);if(j.data&&j.data[0]&&j.data[0].url)ok(j.data[0].url);else no(new Error(JSON.stringify(j).substring(0,200)))}catch(e){no(e)}})});r.on("error",no);r.setTimeout(60000,()=>{r.destroy();no(new Error("timeout"))});r.write(b);r.end()})}
function dl(url,fp){return new Promise((ok,no)=>{const f=fs.createWriteStream(fp);const m=url.startsWith("https")?https:http;m.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){dl(res.headers.location,fp).then(ok).catch(no);return}res.pipe(f);f.on("finish",()=>{f.close();ok(fp)})}).on("error",e=>{try{fs.unlinkSync(fp)}catch(x){}no(e)})})}
function db(q){const r=execSync("docker exec 70e3e7843ca8_raavi-postgres psql -U raavi_user -d raavi_db -A -F '|' -t -c '"+q+"'").toString();return r.trim().split("\n").filter(l=>l.trim()).map(l=>{const p=l.split("|");return{id:p[0]?.trim(),title:p[1]?.trim(),category:p[2]?.trim(),image_url:p[3]?.trim()}})}
function dbRun(id,url){execSync('docker exec 70e3e7843ca8_raavi-postgres psql -U raavi_user -d raavi_db -c "UPDATE events SET image_url=\x27'+url+'\x27 WHERE id=\x27'+id+'\x27"',{stdio:"pipe"})}
async function main(){
  console.log("=== Event Image Generator ===\n");
  const rows=db("SELECT id, title, category, image_url FROM events ORDER BY created_at DESC");
  console.log("Found "+rows.length+" events\n");
  let g=0,s=0,f=0;
  for(const r of rows){
    if(!r.id)continue;
    const fname=r.id+".jpg";
    const fpath=path.join(DIR,fname);
    if(r.image_url&&r.image_url.length>5&&r.image_url.includes(r.id.substring(0,8))){s++;console.log("SKIP "+r.id.substring(0,8)+"... (has image)");continue}
    if(fs.existsSync(fpath)&&fs.statSync(fpath).size>10000){
      dbRun(r.id,"/images/events/"+fname);
      console.log("FILE "+r.id.substring(0,8)+"... (downloaded, updating DB)");
      g++;continue;
    }
    const cat=(r.category||"default").toLowerCase();
    const base=CP[cat]||CP.default;
    const prompt=(r.title||"event")+", "+base+", unique colorful modern illustration, no text, no words";
    try{
      process.stdout.write("GEN  "+r.id.substring(0,8)+"... "+(r.title||"").substring(0,30)+" -> ");
      const url=await gen(prompt);
      await dl(url,fpath);
      const sz=Math.round(fs.statSync(fpath).size/1024);
      dbRun(r.id,"/images/events/"+fname);
      console.log("OK ("+sz+"KB)");
      g++;
    }catch(e){console.log("ERR: "+e.message);f++}
  }
  console.log("\n=== Done: "+g+" generated, "+s+" skipped, "+f+" failed ===");
}
main();
