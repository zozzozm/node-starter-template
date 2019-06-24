const gulp = require("gulp");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const tsProject = ts.createProject("tsconfig.json", {
    typescript: require("typescript")
});

gulp.task("build", () => {
    gulp.src(["package.json"])
        .pipe(gulp.dest("dist"));

    gulp.src(["src/views/**/*"])
        .pipe(gulp.dest("dist/views"));
        
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .js
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist"));
});

gulp.task("watchTask", function () {
    gulp.watch("src/**/*.ts", ["build"]);
});

gulp.task("default", gulp.series("build"));
gulp.task("watch", gulp.series("build", "watchTask"));