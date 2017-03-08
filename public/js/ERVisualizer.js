var lister = [];
var myDiagram;
var saved = {};
var attributesHidden = false;
var data;
var onHighLevelView = true;

function init() {


    if (window.goSamples) goSamples(); // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;
    saved.level = "HIGH";

    myDiagram =
        $(go.Diagram, "myDiagramDiv", {
            "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
            initialContentAlignment: go.Spot.Center,
            initialDocumentSpot: go.Spot.TopCenter,
            "undoManager.isEnabled": true,
            initialViewportSpot: go.Spot.Center,
            initialAutoScale: go.Diagram.Uniform,
        });

    myDiagram.nodeTemplateMap = new go.Map("string", go.Node);

    // show visibility or access as a single character at the beginning of each property or method
    function convertVisibility(v) {
        switch (v) {
            case "public":
                return "+";
            case "private":
                return "-";
            case "protected":
                return "#";
            case "package":
                return "~";
            default:
                return v;
        }
    } //end convertVisibility

    // The item template for properties - this code was provided by GoJS templates
    var propertyTemplate =
        $(go.Panel, "Horizontal",
            // property visibility/access
            $(go.TextBlock, {
                    isMultiline: false,
                    editable: false,
                    width: 12
                },
                new go.Binding("text", "visibility", convertVisibility)), //binding to allow nodes to be hidden
            // property name, underlined if scope=="class" to indicate static property
            $(go.TextBlock, {
                    isMultiline: false,
                    editable: false
                },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("isUnderline", "scope", function(s) {
                    return s[0] === 'c'
                })),
            // property type, if known
            $(go.TextBlock, "",
                new go.Binding("text", "type", function(t) {
                    return (t ? ": " : "");
                })),
            $(go.TextBlock, {
                    isMultiline: false,
                    editable: false
                },
                new go.Binding("text", "type").makeTwoWay()),
            // property default value, if any
            $(go.TextBlock, {
                    isMultiline: false,
                    editable: false
                },
                new go.Binding("text", "default", function(s) {
                    return s ? " = " + s : "";
                }))
        );

    // The item template for methods - this code was provided by GoJS templates
    var methodTemplate =
        $(go.Panel, "Horizontal",
            // method visibility/access
            $(go.TextBlock, {
                    isMultiline: false,
                    editable: false,
                    width: 12
                },
                new go.Binding("text", "visibility", convertVisibility)),
            // method name, underlined if scope=="class" to indicate static method
            $(go.TextBlock, {
                    isMultiline: false,
                    editable: false
                },
                new go.Binding("text", "name").makeTwoWay(),
                new go.Binding("isUnderline", "scope", function(s) {
                    return s[0] === 'c'
                })),
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
                new go.Binding("text", "type", function(t) {
                    return (t ? ": " : "");
                })),
            $(go.TextBlock, {
                    isMultiline: false,
                    editable: false
                },
                new go.Binding("text", "type").makeTwoWay())
        );

    var lowLevelEntity = "lowLevelEntity";
    // The majority of this call was provided by GoJS templates
    myDiagram.nodeTemplateMap.add(lowLevelEntity,
        $(go.Node, "Auto", new go.Binding("visible", "entityVisibility"), {
                visible: false,
                locationSpot: go.Spot.Center,
                fromSpot: go.Spot.AllSides,
                toSpot: go.Spot.AllSides
            },
            new go.Binding("location", "loc", go.Point.parse), {
                contextMenu: // define a context menu for each node
                    $(go.Adornment, "Vertical", // that has one button
                        $("ContextMenuButton",
                            $(go.TextBlock, "hide"), {
                                alignment: go.Spot.Bottom,
                                alignmentFocus: go.Spot.Top,
                                click: cmCommand
                            }),
                        $("ContextMenuButton",
                            $(go.TextBlock, "expand"), {
                                alignment: go.Spot.Bottom,
                                alignmentFocus: go.Spot.Top,
                                click: cmCommand
                            })
                    )
            },
            $(go.Shape, {
                    fill: "lightyellow"
                },
                new go.Binding("fill", "isHighlighted", function(h) {
                    return h ? "#00FF00" : "lightyellow";
                }).ofObject()),
            $(go.Panel, "Table", {
                    defaultRowSeparatorStroke: "black"
                },
                // header
                $(go.TextBlock, {
                        row: 0,
                        columnSpan: 2,
                        margin: 3,
                        alignment: go.Spot.Center,
                        font: "bold 12pt sans-serif",
                        isMultiline: false,
                        editable: false
                    },
                    new go.Binding("text", "name").makeTwoWay()),
                // properties
                $(go.TextBlock, "Properties", {
                        row: 1,
                        font: "italic 10pt sans-serif"
                    },
                    new go.Binding("visible", "visible", function(v) {
                        return !v;
                    }).ofObject("PROPERTIES")),
                $(go.Panel, "Vertical", {
                        name: "PROPERTIES"
                    },
                    new go.Binding("fill", "isHighlighted", function(h) {
                        return h ? "#00FF00" : "lightyellow";
                    }).ofObject(),
                    new go.Binding("itemArray", "properties"), {
                        row: 1,
                        margin: 3,
                        stretch: go.GraphObject.Fill,
                        defaultAlignment: go.Spot.Left,
                        itemTemplate: propertyTemplate
                    }
                )
                // ,
                // $("PanelExpanderButton", "PROPERTIES",
                //   { row: 1, column: 1, alignment: go.Spot.TopRight, visible: true },
                //   new go.Binding("visible", "properties", function(arr) { return arr.length > 0; }))
            )
        )
    );

    var highLevelEntity = "highLevelEntity";
    myDiagram.nodeTemplateMap.add(highLevelEntity,
        $(go.Node, "Auto", new go.Binding("visible", "entityVisibility"), {
                visible: true,
                locationSpot: go.Spot.Center,
                fromSpot: go.Spot.AllSides,
                toSpot: go.Spot.AllSides
            },
            new go.Binding("location", "loc", go.Point.parse), {
                contextMenu: // define a context menu for each node
                    $(go.Adornment, "Vertical", // that has one button
                        $("ContextMenuButton",
                            $(go.TextBlock, "hide"), {
                                alignment: go.Spot.Bottom,
                                alignmentFocus: go.Spot.Top,
                                click: cmCommand
                            }),
                        $("ContextMenuButton",
                            $(go.TextBlock, "drill"), {
                                alignment: go.Spot.Bottom,
                                alignmentFocus: go.Spot.Top,
                                click: drillInto
                            })
                    )
            },
            $(go.Shape, {
                    fill: "lightsalmon"
                },
                new go.Binding("fill", "isHighlighted", function(h) {
                    return h ? "#00FF00" : "lightsalmon";
                }).ofObject()),
            $(go.Panel, "Table", {
                    defaultRowSeparatorStroke: "black"
                },
                // header
                $(go.TextBlock, {
                        row: 0,
                        columnSpan: 2,
                        margin: 3,
                        alignment: go.Spot.Center,
                        font: "bold 12pt sans-serif",
                        isMultiline: false,
                        editable: true
                    },
                    new go.Binding("text", "name").makeTwoWay()),
                // properties
                $(go.TextBlock, "Properties", {
                        row: 1,
                        font: "italic 10pt sans-serif"
                    },
                    new go.Binding("visible", "visible", function(v) {
                        return !v;
                    }).ofObject("PROPERTIES")),
                $(go.Panel, "Vertical", {
                        name: "PROPERTIES"
                    },
                    new go.Binding("fill", "isHighlighted", function(h) {
                        return h ? "#00FF00" : "lightsalmon";
                    }).ofObject(),
                    new go.Binding("itemArray", "properties"), {
                        row: 1,
                        margin: 3,
                        stretch: go.GraphObject.Fill,
                        defaultAlignment: go.Spot.Left,
                        itemTemplate: propertyTemplate
                    }
                )
                //        ,
                //        $("PanelExpanderButton", "PROPERTIES",
                //          { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
                //          new go.Binding("visible", "properties", function(arr) { 
                // 	return arr.length > 0; 
                // }))
            )
        )
    );


    var highLevelRelationship = "highLevelRelationship";
    myDiagram.nodeTemplateMap.add(highLevelRelationship,
        $(go.Node, "Auto", new go.Binding("visible", "entityVisibility"), {
                visible: true,
                locationSpot: go.Spot.Center,
                fromSpot: go.Spot.AllSides,
                toSpot: go.Spot.AllSides
            },
            new go.Binding("location", "loc", go.Point.parse), {
                contextMenu: // define a context menu for each node
                    $(go.Adornment, "Vertical", // that has one button
                        $("ContextMenuButton",
                            $(go.TextBlock, "hide"), {
                                alignment: go.Spot.Bottom,
                                alignmentFocus: go.Spot.Top,
                                click: cmCommand
                            }),
                        $("ContextMenuButton",
                            $(go.TextBlock, "drill"), {
                                alignment: go.Spot.Bottom,
                                alignmentFocus: go.Spot.Top,
                                click: drillInto
                            })
                    )
            },
            $(go.Shape, "Diamond", {
                    fill: "lightblue"
                },
                new go.Binding("fill", "isHighlighted", function(h) {
                    return h ? "#00FF00" : "lightblue";
                }).ofObject()),
            $(go.Panel, "Table", {
                    defaultRowSeparatorStroke: "black"
                },
                // header
                $(go.TextBlock, {
                        row: 0,
                        columnSpan: 2,
                        margin: 3,
                        alignment: go.Spot.Center,
                        font: "bold 12pt sans-serif",
                        isMultiline: false,
                        editable: true
                    },
                    new go.Binding("text", "name").makeTwoWay()),
                // properties
                $(go.TextBlock, "Properties", {
                        row: 1,
                        font: "italic 10pt sans-serif"
                    },
                    new go.Binding("visible", "visible", function(v) {
                        return !v;
                    }).ofObject("PROPERTIES")),
                $(go.Panel, "Vertical", {
                        name: "PROPERTIES"
                    },
                    new go.Binding("fill", "isHighlighted", function(h) {
                        return h ? "#00FF00" : "lightblue";
                    }).ofObject(),
                    new go.Binding("itemArray", "properties"), {
                        row: 1,
                        margin: 3,
                        stretch: go.GraphObject.Fill,
                        defaultAlignment: go.Spot.Left,
                        itemTemplate: propertyTemplate
                    }
                )
                // ,
                // $("PanelExpanderButton", "PROPERTIES",
                //   { row: 1, column: 1, alignment: go.Spot.TopRight, visible: false },
                //   new go.Binding("visible", "properties", function(arr) { return arr.length > 0; }))
            )
        )
    );

    // This function was provided by GoJS templates
    function convertIsTreeLink(r) {
        return r === "generalization";
    }

    // This function was provided by GoJS templates
    function convertFromArrow(r) {
        switch (r) {
            case "generalization":
                return "";
            default:
                return "";
        }
    }

    // This function was provided by GoJS templates
    function convertToArrow(r) {
        switch (r) {
            case "generalization":
                return "Triangle";
            case "aggregation":
                return "StretchedDiamond";
            default:
                return "";
        }
    }

    // The item template for links
    myDiagram.linkTemplate =
        $(go.Link,
            $(go.Shape)
        );


    var xmlHttp_tabledata = new XMLHttpRequest();
    xmlHttp_tabledata.onreadystatechange = function() {
        if (xmlHttp_tabledata.readyState == 4 && xmlHttp_tabledata.status == 200) {
            var nodeData = []
            var linkData = []
            data = JSON.parse(xmlHttp_tabledata.responseText);
            if (data.data != null) {
                nodeData = data.data.highLevelNode;
                linkData = data.data.highLevelLink;
                attributesHidden = data.data.highLevelHidden;
                onHighLevelView = data.data.onHighLevelView;
            } else {
                //add high level tables to model
                for (var i in data.aEntities) {
                    var tableData = data.aEntities[i]
                    lister.unshift(tableData.name);
                    tableData.category = highLevelEntity;
                    nodeData.push(tableData);
                }
                
                for (var i in data.aRelationships) {
                    var tableData = data.aRelationships[i]
                    lister.unshift(tableData.name);
                    tableData.category = highLevelRelationship;
                    nodeData.push(tableData);
                }

                //add low level tables to model
                for (var i in data.tables) {
                    var tableData = data.tables[i]
                    lister.unshift(tableData.name);
                    tableData.category = lowLevelEntity;
                    nodeData.push(tableData);
                }
                //add high level links to model
                linkData = data.aLinks;

                //add low lovel links to model
                for (var i = 0; i < data.links.length; i++) {
                    linkData.push(data.links[i])
                }
            }
            myDiagram.model = $(go.GraphLinksModel, {
                copiesArrays: true,
                copiesArrayObjects: true,
                nodeDataArray: nodeData,
                linkDataArray: linkData
            });
            if (attributesHidden)
                hideAttributes();
            if (!onHighLevelView)
                createDrillOutButton();

            checkVisibility();
        }

    } //end onreadystatechange

    xmlHttp_tabledata.open("GET", "/tabledata", true); // true for asynchronous 
    xmlHttp_tabledata.send(null);

    var myOverview =
        $(go.Overview, "myOverviewDiv", // the HTML DIV element for the Overview
            {
                observed: myDiagram,
                contentAlignment: go.Spot.Center
            });
} //end init

