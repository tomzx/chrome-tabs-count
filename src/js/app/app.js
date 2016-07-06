var VERSION = 'v0.2.0';

var backgroundPage = chrome.extension.getBackgroundPage();
var persistentData = [];
var period = null;
var chart = null;

backgroundPage.extension.getData(function(data) {
	persistentData = data.data;
	period = data.period;

	console.log('Persistent data loaded.');
	$(function () {
		console.log('DOM ready.');
		$('[data-toggle="tooltip"]').tooltip();

		$('.version').text('('+VERSION+')');

		Highcharts.setOptions({
			global: {
				timezoneOffset: (new Date()).getTimezoneOffset(),
			}
		});

		var extremes = initialChartExtremes(getCurrentPeriod());
		$('#graph').highcharts({
			chart: {
				zoomType: 'x',
				events: {
					load: function() {
						series = this.series;
					},
				},
			},
			title: {
				text: 'Tab Count'
			},
			xAxis: {
				type: 'datetime',
				min: extremes.min,
				events: {
					afterSetExtremes: function(event) {
						updateChartTitle(this.chart, persistentData, event);
					},
				},
			},
			yAxis: [{
				title: {
					text: 'Tab Count',
					style: {
						color: Highcharts.getOptions().colors[0]
					}
				},
				min: 0,
			}, {
				title: {
					text: 'Window Count',
					style: {
						color: Highcharts.getOptions().colors[1]
					}
				},
				opposite: true,
				min: 0,
			}],
			legend: {
				enabled: false,
			},
			series: [{
				index: 1,
				name: 'Tabs',
				data: _.map(persistentData, function(datum) {
					return [Date.parse(datum.date), datum.tabCount];
				}),
			},
			{
				index: 0,
				name: 'Windows',
				data: _.map(persistentData, function(datum) {
					return [Date.parse(datum.date), datum.windowCount];
				}),
				yAxis: 1,
			}],
		});
		chart = $('#graph').highcharts();

		updateChartTitle(chart, persistentData, extremes);

		// Period picker
		{
			var labels = _.keys(periods);

			var activePeriod = getCurrentPeriod();
			var activePeriodValue = _.indexOf(labels, activePeriod);

			$('#period-picker').slider({
				min: 0,
				max: labels.length - 1,
				value: activePeriodValue,
			})
			.slider('pips', {
				rest: 'label',
				labels: labels,
			})
			.on('slidechange', function(e, ui) {
				var key = labels[ui.value];
				var extremes = chartExtremes(key, chart);
				chrome.storage.local.set({ period: key});
				chart.xAxis[0].setExtremes(extremes.min, null);
			});
		}
	});
});

var periods = {
	'6h': 6*60*60,
	'12h': 12*60*60,
	'1d': 24*60*60,
	'7d': 7*24*60*60,
	'14d': 14*24*60*60,
	'30d': 30*24*60*60,
	'3m': 3*30*24*60*60,
	'6m': 6*30*24*60*60,
	'all': null,
};

var getCurrentPeriod = function() {
	return period || 'all';
};

var initialChartExtremes = function(key) {
	var extremes = {
		min: null,
		max: null,
	};
	if (key === 'all') { // Show all
		extremes.min = null;
		extremes.max = null;
	} else { // Show specified range
		var now = (new Date()).getTime();
		var period = periods[key]*1000;
		extremes.min = now - period;
		extremes.max = now;
	}
	return extremes;
};

var chartExtremes = function(key, chart) {
	if (key === 'all') {
		var extremes = chart.xAxis[0].getExtremes();
		return {
			min: extremes.dataMin,
			max: extremes.dataMax,
		};
	} else {
		return initialChartExtremes(key);
	}
};

var entryCountInRange = function(data, min, max) {
	if (min === null && max === null) {
		return data.length;
	} else if (min === null) {
		return _.filter(data, function(datum) {
			return Date.parse(datum.date) <= max;
		}).length;
	} else if (max === null) {
		return _.filter(data, function(datum) {
			return Date.parse(datum.date) >= min;
		}).length;
	} else {
		return _.filter(data, function(datum) {
			var date = Date.parse(datum.date);
			return date >= min && date <= max;
		}).length;
	}
};

var updateChartTitle = function(chart, data, extremes) {
	chart.setTitle({ text: 'Tab Count ('+entryCountInRange(data, extremes.min, extremes.max)+' events)' });
};

var addPoint = function(chart, newPoint) {
	persistentData.push(newPoint);
	var date = Date.parse(newPoint.date);
	chart.series[1].addPoint([date, newPoint.tabCount], false); // Skip redraw
	chart.series[0].addPoint([date, newPoint.windowCount], true); // Do redraw
	updateChartTitle(chart, persistentData, chart.xAxis[0].getExtremes());
};

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (request.type === 'data.newData') {
		addPoint(chart, request.data);
	}
});