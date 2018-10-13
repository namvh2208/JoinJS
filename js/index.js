var json=null;
var pointerType = "Screen";
var data=[];
var selectedData={id:0, text:""};
var graph = new joint.dia.Graph;
var selectedElement=null;
var paperScale=1;
var vueApp = null;
var linkMode = false;


var Person = {
                Name : "Bob",
                Age : 30,
                Weight : 213                
            };

alert(eval("(Person.Age < 3 && Person.Weight < 50) || Person.Age < 3"));	
			



$(function(){
	$("#shapes > li").click(function(){
		$(this).siblings(".active").removeClass("active");
		$(this).addClass("active");
		pointerType = $(this).text();
		
		linkMode = pointerType==="Link";
		paper.setInteractivity(!linkMode);
	})
	
	$("html").keydown(function(event){
		//delete Shape
		if ( event.keyCode == 46 && selectedElement!=null)
		{
			selectedElement.remove();
			selectedElement = null;
		}
		//Control
		else if(event.keyCode ==17)
		{
			linkMode = true;
			paper.setInteractivity(!linkMode);
		}
	}).keyup(function(event){
		//Control
		if(event.keyCode ==17)
		{
			linkMode = $("#linkMode").hasClass("active");
			paper.setInteractivity(!linkMode);
		}
	})
	
	$("#toJson").click(function(){
		json = graph.toJSON();
		console.log(json);
	})
	$("#fromJson").click(function(){
		graph.fromJSON(json);
	})
	
	$("#save").click(function(){
		var obj = save();
		var sourcecode = generateCode(obj);
		console.log(sourcecode);
	})
	
});


//Init VUE
vueApp = new Vue({
	el:"#settings",
	data:{
		element:selectedData
	},
	methods:{
		save:function()
		{	
			if(this.element.id!=0)
			{
				console.log("SAVE");
				Object.assign(selectedData, this.element);
				selectedElement.attr('label/text', this.element.text);
			}
		}
	},
	
	created: function(){console.log("CREATED");},
	mounted: function(){console.log("mounted");},
	destroyed: function(){console.log("destroyed");}
});




var paper = new joint.dia.Paper({
	el: document.getElementById("placeholder"),
	model:graph,
	width:1400,
	height:800,
	gridSize:20,
	drawGrid:true
});
paper.drawGrid({color:"#cccccc", thickness:1});
console.log(paper);




paper.on('blank:pointerdblclick', function(event){
	//var text = prompt("Node Label: ");
	addShape(pointerType, null, {x:event.offsetX, y:event.offsetY});
});
paper.on('blank:mousewheel', function(event, x, y, delta){
	paperScale += delta*.2;
	//paper.scale(paperScale, paperScale, x*paperScale,y*paperScale);
});
paper.on('cell:pointerclick', function(cellView) {
	resetAll(this);
    cellView.highlight();
	selectedElement = cellView.model;
	showSettings(cellView.model.id);
});



/*
//Create a new link by dragging
paper.on({
  'element:pointerdown': function(evt, x, y) {
	  if(linkMode)
	  {
		var link = new joint.dia.Link();
		link.set('source', { x: x, y: y });
		link.set('target', { x: x, y: y });
		link.addTo(graph);
		evt.data = { link: link, x: x, y: y };
	}
  },
  'blank:pointermove': function(evt, x, y) {
	if(linkMode)
		evt.data.link.set('target', { x: x, y: y });
  },
  'element:pointerup': function(evt) {
	if(linkMode)
	  {
		//var target = evt.data.link.get('target');
		evt.data.link.remove();
		}
	}
  
});
*/



paper.on({

	'element:pointerdown': function(elementView, evt) {
		if(linkMode)
		{
			evt.data = elementView.model.position();
		}
	},

	'element:pointerup': function(elementView, evt, x, y) {
		if(linkMode)
		{
			var coordinates = new g.Point(x, y);
			var elementAbove = elementView.model;
			var elementBelow = this.model.findModelsFromPoint(coordinates).find(function(el) {
				return (el.id !== elementAbove.id);
			});

			// If the two elements are connected already, don't
			// connect them again (this is application-specific though).
			if (elementBelow && graph.getNeighbors(elementBelow).indexOf(elementAbove) === -1) {

				// Move the element to the position before dragging.
				elementAbove.position(evt.data.x, evt.data.y);

				// Create a connection between elements.
				var link = new joint.shapes.standard.Link({
					attrs:{
						line:{strokeWidth:1, stroke:"#cccccc"}
					}
				});
				link.source(elementAbove);
				link.target(elementBelow);
				link.addTo(graph);
				
				data.push({
					id:link.id,
					//text:text,
					type:"Link"});
				
				// Add remove button to the link.
				/*var tools = new joint.dia.ToolsView({
					tools: [new joint.linkTools.Remove()]
				});
				link.findView(this).addTools(tools);*/
			}
		}
	}
});





