const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const API_KEY = "sk-OZdWzbWxhrVRm0fCCTvNByksyex2hys5pzPtGSEQBnP8pwLK";
const GLM_URL = "https://open.bigmodel.cn/api/paas/v4/images/generations";
const SAVE_DIR = path.join(__dirname, "public", "images", "events");

if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

const CATEGORY_PROMPTS = {
  hambazi: "گروه دوستان در کافه شاد در حال بازی بردگیم، نور گرم، رنگی، ایلوستریشن مدرن، بدون متن",
  hamneshin: "دورهمی صمیمی گروهی در کافه دنج، چای و گفتگو، نور طبیعی، ایلوستریشن مینیمال، بدون متن",
  hamsohbat: "دو نفر در گفتگوی عمیق، فضای آرام، چای، کتاب، نور ملایم، ایلوستریشن نرم، بدون متن",
  hampa: "گروهی در حال پیاده‌روی در طبیعت سبز، کوه، آسمان آبی، ایلوستریشن روشن و شاد، بدون متن",
  hamamooz: "کارگاه آموزشی گروهی، لپ‌تاپ و یادداشت، فضای مدرن، نور روشن، ایلوستریشن تمیز، بدون متن",
  hamkar: "تیم هم‌افراد در فضای کار اشتراکی، لپ‌تاپ، گفتگو، ایلوستریشن حرفه‌ای، بدون متن",
  hamfekr: "گروه فکری در حال طوفان فکری، تخته وست، ایده‌های نو، ایلوستریشن خلاقانه، بدون متن",
  hamteymi: "تیم ورزشی در زمین چمن، فوتبال یا والیبال، انرژی بالا، ایلوستریکن پویا، بدون متن",
  hamghesse: "حلقه داستان‌سرایی، کتاب، نور چراغ، فضای صمیمی، ایلوستریشن هنری، بدون متن",
  default: "گروهی از دوستان خوشحال در کافه، فضای گرم و صمیمی، ایلوستریشن مدرن، بدون متن",
};

function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "cogview-3-plus",
      prompt: prompt,
      size: "1024x1024",
    });
    const url = new URL(GLM_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY,
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.data && json.data[0] && json.data[0].url) {
            resolve(json.data[0].url);
          } else {
            reject(new Error(JSON.stringify(json)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(filepath); });
    }).on("error", (e) => { fs.unlinkSync(filepath); reject(e); });
  });
}

async function main() {
  const categories = Object.keys(CATEGORY_PROMPTS);
  console.log("Generating images for " + categories.length + " categories...\n");

  for (const cat of categories) {
    const filename = cat + ".jpg";
    const filepath = path.join(SAVE_DIR, filename);
    
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 10000) {
      console.log("SKIP " + cat + " (already exists, " + Math.round(fs.statSync(filepath).size / 1024) + "KB)");
      continue;
    }

    try {
      console.log("GEN  " + cat + "...");
      const imgUrl = await generateImage(CATEGORY_PROMPTS[cat]);
      await downloadFile(imgUrl, filepath);
      const size = fs.statSync(filepath).size;
      console.log("OK   " + cat + " (" + Math.round(size / 1024) + "KB)");
    } catch (e) {
      console.log("ERR  " + cat + ": " + e.message);
    }
  }
  console.log("\nDone! Images saved to: " + SAVE_DIR);
}

main();
