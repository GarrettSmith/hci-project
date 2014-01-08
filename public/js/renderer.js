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
                particleSystem.screenPadding(100);

                that.initMouseHandling();
            },

            redraw: function() {
                if (!particleSystem) {
                    return;
                }
                gfx.clear();

                var nodeBoxes = {};
                particleSystem.eachNode(function(node, pt) {
                    var textSize = node.data.textSize || "12px";
                    var textColor = node.data.textColor || "white";
                    var font = node.data.font || "helvetica";
                    var label = node.data.label || "";
                    var color = node.data.color || "#333333";
                    var alpha = node.data.alpha || 1;
                    var shape = node.data.shape || 'dot';

                    ctx.globalAlpha = alpha;
                    ctx.font = textSize + " " + font;
                    ctx.textAlign = "center";
                    ctx.fillStyle = color;

                    var w = ctx.measureText("" + label).width + 10;
                    var h = (ctx.measureText('M').width) * 1.15;
                    if (!("" + label).match(/^[ \t]*$/)) {
                        pt.x = Math.floor(pt.x);
                        pt.y = Math.floor(pt.y);
                    }
                    else {
                        label = null;
                    }

                    if (shape == 'dot') {
                        gfx.oval(pt.x - w / 2, pt.y - w / 2, w, w, {
                            fill: ctx.fillStyle
                        });
                        nodeBoxes[node.name] = [pt.x - w / 2, pt.y - w / 2, w, w];
                    }
                    else {
                        gfx.rect(pt.x - w / 2, pt.y - (h / 1.5), w, h + 2, 4, {
                            fill: ctx.fillStyle
                        });
                        nodeBoxes[node.name] = [pt.x - w / 2, pt.y - 11, w, 22];
                    }

                    if (label) {
                        ctx.fillStyle = textColor;
                        ctx.fillText(label || "", pt.x, pt.y + 4);
                        ctx.fillText(label || "", pt.x, pt.y + 4);
                    }
                });

                // edge: {source:Node, target:Node, length:#, data:{}}
                // pt1:  {x:#, y:#}  source position in screen coords
                // pt2:  {x:#, y:#}  target position in screen coords
                particleSystem.eachEdge(function(edge, pt1, pt2) {
                    var weight = edge.data.weight || 1;
                    var color = edge.data.color || "#999999";
                    var alpha = edge.data.alpha || 0.5;
                    var directed = edge.data.directed || true;
                    var tail = intersect_line_box(pt1, pt2, nodeBoxes[edge.source.name]);
                    var head = intersect_line_box(tail, pt2, nodeBoxes[edge.target.name]);

                    ctx.save();
                    ctx.beginPath();
                    ctx.lineWidth = (!isNaN(weight)) ? parseFloat(weight) : 1;
                    ctx.strokeStyle = color;
                    ctx.fillStyle = null;
                    ctx.globalAlpha = alpha;
                    ctx.moveTo(tail.x, tail.y);
                    ctx.lineTo(head.x, head.y);
                    ctx.stroke();
                    ctx.restore();

                    // draw an arrowhead if this is a -> style edge
                    if (directed) {
                        ctx.save();
                        // move to the head position of the edge we just drew
                        var wt = !isNaN(weight) ? parseFloat(weight) : 1;
                        var arrowLength = 6 + wt;
                        var arrowWidth = 2 + wt;
                        ctx.fillStyle = color;
                        ctx.globalAlpha = alpha;
                        ctx.translate(head.x, head.y);
                        ctx.rotate(Math.atan2(head.y - tail.y, head.x - tail.x));

                        // delete some of the edge that's already there (so the point isn't hidden)
                        ctx.clearRect(-arrowLength / 2, - wt / 2, arrowLength / 2, wt);

                        // draw the chevron
                        ctx.beginPath();
                        ctx.moveTo(-arrowLength, arrowWidth);
                        ctx.lineTo(0, 0);
                        ctx.lineTo(-arrowLength, - arrowWidth);
                        ctx.lineTo(-arrowLength * 0.8, - 0);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    }

                    if (edge.data.name) {
                        ctx.fillStyle = "#333333";
                        ctx.font = 'italic 11px Helvetica';
                        ctx.fillText(edge.data.name, (pt1.x + pt2.x) / 2, (pt1.y + pt2.y) / 2);
                    }
                });
            },
            initMouseHandling: function() {
                var pos, mouseP, nearest, oldNearest, hovered;
                var handler = {
                    clicked: function(e) {
                        var pos = $(canvas).offset();
                        mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top);
                        nearest = particleSystem.nearest(mouseP);

                        if (nearest.node !== null && hovered) nearest.node.fixed = true;

                        $(canvas).bind('mousemove', handler.dragged);
                        $(window).bind('mouseup', handler.dropped);

                        return false;
                    },
                    dragged: function(e) {
                        var pos = $(canvas).offset();
                        if (!nearest) return;
                        if (nearest !== null && nearest.node !== null) {
                            nearest.node.p = particleSystem.fromScreen(arbor.Point(e.pageX - pos.left, e.pageY - pos.top));
                        }
                        return false;
                    },
                    dropped: function(e) {
                        if (nearest === null || nearest.node === undefined) {
                            return;
                        }

                        if (nearest.node !== null) {
                            nearest.node.fixed = false;
                            nearest.node.tempMass = 50;
                            nearest = null;

                        }

                        $(canvas).unbind('mousemove', handler.dragged);
                        $(window).unbind('mouseup', handler.dropped);
                        return false;
                    },
                    mouseListen: function(e) {
                        pos = $(canvas).offset();
                        mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
                        nearest = particleSystem.nearest(mouseP);

                        var xrange = ((ctx.measureText("" + nearest.node.data.label).width + 10) / 2) + 10;
                        var yrange = (((ctx.measureText('M').width) * 1.15) / 2) + 10;
                        if (nearest.node.data.course && Math.abs(mouseP.x - nearest.screenPoint.x) < xrange && Math.abs(mouseP.y - nearest.screenPoint.y) < yrange && oldNearest != nearest) {
                            particleSystem.eachNode(function(node, pt) {
                                node.saved = node.saved || $.extend({}, node.data);
                                if (node.data.course) {
                                    node.data.alpha = 0.1;
                                }
                                else if (node.data.or || node.data.and) {
                                    node.data.alpha = 0.1;
                                }
                            });
                            particleSystem.eachEdge(function(edge, pt1, pt2) {
                                edge.saved = edge.saved || $.extend({}, edge.data);
                                edge.data.alpha = 0.1;
                            });

                            if (nearest.node.data.course) {
                                $('canvas').css('cursor', 'pointer');

                                function highlight(node) {
                                    node.data.alpha = 1;
                                    var edges = particleSystem.getEdgesFrom(node);
                                    for (var x = 0; x < edges.length; x++) {
                                        highlight(edges[x].target);
                                        edges[x].data.alpha = 1;
                                    }
                                }highlight(nearest.node);
                            }
                        }
                        else {
                            particleSystem.eachNode(function(node, pt) {
                                if (node.saved) {
                                    node.data = $.extend({}, node.saved);
                                    delete node.saved;
                                }

                            });
                            particleSystem.eachEdge(function(edge, pt1, pt2) {
                                if(edge.saved){
                                    edge.data =  $.extend({}, edge.saved);
                                    delete edge.saved;
                                }
                            });
                            $('canvas').css('cursor', 'default');
                        }
                        if (particleSystem.energy().mean < 0.05) {
                            that.redraw();
                        }
                    },
                    dblclicked: function(e) {
                        pos = $(canvas).offset();
                        mouseP = arbor.Point(e.pageX - pos.left, e.pageY - pos.top)
                        nearest = particleSystem.nearest(mouseP);
                        if (nearest.node.data.course && nearest.distance < 20) {
                            that.customNodeClick.setCourse(nearest.node.name);
                        }
                        return false;
                    }
                };
                $(canvas).mousedown(handler.clicked);
                $(canvas).dblclick(handler.dblclicked);
                $(canvas).mousemove(handler.mouseListen);
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
