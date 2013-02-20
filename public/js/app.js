//
// Garrett Smith, 3018390
// James Mackay,
//
// The main driver for the app.
//
// Create anonymous scope to run in
(function() {

    var degrees;
    var courses;

    var degree_select;
    var canvas;
    var course_section;

    window.onload = function() {
        degrees = getDegrees();
        courses = getCourses();

        canvas = $("#canvas");
        function sizeCanvas() {
            $(canvas).height(window.innerHeight - $(canvas).offset().top);
        }
        sizeCanvas();

        course_section = $("#course-info");

        degree_select = $("#degree-select");
        function updateDegreeSelected() {
            var id = parseInt(degree_select.val());
            var degree = find(id, degrees);
            drawTree(degree, courses, canvas);
        }
        degree_select.change(updateDegreeSelected);
        populateDegreeSelect(degree_select, degrees);
        updateDegreeSelected();

        window.onresize = function() {
            sizeCanvas();
            updateDegreeSelected();
        };
    };

    /**
     * Request the degrees from the server.
     * For now return some dummy info.
     **/
    function getDegrees() {
        var dummy_degree_1 = {
            id: 1,
            name: "Test Degree 1",
            years: 3,
            type: "bsc",
            courses: [
                1,
                2,
                3
            ]
        };
        var dummy_degree_2 = {
            id: 2,
            name: "Test Degree 2",
            years: 4,
            type: "bsc",
            courses: [
                1,
                3
            ]
        };
        return [dummy_degree_1, dummy_degree_2];
    }

    /**
     * Request the courses from the server.
     * @param: args, overloaded method
     * For now return some dummy info.
     **/
     // do we need year or can we parse it from number?
    function getCourses(args) {
        var dummy_course_1 = {
            id: 1,
            name: "Test Course 1",
            description: "This is a test description",
            department: 1,
            number: "1001",
            prereqs: [],
            coreqs: []
        };
        var dummy_course_2 = {
            id: 2,
            name: "Test Course 2",
            description: "This is a test description",
            department: 1,
            number: "2001",
            prereqs: [1],
            coreqs: [3]
        };
        var dummy_course_3 = {
            id: 3,
            name: "Test Course 3",
            description: "This is a test description",
            department: 2,
            number: "1005",
            prereqs: [],
            coreqs: []
        };
        return [dummy_course_1, dummy_course_2, dummy_course_3];
    }

    /**
     * Populates the select element with the given degrees.
     */
    function populateDegreeSelect(select, degrees) {
        // clear the select
        select.html("");
        for (var i = 0; i < degrees.length; i++) {
            var degree = degrees[i];
            var option = new Option(degree.name, degree.id);
            select.append(option);
        }
    }

    /**
     * Finds the course/degree with the given id number;
     **/
    function find(id, objects) {
        var obj = undefined;
        for (var i = 0; i < objects.length; i++) {
            if(objects[i].id === id) {
                obj = objects[i];
                break;
            }
        }
        return obj;
    }

    /**
     * Prints information about the given course within the given element
     **/
    function printCourse(course, element) {
        element.html("");
        var name = $('<h1/>', {
            html: course.name
        });
        var number = $('<h2/>', {
            html: course.number
        })
        var description = $('<p/>', {
            html: course.description
        })
        element.append(name);
        element.append(number);
        element.append(description);
    }

    /**
     * Draw the given degree, using the given courses, onto the given canvas.
     */
    function drawTree(degree, courses, canvas) {
        canvas.html("");

        var graph = new Graph();

        var course_id;
        var course;
        var course_id_2;

        // create all the nodes
        for (var i = 0; i < degree.courses.length; i++) {
            course_id = degree.courses[i];
            course = find(course_id, courses);
            var node = graph.addNode(course.id, {label: course.name});
            node.onclick = makeCourseFunc(course, course_section);
        }

        // connect all dependencies
        for (i = 0; i < degree.courses.length; i++) {
            course_id = degree.courses[i];
            course = find(course_id, courses);
            // prereqs
            for (var j = 0; j < course.prereqs.length; j++) {
                course_id_2 = course.prereqs[j];
                graph.addEdge(course_id_2, course_id, {directed: true});
            }
            // coreqs
            for (var k = 0; k < course.coreqs.length; k++) {
                course_id_2 = course.coreqs[k];
                graph.addEdge(course_id_2, course_id);
            }
        }

        var layouter = new Graph.Layout.Spring(graph);
        layouter.layout();

        var renderer = new Graph.Renderer.Raphael($(canvas).get(0),
                                                  graph,
                                                  $(canvas).width(),
                                                  $(canvas).height());
        renderer.draw();
    }

    function makeCourseFunc(course, element) {
        return function() {
            printCourse(course, element);
        };
    }

    // Overwrite dracula graph functions
    Graph.Renderer.defaultRenderFunc = function(r, node ) {
        var color = '#bbbbff';
        var rect = r.rect(-40, -20, 80, 40, 5).attr({
          fill: node.fill || color,
          stroke: node.stroke || color,
          "stroke-width": 2
        });
        /* set DOM node ID */
        rect.node.id = node.label || node.id;
        var shape = r.set().push(rect).push(r.text(0, 0, node.label || node.id));
        return shape
    }

})();