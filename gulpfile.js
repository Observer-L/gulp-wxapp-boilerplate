const gulp = require("gulp");
const $ = require("gulp-load-plugins")();
const del = require("del");
const path = require("path");
const autoprefixer = require("autoprefixer");
const pngquant = require("pngquant");
const uglifyjs = require("uglify-es");
const composer = require("gulp-uglify/composer");
const minifyJs = composer(uglifyjs, console);
const jsonTransform = require("gulp-json-transform");
const tsProject = $.typescript.createProject("tsconfig.json");
const pkg = require("./package.json");

/* 文件路径 */
const option = {
  base: "src",
  allowEmpty: true
};
const distPath = "dist";
const wxmlFiles = "src/**/*.wxml";
const lessFiles = "src/**/*.less";
const imgFiles = "src/assets/images/*.{png,jpg,gif,ico}";
const jsonFiles = "src/**/*.json";
const tsFiles = ["src/**/*.ts"];
const copyPath = ["src/**/!(_)*.*", "!src/**/*.less", "!src/**/*.ts"];

const isProd = process.env.NODE_ENV === "production";

function logError(e) {
  console.error(e.message);
  this.emit("end");
}
/* 任务 */
// 清除dist
gulp.task("clean", () => {
  return del(["dist/**", "!dist/miniprogram_npm/**"]);
});

// 复制不包含less和图片的文件
gulp.task("copy", () => {
  return gulp.src(copyPath, option).pipe(gulp.dest(distPath));
});
//复制不包含less和图片的文件(只改动有变动的文件）
gulp.task("copyChange", () => {
  return gulp
    .src(copyPath, option)
    .pipe($.changed(distPath))
    .pipe(gulp.dest(distPath));
});

// 压缩wxml
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

//压缩json
gulp.task("minify-json", function() {
  return gulp
    .src(jsonFiles)
    .pipe($.jsonminify2())
    .pipe(gulp.dest(distPath));
});

// 编译less文件
gulp.task("compile-less", () => {
  const postcssOptions = [
    autoprefixer({
      overrideBrowserslist: ["ios >= 8", "android >= 4.1"]
    })
  ];
  return gulp
    .src(lessFiles, option)
    .pipe($.if(!isProd, $.sourcemaps.init()))
    .pipe($.less().on("error", logError))
    .pipe($.if(isProd, $.postcss(postcssOptions)))
    .pipe($.if(isProd, $.cssnano()))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe(
      $.rename({
        extname: ".wxss"
      })
    )
    .pipe(gulp.dest(distPath));
});

// 压缩图片
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

// 编译ts
gulp.task("compile-ts", () => {
  const minifyJsOptions = {
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
    .js.pipe($.if(isProd, minifyJs(minifyJsOptions)))
    .pipe($.if(!isProd, $.sourcemaps.write()))
    .pipe(gulp.dest(distPath));
});

// npm支持
const nodeModulesCopyPath = Object.keys(pkg.dependencies).map(
  d => "node_modules/" + d + "/**/*"
);

//复制依赖的node_modules文件
gulp.task("copyNodeModules", () => {
  return gulp
    .src(nodeModulesCopyPath, {
      base: ".",
      allowEmpty: true
    })
    .pipe(gulp.dest(distPath));
});
// 根据denpende生成package.json
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

//编译
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

//监听
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

//构建
gulp.task(
  "build",
  gulp.series(
    "compile",
    gulp.parallel("minify-wxml", "minify-json", "minify-image")
  )
);

/**
 * create 自动创建page or component
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
