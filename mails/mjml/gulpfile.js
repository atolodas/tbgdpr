var gulp = require('gulp');
var mjml = require('gulp-mjml')
var mjmlEngine = require('mjml')
var i18n = require('gulp-html-i18n')
var download = require("gulp-download-stream");
var buffer = require('vinyl-buffer')
var replace_task = require('gulp-replace-task');
var ext_replace = require('gulp-ext-replace');
var zip = require('gulp-zip');
var replace = require('gulp-replace');
var rename = require('gulp-rename');
var clean = require('gulp-clean');
var fs = require('fs');

var settings = require('./src/config/settings.json');

// Compile files [dev mode]
gulp.task('build:dev', function () {
  var css = fs.readFileSync(__dirname + '/src/css/global.css', 'utf8');
  var fake_json_path = './src/config/fake.json';
  delete require.cache[require.resolve(fake_json_path)]
  var fake = require(fake_json_path);

  return gulp.src(['src/*.mjml'])

  // Compile MJML to HTML
    .pipe(mjml(mjmlEngine))

    // Delete conditions
    .pipe(replace('{{/if}}', ''))
    .pipe(replace(/{{if \$[a-z_]+}}/ig, ''))

    // We need to decode some curly brackets & dollar signs because of MJML
    .pipe(replace('%7B%7B', '{{'))
    .pipe(replace('%7D%7D', '}}'))
    .pipe(replace('&#36;', '$'))

    // CSS injection in the header
    .pipe(replace('</head>', '<style>' + css + '</style></head>'))

    // Translate
    .pipe(i18n({
      langDir: './langs',
      trace: true,
      createLangDirs: true
    }))

    // Replace variables with fake data
    .pipe(replace_task({
      patterns: [{ json: fake }],
      usePrefix: false
    }))

    .pipe(gulp.dest('./dist/tbgdpr/'))
});

// Compile files with MJML
gulp.task('build:mjml', function () {
  var css = fs.readFileSync(__dirname + '/src/css/global.css', 'utf8');
  var fake_json_path = './src/config/fake.json';
  delete require.cache[require.resolve(fake_json_path)];
  var fake = require(fake_json_path);

  return gulp.src(['src/*.mjml'])

  // Compile MJML to HTML
    .pipe(mjml(mjmlEngine))

    // We need to decode some curly brackets & dollar signs because of MJML
    .pipe(replace('%7B%7B', '{{'))
    .pipe(replace('%7D%7D', '}}'))
    .pipe(replace('&#36;', '$'))

    // CSS injection in the header
    .pipe(replace('</head>', '<style>' + css + '</style></head>'))

    // Translate
    .pipe(i18n({
      langDir: './langs',
      trace: true,
      createLangDirs: true
    }))

    // Rename files
    .pipe(ext_replace('.html'))

    .pipe(gulp.dest('./dist/' + settings.name))
});

// Copy images in dist folder
gulp.task('build:copy:img', function () {
  return gulp.src('src/img/*.{jpg,jpeg,png,gif}')
    .pipe(gulp.dest('./dist/' + settings.name + '/img/'));
});

// Copy tpls in dist folder
gulp.task('build:copy:tpl', function () {
  return gulp.src('src/*.html')
    .pipe(gulp.dest('./dist/' + settings.name + '/tpl/'));
});

// Copy preview img in dist folder
gulp.task('build:copy:preview', function () {
  return gulp.src('src/preview.jpg')
    .pipe(gulp.dest('./dist/' + settings.name + '/'));
});

// Copy settings in dist folder
gulp.task('build:copy:settings', function () {
  return gulp.src('src/config/settings.json')
    .pipe(gulp.dest('./dist/' + settings.name + '/'));
});

// Compress folder
gulp.task('build:compress', ['build:copy:settings', 'build:mjml', 'build:copy:tpl', 'build:copy:img', 'build:copy:preview'], function () {
  return gulp.src('./dist/' + settings.name + '/**/*')
    .pipe(zip(settings.name + '.zip'))
    .pipe(gulp.dest('./dist/'));
});

// Copy images in dist folder
gulp.task('build', ['build:copy:settings', 'build:mjml', 'build:copy:img', 'build:copy:preview', 'build:copy:tpl']);

// Watch changes
gulp.task('watch', function () {
  gulp.watch('src/**/*.mjml', ['build:dev']);
  gulp.watch('src/css/global.css', ['build:dev']);
  gulp.watch('src/config/fake.json', ['build:dev']);
});

// Run all tasks if no args
gulp.task('default', ['watch']);
