var gulp = require('gulp');
var eslint = require('gulp-eslint');
var cache = require('gulp-cached');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');
var watch = require('gulp-watch');
var batch = require('gulp-batch');

var src = './src/**/*.js';

gulp.task('compile', function () {
  return gulp.src(src)
    .pipe(cache('eslint', { optimizeMemory: true }))
    .pipe(eslint({
      configFile: '.eslintrc.js',
      quiet: true
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(plumber())
    .pipe(babel({
      presets: ['es2015'],
      minified: true
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
  watch(src, batch(function (events, done) {
    gulp.start('compile', done);
  }));
});

gulp.task('default', ['watch']);
