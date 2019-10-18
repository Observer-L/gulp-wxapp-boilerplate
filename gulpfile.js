const gulp = require("gulp");
const $ = require("gulp-load-plugins")();
const del = require("del");
const path = require("path");
const autoprefixer = require("autoprefixer");
const pngquant = require("imagemin-pngquant");
const uglifyjs = require("uglify-es");
const px2rpx = require("postcss-px2rpx");
const composer = require("gulp-uglify/composer");
const minifyJs = composer(uglifyjs, console);
const jsonTransform = require("gulp-json-transform");
const tsProject = $.typescript.createProject("tsconfig.json");
const pkg = require("./package.json");

/* 文件路径 */
const distPath = "dist";
const wxmlFiles = "src/**/*.wxml";
const lessFiles = ["src/**/!(_)*.less"];
const imgFiles = "src/assets/images/*.{png,jpg,jpeg,gif,ico,svg}";
const jsonFiles = "src/**/*.json";
const tsFiles = ["src/**/*.ts"];
const copyPath = ["src/**/!(_)*.*", "!src/**/*.less", "!src/**/*.ts"];

const isProd = process.env.NODE_ENV === "production";

function logError(e) {
  console.error(e.message);
  this.emit("end");
}

/****************************/
/*****************************
 ***         TASKS         ***
 ****************************/
/****************************/

/**
 * @description 清空非npm构建包dist目录文件
 */
gulp.task("clean", () => {
  return del(["dist/**", "!dist/miniprogram_npm/**"]);
});

/**
 * @description 复制不包含less和图片的文件
 */
gulp.task("copy", () => {
  return gulp.src(copyPath).pipe(gulp.dest(distPath));
});

/**
 * @description 复制不包含less和图片的文件(只改动有变动的文件）
 */
gulp.task("copyChange", () => {
  return gulp
    .src(copyPath)
    .pipe($.changed(distPath))
    .pipe(gulp.dest(distPath));
});

/**
 * @description 压缩wxml，生产环境任务
 * @options 去空，去注释，补全标签
 */
gulp.task("minify-wxml", () => {
  const options = {
    collapseWhitespace: true,
    removeComments: true,
    keepClosingSlash: true
  };
  return gulp
    .src(wxmlFiles)
    .pipe($.if(isProd, $.htmlmin(options)))
    .pipe(gulp.dest(distPath));
});

/**
 * @description 压缩json，生产环境任务
 */
gulp.task("minify-json", function() {
  return gulp
    .src(jsonFiles)
    .pipe($.jsonminify2())
    .pipe(gulp.dest(distPath));
});

/**
 * @description 编译less，补全、压缩样式文件
 */
gulp.task("compile-less", () => {
  const postcssOptions = [
    px2rpx(),
    autoprefixer({
      overrideBrowserslist: ["ios >= 8", "android >= 4.1"]
    })
  ];
  return gulp
    .src(lessFiles)
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe($.less().on("error", logError))
    .pipe($.if(isProd, $.cssnano()))
    .pipe($.postcss(postcssOptions))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe(
      $.rename({
        extname: ".wxss"
      })
    )
    .pipe(gulp.dest(distPath));
});

/**
 * @description 压缩图片
 */
gulp.task("minify-image", () => {
  const options = {
    progressive: true,
    svgoPlugins: [
      {
        removeViewBox: false
      }
    ],
    use: [pngquant()]
  };
  return gulp
    .src(imgFiles)
    .pipe($.imagemin(options))
    .pipe(gulp.dest("src/assets/images/"));
});

/**
 * @description 编译、压缩ts
 */
gulp.task("compile-ts", () => {
  const options = {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  };
  return tsProject
    .src()
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe(tsProject())
    .on("error", logError)
    .js.pipe($.if(isProd, minifyJs(options)))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe(gulp.dest(distPath));
});

/**
 * @description npm支持1，复制依赖的node_modules文件
 */
gulp.task("copyNodeModules", () => {
  const nodeModulesCopyPath = Object.keys(pkg.dependencies).map(
    d => "node_modules/" + d + "/**/*"
  );
  return gulp
    .src(nodeModulesCopyPath, {
      base: ".",
      allowEmpty: true
    })
    .pipe(gulp.dest(distPath));
});

/**
 * @description npm支持2，根据dependencies生成package.json
 */
gulp.task("generatePackageJson", () => {
  return gulp
    .src("./package.json")
    .pipe(
      jsonTransform(() => {
        return {
          dependencies: pkg.dependencies
        };
      })
    )
    .pipe(gulp.dest(distPath));
});

/**
 * @description 通用编译
 */
gulp.task(
  "compile",
  gulp.series(
    "clean",
    gulp.parallel(
      "copyNodeModules",
      "generatePackageJson",
      "compile-ts",
      "compile-less",
      "copy"
    )
  )
);

/**
 * @description 编译、监听
 */
gulp.task(
  "watch",
  gulp.series("compile", () => {
    gulp.watch(tsFiles, gulp.parallel("compile-ts"));
    gulp.watch(lessFiles, gulp.parallel("compile-less"));
    gulp.watch(copyPath, gulp.parallel("copy"));
    $.watch("src/**", e => {
      console.log(`[watch]:${e.path} has ${e.event}`);
    });
  })
);

/**
 * @description 生产环境打包
 */
gulp.task(
  "build",
  gulp.series(
    "compile",
    gulp.parallel("minify-wxml", "minify-json", "minify-image")
  )
);

/**
 * @description CLI快建模板
 * @example
 *   gulp create -p mypage           创建名称为mypage的page文件
 *   gulp create -t mytpl            创建名称为mytpl的template文件
 *   gulp create -c mycomponent      创建名称为mycomponent的component文件
 *   gulp create -s index -p mypage  创建名称为mypage的page文件
 */
const create = done => {
  const yargs = require("yargs")
    .example("gulp create -p mypage", "创建名为mypage的page文件")
    .example("gulp create -c mycomponent", "创建名为mycomponent的component文件")
    .example(
      "gulp create -s index -p mypage",
      "复制pages/index中的文件创建名称为mypage的页面"
    )
    .option({
      s: {
        alias: "src",
        default: "",
        describe: "copy的模板",
        type: "string"
      },
      p: {
        alias: "page",
        describe: "页面名称",
        conflicts: ["t", "c"],
        type: "string"
      },
      c: {
        alias: "component",
        describe: "组件名称",
        type: "string"
      },
      version: {
        hidden: true
      },
      help: {
        hidden: true
      }
    })
    .fail(msg => {
      done();
      console.error("创建失败!!!");
      console.error(msg);
      console.error("请按照如下命令执行...");
      yargs.parse(["--msg"]);
      return;
    })
    .help("msg");

  const argv = yargs.argv;
  const source = argv.s;

  const typeEnum = {
    p: "pages",
    c: "components"
  };
  let hasParams = false;
  let name, type;
  for (let key in typeEnum) {
    hasParams = hasParams || !!argv[key];
    if (argv[key]) {
      name = argv[key];
      type = typeEnum[key];
    }
  }

  if (!hasParams) {
    done();
    yargs.parse(["--msg"]);
  }

  const root = path.join(__dirname, "template", type);
  return gulp
    .src(path.join(root, source, "*.*"))
    .pipe(
      rename({
        dirname: name,
        basename: name
      })
    )
    .pipe(gulp.dest(path.join("src", type)));
};
gulp.task(create);
