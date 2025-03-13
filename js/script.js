const margin = {top: 80, right: 60, bottom: 60, left: 100};
const width = 775 - margin.left - margin.right;
const height = 575 - margin.top - margin.bottom;

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
        month: +d.date.substring(4,6),
        TMIN: (+d.TMIN != 0) ? +d.TMIN : null,
        TMAX: (+d.TMAX != 0) ? +d.TMAX : null,
        TAVG: (+d.TAVG != 0) ? +d.TAVG : null,
        SNOW: (+d.SNOW != 0) ? +d.SNOW : null,
        SNWD: (+d.SNWD != 0) ? +d.SNWD : null,
        PRCP: (+d.PRCP != 0) ? +d.PRCP : null,
        AWND: (+d.AWND > 0) ? +d.AWND : null,
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

    xScale = d3.scaleLinear()
        .domain([-10, d3.max(allData, d => d[xVar])])
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
        .text("Average Temp (F)") // Displays the current x-axis variable
        .attr('class', 'labels')
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 25)
        .attr("text-anchor", "middle")
        .text("Average Wind Speed (mph)") // Displays the current y-axis variable
        .attr('class', 'labels')
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function setupSelector(){
let slider = d3
    .sliderHorizontal()
    .min(1)
    .max(12)
    .step(1)
    .width(width)
    .tickFormat(d => monthNames[d - 1])
    .displayValue(false)
    .on('onchange', (val) => {
        currMonth = +val
       updateVis()
    });

d3.select('#slider')
    .append('svg')
    .attr('width', width)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)') 
    .call(slider);

    d3.selectAll('.variable')
    .each(function() {
        d3.select(this).selectAll('myOptions')
        .data(options)
        .enter()
        .append('option')
        .text(d => d)
        .attr("value",d => d)
    })
    .on("change", function (event) {
        id = d3.select(this).property("id")
        val = d3.select(this).property("value")
        currState = val
        updateAxes();
        updateVis();
    })
d3.select('#state').property('value', currState)
}

function updateVis(){
    svg.selectAll('.points').remove();
    let currentData = allData.filter(d => d.state === currState && +d.month === currMonth)
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

function addLegend() {
    svg.selectAll(".legend").remove();

    const legendWidth = 200;
    const legendHeight = 10;

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "100%")
        .attr("y2", "0%");

    linearGradient.selectAll("stop")
        .data(d3.range(0, 1.1, 0.2))
        .enter()
        .append("stop")
        .attr("offset", d => d * 100 + "%")
        .attr("stop-color", d => d3.interpolateBlues(d));

    svg.append("rect")
        .attr("x", width - legendWidth - 20)
        .attr("y", height - 330)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)")
        .attr("class", "legend");

    svg.append("text")
        .attr("x", width - legendWidth - 20)
        .attr("y", height - 300)
        .attr("text-anchor", "start")
        .text("Less Snow")
        .attr("class", "legend");

    svg.append("text")
        .attr("x", width - 20)
        .attr("y", height - 300)
        .attr("text-anchor", "end")
        .text("More Snow")
        .attr("class", "legend");
}

window.addEventListener('load', init);

function openTab(evt, tabName) {
            
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    var tablinks = document.getElementsByClassName("tablinks");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

document.getElementById("defaultOpen").click();
