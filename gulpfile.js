'use strict';

const   gulp = require('gulp'),
        watch = require('gulp-watch'),
        rename = require('gulp-rename'),
        fileinclude = require('gulp-file-include'),
        sass = require('gulp-sass'),
        fs = require('fs'),
        resizer = require('gulp-images-resizer'),
        gulpZip = require('gulp-zip'),
        bs = require('browser-sync').create(),
        puppy = require('puppeteer');

const {src, dest} = gulp;

let slideFolders = getSlideFolders(),
    presConfig = getPresConfig(),
    
    re_slideNum = new RegExp(`(\\d{${presConfig.len}})`);

const   bsOptions = {
            watch: true,
            server: {
                baseDir: "build",
                index: "index.html"
            },
            notify: false,
        },
        bsOptionsRoutine = {
            server: {
                baseDir: "build",
                index: "index.html"
            },
            notify: false,
            watch: false,
            localOnly: true,
            ghostMode: false,
            ui: false,
            port: 33333,
            open: false,
        };

/* delay for making screens with puppeteer */
const delayInMSForScreenshots = 2500;

/*
    default task for developing
*/
gulp.task("default", ["index-list", "watch-index-list", "html", "watch-templates", "scss", "watch-styles", "js", "imgcpy", "img-watch", "browserSync"]);

/*
    task to make rest of routine oparations
*/
gulp.task("routine", routine);

function routine()
{
    xml();
    pdf();
    screens()
        .then(zip)
        .catch(err => console.log(err));
}

gulp.task('browserSync', browserSync);

function browserSync(unusedCallback, bsOpt = bsOptions) {
    bs.init(bsOpt);
}

gulp.task("html", function() {
    src('src/html/*.html')
        .pipe( watch('src/html/*.html', updateSlideList) )
        .pipe(fileinclude({
            indent: true,
            context: {
                bg_img: false,
                preload_img: false,
            }
        }))
        .pipe( rename("index.html") )
        .pipe( dest(getHTMLDestPath) );
});

gulp.task('watch-templates', function() {
    gulp.watch([
        "./src/html/templates/*.html",
        "!./src/html/templates/index-list.html"
    ],
    ['html']);
});

gulp.task('scss', function () {
    slideFolders.forEach(slideFolder => {
        let destPath = `./build/${slideFolder}/css/`;

        src('./src/scss/style.scss')
            .pipe(sass({
                outputStyle: 'expanded',
                indentWidth: 4
            }).on('error', sass.logError))
            .pipe( dest(destPath) );
    });
});

gulp.task('watch-styles', function() {
    gulp.watch('./src/scss/*', ['scss']);
});

gulp.task("js", function() {
    slideFolders.forEach(file => {
        let destPath = `./build/${file}/js/`;

        src("src/js/*.js")
            .pipe( watch("src/js/*.js") )
            .pipe( dest(destPath) );
    });
});

gulp.task("img", function() {
    slideFolders.forEach(file => {
        let destPath = `./build/${file}/js/`;

        src("src/js/*.js")
            .pipe( watch("src/js/*.js") )
            .pipe( dest(destPath) );
    });
});

gulp.task("xml", xml);

function xml() {
    console.log("Starting XML task...");

    slideFolders.forEach(slideFolder => {
        let re_res = slideFolder.match(re_slideNum),
            slideNumID = re_res[re_res.length - 1],
            destPath = `./build/${slideFolder}/parameters/`;

        src("./src/xml/parameters.xml")
            .pipe(fileinclude({
                context: {
                    prefix: presConfig.presPrefix,
                    id: slideNumID,
                }
            }))
            .pipe( dest(destPath) );
    });
}

gulp.task("pdf", pdf);