/*
//Linking logic
paper.on({

	'element:pointerdown': function(elementView, evt) {

		evt.data = elementView.model.position();
	},

	'element:pointerup': function(elementView, evt, x, y) {

		var coordinates = new g.Point(x, y);
		var elementAbove = elementView.model;
		var elementBelow = this.model.findModelsFromPoint(coordinates).find(function(el) {
			return (el.id !== elementAbove.id);
		});

		// If the two elements are connected already, don't
		// connect them again (this is application-specific though).
		if (elementBelow && graph.getNeighbors(elementBelow).indexOf(elementAbove) === -1) {

			// Move the element to the position before dragging.
			elementAbove.position(evt.data.x, evt.data.y);

			// Create a connection between elements.
			var link = new joint.shapes.standard.Link({
				attrs:{
					line:{strokeWidth:1, stroke:"#cccccc"}
				}
			});
			link.source(elementAbove);
			link.target(elementBelow);
			link.addTo(graph);
			
			data.push({
				id:link.id,
				//text:text,
				type:"Link"});
			
			// Add remove button to the link.
			//var tools = new joint.dia.ToolsView({
			//	tools: [new joint.linkTools.Remove()]
			//});
			//link.findView(this).addTools(tools);
		}
	}
});
*/

function resetAll(paper) {
    paper.drawBackground({
        color: 'white'
    })

    var elements = paper.model.getElements();
    for (var i = 0, ii = elements.length; i < ii; i++) {
        var currentElement = elements[i];
		var cellView = paper.findViewByModel(currentElement);
        cellView.unhighlight();
    }

    var links = paper.model.getLinks();
    for (var j = 0, jj = links.length; j < jj; j++) {
        var currentLink = links[j];
		var cellView = paper.findViewByModel(currentLink);
        cellView.unhighlight();
    }
}
function showSettings(id)
{

	let filter = data.filter(x=>x.id == id);
	if(filter.length>0)
	{
		selectedData = filter[0];
		vueApp.element = Object.assign({},selectedData);
	}
}




function addShape(type, text, pos)
{
	switch(type.toUpperCase())
	{
		case "SCREEN": 
			addScreen(text, pos);
		break;
		
		case "DATATRANSFORM":
			addDataTransform(text, pos);
		break;
		
		case "CONDITION":
			addCondition(text, pos);
		break;
		
		case "START":
			addStart(pos);
		break;
		
		case "END":
			addEnd(pos);
		break;
	}
}

function addScreen(text, pos)
{
	var m1 = new joint.shapes.standard.Rectangle({
		position: { x: pos.x, y: pos.y },
		size: { width: 100, height: 60 },
		attrs: {
			label: { text: text },
			rect: { fill: '#b2ffbc', rx:8, ry:8},
			body:{strokeWidth:1, stroke:"#cccccc"}
		}
	});
	graph.addCell(m1);
	
	
	/*
	var m1 = new joint.shapes.devs.Model({
		position: { x: pos.x, y: pos.y },
		size: { width: 160, height: 80 },
		inPorts: ['in1','in2', 'in3'],
		outPorts: ['out'],
		ports: {
			groups: {
				'in': {
					attrs: {
						'.port-body': {
							fill: '#16A085'
						}
					}
				},
				'out': {
					attrs: {
						'.port-body': {
							fill: '#E74C3C'
						}
					}
				}
			}
		},
		attrs: {
			'.label': { text: text, 'ref-x': .5, 'ref-y': .2 },
			rect: { fill: '#95d66d', rx:8, ry:8,}
		}
	});
	graph.addCell(m1);*/
	/*rect.addPort({ 
		attrs: { 
			text: { text: 'L' + 1 }, 
			circle: {fill: '#ccc', stroke: '#31d0c6', 'stroke-width': 2, r: 2 , magnet: true } 
		}, 
		group: 'a' 
	});
	rect.addPort({
		groups: {
			'a': {
				position: {
					name: 'top',
					args: { dr: 0, dx: 0, dy: -9 }
				},
				label: { position: { name: 'left', args: { offset: 12 } } },
				attrs: {
					circle: { fill: '#555', stroke: '#31d0c6', 'stroke-width': 1, r: 5 },
					text: { fill: '#6a6c8a' }
				}
			}
		}
	});*/
	
	//rect.addTo(graph);
	//console.log(rect);
	//Create data element
	data.push({
		id:m1.id,
		text:text,
		type:"Screen"});
		
}
function addDataTransform(text, pos)
{

	var m1 = new joint.shapes.standard.Rectangle({
		position: { x: pos.x, y: pos.y },
		size: { width: 100, height: 60 },
		attrs: {
			label: { text: text },
			rect: { fill: '#fffad0', rx:8, ry:8},
			body:{strokeWidth:1, stroke:"#cccccc"}
		}
	});
	graph.addCell(m1);
		
	//Create data element
	data.push({
		id:m1.id,
		text:text,
		type:"DataTransform"});
}