function exportImageView() {
    var img = myDiagram.makeImage({
        background: "rgba(255, 255, 255, 255)",
    });
    var a = document.createElement('a');
    a.href = img.src;
    a.download = 'ERScreenShotView.png';
    a.click();
}

function exportImageFull() {
    var img = myDiagram.makeImage({
        background: "White",
        scale: 1,
    });
    var b = document.createElement('a');
    b.href = img.src;
    b.download = 'ERScreenShotFull.png';
    b.click();
}

function save(noAlert) {
    saved.database = data.database;
    saved.linkData = myDiagram.model.linkDataArray;
    saved.nodeData = myDiagram.model.nodeDataArray;
    saved.hidden = attributesHidden;
    saved.onHighLevelView = onHighLevelView;
    for (var i = 0; i < saved.nodeData.length; i++) {
        var node = myDiagram.findNodeForData(saved.nodeData[i]);
        var loc = node.location.copy();
        saved.nodeData[i].loc = loc.x + " " + loc.y;
    }
    var saveData = new XMLHttpRequest();
    saveData.open("POST", "/saveproject", true);
    saveData.setRequestHeader('Content-Type', 'application/json');
    saveData.send(JSON.stringify(saved));
    if (noAlert == undefined)
        alert("Your project has been saved");
}

