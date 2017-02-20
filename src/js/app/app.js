var VERSION = 'v0.3.0';

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
						onExtremesUpdated(this.chart, persistentData, event);
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
				softMin: 0,
			}, {
				title: {
					text: 'Window Count',
					style: {
						color: Highcharts.getOptions().colors[1]
					}
				},
				softMin: 0,
				opposite: true,
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

		onExtremesUpdated(chart, persistentData, extremes);

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

var entryInRange = function(data, min, max) {
	if (min === null && max === null) {
		return data;
	} else if (min === null) {
		return _.filter(data, function(datum) {
			return Date.parse(datum.date) <= max;
		});
	} else if (max === null) {
		return _.filter(data, function(datum) {
			return Date.parse(datum.date) >= min;
		});
	} else {
		return _.filter(data, function(datum) {
			var date = Date.parse(datum.date);
			return date >= min && date <= max;
		});
	}
};

var entryCountInRange = function(data, min, max) {
	return entryInRange(data, min, max).length;
};

var onExtremesUpdated = function(chart, data, extremes) {
	var entriesInRange = entryInRange(data, extremes.min, extremes.max);
	updateChartTitle(chart, entriesInRange.length);
	updateChartMinMaxPlotLines(chart, entriesInRange);
};

var updateChartTitle = function(chart, eventCount) {
	chart.setTitle({ text: 'Tab Count ('+eventCount+' events)' });
};

var updateChartMinMaxPlotLines = function(chart, data) {
	var tabCounts = _.map(data, 'tabCount');
	var windowCounts = _.map(data, 'windowCount');
	var tabCountMin = _.min(tabCounts);
	var tabCountMax = _.max(tabCounts);
	var windowCountMin = _.min(windowCounts);
	var windowCountMax = _.max(windowCounts);

	chart.yAxis[0].removePlotLine('plot-line-tab-count-min');
	chart.yAxis[0].removePlotLine('plot-line-tab-count-max');
	chart.yAxis[1].removePlotLine('plot-line-window-count-min');
	chart.yAxis[1].removePlotLine('plot-line-window-count-max');

	chart.yAxis[0].addPlotLine({
		id: 'plot-line-tab-count-min',
		value: tabCountMin,
		dashStyle: 'shortdot',
		color: Highcharts.getOptions().colors[0],
		width: 2,
	});
	chart.yAxis[0].addPlotLine({
		id: 'plot-line-tab-count-max',
		value: tabCountMax,
		dashStyle: 'shortdot',
		color: Highcharts.getOptions().colors[0],
		width: 2,
	});

	chart.yAxis[1].addPlotLine({
		id: 'plot-line-window-count-min',
		value: windowCountMin,
		dashStyle: 'shortdot',
		color: Highcharts.getOptions().colors[1],
		width: 2,
	});
	chart.yAxis[1].addPlotLine({
		id: 'plot-line-window-count-max',
		value: windowCountMax,
		dashStyle: 'shortdot',
		color: Highcharts.getOptions().colors[1],
		width: 2,
	});
};

var addPoint = function(chart, newPoint) {
	persistentData.push(newPoint);
	var date = Date.parse(newPoint.date);
	chart.series[1].addPoint([date, newPoint.tabCount], false); // Skip redraw
	chart.series[0].addPoint([date, newPoint.windowCount], true); // Do redraw
	onExtremesUpdated(chart, persistentData, chart.xAxis[0].getExtremes());
};

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (request.type === 'data.newData') {
		addPoint(chart, request.data);
	}
});