function addCondition(text, pos)
{
	var polygon = new joint.shapes.standard.Polygon();
	polygon.resize(100, 60);
	polygon.position(pos.x, pos.y);
	polygon.attr('root/title', 'joint.shapes.standard.Polygon');
	polygon.attr('label/text', text);
	polygon.attr('body/refPoints', '0,10 10,0 20,10 10,20');
	polygon.attr('body/strokeWidth', 1);
	polygon.attr('body/stroke', "#cccccc");
	polygon.attr('body/fill', "#ffe5ca");
	
	polygon.addTo(graph);
	
	data.push({
		id:polygon.id,
		text:text,
		type:"Condition"});
	
}


function addStart(pos)
{
	var m1 = new joint.shapes.standard.Circle({
		position: { x: pos.x, y: pos.y },
		size: { width: 60, height: 60 },
		attrs: {
			label: { text: "Start" },
			body:{fill:"#b2ffbc", strokeWidth:1, stroke:"#cccccc"}
		}
	});
	
	data.push({
		id:m1.id,
		text:"Start",
		type:"Start"});
	
	graph.addCell(m1);
}

function addEnd(pos)
{
	var m1 = new joint.shapes.standard.Circle({
		position: { x: pos.x, y: pos.y },
		size: { width: 60, height: 60 },
		attrs: {
			label: { text: "End" },
			body:{fill:"#ffcece", strokeWidth:1, stroke:"#cccccc"}
		}
	});
	
	data.push({
		id:m1.id,
		text:"End",
		type:"End"});
	
	graph.addCell(m1);
}


/************************************************/
function save(){
	//convert graph to JSON and store it in the global var json
	json = graph.toJSON();
	
	var links = []
	var elements = [];
	
	//loop through the json.cells array
	//if the cell type is standard.Link, then push target and source to links array
	//else, pull the associated data from global data array and push to elements array
	for(var i = 0; i<json.cells.length; i++)
	{
		var cell = json.cells[i];
	
		var tmpData = data.filter(x => x.id === cell.id);
		if(tmpData.length>0)
		{
			
			if(cell.type ==="standard.Link")
			{
				links.push(Object.assign(tmpData[0],
					{
						id:cell.id,
						source:cell.source.id,
						target:cell.target.id
					})
				);
			}
			else
			{
				elements.push(tmpData[0]);
			}
			
		}
		
	}
	
	//return links and elements 
	var result = {links:links, elements:elements};
	console.log(result);
	return result;
	
}


function generateCode(obj)
{
	var code="";
	//for each element in obj.elements, generate a function <Type>_<Id>()
	for(var i = 0; i< obj.elements.length; i++)
	{
		var elem = obj.elements[i];
		var func_name = getFuncName(elem);
		var func_body = generateFuncBody(obj, elem);
		var func_code = "public void "+func_name + "(){\n" + func_body + "\n}";
		code+=func_code+"\n\n\n";
	}
	
	return code;
}

function generateFuncBody(obj, elem)
{
	var source = "";
	
	//Execute main job of the current function
	switch(elem.type)
	{
		case "Start": break;
		case "End": break;
		case "Condition": break;
		case "Screen":
			source += '\tShowScreen("'+elem.id+'");';
			break;
		case "DataTransform":
			source += '\tExecuteDataTransform("'+elem.id+'");';
			break;
	}
	
	//loop thru obj.links array, find all targets of the current elem
	var links = obj.links.filter(x=>x.source === elem.id);
	for(var i=0; i<links.length; i++)
	{
		var link = links[i]; 
		var target_elem = obj.elements.filter(x=>x.id ===link.target)[0];
		var target_func_name = getFuncName(target_elem);;
		var condition = link.condition==null?"true":link.condition;
		
		if(i==0)
			source+= "\n\tif(" + condition + ") {\n\t\t"+ target_func_name +"();\n\t}\n";
		else
			source+= "\n\telse if(" + condition + ") {\n\t\t"+ target_func_name +"();\n\t}\n";
		
	}
	
	return source;
}

function getFuncName(elem)
{
	return elem.type==="Start"? elem.type: elem.type + "_" + elem.id.replace(/-/g, "_");
}