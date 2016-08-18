var gulp = require('gulp');
var eslint = require('gulp-eslint');
var runSequence = require('run-sequence');
var cache = require('gulp-cached');
var babel = require('gulp-babel');

var scripts = {
  src: 'src/**/*.js'
};

/**
 * Linting
 */

function addLinterTask(name, path) {
  gulp.task(name, function () {
    return gulp.src(path)
      .pipe(cache('eslint', { optimizeMemory: true }))
      .pipe(eslint({
        configFile: '.eslintrc.js',
        quiet: true
      }))
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
  });
}

addLinterTask('eslint-src', scripts.src);

/**
 * Babel
 */

function addBabelTask(name, path, dest) {
  gulp.task(name, function() {
    return gulp.src(path)
      .pipe(babel({
        presets: ['es2015'],
        minified: true
      }))
      .pipe(gulp.dest(dest));
  });
}

addBabelTask('babel-src', scripts.src, 'dist');

/**
 * Watch
 */

function addWatchTask(name, path, tasks) {
  gulp.task(name, function() {
    gulp.watch(path, function() {
      runSequence.call(this, tasks);
    });
  });
}

addWatchTask('watch-src', scripts.src, ['eslint-src', 'babel-src']);

/**
 * Tasks
 */

gulp.task('watch', ['watch-src']);
gulp.task('default', ['watch']);
