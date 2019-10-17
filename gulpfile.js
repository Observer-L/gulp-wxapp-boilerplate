const gulp = require("gulp");
const rename = require("gulp-rename");
const del = require("del");
const path = require("path");
const less = require("gulp-less");
const gulpif = require("gulp-if");
const changed = require("gulp-changed");
const imagemin = require("gulp-imagemin");
const sourcemaps = require("gulp-sourcemaps");
const ts = require("gulp-typescript");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const tsProject = ts.createProject("tsconfig.json");
const projectConfig = require("./package.json");
const jsonTransform = require("gulp-json-transform");

/* 文件路径 */
const srcPath = "src/**";
const distPath = "dist/";
const wxmlFiles = `${srcPath}/*.wxml`;
const lessFiles = [`${srcPath}/*.less`, `${srcPath}/assets/styles/*.less`];
const jsonFiles = `${srcPath}/*.json`;
const jsFiles = `${srcPath}/*.ts`;
const imgFiles = [
  `${srcPath}/images/*.{png,jpg,gif,ico}`,
  `${srcPath}/images/**/*.{png,jpg,gif,ico}`
];
const copyPath = ["src/**/!(_)*.*", "!src/**/*.less", "!src/**/*.ts"];
//项目路径
var option = {
  base: "src",
  allowEmpty: true
};

const isProd = process.env.NODE_ENV === "production";

/* 任务 */
// 清除dist
gulp.task("clean", () => {
  return del(["./dist/**"]);
});

// 复制不包含less和图片的文件
gulp.task("copy", () => {
  return gulp.src(copyPath, option).pipe(gulp.dest(distPath));
});
//复制不包含less和图片的文件(只改动有变动的文件）
gulp.task("copyChange", () => {
  return gulp
    .src(copyPath, option)
    .pipe(changed(distPath))
    .pipe(gulp.dest(distPath));
});

// 编译ts
gulp.task("tsCompile", function() {
  return tsProject
    .src()
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(tsProject())
    .js.pipe(gulpif(!isProd, sourcemaps.write()))
    .pipe(gulp.dest(distPath));
});

// 编译less文件
const wxss = () => {
  return gulp
    .src(lessFiles)
    .pipe(less())
    .pipe(postcss([autoprefixer()]))
    .pipe(
      rename({
        extname: ".wxss"
      })
    )
    .pipe(gulp.dest(distPath));
};
gulp.task(wxss);

// 编译压缩图片
const img = () => {
  return gulp
    .src(imgFiles, {
      since: gulp.lastRun(img)
    })
    .pipe(imagemin())
    .pipe(gulp.dest(distPath));
};
gulp.task(img);

// npm支持
const dependencies = projectConfig && projectConfig.dependencies;
const nodeModulesCopyPath = [];
for (const d in dependencies) {
  nodeModulesCopyPath.push("node_modules/" + d + "/**/*");
}
gulp.task("npm", () => {
  return gulp
    .src(`${distPath}/**/*.js`)
    .pipe(
      npm({
        dest: distPath
      })
    )
    .pipe(gulp.dest(distPath));
});
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
      jsonTransform(function(data, file) {
        return {
          dependencies: dependencies
        };
      })
    )
    .pipe(gulp.dest(distPath));
});

/* watch */
gulp.task("watch", () => {
  const watcher = gulp.watch(copyPath, gulp.series("copyChange"));
  gulp.watch(lessFiles, wxss);
  gulp.watch(jsFiles, gulp.series("tsCompile"));
  gulp.watch(imgFiles, img);
  watcher.on("unlink", filepath => {
    const filePathFromSrc = path.relative(path.resolve("src"), filepath);
    const destFilePath = path.resolve(builtPath, filePathFromSrc);
    del.sync(destFilePath);
  });
});

/* dev */
gulp.task(
  "dev",
  gulp.series(
    "clean",
    gulp.parallel("copy", "wxss", "img", "tsCompile"),
    "copyNodeModules",
    "generatePackageJson",
    "watch"
  )
);

/* build */
gulp.task(
  "build",
  gulp.series(
    "clean",
    gulp.parallel("copy", "wxss", "img", "tsCompile"),
    "copyNodeModules",
    "generatePackageJson"
  )
);

/**
 * create 自动创建page or template or component
 *  -s 源目录（默认为_template)
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
