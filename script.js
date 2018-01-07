var nodeCounter = 0;

var clickedBefore = false;
var coordsOld = [0,0];
var objOld = 0;
var colorOld = 'black';
var nodeInEdit = 0;
var nodeInColorchange = 0;

var coordsBeforeDrag = [];
var xNew = 0;
var yNew = 0;

var showDeleteLineButton = false;

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
          .attr('class', 'backgroundRect')
          .attr('fill', '#ffffff');

  //event listeners

  background.on('click', function() {
    newNode(viewport, d3.mouse(this));
  });

  $('#showDeleteLine').on('click', function() {
    if (showDeleteLineButton) {
      showDeleteLineButton = false;
      d3.selectAll('.deleteLine').style('opacity', '0');
      $('#showDeleteLine').css('font-weight', 'normal');
      $('#showDeleteLineIcon').removeClass('showDeleteActive');
    } else {
      showDeleteLineButton = true;
      d3.selectAll('.deleteLine').style('opacity', '1');
      $('#showDeleteLine').css('font-weight', 'bold');
      $('#showDeleteLineIcon').addClass('showDeleteActive')
    }
  });

  $('#uploadFile').on('click', function() {
    $('input[type=file]').trigger('click');
  });

  document.getElementById("fileLoader").addEventListener("change", function () {
  if (this.files && this.files[0]) {
    var myFile = this.files[0];
    var reader = new FileReader();

    reader.addEventListener('load', function (e) {
      document.getElementById("svgContainer").innerHTML = e.target.result;
    });

    reader.readAsBinaryString(myFile);
  }
});

  $('#saveFile').on('click', function() {
    //experimental line breaks
    var stringArray = document.getElementById('svgContainer').innerHTML.split('>');
    var svgFile = '';

    for (var i = 0; i < stringArray.length; i++) {
      svgFile += stringArray[i] + '>' + '\n';
    }

    svgFile = svgFile.substring(0, svgFile.length-2);

    data = [];
    data.push(svgFile);
    properties = {type: 'plain/text'}; // Specify the file's mime-type.
    try {
      // Specify the filename using the File constructor, but ...
      file = new File(data, "MindMap.svg", properties);
    } catch (e) {
      // ... fall back to the Blob constructor if that isn't supported.
      file = new Blob(data, properties);
    }
    url = URL.createObjectURL(file);
    document.getElementById('downloadSVGFile').href = url;
    $('#downloadSVGFile')[0].click(); //strangely $('#downloadSVGFile').trigger('click'); is not working
  });

  $('#changeBGcolor').colorpicker().on('changeColor', function(e) {
    d3.select('.backgroundRect').style('fill', e.color.toString('rgba'));
  });

  $('#nodeColorSelector').colorpicker().on('changeColor', function(e) {
    d3.select('#nodeGroup' + nodeInColorchange).selectAll('.node').style('fill', e.color.toString('rgba'));
  });

  $('#revertToOldColor').on('click', function() {
    d3.select('#nodeGroup' + nodeInColorchange).selectAll('.node').style('fill', colorOld);
  });

  $('#textInputforNode').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        $('#setTextForNode').trigger('click');
    }
  });
});

function dragstarted(d) {
  d3.select(this).classed("active", true);
  coordsBeforeDrag = [];
  for (var i = 0; i < nodeCounter*(nodeCounter-1)/2+1; i++) {
    for (var j = 0; j < nodeCounter*(nodeCounter-1)/2+1; j++) {
      if(d3.select(`#line${i}a${j}`).empty() == false){
        if(parseInt(this.id.substring(9, this.id.length)) == i){
          coordsBeforeDrag.push(`#deleteLine${i}a${j}`);
          coordsBeforeDrag.push(parseInt(d3.select(`#deleteLine${i}a${j}`).attr('x')));
          coordsBeforeDrag.push(parseInt(d3.select(`#deleteLine${i}a${j}`).attr('y')));
        } else if(parseInt(this.id.substring(9, this.id.length)) == j){
          coordsBeforeDrag.push(`#deleteLine${i}a${j}`);
          coordsBeforeDrag.push(parseInt(d3.select(`#deleteLine${i}a${j}`).attr('x')));
          coordsBeforeDrag.push(parseInt(d3.select(`#deleteLine${i}a${j}`).attr('y')));
        }
      }
    }
  }
  xNew = 0;
  yNew = 0;
}

