console.log('D3 Version:', d3.version);
const margin = {top: 40, right: 40, bottom: 40, left: 60};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

let allData = []
let xVar = 'TMAX', yVar = 'PRCP', sizeVar = 'AWND'
let xScale, yScale, sizeScale
const options = ['TMAX', 'TMIN', 'TAVG', 'PRCP', 'AWND']
const t = 1000;
let states = [];
let colorScale;

const svg = d3.select('#vis')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

function init(){
    d3.csv("./data/weather.csv", d => ({
        station: d.station,
        state: d.state,
        month: +d.date.substring(4,6),
        TMIN: +d.TMIN || 0,
        TMAX: +d.TMAX || 0,
        TAVG: +d.TAVG || (+d.TMIN + +d.TMAX) / 2 || 0,
        PRCP: +d.PRCP || 0,
        AWND: +d.AWND || 0
    }))
    .then(data => {
        allData = data.filter(d => !isNaN(d[xVar]) && !isNaN(d[yVar]) && !isNaN(d[sizeVar]));
        states = [...new Set(data.map(d => d.state))];
        colorScale = d3.scaleOrdinal(states, d3.schemeSet2);
        updateAxes();
        updateVis();
        addLegend();
    })
    .catch(error => console.error('Error loading data:', error));
}

function updateAxes(){
    svg.selectAll('.axis, .labels').remove();

    const xMin = d3.min(allData, d => d[xVar]);
    const xMax = d3.max(allData, d => d[xVar]);
    console.log('X-Axis Range:', xMin, xMax);

    xScale = d3.scaleLinear()
        .domain([d3.min(allData, d => d[xVar]), d3.max(allData, d => d[xVar])])
        .range([0, width]);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    yScale = d3.scaleLinear()
        .domain([0, d3.max(allData, d => d[yVar])])
        .range([height, 0]);
    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale));

    sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(allData, d => d[sizeVar])])
        .range([5, 20]);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text(xVar) // Displays the current x-axis variable
        .attr('class', 'labels')
    
    // Y-axis label (rotated)
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 25)
        .attr("text-anchor", "middle")
        .text(yVar) // Displays the current y-axis variable
        .attr('class', 'labels')
}

function updateVis(){
    svg.selectAll('.points')
        .data(allData, d => d.state)
        .join(
            enter => enter
                .append('circle')
                .attr('class', 'points')
                .attr('cx', d => xScale(d[xVar]))
                .attr('cy', d => yScale(d[yVar]))
                .attr('r', d => sizeScale(d[sizeVar]))
                .style('fill', d => colorScale(d.state))
                .style('opacity', 0.5)
                .on('mouseover', function(event, d) {
                    d3.select('#tooltip')
                        .style("display", 'block')
                        .html(`<strong>${d.PRCP}</strong><br/>State: ${d.state}`)
                        .style("left", (event.pageX + 20) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    d3.select(this).style('stroke', 'black').style('stroke-width', '2px');
                })
                .on("mouseout", function() {
                    d3.select('#tooltip').style('display', 'none');
                    d3.select(this).style('stroke', 'none');
                })
                .attr('r', 0)
                .transition(t)
                .attr('r', d => sizeScale(d[sizeVar])),
            update => update
                .transition(t)
                .attr('cx', d => xScale(d[xVar]))
                .attr('cy', d => yScale(d[yVar]))
                .attr('r', d => sizeScale(d[sizeVar])),
            exit => exit.transition(t).attr('r', 0).remove()
        );
}

function addLegend(){
    let size = 10;
}

window.addEventListener('load', init);
