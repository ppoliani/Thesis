(function() {
	var ua = navigator.userAgent, iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i), typeOfCanvas = typeof HTMLCanvasElement, nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'), textSupport = nativeCanvasSupport && ( typeof document.createElement('canvas').getContext('2d').fillText == 'function');
	//I'm setting this based on the fact that ExCanvas provides text support for IE
	//and that as of today iPhone/iPad current text support is lame
	labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
	nativeTextSupport = labelType == 'Native';
	useGradients = nativeCanvasSupport;
	animate = !(iStuff || !nativeCanvasSupport);
})();

/*Prov graph managet*/
App.ProvGraphManager = Em.Object.extend({
	
	Log: {
		elem : false,
		write : function(text) {
			if (!this.elem)
				this.elem = document.getElementById('log');
			this.elem.innerHTML = text;
			this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
		}
	},

	/*create custom node shapes*/
	addCustomNodes : function() {
		$jit.ForceDirected.Plot.NodeTypes.implement({
			'customNode' : {
				'render' : function(node, canvas) {
					var img = new Image(), 
						pos = node.pos.getc(true), 
						ctx = canvas.getCtx();
					img.onload = function() {
						ctx.drawImage(img, pos.x - 15, pos.y - 15);
					};

					img.src = '/static/images/pentagon.png';
					ctx.save();
				},
			}
		});
	},
	
	addCustomEdge: function(){
		//label placement on edges 
  		$jit.ForceDirected.Plot.EdgeTypes.implement({ 
    		'labeled-arrow': { 
      			'render': function(adj, canvas) { 
	        		//plot arrow edge 
	        		this.edgeTypes.arrow.render.call(this, adj, canvas); 
	
	        		//get nodes cartesian coordinates 
	        		var pos = adj.nodeFrom.pos.getc(true); 
	        		var posChild = adj.nodeTo.pos.getc(true); 
	
	        		//check for edge label in data 
	        		var data = adj.data; 
	        		if(data.$labelid && data.$labeltext) { 
						//if the label doesn't exist create it and append it to the label container 
	          			var domlabel = document.getElementById(data.$labelid); 
	          			
	          			if(!domlabel) { 
	            			domlabel = document.createElement('span'); 
	            			domlabel.id = data.$labelid; 
	            			domlabel.className = 'arrow-label'; 
	            			domlabel.innerHTML = data.$labeltext; 
	
	            			//if defined set same color as edge 
	            			//if(data.$color) { 
	            				//  domlabel.style.color = data.$color; 
	            			//} 
	
	            			//append the label to the labelcontainer 
	           			    //this.labels.getLabelContainer().appendChild(domlabel); 
	          			} 
	
	          			//now adjust the label placement 
	          			var ox = canvas.translateOffsetX, 
	              			oy = canvas.translateOffsetY, 
	             			sx = canvas.scaleOffsetX, 
	              			sy = canvas.scaleOffsetY, 
	              			posx = (pos.x + posChild.x) / 2 * sx + ox, 
	              			posy = (pos.y + posChild.y) / 2 * sy + oy, 
	              			s = canvas.getSize(); 
	
	          			var labelPos = { 
	              			x: Math.round(posx - domlabel.offsetWidth / 2 + s.width / 2), 
	              			y: Math.round(posy - domlabel.offsetHeight / 2 + s.height / 2) 
	          			}; 
	
	          			domlabel.style.left = labelPos.x + 'px'; 
	          			domlabel.style.top = labelPos.y + 'px'; 
	        		} 
      			} 
    		} 
  		}); 
	},
	
	/*Initialize graphs*/
	graphInit : function(json) {
		this.addCustomNodes();
		this.addCustomEdge();
		$('#infovis').css('display', 'block');
		var self= this;
		
		// init ForceDirected
		var fd = new $jit.ForceDirected({
			//id of the visualization container
			injectInto : 'infovis',
			//Enable zooming and panning
			//by scrolling and DnD
			Navigation : {
				enable : true,
				//Enable panning events only if we're dragging the empty
				//canvas (and not a node).
				panning : 'avoid nodes',
				zooming : 10 //zoom speed. higher is more sensible
			},
			// Change node and edge styles such as
			// color and width.
			// These properties are also set per node
			// with dollar prefixed data-properties in the
			// JSON structure.
			Node : {
				overridable : true
			},
			Edge : {
				overridable : true,
				color : '#23A4FF',
				lineWidth : 1,
				type: 'arrow'
			},
			//Native canvas text styling
			Label : {
				type : labelType, //Native or HTML
				size : 10,
				style : 'bold',
				color: '#000'
			},
			//Add Tips
			Tips : {
				enable : true,
				onShow : function(tip, node) {
					//count connections
					var count = 0;
					node.eachAdjacency(function() {
						count++;
					});
					//display node info in tooltip
					tip.innerHTML = "<div class=\"tip-title\">" + node.name + "</div>" + "<div class=\"tip-text\"><b>connections:</b> " + count + "</div>";
					
				}
			},
			// Add node events
			Events : {
				enable : true,
				type : 'Native',
				//Change cursor style when hovering a node
				onMouseEnter : function() {
					fd.canvas.getElement().style.cursor = 'move';
				},
				onMouseLeave : function() {
					fd.canvas.getElement().style.cursor = '';
				},
				//Update node positions when dragged
				onDragMove : function(node, eventInfo, e) {
					var pos = eventInfo.getPos();
					node.pos.setc(pos.x, pos.y);
					fd.plot();
				},
				//Implement the same handler for touchscreens
				onTouchMove : function(node, eventInfo, e) {
					$jit.util.event.stop(e);
					//stop default touchmove event
					this.onDragMove(node, eventInfo, e);
				},
				//Add also a click handler to nodes
				onClick : function(node) {
					if (!node)
						return;
					// Build the right column relations list.
					// This is done by traversing the clicked node connections.
					var html = "<h4>" + node.name + "</h4><b> connections:</b><ul><li>", 
					    list = [];
					node.eachAdjacency(function(adj) {
						list.push(adj.nodeTo.name);
					});
					//append connections information
					$jit.id('inner-details').innerHTML = html + list.join("</li><li>") + "</li></ul>";
					
					self.loadNodeDetails(node.name);
					
				}
			},
			//Number of iterations for the FD algorithm
			iterations : 2000,
			//Edge length
			levelDistance : 130,
			// Add text to the labels. This method is only triggered
			// on label creation and only for DOM labels (not native canvas ones).
			onCreateLabel : function(domElement, node) {
				domElement.innerHTML = node.name;
				var style = domElement.style;
				style.fontSize = "0.8em";
				style.color = "#ddd";
			},
			// Change node styles when DOM labels are placed
			// or moved.
			onPlaceLabel : function(domElement, node) {
				var style = domElement.style;
				var left = parseInt(style.left);
				var top = parseInt(style.top);
				var w = domElement.offsetWidth;
				style.left = (left - w / 2) + 'px';
				style.top = (top + 10) + 'px';
				style.display = '';
			}
		});
		// load JSON data.
		fd.loadJSON(json);
		// compute positions incrementally and animate.
		var self = this;
		fd.computeIncremental({
			iter : 40,
			property : 'end',
			onStep : function(perc) {
				self.Log.write(perc + '% loaded...');
			},
			onComplete : function() {
				self.Log.write('done');
				fd.animate({
					modes : ['linear'],
					transition : $jit.Trans.Elastic.easeOut,
					duration : 2500
				});
				
				
			}
		});
		// end
	},
	
	/*loads the json represantation of prov bundles from the server*/
	loadProvBundle: function(provBundleId){
		var url = '/get-prov-graph/?provBundleId=' + provBundleId;
		var self = this;
		
		$.getJSON(url, function(data){
			self.convertJson(data);	
		});
	},
	
	/*converts the json fetched from the server into a json format compatible to infoVis libary*/
	convertJson: function(json){
		/*the index of the elements (i.e. agents, entities and activities) in the newJson array*/
		var elementIndex = {};
		var newJson = [];
		var index = 0;
		
		//get all the entities
		for (entity in json.entity){
			elementIndex[entity] = index++;
			newJson.push({
				"id": entity,
				"name": entity,
				"data": {
					"$color" : "#33FF33",
					"$type" : "ellipse",
					"$dim" : 10,
				},
				"adjacencies": []
			});
		}
		
		//get all the activities
		for (activity in json.activity){
			elementIndex[activity] = index++;
			newJson.push({
				"id": activity,
				"name": activity,
				"data": {
					"$color" : "#0066CC",
					"$type" : "rectangle",
					"$dim" : 10,
				},
				"adjacencies": []
			});
		}
		
		//get all the agents
		for (agent in json.agent){
			elementIndex[agent] = index++;
			newJson.push({
				"id": agent,
				"name": agent,
				"data": {
					"$color" : "#FF0000",
					"$type" : "customNode",
					"$dim" : 10,
				},
				"adjacencies": []
			});
		}
		
		
		//load prov relations
		this.getProvRelations(json.used, newJson, elementIndex);
		this.getProvRelations(json.wasAssociatedWith, newJson, elementIndex);
		this.getProvRelations(json.wasAttributedTo, newJson, elementIndex);
		this.getProvRelations(json.wasDerivedFrom, newJson, elementIndex);
		this.getProvRelations(json.wasGeneratedBy, newJson, elementIndex);
		
		this.graphInit(newJson);
	},
	
	/*reads the relations amond entities, activities and actors*/
	getProvRelations: function(relationArray, newJson, elementIndex){
		for (usageObj in relationArray){
			var elements = []
			for (usage in relationArray[usageObj]){
				elements.push(relationArray[usageObj][usage]);			
			}		
			//get the index of this node
			var from = elements[0];
			var to = elements[1];
			var index = elementIndex[from];
			newJson[index].adjacencies.push({
				"nodeTo": to,
				"data" : {
				 	"$labelid": "arrow1", 
                  	"$labeltext": "somelabel", 
				 	"$direction": [from, to],
					"$color" : "#557EAA",
				}
			});
		}	
	},
	
	/*loads information about the clicked node*/
	loadNodeDetails: function(nodeId){
		var url = '/get-prov-node-info/?id=' + nodeId;
		
		$.getJSON(url, function(data){
			var html = "<h4>Additional Information</h4><ul><li>", 
			    list = [];
			for (item in data){
				list.push(item + ': ' + data[item]);
			}
			$('#inner-details').append(html + list.join("</li><li>") + "</li></ul>");	
		});
	}
});
