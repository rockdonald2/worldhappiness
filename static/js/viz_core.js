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
        'text': 'rgba(76, 76, 76, 1)'
    };

    viz.densityAcc = 100;

    /* length of the transitions in ms */
    viz.TRANS_DURATION = 750;

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
        viz.initRadial();
    };
}(window.viz = window.viz || {}))