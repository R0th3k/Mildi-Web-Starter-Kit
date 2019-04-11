/*global require*/
"use strict";

var gulp = require('gulp'),
  path = require('path'),
  data = require('gulp-data'),
  pug = require('gulp-pug'),
  prefix = require('gulp-autoprefixer'),
  sass = require('gulp-sass'),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify'),
  sourcemaps = require('gulp-sourcemaps'),
  notify = require('gulp-notify'),
  imagemin = require('gulp-imagemin'),
  imagemin = require('gulp-imagemin'),
  cache = require('gulp-cache'),
  imagemin = require('gulp-imagemin'),
  imageminPngquant = require('imagemin-pngquant'),
  imageminZopfli = require('imagemin-zopfli'),
  imageminMozjpeg = require('imagemin-mozjpeg'),//need to run 'brew install libpng'
  imageminGiflossy = require('imagemin-giflossy'),
  browserSync = require('browser-sync');

/*
 * Directories here
 */
var paths = {
  public: './public/',
  sass: './src/sass/',
  scripts: './src/js/',
  images: './src/images/',
  js: './public/js/',
  css: './public/css/',
  img: './public/images/',
  data: './src/pug/_data/'
};

/**
 * Compile .pug files and pass in data from json file
 * matching file name. index.pug - index.pug.json
 */
gulp.task('pug', function () {
  return gulp.src('./src/pug/*.pug')
    .pipe(pug({
      pretty:true,
    }))
    .on('error', function (err) {
      process.stderr.write(err.message + '\n');
      this.emit('end');
    })
    .pipe(gulp.dest(paths.public))
    .pipe(notify({ message: 'Compiled the pug files' }));
});

/**
 * Recompile .pug files and live reload the browser
 */
gulp.task('rebuild', ['pug'], function () {
  browserSync.reload();
});

/**
 * Wait for pug and sass tasks, then launch the browser-sync Server
 */
gulp.task('browser-sync', ['sass', 'pug'], function () {
  browserSync({
    server: {
      baseDir: paths.public
    },
    notify: false
  });
});

/**
 * Compile .scss files into public css directory With autoprefixer no
 * need for vendor prefixes then live reload the browser.
 */
gulp.task('sass', function () {
  return gulp.src(paths.sass + '*.scss')
    .pipe(sass({
      includePaths: [paths.sass],
      outputStyle: 'compressed'
    }))
    .pipe(sourcemaps.init())
    .on('error', sass.logError)
    .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
      cascade: true
    }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.css))
    .pipe(notify({ message: 'Finished minifying Styles' }))
    .pipe(browserSync.reload({
      stream: true
    }));
});

var jsFiles = [
  paths.scripts + "/lib/jquery-3.4.0.js",
  paths.scripts + "/lib/sweetalert2.all.min.js",
  paths.scripts + "/lib/owl.carousel.min.js",
  paths.scripts + "/lib/modernizr.js",
  paths.scripts + "/lib/bootstrap.js",
  paths.scripts + "app.js"
];

gulp.task('minifyJs', function () {
  return gulp.src(jsFiles) //select all javascript files under js/ and any subdirectory
      .pipe(sourcemaps.init())
      .pipe(concat('app.min.js')) //the name of the resulting file
      .pipe(uglify())
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(paths.js)) //the destination folder
      .pipe(notify({ message: 'Finished minifying app JavaScript' }));
});

//compress all images
gulp.task('imagemin', function() {
  return gulp.src([paths.images + '/**/*.{gif,png,jpg,svg}'])
      .pipe(cache(imagemin([
          //png
          imageminPngquant({
              speed: 1,
              quality: [0.95, 1] //lossy settings
          }),
          imageminZopfli({
              more: true
              // iterations: 50 // very slow but more effective
          }),
          //gif
          // imagemin.gifsicle({
          //     interlaced: true,
          //     optimizationLevel: 3
          // }),
          //gif very light lossy, use only one of gifsicle or Giflossy
          imageminGiflossy({
              optimizationLevel: 3,
              optimize: 3, //keep-empty: Preserve empty transparent frames
              lossy: 2
          }),
          //svg
          imagemin.svgo({
              plugins: [{
                  removeViewBox: false
              }]
          }),
          //jpg lossless
          imagemin.jpegtran({
              progressive: true
          }),
          //jpg very light lossy, use vs jpegtran
          imageminMozjpeg({
              quality: 80
          })
      ])))
      .pipe(gulp.dest(paths.img))
      .pipe(notify({ message: 'The images have been optimized' }));
});
/**
 * Watch scss files for changes & recompile
 * Watch .pug files run pug-rebuild then reload BrowserSync
 */
gulp.task('watch', function () {
  gulp.watch(paths.sass + '**/*.scss', ['sass']);
  gulp.watch(paths.scripts + '*', ['minifyJs']);
  gulp.watch(paths.images + '/**/*', ['imagemin']);
  gulp.watch('./src/**/*.pug', ['rebuild']);
});

// Build task compile sass and pug.
gulp.task('build', ['sass', 'pug']);

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync then watch
 * files for changes
 */
gulp.task('default', ['browser-sync', 'watch']);