function pdf() {
    console.log("Starting PDF task...");

    slideFolders.forEach(slideFolder => {
        let re_res = slideFolder.match(re_slideNum),
            slideNumID = re_res[re_res.length - 1],
            pdfGlob = [],
            destPath = `./build/${slideFolder}/export/`;
        
        pdfGlob.length = 0;
        pdfGlob.push(`./src/pdf/*${slideNumID}.pdf`);

        src(pdfGlob)
            .pipe( rename("export.pdf") )
            .pipe( dest(destPath) );
    });
}

gulp.task("imgcpy", function() {
    let imgGlob = [];

    slideFolders.forEach(slideName => {
        let re_res = slideName.match(re_slideNum),
            slideNumID = re_res[re_res.length - 1],
            destPath = `./build/${slideName}/media/images/`;

        imgGlob.length = 0;
        imgGlob.push("build/img/common*");
        imgGlob.push(`build/img/${slideNumID}*`);

        src(imgGlob)
            .pipe( dest(destPath) );
    });
});

gulp.task("img-watch", function() {
    gulp.watch('./build/img/*', ['imgcpy']);
});

gulp.task("img-thumb", function() {
    slideFolders.forEach(slideFolder => {
        let re_res = slideFolder.match(re_slideNum),
            slideNumID = re_res[re_res.length - 1],
            srcGlob = `./build/img/${slideNumID}.*`,
            destPath = `./build/${slideFolder}/media/images/thumbnails/`;

        src(srcGlob)
            .pipe(resizer({
                format: "jpg",
                width: 200
            }))
            .pipe( rename("200x150.jpg") )
            .pipe( dest(destPath) );
    });
});

gulp.task("zip", zip);

function zip() {
    console.log("Starting 'zip'...");

    slideFolders.forEach(slideFolder => {
        src(`./build/${slideFolder}/**`)
            .pipe( gulpZip(`${slideFolder}.zip`) )
            .pipe( dest("./build/zip/") );
    });
}

gulp.task("index-list", function() {
    src('./src/html/index.html')
        .pipe(fileinclude({
            indent: true,
            context: {
                bg_img: false,
                preload_img: false,
            }
        }))
        .pipe( dest('./build/') );
});

gulp.task('watch-index-list', function() {
    gulp.watch('./src/html/templates/index-list.html', ['index-list']);
});

function getHTMLDestPath(file)
{
    let destPath = "./build/",
        re_res = file.history[0].match(/([^\\/]+)[.]html$/),
        filename = re_res[re_res.length - 1];

    if (filename !== "index")
    {
        destPath += filename;
    }

    return destPath;
}

function getPresConfig()
{
    let rslt = {
        presPrefix: "",
        from: 0,
        step: 0,
        len: 0,
        count: 0,
    };

    let struct = JSON.parse( fs.readFileSync("presentation.json", "utf-8") );

    rslt.presPrefix = struct.presFullName ? `${struct.presFullName}__` : "";
    rslt.from = struct.slidesNumStart || 5;
    rslt.step = struct.slidesNumStep || 5;
    rslt.len = struct.slidesNumLen || 3;
    rslt.count = struct.slidesCount || 0;

    return rslt;
}

/* returns array of slides without ".html" extension */
function getSlideFolders()
{
    return fs.readdirSync("./src/html/").reduce(function(acc, file) {
        if (file !== "index.html" && file.match(/\.html$/i) )
        {
            acc.push( file.split(".html")[0] );
        }

        return acc;
    }, []);
}

/* updates index.html with links to all slides */
function updateSlideList()
{
    let outStr = "";

    for (let i = 0, slide; slide = slideFolders[i]; i++)
    {
        outStr += `\n\t<li><a href="${slide}/index.html" target="_blank">${slide}</a></li>`;
    }

    outStr = `<ol>${outStr}\n</ol>`;

    fs.writeFileSync("./src/html/templates/index-list.html", outStr);
}

/* * * * * * * * * * * * * * * * *
thumbs creating code down there
* * * * * * * * * * * * * * * * */
gulp.task("thumbs", screens);
gulp.task("thumbs-only", makeThumbs);

