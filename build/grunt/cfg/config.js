'use strict';

module.exports = {
	js: {
		src: [
			'src/js/app/app.js',
			'src/js/app/**/*.js',
		],
		dist: 'src/js/app.js',
		background: {
			src: [
				'src/js/background/vendor/*.js',
				'src/js/background/background.js',
				'src/js/background/**/*.js',
			],
			dist: 'src/js/background.js',
		},
		components: {
			src: [
				'src/js/vendor/jquery-1.11.2.js',
				'src/js/vendor/*.js',
			],
			dist : 'src/js/components.js',
		},
	},
};