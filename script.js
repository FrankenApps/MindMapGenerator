var nodeCounter = 0;

var clickedBefore = false;
var coordsOld = [0,0];
var objOld = 0;
var colorOld = 'black';
var nodeInEdit = 0;
var nodeInColorchange = 0;  //most likely redundant, change in the future

var coordsBeforeDrag = [];
var xNew = 0;
var yNew = 0;

var showDeleteLineButton = false;

window.URL = window.URL || window.webkitURL;

$( document ).ready(function() {
  var width = $(document).width();
  var height = $(document).height()-50;

  //slideUp
  $('#advancedTextProps').slideUp(400);

  var svg = d3.select(".container")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(d3.zoom().on("zoom", function () {
    svg.attr("transform", d3.event.transform);
  }))
  .append("g")
  .attr('id', 'mainGroup');

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

  $('#newFile').on('click', function() {
    if (confirm("If you did not save earlier your current work will be lost. Continue?")) {
      location.reload();
    }
  });

  $('#uploadFile').on('click', function() {
    if (confirm("If you did not save earlier your current work will be lost. Continue?")) {
      $('input[type=file]').trigger('click');
    }
  });

  $('#saveFile').on('click', function() {
    //experimental line breaks
    var stringArray = document.getElementById('svgContainer').innerHTML.split('>');
    var svgFile = '';

    for (var i = 1; i < stringArray.length; i++) {
      svgFile += stringArray[i] + '>' + '\n';
    }

    //add needed xml stuff
    svgFile = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <svg
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:cc="http://creativecommons.org/ns#"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:svg="http://www.w3.org/2000/svg"
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    viewBox="0 0 ${height} ${width}"` //not so good if someone changes monitor size
    + `
    height="${height}"
    width="${width}">
    <defs
    id="defs4" />
    <metadata
    id="metadata7">
    <rdf:RDF>
    <cc:Work
    rdf:about="">
    <dc:format>image/svg+xml</dc:format>
    <dc:type
    rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
    <dc:title></dc:title>
    </cc:Work>
    </rdf:RDF>
    </metadata>
    `+ svgFile;

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

  $('#textColorSelector').colorpicker().on('changeColor', function(e) {
    d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style('fill', e.color.toString('rgba'));
  });

  $('#revertToOldColor').on('click', function() {
    d3.select('#nodeGroup' + nodeInColorchange).selectAll('.node').style('fill', colorOld);
  });

  $('#fontSize').on('input', function(e){
    if(isNumeric($('#fontSize').val())){
      $(this).css('border', '1px dotted green');
      d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style("font-size", parseFloat($('#fontSize').val()));
    } else{
      $(this).css('border', '1px dotted red');
      d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style("font-size", 20);
    }
  });

  $('#fontSize').focusout(function() {
    if($(this).css('border') != '1px dotted rgb(255, 0, 0)'){
      $(this).css('border', '1px solid #ccc');
    }
  });

  $('#verticalPadding').on('input', function() {
    if(isNumeric($('#verticalPadding').val())){
      $(this).css('border', '1px dotted green');
      d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr("transform", `translate(0, ${$('#verticalPadding').val()})`);
    } else{
      $(this).css('border', '1px dotted red');
      d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr("transform", `translate(0, 0)`);
    }
  });

  $('#verticalPadding').focusout(function() {
    if($(this).css('border') != '1px dotted rgb(255, 0, 0)'){
      $(this).css('border', '1px solid #ccc');
    }
  });

  $('#alignment button').on('click', function() {
    $('#alignment button').removeClass("btn-success").addClass("btn-default");
    $(this).addClass("btn-success").removeClass("btn-default");
    if($(this).html() == 'Middle'){
      d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr('text-anchor', 'middle');
    } else if($(this).html() == 'Left'){
      d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr('text-anchor', 'end');
    } else if ($(this).html() == 'Right') {
      d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr('text-anchor', 'start');
    }
  });

  $('#toggleAdvancedTextProps').on('click', function() {
    if($('#toggleAdvancedTextProps > span').attr('class') == 'caret crazyDropDownThing'){
      $('#toggleAdvancedTextProps > span').removeClass('crazyDropDownThing');
      $('#advancedTextProps').slideDown(400);
    } else{
      $('#toggleAdvancedTextProps > span').addClass('crazyDropDownThing');
      $('#advancedTextProps').slideUp(400);
    }
  });

  $('#textFontList a').on('click', function() {
    $('#textFont').html(this.text + ' <span class="caret">');
    d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style("font-family", this.text);
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

  var lineSpace = viewport.append('g').attr('class', 'lineSpace');

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
  .style('fill', '#FFA500')
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
    nodeInEdit = parseInt(this.parentNode.id.substring(9, this.parentNode.id.length));
    //set current props in modal
    $('#fontSize').val(d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style("font-size").slice(0,-2));
    $('#textColorSelectorInput').val(rgb2hex(d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style("fill")));
    $('#textColorSelectorInput').trigger('change');
    if(d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr('text-anchor')=='middle'){
      $('#alignment button').removeClass("btn-success").addClass("btn-default");
      $('#alB2').addClass("btn-success").removeClass("btn-default");
    } else if (d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr('text-anchor')=='end') {
      $('#alignment button').removeClass("btn-success").addClass("btn-default");
      $('#alB1').addClass("btn-success").removeClass("btn-default");
    } else {
      $('#alignment button').removeClass("btn-success").addClass("btn-default");
      $('#alB3').addClass("btn-success").removeClass("btn-default");
    }
    //adjust selected font
    var transformString = d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr("transform");
    if(transformString == null){
      $('#verticalPadding').val('0');
    } else{
      transformString  = transformString.slice(transformString.indexOf(',')+1);
      transformString = transformString.slice(0,-1);
      $('#verticalPadding').val(transformString);
    }
    //open modal
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

function isNumeric(val) {
  var _val = +val;
  return (val !== val + 1) //infinity check
  && (_val === +val) //Cute coercion check
  && (typeof val !== 'object') //Array/object check
  && (val.replace(/\s/g,'') !== '') //Empty
  && (val.slice(-1) !== '.') //Decimal without Number
}

//Function to convert hex format to a rgb color
function rgb2hex(rgb){
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
  return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}

function prepareSvg(){
  //zoom and drag  need to be performed on a 'g'
  d3.select('svg').call(d3.zoom().on("zoom", function () {
    d3.select('#mainGroup').attr("transform", d3.event.transform);
  }));

  //reset nodeCounter
  nodeCounter = 0;
  while (d3.select(`#nodeGroup${nodeCounter}`).empty() == false) {
    nodeCounter++;
  }

  //listner for hover and drag of nodes. Probably causing that jumping behaviour...
  d3.selectAll('.nodeGroup').datum({
    x: 0,
    y: 0
  })
  .call(d3.drag()
  .on("start", dragstarted)
  .on("drag", dragged)
  .on("end", dragended))
  .on("mouseover", handleMouseOver)
  .on("mouseout", handleMouseOut);

  //listener for text change
  d3.selectAll('.node').on('click', function() {
    nodeInEdit = parseInt(this.parentNode.id.substring(9,this.parentNode.id.length));
    if (d3.select(this.parentNode).selectAll('.textEntry').text().length > 0) {
      $('#textInputforNode').val(d3.select(this.parentNode).selectAll('.textEntry').text());
    } else {
      $('#textInputforNode').val('');
    }
    $('#openTextForNodeModal').trigger('click');
  });

  d3.selectAll('.textEntry').on('click', function() {
    nodeInEdit = parseInt(this.parentNode.id.substring(9,this.parentNode.id.length));
    if (d3.select(this).text().length > 0) {
      $('#textInputforNode').val(d3.select(this).text());
    } else {
      $('#textInputforNode').val('');
    }
    $('#openTextForNodeModal').trigger('click');
  });

  //this really needs a rework...
  for (var i = 0; i < nodeCounter; i++) {

    //listener for connection
    d3.selectAll('.connect'+ i).on('click', function() {
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
          var lineSpace = d3.select('.lineSpace');
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
        d3.selectAll('.nodeGroup').raise();
      }
    });
  }

  //listener for delete node
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

  //listener for node color
  d3.selectAll('.showNodeColorModal').on('click', function() {
    nodeInColorchange = parseInt(this.parentNode.id.substring(9, this.parentNode.id.length));
    colorOld = d3.select('#nodeGroup' + nodeInColorchange).selectAll('.node').style('fill').toString();
    $('#openNodeColorModal').trigger('click');
  });

  //listener for text props
  d3.selectAll('.textProps').on('click', function() {
    nodeInEdit = parseInt(this.parentNode.id.substring(9, this.parentNode.id.length));
    //set current props in modal
    $('#fontSize').val(d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style("font-size").slice(0,-2));
    $('#textColorSelectorInput').val(rgb2hex(d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').style("fill")));
    $('#textColorSelectorInput').trigger('change');
    if(d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr('text-anchor')=='middle'){
      $('#alignment button').removeClass("btn-success").addClass("btn-default");
      $('#alB2').addClass("btn-success").removeClass("btn-default");
    } else if (d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr('text-anchor')=='end') {
      $('#alignment button').removeClass("btn-success").addClass("btn-default");
      $('#alB1').addClass("btn-success").removeClass("btn-default");
    } else {
      $('#alignment button').removeClass("btn-success").addClass("btn-default");
      $('#alB3').addClass("btn-success").removeClass("btn-default");
    }
    //adjust selected font
    var transformString = d3.select('#nodeGroup' + nodeInEdit).selectAll('.textEntry').attr("transform");
    if(transformString == null){
      $('#verticalPadding').val('0');
    } else{
      transformString  = transformString.slice(transformString.indexOf(',')+1);
      transformString = transformString.slice(0,-1);
      $('#verticalPadding').val(transformString);
    }
    //open modal
    $('#openTextPropsModal').trigger('click');
  });

  //listener for new node
  d3.select('.backgroundRect').on('click', function() {
    newNode(d3.select('#mainGroup'), d3.mouse(this));
  });

  //listener for delete line
  d3.selectAll('.deleteLine').on('click', function(){
    var node1 = d3.select(this).attr('id').substring(10);
    node1 = node1.substring(0, node1.indexOf('a'));
    var node2 = d3.select(this).attr('id').substring(10);
    node2 = node2.split('a')[1];
    $('#line'+node1+'a'+ node2).remove();
    d3.select(this).remove();
  });

}

function handleFiles(files) {
  var main_div = d3.select(".container");
  var svg;

  d3.select('svg').remove(); //delete previous svg (after user confirmed)

  //set name of new svg as title
  $('#mainTitle').html(files[0].name.slice(0, -4));
  $('#downloadSVGFile').attr('download', files[0].name);

  d3.xml(window.URL.createObjectURL(files[0]), function(error, documentFragment) {
    if (error) {console.log(error); return;}

    var svgNode = documentFragment
    .getElementsByTagName("svg")[0];

    main_div.node().appendChild(svgNode);

    svg = main_div.select("svg");

    prepareSvg();
  });
}
