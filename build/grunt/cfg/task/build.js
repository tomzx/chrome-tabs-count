'use strict';

var config = require('../config.js');

module.exports = {
	uglify: {
		debug_app: {
			files: {
				'src/js/app.js': config.js.src,
			},
			options: {
				mangle: false,
				compress: false,
				preserveComments: 'all',
				beautify: true,
				sourceMap: true,
			}
		},
		debug_background: {
			files: {
				'src/js/background.js': config.js.background.src,
			},
			options: {
				mangle: false,
				compress: false,
				preserveComments: 'all',
				beautify: true,
				sourceMap: true,
			}
		},
		debug_components: {
			files: {
				'src/js/components.js': config.js.components.src,
			},
			options: {
				mangle: false,
				compress: false,
				preserveComments: 'all',
				beautify: true,
				sourceMap: true,
			}
		},
		release: {
			files: {
				'src/js/app.js': config.js.src,
				'src/js/background.js': config.js.background.src,
				'src/js/components.js': config.js.components.src,
			},
			options: {
				report: 'min',
				preserveComments: 'some',
			}
		},
	},

	crx: {
		release: {
			src: [
				'src/**/*',
				'!src/js/*.map',
				'!src/js/**/*.js',
			],
			dest: 'dist/crx/',
			options: {
				privateKey: './build/key.pem',
			},
		},
	},
};