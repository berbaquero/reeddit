var gulp = require('gulp'),
	sass = require('gulp-ruby-sass'),
	minifycss = require('gulp-minify-css'),
	jshint = require('gulp-jshint'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	concat = require('gulp-concat-util'),
	prefix = require('gulp-autoprefixer'),
	groupMQ = require('gulp-group-css-media-queries'),
	jade = require('gulp-jade'),
	babel = require('gulp-babel');

var paths = {
	styles: 'styles/**/*.scss',
	scripts: [
		'scripts/modules/**/*.js',
		'scripts/init.js'
	],
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
	return sass('styles/', { lineNumbers: true, style: 'expanded' })
		.on('error', function (err) {
			console.error('Error', err.message);
		})
		.pipe(prefix({
            browsers: ['last 2 versions']
		}))
		.pipe(groupMQ())
		.pipe(gulp.dest(paths.distribution))
		.pipe(minifycss())
		.pipe(rename(function(path) {
			path.basename += '.min';
		}))
		.pipe(gulp.dest(paths.distribution));
});

gulp.task('scripts', function() {
	return gulp.src(paths.scripts)
		.pipe(jshint())
		.pipe(jshint.reporter('default'))
		.pipe(babel())
		.pipe(concat('app.js', {process: function(src) { return (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
		.pipe(concat.header('(function() {\n\'use strict\';\n'))
		.pipe(concat.footer('\n})();'))
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
