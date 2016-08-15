var gulp = require('gulp');
var eslint = require('gulp-eslint');
var mocha = require('gulp-spawn-mocha');
var runSequence = require('run-sequence');
var cache = require('gulp-cached');

var scripts = {
  src: 'src/**/*.js',
  test: 'test/**/*.js'
};

/**
 * Testing
 */

gulp.task('test', function() {
  return gulp.src(scripts.test)
    .pipe(mocha({
      istanbul: { report: 'none' }
    }));
});

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
addLinterTask('eslint-test', scripts.test);

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

addWatchTask('watch-src', scripts.src, ['eslint-src', 'test']);
addWatchTask('watch-test', scripts.test, ['eslint-test', 'test']);

/**
 * Tasks
 */

gulp.task('watch', ['watch-src', 'watch-test']);
gulp.task('default', ['watch']);
