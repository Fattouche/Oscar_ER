var entities = {};
var myDiagram;

function init() {
  if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;

  myDiagram =
    $(go.Diagram, "myDiagramDiv",
      {
	"toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
        initialContentAlignment: go.Spot.Center,
	  initialDocumentSpot: go.Spot.TopCenter,
        "undoManager.isEnabled": true,
	  initialViewportSpot: go.Spot.Center,
	  initialAutoScale: go.Diagram.Uniform,
        layout: $(go.GridLayout)
      });
  		
  myDiagram.nodeTemplateMap = new go.Map("string", go.Node);

  // show visibility or access as a single character at the beginning of each property or method
  function convertVisibility(v) {
    switch (v) {
      case "public": return "+";
      case "private": return "-";
      case "protected": return "#";
      case "package": return "~";
      default: return v;
    }
  }

  // the item template for properties
  var propertyTemplate =
    $(go.Panel, "Horizontal",
      // property visibility/access
      $(go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding("text", "visibility", convertVisibility)),
      // property name, underlined if scope=="class" to indicate static property
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "name").makeTwoWay(),
        new go.Binding("isUnderline", "scope", function(s) { return s[0] === 'c' })),
      // property type, if known
      $(go.TextBlock, "",
        new go.Binding("text", "type", function(t) { return (t ? ": " : ""); })),
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "type").makeTwoWay()),
      // property default value, if any
      $(go.TextBlock,
        { isMultiline: false, editable: false },
        new go.Binding("text", "default", function(s) { return s ? " = " + s : ""; }))
    );

  // the item template for methods
  var methodTemplate =
    $(go.Panel, "Horizontal",
      // method visibility/access
      $(go.TextBlock,
        { isMultiline: false, editable: false, width: 12 },
        new go.Binding("text", "visibility", convertVisibility)),
      // method name, underlined if scope=="class" to indicate static method
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "name").makeTwoWay(),
        new go.Binding("isUnderline", "scope", function(s) { return s[0] === 'c' })),
      // method parameters
      $(go.TextBlock, "()",
        // this does not permit adding/editing/removing of parameters via inplace edits
        new go.Binding("text", "parameters", function(parr) {
            var s = "(";
            for (var i = 0; i < parr.length; i++) {
              var param = parr[i];
              if (i > 0) s += ", ";
              s += param.name + ": " + param.type;
            }
            return s + ")";
        })),
      // method return type, if any
      $(go.TextBlock, "",
        new go.Binding("text", "type", function(t) { return (t ? ": " : ""); })),
      $(go.TextBlock,
        { isMultiline: false, editable: true },
        new go.Binding("text", "type").makeTwoWay())
    );

	var entityNodeCategory = "entity";	
    myDiagram.nodeTemplateMap.add(entityNodeCategory, 
      $(go.Node, "Auto", new go.Binding("visible", "entityVisibility"),
        {
          locationSpot: go.Spot.Center,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides
        },
		{
        contextMenu:     // define a context menu for each node
          $(go.Adornment, "Vertical",  // that has one button
            $("ContextMenuButton",
              $(go.TextBlock, "hide"),
              {alignment: go.Spot.Bottom, alignmentFocus: go.Spot.Top, click: cmCommand}),
			$("ContextMenuButton",
              $(go.TextBlock, "expand"),
              {alignment: go.Spot.Bottom, alignmentFocus: go.Spot.Top, click: cmCommand})
          )  
		},
        $(go.Shape, { fill: "lightyellow" }),
        $(go.Panel, "Table",
          { defaultRowSeparatorStroke: "black" },
          // header
          $(go.TextBlock,
            {
              row: 0, columnSpan: 2, margin: 3, alignment: go.Spot.Center,
              font: "bold 12pt sans-serif",
              isMultiline: false, editable: true
            },
            new go.Binding("text", "name").makeTwoWay()),
          // properties
          $(go.TextBlock, "Properties",
            { row: 1, font: "italic 10pt sans-serif" },
            new go.Binding("visible", "visible", function(v) { return !v; }).ofObject("PROPERTIES")),
          $(go.Panel, "Vertical", { name: "PROPERTIES" },
            new go.Binding("itemArray", "properties"),
            {
              row: 1, margin: 3, stretch: go.GraphObject.Fill,
              defaultAlignment: go.Spot.Left, background: "lightyellow",
              itemTemplate: propertyTemplate
            }
          ),
          $("PanelExpanderButton", "PROPERTIES",
            { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
            new go.Binding("visible", "properties", function(arr) { return arr.length > 0; })),
          // methods
          $(go.TextBlock, "Methods",
            { row: 2, font: "italic 10pt sans-serif" },
            new go.Binding("visible", "visible", function(v) { return !v; }).ofObject("METHODS")),
          $(go.Panel, "Vertical", { name: "METHODS" },
            new go.Binding("itemArray", "methods"),
            {
              row: 2, margin: 3, stretch: go.GraphObject.Fill,
              defaultAlignment: go.Spot.Left, background: "lightyellow",
              itemTemplate: methodTemplate
            }
          ),
          $("PanelExpanderButton", "METHODS",
            { row: 2, column: 1, alignment: go.Spot.TopRight, visible: false },
            new go.Binding("visible", "methods", function(arr) { return arr.length > 0; }))
        )
      )
	);
  	  

  function convertIsTreeLink(r) {
    return r === "generalization";
  }

  function convertFromArrow(r) {
    switch (r) {
      case "generalization": return "";
      default: return "";
    }
  }

  function convertToArrow(r) {
    switch (r) {
      case "generalization": return "Triangle";
      case "aggregation": return "StretchedDiamond";
      default: return "";
    }
  }

  myDiagram.linkTemplate =
    $(go.Link,
      { routing: go.Link.Orthogonal },
      new go.Binding("isLayoutPositioned", "relationship", convertIsTreeLink),
      $(go.Shape),
      $(go.Shape, { scale: 1.3, fill: "white" },
        new go.Binding("fromArrow", "relationship", convertFromArrow)),
      $(go.Shape, { scale: 1.3, fill: "white" },
        new go.Binding("toArrow", "relationship", convertToArrow))
    );

	
    var xmlHttp_tabledata = new XMLHttpRequest();
    xmlHttp_tabledata.onreadystatechange = function() { 
      if (xmlHttp_tabledata.readyState == 4 && xmlHttp_tabledata.status == 200) {
            data = JSON.parse(xmlHttp_tabledata.responseText);
            var nodedata = data.tables;
			for (var i in nodedata) {
				entities[nodedata[i]["name"]] = nodedata[i]["key"];				
				nodedata[i]["category"] = entityNodeCategory;
			}
            var linkdata = data.links;
            myDiagram.model = $(go.GraphLinksModel,
              {
                copiesArrays: true,
                copiesArrayObjects: true,
                nodeDataArray: nodedata,
                linkDataArray: linkdata
              });
  	  }
    }
  
  xmlHttp_tabledata.open("GET", "/tabledata", true); // true for asynchronous 
  xmlHttp_tabledata.send(null);
      


}//end init
  
