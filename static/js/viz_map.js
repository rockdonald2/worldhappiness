(function (viz) {
    'use strict';

    const chartContainer = d3.select('.map-graph');
    const margin = {
        'top': -100,
        'left': 50,
        'right': 50,
        'bottom': 50
    };
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

    viz.initMap = function () {
        const countries = topojson.feature(viz.data.worldMap, viz.data.worldMap.objects.countries).features;

        const nameToCountry = {};

        countries.forEach((c) => nameToCountry[c.properties.name] = c);

        const data = viz.data.data.filter(2019).top(Infinity);
        data.forEach((d) => {
            d['Geo'] = nameToCountry[d['Country']];
            delete nameToCountry[d['Country']];
        });

        const makeLegend = function () {
            const legendWidth = 300;
            const legendHeight = 15;

            const defs = svg.append('defs');
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

            const legend = svg.append('g').attr('class', 'legendWrapper').attr('transform', `translate(${margin.left + legendWidth + legendWidth / 2}, ${height * 0.7})`);

            legend.append('rect').attr('width', legendWidth).attr('height', legendHeight)
                .style("fill", "url(#legendGradient)")
                .attr('fill-opacity', .65);
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
                .attr('stroke-opacity', .1);
        }();
    };
}(window.viz = window.viz || {}));