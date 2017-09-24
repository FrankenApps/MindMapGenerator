var nodeCounter = 0;

var clickedBefore = false;
var coordsOld = [0,0];
var idOld = 0;

$( document ).ready(function() {
  var width = $(document).width();
  var height = $(document).height()-50;

  var svg = d3.select(".container")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(d3.zoom().on("zoom", function () {
              svg.attr("transform", d3.event.transform);
            }))
        .append("g");

  var viewport = svg.append('g');

  //the background for clicking
  var background = viewport.append("rect")
          .attr("x", -width*50)
          .attr("y", -height*50)
          .attr("width", width*100)
          .attr("height", height*100)
          .attr('fill', '#ffffff');

  //event listeners

  background.on('click', function() {
    newNode(viewport, d3.mouse(this));
  });

});

function dragstarted(d) {
  d3.select(this).classed("active", true);
}

function dragged(d) {
  d.x += d3.event.dx;
  d.y += d3.event.dy;
  d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
  for (var i = 0; i < nodeCounter*(nodeCounter-1)/2+1; i++) {  //prevent "double" connections
    for (var j = 0; j < nodeCounter*(nodeCounter-1)/2+1; j++) {
      if(d3.select(`#line${i}a${j}`).empty() == false){
        if(parseInt(this.id.substring(9, this.id.length)) == i){
          d3.select(`#line${i}a${j}`)
          .attr("x1", d.x+d3.select(this).selectAll('rect').node().getBBox().x+35)
          .attr("y1", d.y+d3.select(this).selectAll('rect').node().getBBox().y+35);
        } else if(parseInt(this.id.substring(9, this.id.length)) == j){
          d3.select(`#line${i}a${j}`)
          .attr("x2", d.x+d3.select(this).selectAll('rect').node().getBBox().x+35)
          .attr("y2", d.y+d3.select(this).selectAll('rect').node().getBBox().y+35);
        }
      }
    }
  }
}

function dragended(d) {
  d3.select(this).classed("active", false);
}

function newNode(viewport, coords){
  var nodeGroup=viewport.append('g')
  .datum({
    x: 0,
    y: 0
  })
  .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended))
  .on("mouseover", handleMouseOver)
  .on("mouseout", handleMouseOut)
  .attr('class', 'nodeGroup')
  .attr('id', 'nodeGroup' + nodeCounter);

  var lineSpace = viewport.append('g');

  nodeGroup.append("rect")
    .attr("x", coords[0])
    .attr("y", coords[1])
    .attr('rx', 20)
    .attr('ry', 40)
    .attr("width", 200)
    .attr("height", 40)
    .attr('class', 'node');

  nodeGroup.append("foreignObject")
    .attr("x", coords[0]+12)
    .attr("y", coords[1]+10)
    .attr("width", 0)
    .attr("height", 0)
      .append("xhtml:body")
      .style("font", "14px 'Helvetica Neue'")
      .html(`<input type="text" style="color: #FF8C00; background-color: #000000; border: none; text-align: center"></input>`);

  nodeGroup.append("foreignObject")
    .attr("x", coords[0]+35)
    .attr("y", coords[1]+35)
    .attr("width", 0)
    .attr("height", 0)
      .append("xhtml:body")
      .attr('id', nodeCounter)
      .style("font", "14px 'Helvetica Neue'")
      .html(`<button style="color: #000000; background-color: #FF8C00; border: 1px solid #888888; opacity: 0" class="connector-button">
              <i class="fa fa-arrows-v" aria-hidden="true"></i>
              </button>`)
        .on('click', function() {
          if(clickedBefore === false){
            clickedBefore = true;
            coordsOld = [d3.select(this).node().parentNode.getBBox().x, d3.select(this).node().parentNode.getBBox().y];
            idOld = this.id;
            console.log(d3.select(this).node().parentNode.getBBox().x); //obviously does not change on drag?
          } else {
            clickedBefore = false;
            lineSpace.append("line")
                    .attr("x1", d3.select(this).node().parentNode.getBBox().x+35)
                    .attr("y1", d3.select(this).node().parentNode.getBBox().y-15)
                    .attr("x2", coordsOld[0]+35)
                    .attr("y2", coordsOld[1]-15)
                    .attr("stroke-width", 2)
                    .attr("stroke", "red")
                    .attr('id', 'line'+String(this.id)+'a'+ idOld);

                    console.log(coordsOld);
          }
      });
      //adjust nodes counter
      nodeCounter++;

      //raise node groups over lineSpace
      d3.selectAll('.nodeGroup').raise();
}

function handleMouseOver (){
  d3.select(this).selectAll('.connector-button').style('opacity', '1');
}

function handleMouseOut(){
  d3.select(this).selectAll('.connector-button').style('opacity', '0');
}

function factorialize(num) {
  var result = num;
  if (num === 0 || num === 1)
    return 1;
  while (num > 1) {
    num--;
    result *= num;
  }
  return result;
}
