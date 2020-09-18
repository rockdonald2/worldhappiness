(function (viz) {
    'use strict';

    d3.queue()
        .defer(d3.json, 'static/data/merged.json')
        .defer(d3.json, 'static/data/worldMap.json')
        .await(ready);

    function ready(error, mergedData, worldMap) {
        /* if any error occurs, break the code */
        if (error) {
            return console.warn(error);
        }

        /* we save our data to the storage */
        viz.makeFilterAndDimension(mergedData);
        viz.data.worldMap = worldMap;

        /* we initialize the visualization */
        viz.init()
        setTimeout(() => {
            d3.select('body.hidden').attr('class', '');
            d3.select('body>.overlay').attr('class', 'overlay');
        }, 1000);
    }
}(window.viz = window.viz || {}));