async function screens()
{
    console.log("Starting screens fn...");

    browserSync(null, bsOptionsRoutine);

    var screenshotsFolder = "./screens/";

    if( !fs.existsSync(screenshotsFolder) )
    {
        fs.mkdirSync(screenshotsFolder);
    }

    await makeScreenshots(slideFolders, screenshotsFolder);

    await makeThumbs();

    await bs.exit();

    await timeout(3000);

    return;
    // rmDir(screenshotsFolder);
}

async function makeScreenshots(slideAr, screenDest) {
    console.log("Starting makeScreenshots fn...");

    const   browser = await puppy.launch(),
            page = await browser.newPage();

    await page.setViewport({width: 1024, height: 768});

    for(let i = 0; i < slideAr.length; i++)
    {
        let curSlide = slideAr[i];

        console.log(`Going to ${curSlide}...`);
        await page.goto(`http://localhost:33333/${curSlide}/index.html`);

        console.log(`Waiting ${delayInMSForScreenshots / 1000} sec...`);
        await timeout(delayInMSForScreenshots);

        let screenName = screenDest + curSlide + ".png";
        console.log("Taking screenshot...");
        await page.screenshot({path: screenName});
    }

    await browser.close();

    return;
}

async function makeThumbs()
{
    console.log("Starting makeThumbs fn...");

    var screenFiles = fs.readdirSync("./screens/");

    if( !screenFiles.length )
    {
        console.log("screenFiles.length = 0 ¯\\_(''/)_/¯");
        return;
    }

    screenFiles.forEach(screenFile => {
        if ( !screenFile.match(/\.png$/i) )
        {
            return;
        }

        var slideName = screenFile.split(".png")[0];

        return src(`./screens/${screenFile}`)
            .pipe(resizer({
                format: "jpg",
                width: 200
            }))
            .pipe( rename("200x150.jpg") )
            .pipe( dest(`./build/${slideName}/media/images/thumbnails/`) );
    });
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function rmDir(folder)
{
    let folderFiles = fs.readdirSync(folder);

    folderFiles.forEach(file => {
        fs.unlinkSync(`${folder}${file}`);
    });

    fs.rmdirSync(folder);
}

/* * * * * * * * * * * * * * * * *
create slides code there stranger
(its dangerous to go alone there)
* * * * * * * * * * * * * * * * */

gulp.task("create", function() {
    let prefix = presConfig.presConfig,
        from = presConfig.from,
        step = presConfig.step,
        count = presConfig.count,
        to = count * step,
        len = presConfig.len,

        createdSlides = [],

        slideNumStr,
        fileName,
        slideID,
        folderName;

    for (let i = from; i <= to; i += step)
    {
        slideNumStr = getSlideNumStr(i, len);

        fileName = `slide_${slideNumStr}.html`;
        slideID = prefix + slideNumStr;
    
        if ( !fs.existsSync(`./src/html/${fileName}`) )
        {
            src("./src/html/common/slide-template.html")
                .pipe(fileinclude({
                    prefix: "###",
                    context: {
                        id: slideID,
                        prevent_left_swipe: false,
                        prevent_right_swipe: false,
                        bg_img: slideNumStr,
                    }
                }))
                .pipe( rename(fileName) )
                .pipe( dest("./src/html/") );

            createdSlides.push(fileName);
        }

        folderName = `./build/slide_${slideNumStr}`;
        
        if( !fs.existsSync(folderName) )
        {
            fs.mkdirSync(folderName);
        }
    }

    for (let i = 0; i < createdSlides.length; i++)
    {
        console.log(`${createdSlides[i]} - Files and folders has been created.`);
    }
});

function getSlideNumStr(num, len)
{
    let result = "",
        tmp = num,
        numLen = 1;
    
    while( tmp = Math.floor(tmp / 10) )
    {
        numLen++;
    }

    if (numLen < len)
    {
        result = "0".repeat(len - numLen) + num;
    }
    else
    {
        result = num.toString();
    }

    return result;
}
