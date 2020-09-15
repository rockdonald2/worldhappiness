(function (viz) {
    'use strict';

    const chartContainer = d3.select('.radial-graph');
    const margin = {
        'top': 100,
        'left': 100,
        'right': 100,
        'bottom': 100,
        'outer': 150
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;
    const innerRadius = width / 15;
    const outerRadius = Math.min(width, height) / 2 - margin.outer;

    const svg = chartContainer.append('svg').attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

    const chartHolder = svg.append('g').attr('transform', 'translate(' + (margin.left) + ', ' + (margin.top) + ')');
    const g = chartHolder.append('g').attr('transform', 'translate(' + (width / 2) + ', ' + (height / 2) + ')');

    const scaleScore = d3.scaleLinear().domain([0, 10]).range([0, 2 * Math.PI]);
    const scaleDensity = d3.scaleLinear().domain([1.1719157883579663e-12, 3.998704138881966e-8]).range([innerRadius, outerRadius]);

    const line = d3.lineRadial().curve(d3.curveLinearClosed).angle((d) => scaleScore(d[0]));
    const area = d3.areaRadial().curve(d3.curveLinearClosed).angle((d) => scaleDensity(d[1]));

    viz.initRadial = function () {
        const allDensity = [];

        /* gaussian kernel function */
        for (const y of viz.years) {
            const scores = viz.data.data.filter(y).top(Infinity).map((d) => d['Score']);
            const densityFunc = ss.kernelDensityEstimation(scores);
            const densities = scaleScore.ticks(viz.densityAcc).map((d) => [d, densityFunc(d)]);

            allDensity.push({
                key: y,
                density: densities
            });
        }
    };
}(window.viz = window.viz || {}));