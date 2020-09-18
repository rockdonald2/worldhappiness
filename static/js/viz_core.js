(function (viz) {
    'use strict';

    /* storage */
    viz.data = {};

    viz.regions = ['Australia and New Zealand',
        'Central and Eastern Europe',
        'Eastern Asia',
        'Latin America and Caribbean',
        'Middle East and Northern Africa',
        'North America',
        'Southeastern Asia',
        'Southern Asia',
        'Sub-Saharan Africa',
        'Western Europe'
    ];
    viz.years = d3.range(2015, 2020);
    viz.colors = {
        'text': 'rgba(18, 18, 18, 1)',
        'emp': ' rgb(81, 152, 114)',
    };

    viz.densityAcc = 100;

    /* length of the transitions in ms */
    viz.TRANS_DURATION = 250;

    viz.multivalue_filter = function (values) {
        return function (v) {
            return values.indexOf(v) !== -1;
        };
    }

    viz.makeFilterAndDimension = function (data) {
        viz.filter = crossfilter(data);

        viz.data.data = viz.filter.dimension(function (o) {
            return o.Year;
        });
    }

    viz.init = function () {
        viz.initYears();
        viz.initSpider();
        viz.initRegions();
        viz.initMap();
    };
}(window.viz = window.viz || {}))