const puppeteer = require('puppeteer');
const async = require('async');
const fs = require('fs');

var readline = require('readline');

//调用方法
var paths = ['file1','file2'];  
//定义读取方法
let urls = [];

async function read_file(path, urls ,callback){
    var fRead = fs.createReadStream(path);
    var objReadline = readline.createInterface({
        input:fRead
    });
    objReadline.on('line',function (line) {
       //console.log(line)
       urls.push(line);
    });
    objReadline.on('close',function () {
        callback(urls);
    });
}

var concurrencyCount = 0;

function repalceAll(find, replace, str) {
    var find = find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    str=str.replace(/\n/g,"");
    return str.replace(new RegExp(find, 'g'), replace);
  }

async function main() {
    for (var i = 0; i < paths.length; i++) {
        var data = fs.readFileSync(paths[i]);
       //console.log(data.toString());
       //a.push.apply(a,b);
       urls.push.apply(urls,data.toString().trim().split(","));
    }
    console.log(urls);
    let total = urls.length;
    async.mapLimit(urls, 10, async function(url) {
        console.log('todo downloads:',total);
        await downloadedPage(url);
        total--;
        console.log('complete');
        return;
    }, function (err, result) {
        //所有连接抓取成功，返回回调结果列表
        //console.log(result);
        return;
    });
    /*
    urls.forEach(async function(url) {
        console.log(url);
        await downloadedPage(url);
        return;
    });*/
}

async function downloadedPage(url) {
    console.log('process', url);
    if(url.length <=0) {
        return;
    }
    let filename = repalceAll('/','_',url);
    filename = repalceAll('\n','',filename);
    if(fs.existsSync(filename+'.pdf')) {
        console.log('skip');
        return;
    }
    concurrencyCount++;
    const browser = await puppeteer.launch({timeout:90000}); //{headless: false}
    const page = await browser.newPage();
    await page.goto(url, {timeout:90000, waitUntil: 'networkidle2'});
    // Get the "viewport" of the page, as reported by the page.
    /*const dimensions = await page.evaluate(() => {
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        deviceScaleFactor: window.devicePixelRatio
      };
    });*/
    //console.log(url,dimensions);
    await page.pdf({path: filename+'.pdf', format: 'A4', printBackground: true});
    await browser.close();
    console.log('completed', url);
    concurrencyCount--;
    return;
}

main();