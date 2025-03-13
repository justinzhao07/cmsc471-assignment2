const margin = {top: 40, right: 40, bottom: 40, left: 60};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

let allData = []
let xVar = 'TAVG', yVar = 'AWND', sizeVar = 'PRCP', colorVar = 'SNOW'
let xScale, yScale, sizeScale
let currMonth = 1
const options = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];
const t = 1000;
let states = [];
let months = [];
let currState = 'MD'
const colorScale = d3.scaleSequential(d3.interpolateBlues);

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
        month: d.date.substring(4,6),
        TMIN: (+d.TMIN != 0) ? +d.TMIN : null,
        TMAX: (+d.TMAX != 0) ? +d.TMAX : null,
        TAVG: (+d.TAVG > 0) ? +d.TAVG : null,
        SNOW: (+d.SNOW != 0) ? +d.SNOW : null,
        SNWD: (+d.SNWD != 0) ? +d.SNWD : null,
        PRCP: (+d.PRCP != 0) ? +d.PRCP : null,
        AWND: (+d.AWND > 0) ? +d.AWND : null,
        SNOW: (+d.SNOW > 0) ? +d.SNOW : null
    }))
    .then(data => {
        allData = data.filter(d => 
            d[xVar] !== null && d[yVar] !== null && d[sizeVar] !== null
            && !isNaN(d[xVar]) && !isNaN(d[yVar]) && !isNaN(d[sizeVar])
        );
        states = [...new Set(data.map(d => d.state))];
        months = [...new Set(data.map(d => d.month))];
        setupSelector();
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
        // .domain([0, d3.max(allData, d => d[yVar])])
        .domain([0, 30])
        .range([height, 0]);
    svg.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale));

    sizeScale = d3.scaleSqrt()
        .domain([0, d3.max(allData, d => d[sizeVar])])
        .range([3, 20]);

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

function setupSelector(){
let slider = d3
    .sliderHorizontal()
    .min(1) // setup the range
    .max(10) // setup the range
    .step(1)
    .width(width)  // Widen the slider if needed
    .displayValue(false)
    .on('onchange', (val) => {
        currMonth = +val // Update the year
       updateVis() // Refresh the chart
    });

d3.select('#slider')
    .append('svg')
    .attr('width', width)  // Adjust width if needed
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)') 
    .call(slider);

    d3.selectAll('.variable')
   // loop over each dropdown button
    .each(function() {
        d3.select(this).selectAll('myOptions')
        .data(options)
        .enter()
        .append('option')
        .text(d => d) // The displayed text
        .attr("value",d => d) // The actual value used in the code
    })
    .on("change", function (event) {
        // Placeholder: we’ll change xVar, yVar, or sizeVar here
        id = d3.select(this).property("id")
        val = d3.select(this).property("value")
        currState = val
        updateAxes();
        updateVis();
    })
d3.select('#state').property('value', currState)
}

function updateVis(){
    console.log(currMonth)
    let currentData = allData.filter(d => d.state === currState && +d.month === currMonth)
    console.log(currState)
    // colorScale.domain([d3.min(currentData, d => d[colorVar]), d3.max(currentData, d => d[colorVar])]);
    svg.selectAll('.points')
        .data(currentData, d => d.state)
        .join(
            enter => enter
                .append('circle')
                .attr('class', 'points')
                .attr('cx', d => xScale(d[xVar]))
                .attr('cy', d => yScale(d[yVar]))
                .attr('r', d => sizeScale(d[sizeVar]))
                .style('fill', d => d[colorVar] < .01 ? "green" : colorScale(d[colorVar]))
                .style('opacity', 0.5)
                .on('mouseover', function(event, d) {
                    let tooltipText = `Precipitation: ${d.PRCP.toFixed(2)} in
                        <br/>Avg Wind: ${d.AWND.toFixed(2)} mph
                        <br/>Avg Temp: ${d.TAVG.toFixed(2)} F`;

                    if (d.SNOW !== null) {
                        tooltipText += `<br/>Snow: ${d.SNOW.toFixed(2)} in`;
                    }

                    d3.select('#tooltip')
                        .style("display", 'block')
                        .html(tooltipText)
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
