var gulp = require('gulp'),
	sass = require('gulp-ruby-sass'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat'),
	jade = require('gulp-jade'),
	prefix = require('gulp-autoprefixer');

var paths = {
	styles: 'styles/**/*.scss',
	scripts: {
		app: 'scripts/app/**/*.js',
		libs: 'scripts/libs/**/*.js'
	},
	markup: ['markup/index.jade', '!markup/**/_*.jade'],
	watch: {
		scripts: 'scripts/**/*.js',
		styles: 'styles/**/*.scss',
		markup: 'markup/**/*.jade'
	},
	root: './',
	distribution: 'dist/'
};

gulp.task('styles', function() {
	return gulp.src(paths.styles)
		.pipe(sass({
			style: 'expanded',
			lineNumbers: true
		}))
		.pipe(prefix('> 2%'))
		.pipe(gulp.dest(paths.distribution + 'css'))
		.pipe(minifycss())
		.pipe(rename(function(path) {
			path.basename += '.min'
		}))
		.pipe(gulp.dest(paths.distribution + 'css'));
});

gulp.task('scripts-app', function() {
	return gulp.src(paths.scripts.app)
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(concat('app.js'))
		.pipe(gulp.dest(paths.distribution + 'js'))
		.pipe(uglify({
			mangle: false,
			compress: false
		}))
		.pipe(rename('app.min.js'))
		.pipe(gulp.dest(paths.distribution + 'js'));
});

gulp.task('scripts-libs', function() {
	return gulp.src(paths.scripts.libs)
		.pipe(concat('libs.js'))
		.pipe(gulp.dest(paths.distribution + 'js'))
		.pipe(uglify({
			mangle: false,
			compress: false
		}))
		.pipe(rename('libs.min.js'))
		.pipe(gulp.dest(paths.distribution + 'js'));
});

gulp.task('scripts', ['scripts-app', 'scripts-libs']);

gulp.task('markup', function() {
	return gulp.src(paths.markup)
		.pipe(jade())
		.pipe(gulp.dest(paths.root));
});

gulp.task('default', ['styles', 'scripts', 'markup']);

gulp.task('dev', function() {
	gulp.watch(paths.watch.styles, ['styles']);
	gulp.watch(paths.watch.scripts, ['scripts']);
	gulp.watch(paths.watch.markup, ['markup']);
});