function exportImage(){
	var img = myDiagram.makeImage({
		background: "rgba(255,255, 255, 255)",
		scale:1
	});  
	var a  = document.createElement('a');
	a.href = img.src;
	a.download = 'ERScreenShot.png';
	a.click();
}

//hide all entities
function hideAll(){
  var nodeDataArray = myDiagram.model.nodeDataArray;
  document.getElementById('entityList').innerHTML = "";
  for (var i in nodeDataArray) {
    if (nodeDataArray[i] != undefined) {
      setVisibility(nodeDataArray[i]["name"], false);
    }
  };
}//end hideAll

//show all entities
function showAll(){
  var nodeDataArray = myDiagram.model.nodeDataArray;
  document.getElementById('entityList').innerHTML = "";
  for (var i in nodeDataArray) {
    if (nodeDataArray[i] != undefined) {
      setVisibility(nodeDataArray[i]["name"], true);
    }
  };
}//end showAll

//sets visibility
function setVisibility(entityName, isSelected) {
  var entityKey = entities[entityName];
  myDiagram.model.startTransaction("change_entity_visibility");
  var data = myDiagram.model.findNodeDataForKey(entityKey);
  if (data != null) 
    myDiagram.model.setDataProperty(data, "entityVisibility", isSelected);
  myDiagram.model.commitTransaction("change_entity_visibility");

  //if element is not visible, create a checkbox 
  if(isSelected == false){
      var button = document.createElement('button');
		button.className = "myButton";
        button.textContent = entityName;
        button.onclick = function(cb) {
            setVisibility(button.textContent, true);
            button.parentNode.removeChild(button);
            label.parentNode.removeChild(label);
        } 
        var div = document.getElementById("entityList");
        var label = document.createElement('label')
        label.htmlFor = "id";
        label.appendChild(document.createTextNode(button.name));
        
        div.appendChild(button);
        div.appendChild(label);
  }
}

function cmCommand(e, obj){
	var node = obj.part.adornedPart;
	var button = obj.elt(1);
	if(button.text=="hide"){
		setVisibility(node.data.name, false);
	}else if(button.text=="expand"){
		//expand in here Cailan
	}
}

function ChangeLayout(){
	 var layout = document.getElementById("layout").value;
	 myDiagram.startTransaction("Change Layout");
	 switch(layout){
		case "force-directed":
			myDiagram.layout = new go.ForceDirectedLayout();
			break;
		case "circular": 
			myDiagram.layout = new go.CircularLayout();
			break;
		case "tree":
			myDiagram.layout = new go.TreeLayout();
			break;
		case "layered-digraph":
			myDiagram.layout = new go.LayeredDigraphLayout();
			break;
		default:
			myDiagram.layout = new go.GridLayout();
	 }
	 myDiagram.commitTransaction("Change Layout");
}
