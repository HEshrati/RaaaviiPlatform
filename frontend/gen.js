const https=require("https"),http=require("http"),fs=require("fs"),path=require("path");
const KEY="sk-OZdWzbWxhrVRm0fCCTvNByksyex2hys5pzPtGSEQBnP8pwLK";
const DIR=path.join(__dirname,"public","images","events");
if(!fs.existsSync(DIR))fs.mkdirSync(DIR,{recursive:true});
const P={
hambazi:"group of friends playing board games in cozy cafe, warm lighting, colorful illustration, no text",
hamneshin:"intimate group gathering in warm cafe with tea, natural light, minimal illustration, no text",
hamsohbat:"two people having deep conversation, calm space, tea, soft lighting, illustration, no text",
hampa:"group hiking in green nature with mountains, blue sky, bright illustration, no text",
hamamooz:"group workshop with laptops and notebooks, modern bright space, clean illustration, no text",
hamkar:"coworking team in shared office, laptops, discussion, professional illustration, no text",
hamfekr:"brainstorming group with whiteboard and sticky notes, creative illustration, no text",
hamteymi:"sports team on green field playing football, high energy, dynamic illustration, no text",
hamghesse:"storytelling circle with books and warm lamp light, cozy artistic illustration, no text",
default:"happy group of friends in modern cafe, warm atmosphere, modern illustration, no text"
};
function gen(p){return new Promise((ok,no)=>{const b=JSON.stringify({model:"cogview-3-plus",prompt:p,size:"1024x1024"});const u=new URL("https://open.bigmodel.cn/api/paas/v4/images/generations");const r=https.request({hostname:u.hostname,path:u.pathname,method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+KEY,"Content-Length":Buffer.byteLength(b)}},res=>{let d="";res.on("data",c=>d+=c);res.on("end",()=>{try{const j=JSON.parse(d);if(j.data&&j.data[0]&&j.data[0].url)ok(j.data[0].url);else no(new Error(JSON.stringify(j)))}catch(e){no(e)}})});r.on("error",no);r.setTimeout(60000,()=>{r.destroy();no(new Error("timeout"))});r.write(b);r.end()})}
function dl(url,fp){return new Promise((ok,no)=>{const f=fs.createWriteStream(fp);const m=url.startsWith("https")?https:http;m.get(url,res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){dl(res.headers.location,fp).then(ok).catch(no);return}res.pipe(f);f.on("finish",()=>{f.close();ok(fp)})}).on("error",e=>{fs.unlinkSync(fp);no(e)})})}
async function main(){const cats=Object.keys(P);console.log("Generating "+cats.length+" images...");for(const c of cats){try{console.log("GEN "+c+"...");const url=await gen(P[c]);await dl(url,path.join(DIR,c+".jpg"));console.log("OK  "+c+" ("+Math.round(fs.statSync(path.join(DIR,c+".jpg")).size/1024)+"KB)")}catch(e){console.log("ERR "+c+": "+e.message)}}console.log("Done!")}
main();
