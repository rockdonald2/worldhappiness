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

    //Filter for the outside glow
    let filter = svg.append('defs').append('filter').attr('id', 'glow'),
        feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur'),
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

        console.log(corrs);

        const makeAxis = function () {
            const axisGrid = chartHolder.append('g').attr('class', 'axisWrapper');

            axisGrid.selectAll('.levels')
                .data(d3.range(1, levels + 1).reverse())
                .enter().append('circle')
                .attr('class', 'gridCircle')
                .attr('r', (d, i) => radius / levels * d)
                .attr('fill', 'none')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-opacity', .25)
                .style('pointer-events', 'none');

            axisGrid.selectAll('.axisLabel')
                .data(d3.range(1, levels + 1).reverse())
                .enter().append('text')
                .attr('class', 'axisLabel')
                .attr('x', 0)
                .attr('y', (d) => -d * radius / levels)
                .attr('dy', '-.2em')
                .style('font-size', '1.4rem')
                .attr('fill', viz.colors['text'])
                .attr('opacity', .75)
                .attr('text-anchor', 'middle')
                .text((d, i) => d / 5)
                .style('pointer-events', 'none');

            const axis = axisGrid.selectAll('.axis')
                .data(cols).enter().append('g')
                .attr('class', 'axis');

            axis.append('line')
                .attr('x1', 0).attr('x2', (d, i) => scaleRadius(1 * 1.1) * Math.cos(angleSlice * i - (Math.PI / 2)))
                .attr('y1', 0).attr('y2', (d, i) => scaleRadius(1 * 1.1) * Math.sin(angleSlice * i - (Math.PI / 2)))
                .attr('class', 'line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', '1px')
                .attr('stroke-opacity', .25)
                .style('pointer-events', 'none');

            axis.append('text')
                .attr('class', 'legend')
                .attr('font-size', '1.2rem')
                .attr('text-anchor', 'middle')
                .attr('fill', viz.colors['text'])
                .attr('opacity', .75)
                .attr('dy', '.35em')
                .attr('x', (d, i) => scaleRadius(1 * 1.25) * Math.cos(angleSlice * i - (Math.PI / 2)))
                .attr('y', (d, i) => scaleRadius(1 * 1.25) * Math.sin(angleSlice * i - (Math.PI / 2)))
                .text((d) => d)
                .style('pointer-events', 'none');
        }();

        const makeRadar = function () {
            const blobWrapper = chartHolder.selectAll('.radarWrapper')
                .data([corrs]).enter().append('g').attr('class', 'radarWrapper');

            blobWrapper.append('path').attr('class', 'radarArea')
                .attr('d', radarLine)
                .attr('fill', viz.colors['emp'])
                .attr('fill-opacity', .5)
                .attr('stroke-width', '3px')
                .attr('stroke', viz.colors['emp'])
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
                .style('filter', 'url(#glow)');

            blobWrapper.selectAll('.radarCircle')
                .data((d) => d).enter().append('circle')
                .attr('class', 'radarCircle')
                .attr('r', 7)
                .attr('cx', (d, i) => scaleRadius(d.value) * Math.cos(angleSlice * i - (Math.PI / 2)))
                .attr('cy', (d, i) => scaleRadius(d.value) * Math.sin(angleSlice * i - (Math.PI / 2)))
                .attr('fill', viz.colors['emp'])
                .attr('fill-opacity', .8)
                .style('filter', 'url(#glow)')
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
            const weightAnnot = 300;

            const annotMargin = {
                'left': 10,
                'top': 32,
                'height': 22.5
            };

            const g = chartHolder.append('g').attr('class', 'textWrapper');

            const circleGdp = g.append('circle')
                .attr('fill', 'none')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('r', 4).attr('cx', scaleRadius(0.7945385812159554) * Math.cos(angleSlice * 1 - (Math.PI / 2)))
                .attr('cy', scaleRadius(0.7945385812159554) * Math.sin(angleSlice * 1 - (Math.PI / 2)))
                .style('pointer-events', 'none');

            const line1ToTextGdp = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', scaleRadius(0.7945385812159554) * Math.cos(angleSlice * 1 - (Math.PI / 2)))
                .attr('x2', scaleRadius(1) * Math.cos(angleSlice * 1 - (Math.PI / 2)))
                .attr('y1', scaleRadius(0.7945385812159554) * Math.sin(angleSlice * 1 - (Math.PI / 2)))
                .attr('y2', scaleRadius(1.5) * Math.sin(angleSlice * 1 - (Math.PI / 2)));
            const line2ToTextGdp = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', scaleRadius(1) * Math.cos(angleSlice * 1 - (Math.PI / 2)))
                .attr('x2', width / 1.42)
                .attr('y1', scaleRadius(1.5) * Math.sin(angleSlice * 1 - (Math.PI / 2)))
                .attr('y2', scaleRadius(1.5) * Math.sin(angleSlice * 1 - (Math.PI / 2)));

            const annotTitleGdp = g.append('text').text('Economy\'s influence over happiness')
                .attr('fill', viz.colors['emp'])
                .style('font-size', fontTitle)
                .style('font-weight', weightTitle)
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${width / 1.42}, ${scaleRadius(1.5) * Math.sin(angleSlice * 1 - (Math.PI / 2)) + 25})`);

            const annotTextGdp = ['As the radar graph on the right shows,', 'there is a strong correlation between', 'the Happiness Scores and factors, like GDP,', 'or the overall economy of a state, social support,', 'and life expectancy. However, when it comes', 'to generosity, states fall short.']
            const annotGdp = g.append('text')
                .attr('text-anchor', 'end')
                .attr('transform', `translate(${width / 1.44}, ${scaleRadius(1.5) * Math.sin(angleSlice * 1 - (Math.PI / 2)) + 25})`)
                .selectAll('tspan').data(annotTextGdp)
                .enter().append('tspan')
                .text((d) => d)
                .style('font-size', fontAnnot)
                .style('font-weight', weightAnnot)
                .attr('x', annotMargin.left)
                .attr('y', (d, i) => annotMargin.top + i * annotMargin.height);
        }();
    }
}(window.viz = window.viz || {}));