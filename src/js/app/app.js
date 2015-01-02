var series = null;

$(function () {
	var data = JSON.parse(localStorage.data);

	Highcharts.setOptions({
		global: {
			timezoneOffset: (new Date()).getTimezoneOffset(),
		}
	});

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
			name: 'Tabs',
			data: _.map(data, function(datum) {
				return [Date.parse(datum.date), datum.tabCount];
			}),
		},
		{
			name: 'Windows',
			data: _.map(data, function(datum) {
				return [Date.parse(datum.date), datum.windowCount];
			}),
			yAxis: 1,
		}],
	});
});

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