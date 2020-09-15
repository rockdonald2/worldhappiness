(function (viz) {
    'use strict';

    d3.queue()
        .defer(d3.json, 'static/data/merged.json')
        .await(ready);

    function ready(error, mergedData) {
        /* if any error occurs, break the code */
        if (error) {
            return console.warn(error);
        }

        /* we save our data to the storage */
        viz.makeFilterAndDimension(mergedData);

        /* we initialize the visualization */
        viz.init()
        setTimeout(() => {
            /* we will clear our overlay after the timeout ends */
        }, viz.TRANS_DURATION);
    }
}(window.viz = window.viz || {}));