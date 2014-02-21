module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			dist: {
				src: ['src/js/globals.js', 'src/js/templates.js', 'src/js/model.js', 'src/js/view.js', 'src/js/controller.js', 'src/js/functions.js', 'src/js/actions.js', 'src/js/listeners.js', 'src/js/init.js'],
				dest: 'dist/reeddit.js'
			},
			options: {
				banner: '(function(win) {',
				footer: '})(window);'
			}
		},

		uglify: {
			options: {
				mangle: false
			},
			my_target: {
				files: {
					'dist/reeddit.js': ['dist/reeddit.js']
				}
			}
		},

		sass: {
			dist: {
				options: {
					style: 'compressed'
				},
				files: {
					'dist/reeddit.css': 'src/css/main.scss',
					'dist/desk.css':'src/css/desk.scss'
				}
			}
		},

		watch: {
			scripts: {
				files: ['src/js/*.js'],
				tasks: ['concat', 'uglify'],
				options: {
					spawn: false,
				}
			},
			styles: {
				files: ['src/css/*.scss'],
				tasks: ['sass'],
				options: {
					spawn: false,
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['concat', 'uglify', 'sass']);
	grunt.registerTask('dev', ['watch']);
};