(function (viz) {
    'use strict';

    const chartContainer = d3.select('.map-graph');
    const margin = {
        'top': -100,
        'left': 50,
        'right': 50,
        'bottom': -50
    };
    if (window.innerWidth <= 1000) {
        margin['top'] = -75;
        margin['bottom'] = -75;
    }

    const width = parseInt(chartContainer.style('width')) - margin.left - margin.right;
    const height = parseInt(chartContainer.style('height')) - margin.top - margin.bottom;

    const svg = chartContainer.append('svg').attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right);

    const chartHolder = svg.append('g').attr('class', 'chartHolder')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const projection = d3.geoEquirectangular().scale(125 * (height / 600)).center([0, 0])
        .translate([width / 2, height / 2]).precision(.1);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3.scaleQuantize().domain([2, 8]).range(d3.schemeGreens[9]);

    const tooltip = chartContainer.select('.tooltip');

    viz.initMap = function () {
        const countries = topojson.feature(viz.data.worldMap, viz.data.worldMap.objects.countries).features;

        const nameToCountry = {};

        countries.forEach((c) => nameToCountry[c.properties.name] = c);

        const data = viz.data.data.filter(2019).top(Infinity);
        let haiti = null;
        data.forEach((d) => {
            d['Geo'] = nameToCountry[d['Country']];
            if (d['Country'] == 'Haiti') {
                haiti = d;
            }
            delete nameToCountry[d['Country']];
        });

        const makeLegend = function () {
            const legendWidth = 300;
            const legendHeight = 10;
            const fillOpacity = .65;
            const fontWeight = 400;
            const fontSize = '1.4rem';

            const coordinates = {
                'x': width / 2 - legendWidth / 2 + margin.left + margin.right,
                'y': height * 0.7
            }

            const defs = svg.append('defs');

            //Filter for the outside glow4
            const filter = defs.append('filter').attr('id', 'glow4'),
                feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation', '1').attr('result', 'coloredBlur'),
                feMerge = filter.append('feMerge'),
                feMergeNode_1 = feMerge.append('feMergeNode').attr('in', 'coloredBlur'),
                feMergeNode_2 = feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

            const linearGradient = defs.append('linearGradient').attr('id', 'legendGradient')
                .attr('x1', '0%').attr('x2', '100%').attr('y1', '0%').attr('y2', '0%');
            linearGradient.selectAll("stop")
                .data([{
                        offset: "0%",
                        color: colorScale.range()[0]
                    },
                    {
                        offset: "12.5%",
                        color: colorScale.range()[1]
                    },
                    {
                        offset: "25%",
                        color: colorScale.range()[2]
                    },
                    {
                        offset: "37.5%",
                        color: colorScale.range()[3]
                    },
                    {
                        offset: "50%",
                        color: colorScale.range()[4]
                    },
                    {
                        offset: "62.5%",
                        color: colorScale.range()[5]
                    },
                    {
                        offset: "75%",
                        color: colorScale.range()[6]
                    },
                    {
                        offset: "87.5%",
                        color: colorScale.range()[7]
                    },
                    {
                        offset: "100%",
                        color: colorScale.range()[8]
                    }
                ])
                .enter().append("stop")
                .attr("offset", function (d) {
                    return d.offset;
                })
                .attr("stop-color", function (d) {
                    return d.color;
                });

            const legend = svg.append('g').attr('class', 'legendWrapper').attr('transform', `translate(${coordinates.x}, ${coordinates.y})`);

            const legendRect = legend.append('rect').attr('class', 'legendRect').attr('width', legendWidth).attr('height', legendHeight)
                .style("fill", "url(#legendGradient)")
                .attr('fill-opacity', fillOpacity)
                .attr('rx', 5)
                .style('filter', 'url(#glow4)');

            const legendTitle = legend.append('text').attr('class', 'legendTitle').text('The scale of Happiness')
                .style('font-size', fontSize).style('font-weight', fontWeight)
                .attr('fill', viz.colors['text']).attr('fill-opacity', fillOpacity)
                .attr('x', legendWidth / 2).attr('y', -20).attr('text-anchor', 'middle');

            const range = d3.range(0, 337.5, 37.5);
            const legendScale = d3.scaleQuantize().domain([2, 8]).range(range);

            const legendTicks = legend.append('g').attr('class', 'legendTicks').selectAll('.legendTick')
                .data(d3.range(2, 9, 1.5)).enter().append('text').text((d) => d)
                .attr('x', legendScale).attr('y', 30).attr('fill', viz.colors['text'])
                .attr('text-anchor', 'middle')
                .style('font-size', fontSize).style('font-weight', fontWeight)
                .attr('fill-opacity', fillOpacity);
        }();

        const makeMap = function () {
            const missingCountriesGeo = chartHolder.append('g').attr('class', 'missingCountries').selectAll('.missingCountry')
                .data(countries).enter().append('path').attr('d', (d) => {
                    if (d.properties.name != 'Antarctica' && nameToCountry.hasOwnProperty(d.properties.name)) return path(d);
                }).attr('class', 'missingCountry').attr('fill', '#ece9e2').attr('stroke', viz.colors['text'])
                .attr('stroke-opacity', .1);
            const countriesGeo = chartHolder.append('g').attr('class', 'countries').selectAll('.country').data(data)
                .enter().append('path').attr('d', (d) => path(d['Geo'])).attr('class', 'country')
                .attr('fill', (d) => colorScale(d.Score))
                .attr('fill-opacity', .65)
                .attr('stroke', '#ece9e2')
                .attr('stroke-opacity', .1)
                .on('mouseenter', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', .95);
                    tooltip.select('.tooltip--title').html(d['Country']);
                    tooltip.select('.tooltip--text').html(`Happiness Score: ${d['Score']}`);
                })
                .on('mousemove', function (d) {
                    tooltip.style('left', (d3.event.pageX - parseInt(tooltip.style('width')) / 2) + 'px');
                    tooltip.style('top', (d3.event.pageY + parseInt(tooltip.style('height')) / 2) + 'px');
                })
                .on('mouseleave', function (d) {
                    d3.select(this).transition().duration(viz.TRANS_DURATION).attr('fill-opacity', .65);
                    tooltip.style('left', '-9999px');
                })
                .style('filter', 'url(#glow4)');
        }();

        const makeText = function () {
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

            const centroid = path.centroid(haiti['Geo']);

            const coordinates = {
                'startX': centroid[0] + margin.left,
                'startY': centroid[1],
                'midX': centroid[0] - 60,
                'midY': centroid[1] + 40,
                'endX': 0
            }

            const g = svg.append('g').attr('class', 'textWrapper').attr('transform', `translate(${0}, ${margin.top})`);

            const circle = g.append('circle')
                .attr('r', 4)
                .attr('transform', () => `translate(${coordinates.startX}, ${coordinates.startY})`)
                .attr('fill', 'none')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth);

            const lineToText1 = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', coordinates.startX)
                .attr('x2', coordinates.midX)
                .attr('y1', coordinates.startY)
                .attr('y2', coordinates.midY);

            const lineToText2 = g.append('line')
                .attr('stroke', viz.colors['text'])
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray)
                .attr('fill', 'none')
                .attr('x1', coordinates.midX)
                .attr('x2', coordinates.endX)
                .attr('y1', coordinates.midY)
                .attr('y2', coordinates.midY);

            const annotTitle = g.append('text')
                .text('The lowest point in the Caribbean')
                .attr('fill', viz.colors['emp'])
                .style('font-size', fontTitle)
                .style('font-weight', weightTitle)
                .attr('text-anchor', 'start')
                .attr('transform', `translate(${coordinates.endX}, ${coordinates.midY + 25})`)
                .attr('fill-opacity', .85);

            const annotText = ['Hardly visible on this map, but', 'remains the question, why was the min', 'score so low in the Caribbean?', 'It was because of Haiti, which amongst', 'the Latin American and Caribbean countries', 'has the lowest Happiness Score.', 'Regardless, they\'re living on an island', 'with many sunny days, they remain unhappy.'];
            const annot = g.append('text')
                .attr('text-anchor', 'start')
                .attr('transform', `translate(${coordinates.endX}, ${coordinates.midY + 25})`)
                .selectAll('tspan').data(annotText)
                .enter().append('tspan')
                .text((d) => d)
                .style('font-size', fontAnnot)
                .style('font-weight', weightAnnot)
                .attr('x', 0)
                .attr('y', (d, i) => annotMargin.top + i * annotMargin.height)
                .attr('fill-opacity', .65);
        }();
    };
}(window.viz = window.viz || {}));