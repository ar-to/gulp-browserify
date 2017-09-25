
var gulp = require('gulp');
var browserify = require('browserify'); // Providers "require" support, CommonJS
var source = require('vinyl-source-stream'); // Vinyl stream support
var uglify = require('gulp-uglify');

// Configuration for Gulp
var config = {
  js: {
    src: './src/js/main.js',
    watch: './src/js/**/*',
    outputDir: './www/js',
    outputFile: 'bundle.js',
  },
};

gulp.task('browserify-single', function () {//works taken from : https://wehavefaces.net/gulp-browserify-the-gulp-y-way-bb359b3f9623
  return browserify(config.js.src)
    .bundle()
    .on('error', mapError) // Map error reporting
    .pipe(source('bundle.js'))
    .pipe(notify({
      message: 'Generated file: <%= file.relative %>',
    }))
    .pipe(gulp.dest(config.js.outputDir));
});

//with sourcemaps
gulp.task('browserify', function () {//https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-uglify-sourcemap.md
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: config.js.src,
    debug: true
  });

  return b.bundle()
    .pipe(source(config.js.outputFile))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.
        //.pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('./map'))
    .pipe(gulp.dest(config.js.outputDir));
});

//http://mikevalstar.com/post/fast-gulp-browserify-babelify-watchify-react-build/

var babelify = require('babelify'); // Used to convert ES6 & JSX to ES5
var notify = require('gulp-notify'); // Provides notification to both the console and Growel
var rename = require('gulp-rename'); // Rename sources
var sourcemaps = require('gulp-sourcemaps'); // Provide external sourcemap files
var livereload = require('gulp-livereload'); // Livereload support for the browser - did not get to work; used browser-sync instead
var gutil = require('gulp-util'); // Provides gulp utilities, including logging and beep
var chalk = require('chalk'); // Allows for coloring for logging
var buffer = require('vinyl-buffer'); // Vinyl stream support
var watchify = require('watchify'); // Watchify for source changes
var merge = require('utils-merge'); // Object merge tool
var duration = require('gulp-duration'); // Time aspects of your gulp process

// Error reporting function
function mapError(err) {
  if (err.fileName) {
    // Regular error
    gutil.log(chalk.red(err.name)
      + ': ' + chalk.yellow(err.fileName.replace(__dirname + '/src/js/', ''))
      + ': ' + 'Line ' + chalk.magenta(err.lineNumber)
      + ' & ' + 'Column ' + chalk.magenta(err.columnNumber || err.column)
      + ': ' + chalk.blue(err.description));
  } else {
    // Browserify error..
    gutil.log(chalk.red(err.name)
      + ': '
      + chalk.yellow(err.message));
  }
}

// Completes the final file outputs
function bundle(bundler) {
  var bundleTimer = duration('Javascript bundle time');

  bundler
    .bundle()
    .on('error', mapError) // Map error reporting
    .pipe(source('main.jsx')) // Set source name
    .pipe(buffer()) // Convert to gulp pipeline
    .pipe(rename(config.js.outputFile)) // Rename the output file
    .pipe(sourcemaps.init({loadMaps: true})) // Extract the inline sourcemaps
    .pipe(sourcemaps.write('./map')) // Set folder for sourcemaps to output to
    .pipe(gulp.dest(config.js.outputDir)) // Set the output folder
    .pipe(notify({
      message: 'Generated file: <%= file.relative %>',
    })) // Output the file being created
    .pipe(bundleTimer); // Output time timing of the file creation
    //.pipe(livereload()); // Reload the view in the browser
}

// Gulp task for build - not used
gulp.task('watchify', function() {
  //livereload.listen(); // Start livereload server
  var args = merge(watchify.args, { debug: true }); // Merge in default watchify args with browserify arguments

  var bundler = browserify(config.js.src, args) // Browserify
    .plugin(watchify, {ignoreWatch: ['**/node_modules/**', '**/bower_components/**']}) // Watchify to watch source file changes
    //.transform(babelify, {presets: ['es2015', 'react']}); // Babel tranforms

  bundle(bundler); // Run the bundle the first time (required for Watchify to kick in)

  bundler.on('update', function() {
    bundle(bundler); // Re-run bundle on source updates
  });
});

//http://blog.qhashtech.com/2015/10/09/gulp-task-to-run-the-web-server-and-live-reload-the-changes-in-browser/

//https://browsersync.io/docs/gulp - browser-sync
//https://scotch.io/tutorials/automate-your-tasks-easily-with-gulp-js - gulp.watch()
//https://css-tricks.com/gulp-for-beginners/ - gulp tricks
var browserSync = require('browser-sync').create();
var notifier = require('node-notifier');//https://davidwalsh.name/system-notifications-node
var fs = require('fs');
var path = require('path');

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
      //browser: ["chrome", "firefox", "microsoft edge"],
      browser: ["Google Chrome"],
      server: {
          baseDir: "./www/"
      }
    });
});

//notification for browser reload
function noti() {
  notifier.notify({
    'title': 'Gulp notification',
    'message': 'reloaded browser',
    //icon: fs.readFileSync(__dirname + '/icon.jpg'),
    icon: path.join(__dirname, 'icon.jpg'),
    timeout : 2
  });
}

gulp.task('serve', ['browser-sync'], function() {
  gulp.watch(config.js.watch, ['browserify']);//watches for all js/* changes and builds bundle.js
  browserSync.watch(config.js.watch, browserSync.reload);//watches all js changes and reload browser
  gulp.watch(config.js.outputDir + '/bundle.js')//watches bundle.js changes
    .on('change', noti);//loads notification
  //below: extra for experimentation
  //gulp.watch('./www/js/bundle.js', browserSync.reload);//works!
  //gulp.watch(config.js.outputDir + '/bundle.js', browserSync.reload);//works!
  // gulp.watch(config.js.outputDir + '/bundle.js')
  //   .on('change', noti);//works!
    // notifier.notify({
    //   'title': 'My notification',
    //   'message': 'Hello, there!'
    // });
});
