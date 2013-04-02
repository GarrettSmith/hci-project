(function() {

    Renderer = function(canvas) {
        var canvas = $(canvas).get(0);
        var ctx = canvas.getContext("2d");
        var gfx = arbor.Graphics(canvas);
        var particleSystem = null;

        var that = {
            init: function(system) {
                particleSystem = system;
                particleSystem.screenSize(canvas.width, canvas.height);
                particleSystem.screenPadding(40);

                that.initMouseHandling();
            },

            redraw: function() {
                if (!particleSystem){
                    return;    
                } 
                var nodeBoxes = {};

                ctx.fillStyle = "#EFEFEF";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // node: {mass:#, p:{x,y}, name:"", data:{}}
                    // pt:   {x:#, y:#}  node position in screen coords
                    particleSystem.eachNode(function(node, pt) {
                        var label,w;
                        

                    label = node.data.label || "";
                    w = ctx.measureText("" + label).width + 10;
                    
                    if (!("" + label).match(/^[ \t]*$/)) {
                        pt.x = Math.floor(pt.x);
                        pt.y = Math.floor(pt.y);
                    }
                    else {
                        label = null;
                    }

                    if (node.data.color){ 
                        var c = node.data.color;
                        var a = c.a? c.a : 1;
                        ctx.fillStyle = "rgba("+c.r+","+c.g+","+c.b+","+a+")";
                    }else{
                        ctx.fillStyle = "rgba(0,0,0,1)";
                    } 

                    if (node.data.shape == 'dot') {
                        gfx.oval(pt.x - w / 2, pt.y - w / 2, w, w, {
                            fill: ctx.fillStyle
                        });
                        nodeBoxes[node.name] = [pt.x - w / 2, pt.y - w / 2, w, w];
                    }else {
                        gfx.rect(pt.x - w / 2, pt.y - 10, w, 20, 4, {
                            fill: ctx.fillStyle
                        });
                        nodeBoxes[node.name] = [pt.x - w / 2, pt.y - 11, w, 22];
                    }

                    if (label) {
                        ctx.font = "10px Helvetica";
                        ctx.textAlign = "center";
                        ctx.fillStyle = "white";
                        if (node.data.color == 'none'){
                            ctx.fillStyle = '#333333';
                        } 
                        ctx.fillText(label || "", pt.x, pt.y + 4);
                        ctx.fillText(label || "", pt.x, pt.y + 4);
                    }
                });

                // edge: {source:Node, target:Node, length:#, data:{}}
                // pt1:  {x:#, y:#}  source position in screen coords
                // pt2:  {x:#, y:#}  target position in screen coords
                particleSystem.eachEdge(function(edge, pt1, pt2) {
                    var weight, color, tail, head;
                    
                    weight = edge.data.weight;
                    
                    var c = edge.data.color;
                    var a = c.a? c.a : 1;
                    color = "rgba("+c.r+","+c.g+","+c.b+","+a+")";
                    
                    if (!color || ("" + color).match(/^[ \t]*$/)){
                        color = null ; 
                    } 

                    tail = intersect_line_box(pt1, pt2, nodeBoxes[edge.source.name]);
                    head = intersect_line_box(tail, pt2, nodeBoxes[edge.target.name]);

                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = (!isNaN(weight)) ? parseFloat(weight) : 1;
                    ctx.strokeStyle = (color) ? color : "#aaaaaa";
                    ctx.fillStyle = null;

                    ctx.moveTo(tail.x, tail.y);
                    ctx.lineTo(head.x, head.y);
                    ctx.stroke();
                    ctx.restore();

                    // draw an arrowhead if this is a -> style edge
                    if (edge.data.directed) {
                        ctx.save()
                        // move to the head position of the edge we just drew
                        var wt = !isNaN(weight) ? parseFloat(weight) : 1
                        var arrowLength = 6 + wt
                        var arrowWidth = 2 + wt
                        ctx.fillStyle = (color) ? color : "#333333"
                        ctx.translate(head.x, head.y);
                        ctx.rotate(Math.atan2(head.y - tail.y, head.x - tail.x));

                        // delete some of the edge that's already there (so the point isn't hidden)
                        ctx.clearRect(-arrowLength / 2, - wt / 2, arrowLength / 2, wt)

                        // draw the chevron
                        ctx.beginPath();
                        ctx.moveTo(-arrowLength, arrowWidth);
                        ctx.lineTo(0, 0);
                        ctx.lineTo(-arrowLength, - arrowWidth);
                        ctx.lineTo(-arrowLength * 0.8, - 0);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore()
                    }

                    if (edge.data.name) {
                        ctx.fillStyle = "#333333";
                        ctx.font = 'italic 11px Helvetica';
                        ctx.fillText(edge.data.name, (pt1.x + pt2.x) / 2, (pt1.y + pt2.y) / 2);
                    }
                })
            },
            initMouseHandling: function() {
                var pos, mouseP, nearest;
                var handler = {
                    moved: function(e) {
                        pos = $(canvas).offset();
                        mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
                        nearest = particleSystem.nearest(mouseP);

                            if (nearest && nearest.node.data.label !== "OR" && nearest.node.data.label !== "AND" && nearest.distance < 20){
                                $('canvas').css( 'cursor', 'pointer' );
                                 function highlight(node){
                                    node.data.color.a = 1;
                                    var edges = particleSystem.getEdgesFrom(node);
                                    for(var x = 0; x< edges.length; x++){
                                        highlight(edges[x].target);
                                        edges[x].data.color.a = 1;
                                    }
                                }highlight(nearest.node);
                            }else{
                                particleSystem.eachNode(function(node, pt){
                                    node.data.color.a = 0.6;
                                });
                                
                                particleSystem.eachEdge(function(edge, pt1, pt2){
                                    edge.data.color.a = 0.2;
                                });

                                $('canvas').css( 'cursor', 'default' );
                            }
                            console.log(particleSystem.energy().mean);
                            if(particleSystem.energy().mean < 0.02){
                                that.redraw();                                    
                            }

                        return false;
                    },
                    clicked: function(e) {                        
                        pos = $(canvas).offset();
                        mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
                        nearest = particleSystem.nearest(mouseP);
                        if( nearest&& nearest.node.data.label !== "OR" && nearest.node.data.label !== "AND" && nearest.distance < 20 ){
                            that.customNodeClick.setCourse(nearest.node.name);
                        }
                        return false;
                    }
                };
                $(canvas).mousedown(handler.clicked);
                $(canvas).mousemove(handler.moved);
            }
        }

        // helpers for figuring out where to draw arrows (thanks springy.js)
        var intersect_line_line = function(p1, p2, p3, p4) {
            var denom = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
            if (denom === 0) return false // lines are parallel
            var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
            var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

            if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return false
            return arbor.Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
        };

        var intersect_line_box = function(p1, p2, boxTuple) {
            var p3 = {
                x: boxTuple[0],
                y: boxTuple[1]
            },
            w = boxTuple[2],
            h = boxTuple[3];

            var tl = {
                x: p3.x,
                y: p3.y
            };
            var tr = {
                x: p3.x + w,
                y: p3.y
            };
            var bl = {
                x: p3.x,
                y: p3.y + h
            };
            var br = {
                x: p3.x + w,
                y: p3.y + h
            };

            return intersect_line_line(p1, p2, tl, tr) || intersect_line_line(p1, p2, tr, br) || intersect_line_line(p1, p2, br, bl) || intersect_line_line(p1, p2, bl, tl) || false
        };

        return that;
    };

})();