//hide all entities
function hideAll() {
    var nodeDataArray = myDiagram.model.nodeDataArray;
    document.getElementById('entityList').innerHTML = "";
    for (var i in nodeDataArray) {
        if (nodeDataArray[i] != undefined) {
            setVisibility(nodeDataArray[i]["name"], false, nodeDataArray[i]);
        }
    };
} //end hideAll

//show all entities
function showAll() {
    var nodeDataArray = myDiagram.model.nodeDataArray;
    document.getElementById('entityList').innerHTML = "";
    for (var i in nodeDataArray) {
        if (nodeDataArray[i] != undefined) {
            setVisibility(nodeDataArray[i]["name"], true, nodeDataArray[i]);
        }
    };
} //end showAll

//sets visibility
function setVisibility(entityName, isSelected, data) {
    myDiagram.model.startTransaction("change_entity_visibility");
    if (data == null) {
        data = myDiagram.model.findNodeDataForKey(entityName);
    }
    if ((onHighLevelView && data.category == "highLevelEntity") || (onHighLevelView && data.category == "highLevelRelationship") || (!onHighLevelView && data.category == "lowLevelEntity")) {
        myDiagram.model.setDataProperty(data, "entityVisibility", isSelected);
        myDiagram.model.commitTransaction("change_entity_visibility");

        //if element is not visible, create a checkbox 
        if (isSelected == false) {
            var element = document.createElement('a');
            element.innerHTML = entityName;
            element.onclick = function(cb) {
                setVisibility(element.innerHTML, true, data);
                element.parentNode.removeChild(element);
            }

            var div = document.getElementById("entityList");
            div.appendChild(element);
        }
    } else {
        myDiagram.model.setDataProperty(data, "entityVisibility", false);
        myDiagram.model.commitTransaction("change_entity_visibility");
    }
} //end setVisibility

