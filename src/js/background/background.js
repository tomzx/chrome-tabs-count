var extension = {
	tabCount: 0,
	windowCount: 0,
	updateBadge: function(callback) {
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
			if (callback) {
				callback();
			}
		});
	},
	record: function() {
		extension.updateBadge(function() {
			extension.recorder.record();
		});
	},
	listen: {
		init: function() {
			chrome.tabs.onAttached.addListener(function(tabId) {
				extension.record();
			});
			chrome.tabs.onCreated.addListener(function(tab) {
				extension.record();
			});
			chrome.tabs.onUpdated.addListener(function(tab) {
				extension.record();
			});
			chrome.tabs.onRemoved.addListener(function(tabId) {
				extension.record();
			});
			chrome.tabs.onDetached.addListener(function(tabId) {
				extension.record();
			});
		}
	},
	browserActions: {
		init: function() {
			chrome.browserAction.setPopup({ popup: '/views/main.html' });
		},
	},
	getData: function(callback) {
		extension.recorder.get(callback);
	},
	recorder: {
		recordsToWrite: [],
		lastRecord: null,
		writeTimer: null,
		init: function() {
			var self = this;
			chrome.storage.local.get('data', function(storageData) {
				storageData = storageData.data;
				self.lastRecord = storageData ? storageData[storageData.length - 1] : null;
			});
		},
		record: function() {
			var self = this;
			var data = {
				date: (new Date).toISOString(),
				windowCount: extension.windowCount,
				tabCount: extension.tabCount,
			};
			// If this new record doesn't change windowCount or tabCount, then we ignore it.
			if (self.lastRecord) {
				var isSameWindowCount = self.lastRecord.windowCount === data.windowCount;
				var isSameTabCount = self.lastRecord.tabCount === data.tabCount;
				if (isSameWindowCount && isSameTabCount) {
					return;
				}
			}

			// If a write timer is already define, we want to destroy it and then create a new one (reset the timeout)
			if (self.writeTimer) {
				clearTimeout(self.writeTimer);
			}
			self.writeTimer = setTimeout(function() {
				self.write();
			}, 5000);

			self.recordsToWrite.push(data);
			self.lastRecord = data;

			chrome.runtime.sendMessage({
				type: 'data.newData',
				data: data
			});
		},
		write: function() {
			var self = this;
			self.writeTimer = null;
			chrome.storage.local.get('data', function(storageData) {
				storageData = storageData.data || [];
				var recordCount = self.recordsToWrite.length;
				storageData = storageData.concat(self.recordsToWrite);
				self.recordsToWrite = [];

				chrome.storage.local.set({ data: storageData }, function() {
					console.log('Wrote ' + recordCount + ' record(s) to local storage @ ' + (new Date));
				});
			});
		},
		get: function(callback) {
			var self = this;
			chrome.storage.local.get(null, function(storageData) {
				storageData.data = storageData.data || [];
				// Merge unwritten data with current stored data
				storageData.data = storageData.data.concat(self.recordsToWrite);
				callback(storageData);
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