$(function () {
	var data = JSON.parse(localStorage.data);

	Highcharts.setOptions({
		global: {
			timezoneOffset: (new Date()).getTimezoneOffset(),
		}
	});

	$('#graph').highcharts({
		chart: {
			zoomType: 'x'
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