function dragged(d) {
  d.x += d3.event.dx;
  d.y += d3.event.dy;
  xNew += d3.event.dx;
  yNew += d3.event.dy;
  d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
  for (var i = 0; i < nodeCounter*(nodeCounter-1)/2+1; i++) {  //TODO: prevent dragging while drawing a line
    for (var j = 0; j < nodeCounter*(nodeCounter-1)/2+1; j++) {
      if(d3.select(`#line${i}a${j}`).empty() == false){
        if(parseInt(this.id.substring(9, this.id.length)) == i){
          d3.select(`#line${i}a${j}`)
            .attr("x1", d.x+d3.select(this).selectAll('rect').node().getBBox().x+35)
            .attr("y1", d.y+d3.select(this).selectAll('rect').node().getBBox().y+35);
          d3.select(`#deleteLine${i}a${j}`)
            .attr('x', xNew/2+coordsBeforeDrag[coordsBeforeDrag.indexOf(`#deleteLine${i}a${j}`)+1])
            .attr('y', yNew/2+coordsBeforeDrag[coordsBeforeDrag.indexOf(`#deleteLine${i}a${j}`)+2]);
        } else if(parseInt(this.id.substring(9, this.id.length)) == j){
          d3.select(`#line${i}a${j}`)
          .attr("x2", d.x+d3.select(this).selectAll('rect').node().getBBox().x+35)
          .attr("y2", d.y+d3.select(this).selectAll('rect').node().getBBox().y+35);
          d3.select(`#deleteLine${i}a${j}`)
            .attr('x', xNew/2+coordsBeforeDrag[coordsBeforeDrag.indexOf(`#deleteLine${i}a${j}`)+1])
            .attr('y', yNew/2+coordsBeforeDrag[coordsBeforeDrag.indexOf(`#deleteLine${i}a${j}`)+2]);
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
  .attr('id', 'nodeGroup' + nodeCounter)
  .attr("transform", "translate(" + 0 + "," + 0 + ")");

  var lineSpace = viewport.append('g');

  nodeGroup.append("rect")
    .attr("x", coords[0])
    .attr("y", coords[1])
    .attr('rx', 20)
    .attr('ry', 40)
    .attr("width", 200)
    .attr("height", 40)
    .attr('class', 'node')
    .on('click', function() {
          nodeInEdit = parseInt(this.parentNode.id.substring(9,this.parentNode.id.length));
          if (d3.select(this.parentNode).selectAll('.textEntry').text().length > 0) {
            $('#textInputforNode').val(d3.select(this.parentNode).selectAll('.textEntry').text());
          } else {
            $('#textInputforNode').val('');
          }
          $('#openTextForNodeModal').trigger('click');
      });

  nodeGroup.append("text")
    .attr("x", coords[0]+100)
    .attr("y", coords[1]+26)
    .attr('text-anchor', 'middle')
    .attr('class', 'textEntry')
    .style("font-size", 20)
    .style('fill', 'orange')
    .style('opacity', 1)
    .text('')
    .on('click', function() {
          nodeInEdit = parseInt(this.parentNode.id.substring(9,this.parentNode.id.length));
          if (d3.select(this).text().length > 0) {
            $('#textInputforNode').val(d3.select(this).text());
          } else {
            $('#textInputforNode').val('');
          }
          $('#openTextForNodeModal').trigger('click');
      });

  nodeGroup.append("rect")
    .attr("x", coords[0]+150)
    .attr("y", coords[1]-13)
    .attr("width", 22)
    .attr("height", 22)
    .style('fill', 'red')
    .style('opacity', 0)
    .attr('class', 'deleteNode');

  nodeGroup.append('text')
        .attr("x", coords[0]+153)
        .attr("y", coords[1]+5)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '20px' )
        .attr('class', 'deleteNode')
        .text(function(d) { return '\uf1f8' })
        .style('opacity', 0);


    d3.selectAll('.deleteNode').on('click', function() {
      var ans = window.confirm('Really delete this node?');
      if (ans) {
        $(this.parentNode).remove();
        //find all connections to this node and delete them
        for (var i = 0; i < nodeCounter*(nodeCounter-1)/2+1; i++) {
          if(d3.select(`#line${i}a${this.parentNode.id.substring(9)}`).empty() == false){
            $(`#line${i}a${this.parentNode.id.substring(9)}`).remove();
            $(`#deleteLine${i}a${this.parentNode.id.substring(9)}`).remove();
          }
        }
        for (var i = 0; i < nodeCounter*(nodeCounter-1)/2+1; i++) {
          if(d3.select(`#line${this.parentNode.id.substring(9)}a${i}`).empty() == false){
            $(`#line${this.parentNode.id.substring(9)}a${i}`).remove();
            $(`#deleteLine${this.parentNode.id.substring(9)}a${i}`).remove();
          }
        }
      }
    });

  var colorRect = nodeGroup.append("rect")
      .attr("x", coords[0]+119)
      .attr("y", coords[1]-13)
      .attr("width", 22)
      .attr("height", 22)
      .attr('class', 'showNodeColorModal')
      .style('fill', 'green')
      .style('opacity', 0);

  nodeGroup.append('text')
        .attr("x", coords[0]+120)
        .attr("y", coords[1]+5)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '20px' )
        .attr('class', 'showNodeColorModal')
        .text(function(d) { return '\uf2d0' })
        .style('opacity', 0);

  d3.selectAll('.showNodeColorModal').on('click', function() {
        nodeInColorchange = parseInt(this.parentNode.id.substring(9, this.parentNode.id.length));
        colorOld = d3.select('#nodeGroup' + nodeInColorchange).selectAll('.node').style('fill').toString();
        $('#openNodeColorModal').trigger('click');
  });

  //text properties
  nodeGroup.append("rect")
      .attr("x", coords[0]+88)
      .attr("y", coords[1]-13)
      .attr("width", 22)
      .attr("height", 22)
      .attr('class', 'textProps')
      .style('fill', '#A4A4A4')
      .style('opacity', 0);

  nodeGroup.append('text')
        .attr("x", coords[0]+90)
        .attr("y", coords[1]+5)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '20px' )
        .attr('class', 'textProps')
        .text(function(d) { return '\uf031' })
        .style('opacity', 0);

  d3.selectAll('.textProps').on('click', function() {
    //im hinterkopf behalten
    nodeInColorchange = parseInt(this.parentNode.id.substring(9, this.parentNode.id.length));
    $('#openTextPropsModal').trigger('click');
  });

  nodeGroup.append("rect")
    .attr("x", coords[0]+35)
    .attr("y", coords[1]+35)
    .attr("width", 22)
    .attr("height", 22)
    .style('fill', 'orange')
    .style('opacity', 0)
    .style('cursor', 'pointer')
    .attr('class', 'connect' + nodeCounter)
    .attr("stroke-width", 1)
    .attr("stroke", "#B0C4DE");

  nodeGroup.append('text')
        .attr("x", coords[0]+35.7)
        .attr("y", coords[1]+52.5)
        .attr('font-family', 'FontAwesome')
        .attr('font-size', '18px' )
        .attr('class', 'connect' + nodeCounter)
        .text(function(d) { return '\uf20e' })
        .style('cursor', 'pointer')
        .style('opacity', 0);

    d3.selectAll('.connect'+ nodeCounter).on('click', function() {
      //OK this is hacky and it still has a bug. When a node is dragged after clicking the connection goes to the location where it got clicked..
      if(clickedBefore === false){
        clickedBefore = true;
        coordsOld = [35+d3.select(this).node().getBBox().x+parseInt(d3.select(this.parentNode).attr('transform').substring(10 ,d3.select(this.parentNode).attr('transform').indexOf(','))), d3.select(this).node().getBBox().y+parseInt(d3.select(this.parentNode).attr('transform').substring(d3.select(this.parentNode).attr('transform').indexOf(',')+1, d3.select(this.parentNode).attr('transform').length -1))-15];
        objOld = this;
        colorOld = d3.select(this.parentNode).selectAll('.node').style('fill');
        d3.select(this.parentNode).selectAll('.node').style('fill', 'red');
      } else {
        clickedBefore = false;
        if ($('#line'+d3.select(this).attr('class').substring(7)+'a'+ d3.select(objOld).attr('class').substring(7)).length || $('#line'+d3.select(objOld).attr('class').substring(7)+'a'+ d3.select(this).attr('class').substring(7)).length) {
          alert('You can not connect nodes twice.');
          d3.select(objOld.parentNode).selectAll('.node').style('fill', colorOld);
        } else if (d3.select(objOld).attr('class').substring(7) == d3.select(this).attr('class').substring(7)) {
          alert('You can not connect a node to itself.');
          d3.select(objOld.parentNode).selectAll('.node').style('fill', colorOld);
        } else{
          var coordsNew = [d3.select(this).node().getBBox().x+35+parseInt(d3.select(this.parentNode).attr('transform').substring(10 ,d3.select(this.parentNode).attr('transform').indexOf(','))), d3.select(this).node().getBBox().y-15+parseInt(d3.select(this.parentNode).attr('transform').substring(d3.select(this.parentNode).attr('transform').indexOf(',')+1, d3.select(this.parentNode).attr('transform').length -1))];
          var line = lineSpace.append("line")
                .attr("x1", coordsNew[0])
                .attr("y1", coordsNew[1])
                .attr("x2", coordsOld[0])
                .attr("y2", coordsOld[1])
                .attr("stroke-width", 2)
                .attr("stroke", "red")
                .attr('id', 'line'+d3.select(this).attr('class').substring(7)+'a'+ d3.select(objOld).attr('class').substring(7));

          var node1 = d3.select(this).attr('class').substring(7);
          var node2 = d3.select(objOld).attr('class').substring(7);

          lineSpace.append('text')
                .attr("x", coordsNew[0]+(coordsOld[0]-coordsNew[0])/2)
                .attr("y", coordsNew[1]+(coordsOld[1]-coordsNew[1])/2)
                .attr('font-family', 'FontAwesome')
                .attr('font-size', '20px' )
                .attr('class', 'deleteLine')
                .text(function(d) { return '\uf1f8' })
                .style('cursor', 'pointer')
                .attr('id', 'deleteLine'+node1+'a'+ node2)
                .on('click', function(){
                  $('#line'+node1+'a'+ node2).remove();
                  $('#deleteLine'+node1+'a'+ node2).remove();
                });

          if (showDeleteLineButton) {
            d3.select('#deleteLine'+node1+'a'+ node2).style('opacity', '1');
          } else {
            d3.select('#deleteLine'+node1+'a'+ node2).style('opacity', '0');
          }

          d3.select(objOld.parentNode).selectAll('.node').style('fill', colorOld);

      }
    }
  });
      //adjust nodes counter
      nodeCounter++;

      //raise node groups over lineSpace
      d3.selectAll('.nodeGroup').raise();
}

function handleMouseOver (){
  d3.select(this).selectAll('.connect'+this.id.substring(9,this.id.length)).style('opacity', '1');
  d3.select(this).selectAll('.deleteNode').style('opacity', '1');
  d3.select(this).selectAll('.showNodeColorModal').style('opacity', '1');
  d3.select(this).selectAll('.textProps').style('opacity', '1');
}

function handleMouseOut(){
  d3.select(this).selectAll('.connect'+this.id.substring(9,this.id.length)).style('opacity', '0');
  d3.select(this).selectAll('.deleteNode').style('opacity', '0');
  d3.select(this).selectAll('.showNodeColorModal').style('opacity', '0');
  d3.select(this).selectAll('.textProps').style('opacity', '0');
}

function saveName (){
  $('#mainTitle').html($('#nameOfMindMap').val());
  $('#downloadSVGFile').attr('download', $('#nameOfMindMap').val()+'.svg');
}


function saveTextForNode(){
  d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').text($('#textInputforNode').val());
}
