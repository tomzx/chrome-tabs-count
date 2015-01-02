var extension = {
	tabCount: 0,
	windowCount: 0,
	updateBadge: function() {
		chrome.windows.getAll({ populate: true }, function(windows) {
			var tabCount = 0;
			var windowCount = 0;
			for (var w = 0; w < windows.length; w++) {
				windowTabCount = windows[w].tabs.length;
				tabCount += windowTabCount;
				windowCount += windowTabCount > 0 ? 1 : 0;
			}
			extension.tabCount = tabCount;
			extension.windowCount = windowCount;
			var text = tabCount === 0 ? '' : tabCount.toString();
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
		lastRecord: null,
		init: function() {
			var currentData = localStorage.data ? JSON.parse(localStorage.data) : [];
			this.lastRecord = currentData ? currentData[currentData.length - 1] : null;
			// var scheduler = later.parse.cron('*/5 * * * *');
			// later.setInterval(extension.recorder.record, scheduler);
		},
		record: function() {

			var data = {
				date: (new Date).toISOString(),
				windowCount: extension.windowCount,
				tabCount: extension.tabCount,
			};
			// If this new record doesn't change windowCount or tabCount, then we ignore it.
			if (this.lastRecord && this.lastRecord.windowCount === data.windowCount && this.lastRecord.tabCount === data.tabCount) {
				return;
			}

			var currentData = localStorage.data ? JSON.parse(localStorage.data) : [];
			currentData.push(data);
			localStorage.data = JSON.stringify(currentData);

			this.lastRecord = data;

			chrome.runtime.sendMessage({
				type: 'data.newData',
				data: data
			});
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