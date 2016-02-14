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
			var self = this;
			chrome.storage.local.get('data', function(storageData) {
				storageData = storageData.data;
				self.lastRecord = storageData ? storageData[storageData.length - 1] : null;
			});
			// var scheduler = later.parse.cron('*/5 * * * *');
			// later.setInterval(extension.recorder.record, scheduler);
		},
		record: function() {
			var recorder = this;
			var data = {
				date: (new Date).toISOString(),
				windowCount: extension.windowCount,
				tabCount: extension.tabCount,
			};
			// If this new record doesn't change windowCount or tabCount, then we ignore it.
			if (recorder.lastRecord) {
				var isSameWindowCount = recorder.lastRecord.windowCount === data.windowCount;
				var isSameTabCount = recorder.lastRecord.tabCount === data.tabCount;
				if (isSameWindowCount && isSameTabCount) {
					return;
				}
			}

			chrome.storage.local.get('data', function(storageData) {
				storageData = storageData.data;
				storageData.push(data);

				chrome.storage.local.set({ data: storageData }, function() {
					recorder.lastRecord = data;

					chrome.runtime.sendMessage({
						type: 'data.newData',
						data: data
					});
				});
			});
		},
	},
	upgrader: {
		run: function() {
			var self = extension.upgrader;
			self.upgradeFromLocalStorageToStorage();
		},
		upgradeFromLocalStorageToStorage: function() {
			if ( ! localStorage.data) {
				return;
			}

			console.log('Upgrading from local storage to storage');

			chrome.storage.local.set({ data: JSON.parse(localStorage.data), period: localStorage.period }, function() {
				delete localStorage.data;
			});
		},
	},
	init: function() {
		var self = extension;
		self.upgrader.run();
		self.listen.init();
		self.updateBadge();
		self.browserActions.init();
		self.recorder.init();
	}
};

document.addEventListener('DOMContentLoaded', function() {
	extension.init();
});