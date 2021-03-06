(function (viz) {
    'use strict';

    const chartContainer = d3.select('.density-graphs');
    const margin = {
        'top': 150,
        'left': 75,
        'right': 400,
        'bottom': 100
    };
    if (window.innerWidth <= 1000) {
        margin['top'] = 120;
        margin['right'] = 325;
        margin['left'] = 50;
    }

    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;
    const overlap = 8;
    const multiple = window.innerWidth > 1250 ? 4 : 6;

    const svg = chartContainer.append('svg').attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

    //Filter for the outside glow1
    let filter = svg.append('defs').append('filter').attr('id', 'glow1'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '1.25').attr('result', 'coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const chartHolder = svg.append('g').attr('class', 'chartHolder')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const scaleScore = d3.scaleLinear().domain([0, 10]).range([0, width]);
    const scaleYears = d3.scalePoint().domain(viz.years).range([0, height]);
    const scaleDensity = d3.scaleLinear().domain([0, overlap / multiple]).range([0, -overlap * scaleYears.step()]);

    const area = d3.area().curve(d3.curveBasis)
        .x((d) => scaleScore(d[0]))
        .y0(0)
        .y1((d) => scaleDensity(d[1]));

    const line = area.lineY1();

    viz.initYears = function () {
        const allDensity = [];

        /* gaussian kernel function */
        for (const y of viz.years) {
            const scores = viz.data.data.filter(y).top(Infinity).map((d) => d['Score']);
            const densityFunc = ss.kernelDensityEstimation(scores);
            const densities = scaleScore.ticks(viz.densityAcc).map((d) => [d, densityFunc(d)]);
            const median = ss.median(scores);

            allDensity.push({
                'key': y,
                'density': densities,
                'median': median
            });
        }

        const makeAxis = function () {
            const fontSize = '1.4rem';
            const strokeWidth = 1;
            const strokeOpacity = .25;
            const fontWeight = 400;

            const xAxis = svg.append('g').attr('class', 'x-axis')
                .attr('transform', `translate(${margin.left}, ${margin.top + height})`);
            const xTicks = xAxis.selectAll('.x-tick').data(scaleScore.ticks())
                .enter().append('g').attr('class', 'x-tick')
                .call((g) => {
                    g.append('line').attr('stroke', viz.colors['text'])
                        .attr('stroke-opacity', strokeOpacity)
                        .attr('stroke-dasharray', '.5rem')
                        .attr('y1', 25).attr('y2', -height - margin.top / 1.5)
                        .attr('x1', scaleScore).attr('x2', scaleScore)
                        .style('pointer-events', 'none');
                    g.append('text').text((d) => d).attr('text-anchor', 'middle')
                        .style('font-size', fontSize).attr('fill', viz.colors['text'])
                        .style('font-weight', fontWeight)
                        .attr('x', scaleScore).attr('y', 50)
                        .attr('opacity', .75)
                        .style('pointer-events', 'none');
                });

            const yAxis = svg.append('g').attr('class', 'y-axis')
                .attr('transform', `translate(${margin.left}, ${margin.top})`);
            const yTicks = yAxis.selectAll('.y-tick').data(viz.years)
                .enter().append('g').attr('class', 'y-tick')
                .call((g) => {
                    g.append('line').attr('stroke', viz.colors['text'])
                        .attr('stroke-opacity', strokeOpacity)
                        .attr('x1', -25).attr('x2', width + 25)
                        .attr('y1', scaleYears).attr('y2', scaleYears)
                        .style('pointer-events', 'none');
                    g.append('text').text((d) => d)
                        .style('font-size', fontSize).attr('fill', viz.colors['text'])
                        .style('font-weight', fontWeight)
                        .attr('x', scaleScore(0.5)).attr('y', (d) => (scaleYears(d) - 5))
                        .attr('text-anchor', 'middle')
                        .attr('opacity', strokeOpacity * 2)
                        .style('pointer-events', 'none');
                });

            const length = {
                'start': -100,
                'end': -135
            };

            if (window.innerWidth <= 1250) {
                length['start'] = -90;
                length['end'] = -125;
            }

            if (window.innerWidth <= 1000) {
                length['start'] = -70;
                length['end'] = -95;
            }

            const explanation = svg.append('g')
                .attr('transform', `translate(${width + margin.left + 50}, ${height + margin.top})`)
                .call((g) => {
                    g.append('marker').attr('id', 'marker1').attr('markerHeight', 10).attr('markerWidth', 10).attr('refX', 6).attr('refY', 3).attr('orient', 'auto')
                        .append('path').attr('d', 'M0,0L9,3L0,6Z')
                        .attr('fill', viz.colors['text'])
                        .attr('fill-opacity', .75)
                        .style('pointer-events', 'none');
                    g.append('line').attr('marker-end', 'url(#marker1)').attr('x1', -4).attr('x2', -4)
                        .attr('y1', length['start']).attr('y2', length['end']).attr('stroke', viz.colors['text']).attr('stroke-width', strokeWidth)
                        .attr('fill-opacity', .75)
                        .style('pointer-events', 'none');
                    g.append('text')
                        .text('More common')
                        .style('font-size', fontSize).attr('fill', viz.colors['text'])
                        .style('font-weight', fontWeight)
                        .attr('fill-opacity', .75)
                        .attr('transform', `rotate(-90)`)
                        .style('pointer-events', 'none');
                });
        }();

        const makeTexts = function () {
            const strokeWidth = 1
            const strokeDashArray = '5,2,2,2';
            const fontTitle = '1.6rem';
            const fontAnnot = '1.2rem';
            const weightTitle = 400;
            const weightAnnot = 400;

            const annotMargin = {
                'top': 32,
                'height': 22.5
            };

            const coordinates = {
                'startX': scaleScore(5),
                'startY': scaleDensity(scaleDensity.domain()[0] + 0.2),
                'midX': scaleScore(6),
                'midY': -margin.top / 1.5,
                'endX': width + margin.right
            }

            if (window.innerWidth <= 1000) {
                coordinates['midY'] = -margin.top / 1.25;
            }

            const g = svg.append('g').attr('class', 'textWrapper')
                .attr('transform', `translate(${margin.left}, ${margin.top})`);

            const circle = g.append('circle')
                .attr('stroke', viz.colors['text']).attr('stroke-width', strokeWidth)
                .attr('r', 4).attr('cx', coordinates.startX)
                .attr('cy', coordinates.startY)
                .attr('fill', 'none');
            const lineToText1 = g.append('line')
                .attr('stroke', viz.colors['text']).attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray).attr('fill', 'none')
                .attr('x1', coordinates.startX).attr('x2', coordinates.midX)
                .attr('y1', coordinates.startY)
                .attr('y2', coordinates.midY);
            const lineToText2 = g.append('line')
                .attr('stroke', viz.colors['text']).attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray).attr('fill', 'none')
                .attr('x1', coordinates.midX).attr('x2', coordinates.endX)
                .attr('y1', coordinates.midY).attr('y2', coordinates.midY);

            const annotTitle = g.append('text')
                .text('Changes through the years')
                .attr('fill', viz.colors['emp'])
                .style('font-size', fontTitle)
                .style('font-weight', weightTitle)
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${coordinates.endX}, -75)`)
                .attr('fill-opacity', .85);

            const annotText = ['The density charts on the right visualizes for us,', 'that generally people feel more happy collectively.', 'Through the last 5 years, more countries', 'improved their Happiness Score, so there are', 'less people living in countries with lower scores.', 'The density moved from a score around 4-4.5 to over 5.5.'];
            const annot = g.append('text')
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${coordinates.endX}, -75)`)
                .selectAll('tspan')
                .data(annotText).enter().append('tspan')
                .text((d) => d)
                .style('font-size', fontAnnot)
                .style('font-weight', weightAnnot)
                .attr('x', 0)
                .attr('y', (d, i) => annotMargin.top + i * annotMargin.height)
                .attr('fill-opacity', .65);
        }();

        const makeLegend = function () {
            const fontWeight = 400;
            const fontSize = '1.1rem';
            const fillOpacity = .5;

            const coordinates = {
                'x': margin.left + width + margin.right,
                'y': margin.top + height
            }

            const legend = svg.append('g').attr('class', 'legendWrapper')
                .attr('transform', `translate(${coordinates.x}, ${coordinates.y})`)
                .attr('text-anchor', 'end')
                .call((g) => {
                    g.append('text').text('* Inner values represent median Happiness Scores')
                        .style('font-weight', fontWeight).style('font-size', fontSize)
                        .attr('fill', viz.colors['text'])
                        .attr('fill-opacity', fillOpacity);
                });
        }();

        const makeChart = function () {
            const chart = chartHolder.selectAll('g')
                .data(allDensity)
                .enter().append('g')
                .attr('transform', (d) => `translate(0,${scaleYears(d.key) + 1})`);
            chart.append('path').attr('fill', viz.colors['emp'])
                .attr('fill-opacity', .5)
                .attr('d', (d) => area(d.density))
                .on('mouseenter', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', 1);
                    d3.select(this.parentNode).select('text').transition().duration(viz.TRANS_DURATION).attr('opacity', 1);
                })
                .on('mouseleave', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', .25);
                    d3.select(this.parentNode).select('text').transition().duration(viz.TRANS_DURATION).attr('opacity', .25);
                });
            chart.append('path').attr('fill', 'none')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-opacity', .5)
                .attr('d', (d) => line(d.density))
                .style('filter', 'url(#glow1)');
            chart.append('text').text((d) => d3.format('.2f')(d['median']))
                .style('font-weight', 400).style('font-size', '3.2rem')
                .attr('text-anchor', 'middle')
                .attr('x', scaleScore(5.25))
                .attr('y', scaleDensity(scaleDensity.domain()[0] + 0.1))
                .attr('fill', viz.colors['text'])
                .attr('opacity', .25)
                .style('pointer-events', 'none')
                .style('filter', 'url(#glow1)');
        }();
    };
}(window.viz = window.viz || {}));