var VERSION = 'v0.0.1';

var series = null;

$(function () {
	$('[data-toggle="tooltip"]').tooltip();

	$('.version').text('('+VERSION+')');

	var data = JSON.parse(localStorage.data);

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
			max: extremes.max,
		},
		yAxis: [{
			title: {
				text: 'Tab Count',
				style: {
					color: Highcharts.getOptions().colors[0]
				}
			}
		}, {
			title: {
				text: 'Window Count',
				style: {
					color: Highcharts.getOptions().colors[1]
				}
			},
			opposite: true
		}],
		legend: {
			enabled: false,
		},
		series: [{
			index: 1,
			name: 'Tabs',
			data: _.map(data, function(datum) {
				return [Date.parse(datum.date), datum.tabCount];
			}),
		},
		{
			index: 0,
			name: 'Windows',
			data: _.map(data, function(datum) {
				return [Date.parse(datum.date), datum.windowCount];
			}),
			yAxis: 1,
		}],
	});

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
			var chart = $('#graph').highcharts();
			var extremes = chartExtremes(key, chart);
			localStorage.period = key;
			chart.xAxis[0].setExtremes(extremes.min, extremes.max);
		});
	}
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
	return localStorage.period || 'all';
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

var addPoint = function(data) {
	var date = Date.parse(data.date);
	series[0].addPoint([date, data.tabCount], false); // Skip redraw
	series[1].addPoint([date, data.windowCount], true); // Do redraw
};

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (request.type === 'data.newData') {
		addPoint(request.data);
	}
});