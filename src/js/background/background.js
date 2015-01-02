var extension = {
	tabCount: 0,
	windowCount: 0,
	updateBadge: function() {
		chrome.windows.getAll({ populate: true }, function(windows) {
			var count = 0;
			for (var w = 0; w < windows.length; w++) {
				count += windows[w].tabs.length;
			}
			extension.tabCount = count;
			extension.windowCount = windows.length;
			var text = (count === 0 ? '' : count.toString());
			chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 100] });
			chrome.browserAction.setBadgeText({ text: text });
			extension.recorder.record();
		});
	},
	listen: {
		init: function() {
			chrome.tabs.onAttached.addListener(function(tabId) {
				extension.updateBadge();
			});
			chrome.tabs.onCreated.addListener(function(tab) {
				extension.updateBadge();
			});
			chrome.tabs.onUpdated.addListener(function(tab) {
				extension.updateBadge();
			});
			chrome.tabs.onRemoved.addListener(function(tabId) {
				extension.updateBadge();
			});
			chrome.tabs.onDetached.addListener(function(tabId) {
				extension.updateBadge();
			});
		}
	},
	browserActions: {
		init: function() {
			chrome.browserAction.setPopup({ popup: '/views/main.html' });
		},
	},
	recorder: {
		init: function() {
			// var scheduler = later.parse.cron('*/5 * * * *');
			// later.setInterval(extension.recorder.record, scheduler);
		},
		record: function() {
			var data = {
				date: new Date,
				windowCount: extension.windowCount,
				tabCount: extension.tabCount,
			};
			console.log(data);

			var currentData = localStorage.data ? JSON.parse(localStorage.data) : [];
			currentData.push(data);
			localStorage.data = JSON.stringify(currentData);
		},
	},
	init: function() {
		extension.listen.init();
		extension.updateBadge();
		extension.browserActions.init();
		extension.recorder.init();
	}
};

document.addEventListener('DOMContentLoaded', function() {
	extension.init();
});