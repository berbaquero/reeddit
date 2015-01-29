var gulp = require('gulp'),
	sass = require('gulp-ruby-sass'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat-util'),
	prefix = require('gulp-autoprefixer'),
	groupMQ = require('gulp-group-css-media-queries'),
	jade = require('gulp-jade');

var paths = {
	styles: 'styles/**/*.scss',
	scripts: [
		'scripts/globals.js',
		'scripts/templates.js',
		'scripts/model.js',
		'scripts/view.js',
		'scripts/controller.js',
		'scripts/functions.js',
		'scripts/actions.js',
		'scripts/listeners.js',
		'scripts/init.js',
		'scripts/modules.js'
	],
	scriptModules: {
		root: 'scripts/modules/**/*.js',
		dest: 'scripts'
	},
	templates: {
		root: 'templates/index.jade'
	},
	watch: {
		scripts: ['scripts/**/*.js', '!scripts/modules.js'],
		styles: 'styles/**/*.scss',
		templates: 'templates/**/*.jade'
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
		.pipe(groupMQ())
		.pipe(gulp.dest(paths.distribution))
		.pipe(minifycss())
		.pipe(rename(function(path) {
			path.basename += '.min';
		}))
		.pipe(gulp.dest(paths.distribution));
});

gulp.task('scripts-modules', function() {
	return gulp.src(paths.scriptModules.root)
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(concat('modules.js'))
		.pipe(gulp.dest(paths.scriptModules.dest));
});

gulp.task('scripts', ['scripts-modules'], function() {
	return gulp.src(paths.scripts)
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(concat('app.js'))
		.pipe(concat.header('(function(win) {\n\'use strict\';\n\n'))
		.pipe(concat.footer('\n})(window);'))
		.pipe(gulp.dest(paths.distribution))
		.pipe(uglify({
			mangle: false,
			compress: false
		}))
		.pipe(rename('app.min.js'))
		.pipe(gulp.dest(paths.distribution));
});

gulp.task('templates', function() {
	return gulp.src(paths.templates.root)
		.pipe(jade({
			pretty: true
		}))
		.pipe(gulp.dest(paths.root));
});

gulp.task('default', ['styles', 'scripts', 'templates']);

gulp.task('dev', function() {
	gulp.watch(paths.watch.styles, ['styles']);
	gulp.watch(paths.watch.scripts, ['scripts']);
	gulp.watch(paths.watch.templates, ['templates']);
});
