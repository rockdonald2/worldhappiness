(function (viz) {
    'use strict';

    const chartContainer = d3.select('.regions-graph');
    const margin = {
        'top': 50,
        'left': 50,
        'right': 500,
        'bottom': 50
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const chartHolder = svg.append('g').attr('class', 'chartHolder')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const scaleRegions = d3.scaleBand().domain(viz.regions).range([0, height]).padding(1);
    const scaleScores = d3.scaleLinear().domain([2, 8]).range([0, width]);

    //Filter for the outside glow2
    let filter = svg.append('defs').append('filter').attr('id', 'glow2'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '1.5').attr('result', 'coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    viz.initRegions = function () {
        const data2015 = viz.data.data.filter(2015).top(Infinity);
        const data2019 = viz.data.data.filter(2019).top(Infinity);
        let data = [];

        for (const r of viz.regions) {
            const d1 = data2015.filter((d) => d['Region'] == r);
            const d2 = data2019.filter((d) => d['Region'] == r);
            data.push({
                'region': r,
                'value1': d3.mean(d1, (d) => d['Score']),
                'value2': d3.mean(d2, (d) => d['Score']),
                'ph': 'avg'
            });
            data.push({
                'region': r,
                'value1': d3.min(d1, (d) => d['Score']),
                'value2': d3.min(d2, (d) => d['Score']),
                'ph': 'min'
            });
        }

        const makeAxis = function () {
            const xAxis = svg.append('g').attr('class', 'x-axis')
                .attr('transform', `translate(${margin.left}, ${margin.top})`);

            const xTicks = xAxis.selectAll('.x-tick').data(d3.range(scaleScores.domain()[0], scaleScores.domain()[1] + 1))
                .enter().append('g').attr('class', 'x-tick')
                .call((g) => {
                    g.append('line').attr('stroke', viz.colors['text']).attr('stroke-opacity', .25)
                        .attr('stroke-dasharray', '.5rem')
                        .attr('x1', scaleScores).attr('x2', scaleScores)
                        .attr('y1', 0).attr('y2', height);

                    g.append('text').text((d) => d)
                        .attr('text-anchor', 'middle')
                        .attr('fill', viz.colors['text'])
                        .attr('opacity', .75)
                        .attr('x', scaleScores).attr('y', -20)
                        .style('font-weight', 400)
                        .style('font-size', '1.4rem');
                });
        }();

        const makeChart = function () {
            const lines = chartHolder.selectAll('line').data(data)
                .enter().append('line')
                .attr('x1', (d) => scaleScores(d['value1']))
                .attr('x2', (d) => scaleScores(d['value2']))
                .attr('y1', (d) => scaleRegions(d['region']))
                .attr('y2', (d) => scaleRegions(d['region']))
                .attr('stroke', viz.colors['text'])
                .attr('stroke-opacity', .25);

            const arrows = chartHolder.selectAll('.arrow')
                .data(data.filter((d) => Math.abs(d['value1'] - d['value2']) > 0.25))
                .enter().append('g')
                .call((g) => {
                    g.append('marker').attr('id', 'marker2').attr('markerHeight', 10).attr('markerWidth', 10).attr('refX', 0).attr('refY', 3).attr('orient', 'auto')
                        .append('path').attr('d', 'M0,0L9,3L0,6Z')
                        .attr('fill', viz.colors['text'])
                        .attr('fill-opacity', .3)
                        .style('pointer-events', 'none');

                    g.append('line')
                        .attr('stroke', viz.colors['text']).attr('stroke-opacity', .3)
                        .attr('x1', (d) => d['value1'] < d['value2'] ? scaleScores(d['value1']) + 10 : scaleScores(d['value1']) - 10)
                        .attr('x2', (d) => d['value1'] < d['value2'] ? scaleScores(d['value2']) - 15 : scaleScores(d['value2']) + 15)
                        .attr('y1', (d) => scaleRegions(d['region']) - 10)
                        .attr('y2', (d) => scaleRegions(d['region']) - 10)
                        .attr('marker-end', 'url(#marker2)');
                });

            const circles1 = chartHolder.selectAll('.circle1').data(data)
                .enter().append('circle').attr('class', 'circle1')
                .attr('r', (d) => {
                    if (d['ph'] == 'avg') return 9;
                    else return 5;
                })
                .attr('cx', (d) => scaleScores(d['value1']))
                .attr('cy', (d) => scaleRegions(d['region']))
                .attr('fill', (d) => {
                    if (d['ph'] == 'avg') return 'none';
                    else return viz.colors['emp'];
                })
                .attr('stroke', (d) => {
                    if (d['ph'] == 'avg') return viz.colors['emp'];
                    else return 'none';
                })
                .style('filter', 'url(#glow2)');

            const circles2 = chartHolder.selectAll('.circle2').data(data)
                .enter().append('circle').attr('class', 'circle2')
                .attr('r', (d) => {
                    if (d['ph'] == 'avg') return 9;
                    else return 5;
                })
                .attr('cx', (d) => scaleScores(d['value2']))
                .attr('cy', (d) => scaleRegions(d['region']))
                .attr('fill', (d) => {
                    if (d['ph'] == 'avg') return 'none';
                    else return viz.colors['emp'];
                })
                .attr('stroke', (d) => {
                    if (d['ph'] == 'avg') return viz.colors['emp'];
                    else return 'none';
                })
                .style('filter', 'url(#glow2)');

            const circles1Inner = chartHolder.selectAll('.circle1Inner').data(data.filter((d) => d['ph'] == 'avg'))
                .enter().append('circle').attr('class', 'circle1Inner')
                .attr('r', 2)
                .attr('cx', (d) => scaleScores(d['value1']))
                .attr('cy', (d) => scaleRegions(d['region']))
                .attr('fill', viz.colors['emp'])
                .style('filter', 'url(#glow2)');
            const circles2Inner = chartHolder.selectAll('.circle2Inner').data(data.filter((d) => d['ph'] == 'avg'))
                .enter().append('circle').attr('class', 'circle2Inner')
                .attr('r', 2)
                .attr('cx', (d) => scaleScores(d['value2']))
                .attr('cy', (d) => scaleRegions(d['region']))
                .attr('fill', viz.colors['emp'])
                .style('filter', 'url(#glow2)');

            const maxScores = [];
            for (const r of viz.regions) {
                const d = data.filter((d) => d['region'] == r);
                maxScores.push({
                    'region': r,
                    'value': d3.max(d, (t) => t['value1'] > t['value2'] ? t['value1'] : t['value2'])
                });
            }

            const labels = chartHolder.selectAll('.label').data(maxScores)
                .enter().append('text').attr('class', 'label').text((d) => d['region'])
                .attr('x', (d) => scaleScores(d['value']) + 20)
                .attr('y', (d) => scaleRegions(d['region']))
                .attr('fill', viz.colors['text'])
                .attr('fill-opacity', .75)
                .attr('dy', '.32em')
                .style('font-size', '1.2rem')
                .style('font-weight', 300);
        }();

        const makeTexts = function () {
            const strokeWidth = 1
            const strokeDashArray = '5,2,2,2';
            const fontTitle = '1.6rem';
            const fontAnnot = '1.2rem';
            const weightTitle = 400;
            const weightAnnot = 300;

            const annotMargin = {
                'top': 32,
                'height': 22.5
            };

            const g = svg.append('g').attr('class', 'textWrapper')
                .attr('transform', `translate(${margin.left}, ${margin.top})`);

            const circle = g.append('circle')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('r', 4).attr('cx', scaleScores(4.518)).attr('cy', scaleRegions('Latin America and Caribbean'))
                .attr('fill', 'none');
            const lineToText1 = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', scaleScores(4.518))
                .attr('x2', scaleScores(5))
                .attr('y1', scaleRegions('Latin America and Caribbean'))
                .attr('y2', scaleRegions('Latin America and Caribbean') - 25);
            const lineToText2 = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', scaleScores(5))
                .attr('x2', width + margin.right * 0.96)
                .attr('y1', scaleRegions('Latin America and Caribbean') - 25)
                .attr('y2', scaleRegions('Latin America and Caribbean') - 25);

            const annotTitle = g.append('text')
                .text('Huge decline in Latin America')
                .attr('fill', viz.colors['emp'])
                .style('font-size', fontTitle)
                .style('font-weight', weightTitle)
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${width + margin.right * 0.96}, ${scaleRegions('Latin America and Caribbean')})`);

            const annotText = ['Among all the regions, the Caribbean', 'region showed the largest decline through', 'recent years. Latin American people tend', 'to get more unhappy each year.', 'On the other hand, regions like Oceania', 'almost showed no change.', 'The same can be said about the North American region too.'];
            const annot = g.append('text')
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${width + margin.right * 0.96}, ${scaleRegions('Latin America and Caribbean')})`)
                .selectAll('tspan')
                .data(annotText).enter().append('tspan')
                .text((d) => d)
                .style('font-size', fontAnnot)
                .style('font-weight', weightAnnot)
                .attr('x', 0)
                .attr('y', (d, i) => annotMargin.top + i * annotMargin.height);
        }();

        const makeLegend = function () {
            const legend = svg.append('g').attr('class', 'legendWrapper')
                .attr('transform', `translate(${margin.left + width + margin.right * 0.59}, ${margin.top})`);

            legend.append('circle').attr('cx', 0).attr('cy', 25)
                .attr('r', 5).attr('fill', viz.colors['emp']);
            legend.append('text').text('Min. happiness score (2015-2019)')
                .attr('font-size', '1.2rem').attr('fill', viz.colors['text'])
                .attr('fill-opacity', .85)
                .attr('x', 20)
                .attr('y', 25)
                .attr('dy', '.3em');

            legend.append('circle').attr('cx', 0).attr('cy', 50)
                .attr('r', 9).attr('fill', 'none').attr('stroke', viz.colors['emp']);
            legend.append('circle').attr('cx', 0).attr('cy', 50)
                .attr('r', 2).attr('fill', viz.colors['emp']);
            legend.append('text').text('Avg. happiness score (2015-2019)')
                .attr('font-size', '1.2rem').attr('fill', viz.colors['text'])
                .attr('fill-opacity', .85)
                .attr('x', 20)
                .attr('y', 50)
                .attr('dy', '.3em');

            legend.append('line').attr('stroke', viz.colors['text']).attr('stroke-opacity', .5)
                .attr('x1', -10).attr('x2', 5)
                .attr('y1', 75).attr('y2', 75)
                .attr('marker-end', 'url(#marker2)');
            legend.append('text').text('Direction of change')
                .attr('font-size', '1.2rem').attr('fill', viz.colors['text'])
                .attr('fill-opacity', .85)
                .attr('x', 20)
                .attr('y', 75)
                .attr('dy', '.3em');
        }();
    };
}(window.viz = window.viz || {}));