function checkVisibility() {
    myDiagram.startTransaction("checkVisibility");
    // get an iterator for all nodes
    var itr = myDiagram.nodes;
    while (itr.next()) {
        var node = itr.value;
        var visibility = node.visible;
        setVisibility(node.data.name, visibility, node.data);
    }
    myDiagram.commitTransaction("checkVisibility");
}

function cmCommand(e, obj) {
    var node = obj.part.adornedPart;
    var button = obj.elt(1);
    if (button.text == "hide") {
        setVisibility(node.data.name, false, node.data);
    } else if (button.text == "expand") {
        for (var i in node.data.incoming_links) {
            setVisibility(node.data.incoming_links[i], true, null);
        }
        for (var i in node.data.outgoing_links) {
            setVisibility(node.data.outgoing_links[i], true, null);
        }
    }
} //end cmCommand

function ChangeLayout() {
    var layout = document.getElementById("layout").value;
    myDiagram.startTransaction("Change Layout");
    switch (layout) {
        case "force-directed":
            myDiagram.layout = new go.ForceDirectedLayout();
            myDiagram.model.layout = "ForceDirected";
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
} //end changeLayout

function searchDiagram() { // called by button
    var input = document.getElementById("mySearch");
    if (!input) return;
    input.focus();

    // create a case insensitive RegExp from what the user typed
    var regex = new RegExp(input.value, "i");

    myDiagram.startTransaction("highlight search");
    myDiagram.clearHighlighteds();

    // search four different data properties for the string, any of which may match for success
    if (input.value) { // empty string only clears highlighteds collection
        var results = myDiagram.findNodesByExample({
            name: regex
        });
        myDiagram.highlightCollection(results);
        // try to center the diagram at the first node that was found
        if (results.count > 0) myDiagram.centerRect(results.first().actualBounds);
    }

    myDiagram.commitTransaction("highlight search");
} //end searchDiagram 


function hideAttributes() {
    var toggleButton = document.getElementById("attributeToggle");

    if (toggleButton.innerHTML == "Show Attributes") {
        showAttributes();
        toggleButton.innerHTML = "Hide Attributes"
        return;
    }

    toggleButton.innerHTML = "Show Attributes";
    attributesHidden = true;
    myDiagram.startTransaction("hideAllAttributes");

    // get an iterator for all nodes
    var itr = myDiagram.nodes;
    while (itr.next()) {
        var node = itr.value;
        var properties = node.findObject("PROPERTIES");
        properties.visible = false;
    }
    myDiagram.commitTransaction("hideAllAttributes");
} //end hideAttributes


function showAttributes() {
    attributesHidden = false;
    myDiagram.startTransaction("showAllAttributes");

    // get an iterator for all nodes
    var itr = myDiagram.nodes;
    while (itr.next()) {
        var node = itr.value;
        var properties = node.findObject("PROPERTIES");
        properties.visible = true;
    }
    myDiagram.commitTransaction("showAllAttributes");
} //end showAttributes

function drillInto(e, obj) {
    onHighLevelView = false;

    myDiagram.startTransaction("drillInto");
    var itr = myDiagram.nodes;

    //set visibility of high level nodes to false
    while (itr.next()) {
        var node = itr.value;
        if (node.data.category === "highLevelEntity" || node.data.category === "highLevelRelationship")
            setVisibility(node.data.name, false, node.data);
        // node.visible = false;
    }

    var drilledNode = obj.part.adornedPart;
    itr = myDiagram.nodes;

    //set visibility of low level nodes to true
    while (itr.next()) {
        var node = itr.value;
        for (var i = 0; i < drilledNode.data.properties.length; i++) {
            if (node.data.name == drilledNode.data.properties[i].name)
                //node.visible = true;
                setVisibility(node.data.name, true, node.data)
        }
    }
    save(true);
    myDiagram.commitTransaction("drillInto");
    createDrillOutButton();

} //end drillInto

function createDrillOutButton() {
    var buttonArea = document.getElementById("rowButtons")
    var button = document.createElement("button");
    button.className = "myButton";
    button.innerHTML = "Drill Out"
    button.id = "drillButton"
    buttonArea.appendChild(button);
    button.onclick = function() {
        buttonArea.removeChild(button);
        drillOut();
    }
} //end CreateDrillOutButton

function drillOut() {
    onHighLevelView = true;
    myDiagram.startTransaction("drillOut");

    var itr = myDiagram.nodes;

    while (itr.next()) {
        var node = itr.value;
        if (node.data.category === "highLevelEntity" || node.data.category === "highLevelRelationship")
            setVisibility(node.data.name, true, node.data)
        else
            setVisibility(node.data.name, false, node.data)
    }
    myDiagram.commitTransaction("drillOut");
} //end drillOut