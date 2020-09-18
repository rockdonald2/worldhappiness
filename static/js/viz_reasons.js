(function (viz) {
    'use strict';

    const chartContainer = d3.select('.spider-graph');
    const margin = {
        'top': 75,
        'left': 75,
        'right': 75,
        'bottom': 75
    };
    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    const cols = ['Freedom to make life choices', 'GDP per capita', 'Generosity', 'Life expectancy', 'Perceptions of corruption', 'Social support'];

    const svg = chartContainer.append('svg').attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

    //Filter for the outside glow3
    let filter = svg.append('defs').append('filter').attr('id', 'glow3'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '1.75').attr('result', 'coloredBlur'),
        feMerge = filter.append('feMerge'),
        feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
        feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const chartHolder = svg.append('g').attr('class', 'chartHolder')
        .attr('transform', `translate(${margin.left + width / 3}, ${margin.top + height / 2})`);

    const radius = Math.min(width / 2, height / 2);
    const scaleRadius = d3.scaleLinear().range([0, radius]).domain([0, 1]);
    const levels = 5; // for the axis
    const angleSlice = (Math.PI * 2) / cols.length;
    const radarLine = d3.radialLine().curve(d3.curveCardinalClosed).radius((d) => scaleRadius(d.value))
        .angle((d, i) => i * angleSlice);

    const tooltip = chartContainer.select('.tooltip');

    viz.initSpider = function () {
        const data = viz.data.data.filter(2019).top(Infinity);
        const scores = data.map((d) => d['Score']);
        const corrs = [];

        for (const c of cols) {
            const currentFactor = data.map((d) => d[c]);
            const corr = ss.sampleCorrelation(scores, currentFactor);
            corrs.push({
                'factor': c,
                'value': corr
            });
        }

        const makeAxis = function () {
            const fontSize = '1.4rem';

            const axisGrid = chartHolder.append('g').attr('class', 'axisWrapper')
                .call((g) => {
                    g.selectAll('.levels')
                        .data(d3.range(1, levels + 1).reverse())
                        .enter().append('circle')
                        .attr('class', 'gridCircle')
                        .attr('r', (d, i) => radius / levels * d)
                        .attr('fill', 'none')
                        .attr('stroke', viz.colors['text'])
                        .attr('stroke-opacity', .25)
                        .attr('stroke-dasharray', '.5rem')
                        .style('pointer-events', 'none')
                        .style('filter', 'url(#glow3)');

                    g.selectAll('.axisLabel')
                        .data(d3.range(1, levels + 1).reverse())
                        .enter().append('text')
                        .attr('class', 'axisLabel')
                        .attr('x', 0)
                        .attr('y', (d) => -d * radius / levels)
                        .attr('dy', '-.2em')
                        .style('font-size', fontSize)
                        .attr('fill', viz.colors['text'])
                        .attr('opacity', .75)
                        .attr('text-anchor', 'middle')
                        .text((d, i) => d / 5)
                        .style('pointer-events', 'none');
                });

            const axis = axisGrid.selectAll('.axis')
                .data(cols).enter().append('g')
                .attr('class', 'axis')
                .call((g) => {
                    g.append('line')
                        .attr('x1', 0).attr('x2', (d, i) => scaleRadius(1 * 1.1) * Math.cos(angleSlice * i - (Math.PI / 2)))
                        .attr('y1', 0).attr('y2', (d, i) => scaleRadius(1 * 1.1) * Math.sin(angleSlice * i - (Math.PI / 2)))
                        .attr('class', 'line')
                        .attr('stroke', viz.colors['text'])
                        .attr('stroke-width', '1px')
                        .attr('stroke-opacity', .25)
                        .attr('stroke-dasharray', '.5rem')
                        .style('pointer-events', 'none')
                        .style('filter', 'url(#glow3)');

                    g.append('text')
                        .attr('class', 'legend')
                        .attr('font-size', fontSize)
                        .attr('text-anchor', 'middle')
                        .attr('fill', viz.colors['text'])
                        .attr('opacity', .75)
                        .attr('dy', '.35em')
                        .attr('x', (d, i) => scaleRadius(1 * 1.25) * Math.cos(angleSlice * i - (Math.PI / 2)))
                        .attr('y', (d, i) => scaleRadius(1 * 1.25) * Math.sin(angleSlice * i - (Math.PI / 2)))
                        .text((d) => d)
                        .style('pointer-events', 'none');
                });
        }();

        const makeChart = function () {
            const blobWrapper = chartHolder.selectAll('.radarWrapper')
                .data([corrs]).enter().append('g').attr('class', 'radarWrapper');

            blobWrapper.append('path').attr('class', 'radarArea')
                .attr('d', radarLine)
                .attr('fill', viz.colors['emp'])
                .attr('fill-opacity', .5)
                .on('mouseenter', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', .75);
                })
                .on('mouseleave', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', .5);
                });

            blobWrapper.append('path').attr('class', 'radarStroke')
                .attr('d', radarLine)
                .attr('fill', 'none')
                .attr('stroke-width', '3px')
                .attr('stroke', viz.colors['emp'])
                .style('filter', 'url(#glow3)');

            blobWrapper.selectAll('.radarCircle')
                .data((d) => d).enter().append('circle')
                .attr('class', 'radarCircle')
                .attr('r', 7)
                .attr('cx', (d, i) => scaleRadius(d.value) * Math.cos(angleSlice * i - (Math.PI / 2)))
                .attr('cy', (d, i) => scaleRadius(d.value) * Math.sin(angleSlice * i - (Math.PI / 2)))
                .attr('fill', viz.colors['emp'])
                .attr('fill-opacity', .8)
                .style('filter', 'url(#glow3)')
                .on('mouseenter', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', 1);
                    tooltip.html(d3.format('.2f')(d.value));
                })
                .on('mousemove', function (d) {
                    tooltip.style('left', (d3.event.pageX - parseInt(tooltip.style('width')) / 2) + 'px');
                    tooltip.style('top', (d3.event.pageY + parseInt(tooltip.style('height'))) + 'px');
                })
                .on('mouseleave', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', .8);
                    tooltip.style('left', '-9999px');
                });
        }();

        const makeTexts = function () {
            const strokeWidth = 1
            const strokeDashArray = '5,2,2,2';
            const fontTitle = '1.6rem';
            const fontAnnot = '1.2rem';
            const weightTitle = 400;
            const weightAnnot = 400;

            const coordinates = {
                'startX': scaleRadius(0.7945385812159554) * Math.cos(angleSlice * 1 - (Math.PI / 2)),
                'startY': scaleRadius(0.7945385812159554) * Math.sin(angleSlice * 1 - (Math.PI / 2)),
                'midX': scaleRadius(1) * Math.cos(angleSlice * 1 - (Math.PI / 2)),
                'midY': scaleRadius(1.5) * Math.sin(angleSlice * 1 - (Math.PI / 2)),
                'endX': width - (margin.left + width / 3 - scaleRadius(0.7945385812159554) * Math.cos(angleSlice * 1 - (Math.PI / 2))) + 12.5
            }

            if (window.innerWidth <= 1250) {
                coordinates['endX'] += margin.right / 2;
            }

            if (window.innerWidth <= 1000) {
                coordinates['endX'] += margin.right / 3.85;
            }

            const annotMargin = {
                'top': 32,
                'height': 22.5
            };

            const g = svg.append('g').attr('class', 'textWrapper')
                .attr('transform', `translate(${margin.left + width / 3}, ${margin.top + height / 2})`);

            const circleGdp = g.append('circle')
                .attr('fill', 'none')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('r', 4).attr('cx', coordinates.startX)
                .attr('cy', coordinates.startY)
                .style('pointer-events', 'none');

            const line1ToTextGdp = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', coordinates.startX)
                .attr('x2', coordinates.midX)
                .attr('y1', coordinates.startY)
                .attr('y2', coordinates.midY);
            const line2ToTextGdp = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', coordinates.midX)
                .attr('x2', coordinates.endX)
                .attr('y1', coordinates.midY)
                .attr('y2', coordinates.midY);

            const annotTitleGdp = g.append('text').text('Economy\'s influence over Happiness')
                .attr('fill', viz.colors['emp'])
                .style('font-size', fontTitle)
                .style('font-weight', weightTitle)
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${coordinates.endX}, ${coordinates.midY + 25})`)
                .attr('fill-opacity', .85);

            const annotTextGdp = ['As the radar graph on the left shows,', 'there is a strong correlation between', 'the Happiness Scores and factors, like GDP,', 'or the overall economy of a state, social support,', 'and life expectancy. However, when it comes', 'to generosity, states fall short.']
            const annotGdp = g.append('text')
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${coordinates.endX}, ${coordinates.midY + 25})`)
                .selectAll('tspan').data(annotTextGdp)
                .enter().append('tspan')
                .text((d) => d)
                .style('font-size', fontAnnot)
                .style('font-weight', weightAnnot)
                .attr('x', 0)
                .attr('y', (d, i) => annotMargin.top + i * annotMargin.height)
                .attr('fill-opacity', .65);
        }();

        const makeLegend = function () {
            const fontWeight = 300;
            const fontSize = '1.1rem';
            const legendText = ['* Values are calculated with sample correlation,', 'representing linear correlation with Happiness Scores'];
            const fillOpacity = .5;

            const coordinates = {
                'x': width + margin.left + margin.right,
                'y': height + margin.top
            }

            const legend = svg.append('g').attr('class', 'legendWrapper')
                .attr('transform', `translate(${coordinates.x}, ${coordinates.y})`)
                .attr('text-anchor', 'end')
                .call((g) => {
                    g.append('text').selectAll('tspan').data(legendText)
                        .enter().append('tspan').text((d) => d)
                        .style('font-weight', fontWeight).style('font-size', fontSize)
                        .attr('fill', viz.colors['text'])
                        .attr('fill-opacity', fillOpacity)
                        .attr('x', 0)
                        .attr('y', (d, i) => i * 20);
                });
        }();
    }
}(window.viz = window.viz || {}));