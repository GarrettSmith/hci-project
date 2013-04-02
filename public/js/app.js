//
// Garrett Smith, 3018390
// James Mackay, 3030203
//
// The main driver for the app.
//
// Create anonymous scope to run in
(function() {
    //node drawing system
    var sys;
    var treeJSON;
    var degrees;
    var courses;
    var departments;
    var course_select, department_select, degree_select;
    var container;
    var course_section, department_section, degree_section, help_section;

    var course_tab, department_tab, degree_tab, help_tab;

    window.onload = function() {
        // get course
        $.ajax({
            url: 'json/courses.json',
            context: document.body,
            dataType: "json",
            success: function(data) {
                var def = data.
                default;
                delete data.
                default;
                setDefaults(data, def);
                courses = data;
                populate();
            },
            error: function(data, status, error) {
                console.log(arguments);
            }
        });

        // get degrees
        $.ajax({
            url: "json/degrees.json",
            context: document.body,
            dataType: "json",
            success: function(data) {
                var def = data.
                default;
                delete data.
                default;
                setDefaults(data, def);
                degrees = data;
                populate();
            },
            error: function(data, status, error) {
                console.log(arguments);
            }
        });

        // get departments
        $.ajax({
            url: "json/departments.json",
            context: document.body,
            dataType: "json",
            success: function(data) {
                var def = data.
                default;
                delete data.
                default;
                setDefaults(data, def);
                departments = data;
                populate();
            },
            error: function(data, status, error) {
                console.log(arguments);
            }
        });

        course_tab = $("#course-tab");
        department_tab = $("#department-tab");
        degree_tab = $("#degree-tab");
        help_tab = $("#help-tab");

        course_section = $("#course-section");
        department_section = $("#department-section");
        degree_section = $("#degree-section");
        help_section = $("#help-section");

        var tabs = [course_tab, department_tab, degree_tab, help_tab];
        var sections = [course_section, department_section, degree_section, help_section];

        function sizeSections() {
            sections.forEach(function(section) {
                section.height(window.innerHeight - section.offset().top - 12);
            });
            $('.content').each(function() {
                var div = $(this);
                div.height(window.innerHeight - div.offset().top);
            });
            fixDropDownWidths();
        }
        sizeSections();

        function clearTabs() {
            tabs.forEach(function(tab) {
                tab.removeClass("active");
            });
            sections.forEach(function(section) {
                section.hide();
            });
        }

        course_tab.click(function() {
            clearTabs();
            course_tab.addClass("active");
            course_section.show();
            sizeSections();
        });

        department_tab.click(function() {
            clearTabs();
            department_tab.addClass("active");
            department_section.show();
            sizeSections();
        });

        degree_tab.click(function() {
            clearTabs();
            degree_tab.addClass("active");
            degree_section.show();
            sizeSections();
        });

        help_tab.click(function() {
            clearTabs();
            help_tab.addClass("active");
            help_section.show();
            sizeSections();
        });

        container = $("#container");

        function sizeContainer() {
            container.height(window.innerHeight - container.offset().top - 12);
        }
        sizeContainer();


        function sizeCanvas() {
            var canvas = $('#viewport');

            canvas[0].height = container.height();
            canvas[0].width = container.width();
            canvas.height(container.height());
            canvas.width(container.width());
        }
        sizeCanvas();

        function sizeTree() {
            sys.renderer.init(sys);
        }


        course_select = $("#course-select");
        course_select.change(function() {
            var id = course_select.val();
            var course = courses[id];
            updateCourseSelected(course);
        });

        department_select = $("#department-select");
        department_select.change(function() {
            var id = department_select.val();
            var department = departments[id];
            updateDepartmentSelected(department);
        });

        degree_select = $("#degree-select");
        degree_select.change(function() {
            var id = degree_select.val();
            var degree = degrees[id];
            updateDegreeSelected(degree);
        });

        window.onresize = function() {
            sizeContainer();
            sizeSections();
            sizeCanvas();
            sizeTree();
            //updateDegreeSelected();
            fixDropDownWidths();
        };

    };

    function fixDropDownWidths() {
        // fix select dropdowns
        $(".chzn-drop").each(function(i) {
            var elem = $(this);
            elem.css('width', elem.parent().outerWidth() - 2);
        });
        $(".chzn-drop input").css('width', '100%');
    }

    function setCourse(id) {
        setSelect(id, course_select);
    }

    function setDepartment(id) {
        setSelect(id, department_select);
    }

    function setDegree(id) {
        setSelect(id, degree_select);
    }

    function setSelect(id, select) {
        select.val(id); //.trigger('change');
        select.chosen().change();
        select.trigger("liszt:updated");
    }

    function updateCourseSelected(course) {
        printCourse(course, course_section);
        course_tab.trigger('click');
    }

    function updateDepartmentSelected(department) {
        printDepartment(department, department_section);
        department_tab.trigger('click');
    }

    function updateDegreeSelected(degree) {
        printDegree(degree, degree_section);
        degree_tab.trigger('click');
        drawTree(degree);
    }

    function populate() {
        if (degrees && courses && departments) {
            populateSelect(course_select, courses, function(key, objs) {
                var obj = objs[key];
                return obj.id + ", " + obj.name;
            });
            populateSelect(department_select, departments);
            populateSelect(degree_select, degrees, function(key, objs) {
                var obj = objs[key];
                return obj.name + ", " + obj.years + "-years " + obj.type;
            });
            // fix widths
            $('.chzn-container').css('width', '100%');
            // fix padding
            $('#department_select_chzn').css('margin', department_select.css('margin'));
            $('#course_select_chzn').css('margin', course_select.css('margin'));
            // display initial values
            setCourse(course_select.val());
            setDepartment(department_select.val());
            setDegree(degree_select.val());
            // show help tab first
            help_tab.trigger('click');
        }
    }

    var defaultNameFunc = function(key, objs) {
        return objs[key].name;
    };

    /**
     * Populates the select element with the given degrees.
     */
    function populateSelect(select, objs, nameFunc) {
        nameFunc = nameFunc || defaultNameFunc;
        // clear the select
        select.html("");
        var keys = Object.keys(objs).sort();
        keys.forEach(function(key) {
            var option = new Option(nameFunc(key, objs), key);
            select.append(option);
        });
        select.chosen();
    }

    /**
     *  Set default course values.
     */
    function setDefaults(objs, defObj) {
        for (var id in objs) {
            var obj = objs[id];
            for (var value in defObj) {
                if (!(value in obj)) {
                    obj[value] = defObj[value];
                }
            }
        }
    }

    /**
     * Prints information about the given course within the given element
     * TODO print all info, make relevant links
     **/
    function printCourse(course, element) {
        var content = element.children(".content");
        content.html("");
        var elems = [];

        if (course) {
            //            elems.push($('<h1/>', {
            //                html: course.department + "-" + course.number
            //            }));
            //            elems.push($('<h2/>', {
            //                html: course.name
            //            }));

            // taken
            function setTaken(course, elem, taken) {
                course.taken = taken;
                if (taken) {
                    elem.addClass("set");
                    elem.html("Taken");
                }
                else {
                    elem.removeClass("set");
                    elem.html("Untaken");
                }
            }

            var takenElem = $('<div/>', {
                class: "taken badge"
            });

            function toggleTaken() {
                setTaken(course, takenElem, !course.taken);
            }

            takenElem.click(toggleTaken);
            setTaken(course, takenElem, course.taken);
            elems.push(takenElem);

            elems.push($('<div/>', {
                html: "<span>" + course["credit-hours"] + "</span>Credits",
                class: "credit-hours badge"
            }));

            elems.push($('<div/>', {
                html: "<span>" + course.level + "</span>\n" + ((course.level === "UUG") ? "Undergraduate" : "Graduate"),
                class: "level badge"
            }));

            // humanity or sciences
            elems.push($('<div/>', {
                html: "Humanity",
                class: "humanity badge" + (course.humanity ? ' set' : '')
            }));

            elems.push($('<div/>', {
                html: "Science",
                class: "science badge" + (course.science ? ' set' : '')
            }));

            elems.push($('<hr/>'));

            // department
            elems.push(getDepartmentElement(course));

            course.description.split('\n').forEach(function(text) {
                elems.push($('<p/>', {
                    html: text
                }));
            });

            // cross listed
            if (course["cross-listed"]) {
                var crossP = $('<p/>', {
                    html: "<strong>Cross Listed:</strong> "
                });
                crossP.append($('<a/>', {
                    html: course["cross-listed"],
                    href: '#',
                    click: function(e) {
                        e.preventDefault();
                        setCourse(course["cross-listed"]);
                    }
                }));
                elems.push(crossP);
            }

            // notes
            if (course.notes) {
                elems.push($('<h3/>', {
                    html: "Notes"
                }));
                elems.push($('<p/>', {
                    html: course.notes
                }));
            }

            // prereqs
            if (course.prereqs && course.prereqs.length > 0) {
                elems.push($('<h3/>', {
                    html: "Prerequisites"
                }));
                elems.push(createCourseTable(getObjs(flatten(course.prereqs), courses), undefined, undefined, false));
            }

            // coreqs
            if (course.coreqs && course.coreqs.length > 0) {
                elems.push($('<h3/>', {
                    html: "Corequisites"
                }));
                elems.push(createCourseTable(getObjs(course.coreqs, courses)));
            }

            // restrictions
            if (course.restrictions && course.restrictions.length > 0) {
                elems.push($('<h3/>', {
                    html: "Restrictions"
                }));
                elems.push($('<p/>', {
                    html: "Students may not hold a credit in this course and any of the following courses."
                }));
                elems.push(createCourseTable(getObjs(course.restrictions, courses)));
            }
        }
        else {
            elems.push($('<p/>', {
                html: "No course selected."
            }));
        }

        // write to dom
        content.append(elems);
    }

    function getObjs(ids, objs) {
        return ids.map(function(id) {
            var obj = objs[id];
            return (typeof obj !== 'undefined' ? obj : id);
        });
    }

    /**
     * Prints the given department.
     */
    function printDepartment(department, element) {
        var content = element.children(".content");
        content.html("");
        var elems = [];

        if (department) {
            //            elems.push($('<h1/>', {
            //                html: department.name
            //            }));
            elems.push($('<a/>', {
                html: department.website,
                href: department.website,
                target: "_blank"
            }));
            elems.push($('<p/>', {
                html: "<strong>Chair:</strong> " + department.chair
            }));
            elems.push($('<p/>', {
                html: "<strong>Professors:</strong> " + department.professors.reduce(function(profs, name, iter) {
                    return profs + ((iter !== 0) ? ", " : "") + name;
                }, "")
            }));
            department.description.split('\n').forEach(function(text) {
                elems.push($('<p/>', {
                    html: text
                }));
            });

            // degrees
            elems.push($('<h3/>', {
                html: "Degrees"
            }));
            elems.push(createDegreeTable(getDepartmentObjs(department, degrees)));

            // courses
            elems.push($('<h3/>', {
                html: "Courses"
            }));
            elems.push(createCourseTable(getDepartmentObjs(department, courses)));
        }
        else {
            elems.push($('<p/>', {
                html: "No degree selected."
            }));
        }

        // write to dom
        content.append(elems);
    }

    function printDegree(degree, element) {
        var content = element.children(".content");
        content.html("");
        var elems = [];

        if (degree) {
            elems.push($('<h1/>', {
                html: fullDegreeName(degree)
            }));

            // department
            elems.push(getDepartmentElement(degree));

            elems.push($('<h3/>', {
                html: "Admission Requirement"
            }));
            elems.push($('<p/>', {
                html: degree["admission-reqs"] ? degree["admission-reqs"] : "None"
            }));

            elems.push($('<h3/>', {
                html: "Residence Requirement"
            }));
            elems.push($('<p/>', {
                html: "<strong>Degree:</strong> Minimum " + degree["residence-reqs"].degree + " credit hours"
            }));
            elems.push($('<p/>', {
                html: "<strong>Major:</strong> Minimum " + degree["residence-reqs"].major + " credit hours"
            }));

            elems.push($('<h3/>', {
                html: "General Degree Requirement"
            }));
            elems.push($('<p/>', {
                html: "<strong>Humanities:</strong> " + degree["general-reqs"].humanities + " credit hours in Humanities"
            }));
            elems.push($('<p/>', {
                html: "<strong>Science:</strong> " + degree["general-reqs"].science + " credit hours in Science"
            }));
            elems.push($('<p/>', {
                html: "<strong>Writing:</strong> " + degree["general-reqs"].writing
            }));
            elems.push($('<p/>', {
                html: "<strong>Maximum Introductory Courses:</strong> " + degree["general-reqs"]["max-introductory"]
            }));
            elems.push($('<p/>', {
                html: "<strong>Distribution:</strong> " + degree["general-reqs"].distribution
            }));

            elems.push($('<h3/>', {
                html: "Major Requirement"
            }));
            elems.push($('<p/>', {
                html: "<strong>Single Major:</strong> " + degree["major-reqs"].single
            }));
            elems.push($('<p/>', {
                html: "<strong>Double Major:</strong> " + degree["major-reqs"].double
            }));
        }
        else {
            elems.push($('<p/>', {
                html: "No degree selected."
            }));
        }

        content.append(elems);
    }

    function getDepartmentElement(obj) {
        var departmentP = $('<p/>', {
            html: "<strong>Department:</strong> "
        });
        departmentP.append($('<a/>', {
            html: departments[obj.department].name,
            href: "#",
            click: function(e) {
                e.preventDefault();
                setDepartment(obj.department);
            }
        }));
        return departmentP;
    }

    function fullDegreeName(degree) {
        return degree.years + "-year " + degree.type + " in " + degree.name;
    }

    function getDepartmentObjs(department, objs) {
        var matches = [];
        for (var key in objs) {
            var obj = objs[key];
            if (departments[obj.department] === department) {
                matches.push(obj);
            }
        }
        return matches.sort();
    }

    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    function flatten(orig) {
        return [].concat.apply([], orig);
    }

    var defaultCourseArgs = {
        "Course Number": "id",
        "Name": "name"
    };

    var defaultCourseOnclick = function(c) {
        var course = c;
        return function(e) {
            e.preventDefault();
            setCourse(course.id);
        };
    };

    function createCourseTable(courses, args, onclick, sort) {
        args = args || defaultCourseArgs;
        onclick = onclick || defaultCourseOnclick;
        if (sort) {
            courses.sort(sortCourses);
        }
        return createTable(courses, args, onclick);
    }

    var defaultDegreeArgs = {
        "Name": "name",
        "Years": "years",
        "Type": "type"
    };

    var defaultDegreeOnclick = function(d) {
        var degree = d;
        return function(e) {
            e.preventDefault();
            setDegree(degree.id);
        };
    };

    function createDegreeTable(degrees, args, onclick) {
        args = args || defaultDegreeArgs;
        onclick = onclick || defaultDegreeOnclick;
        return createTable(degrees, args, onclick);
    }

    function sortCourses(c1, c2) {
        return (c1.id < c2.id) ? -1 : 1;
    }

    /**
     *  Returns a table of with the given headers and vals.
     */
    function createTable(objs, args, onclick) {
        var table = $('<table/>', {});

        var thead = $('<thead/>');
        var tr = $('<tr/>');
        for (var header in args) {
            tr.append($('<th/>', {
                html: header
            }));
        }
        thead.append(tr);
        table.append(thead);

        objs.forEach(function(obj) {
            var row = $('<tr/>');
            var td;
            if (typeof obj === 'string') {
                td = $('<td/>', {
                    html: obj
                });
                td.attr('colspan', args.length);
                row.append(td);
            }
            else {
                var first = true;
                for (var key in args) {
                    var valFunc = args[key];
                    var val = (isFunction(valFunc) ? valFunc(obj) : obj[valFunc]);
                    td = $('<td/>');
                    if (first) {
                        first = false;
                        td.append($('<a/>', {
                            click: onclick(obj),
                            html: val,
                            href: '#'
                        }));
                    }
                    else {
                        td.html(val);
                    }
                    row.append(td);
                }
            }
            table.append(row);
        });
        return table;
    }

    function initArbor() {
        var returnable = arbor.ParticleSystem(1200, 15, .5, true, 55, 0.10, .6);
        returnable.renderer = Renderer("#viewport");
        returnable.renderer.customNodeClick = {
            'setCourse': setCourse
        };
        $("<button/>", {'text' : "Redraw"}).addClass("redraw").click(function(e){
            clearTree();
            sys.merge(treeJSON);
        }).appendTo($("#container"));
        return returnable;
    }

    function drawTree(_degree) {
        var degree = $.extend(true, {}, _degree);
        if (sys === undefined) {
            sys = initArbor();
        }
        clearTree();
        treeJSON = {
            'nodes': {},
            'edges': {}
        };
        treeJSON.nodes[degree.id] = {'label':degree.id,'fixed':true, 'x':-35,'y':-35,'color' : {'r':75,'g':75,'b':75,'a': 0.6}};
        parseRequirements(degree.id, degree['required-courses']);
        sys.merge(treeJSON);
    }

    function parseRequirements(parentNodeID, req) {
        var ors = [];
        var children = [];

        while (req.length > 0) {
            if (req[req.length - 1] instanceof Array) {
                ors.push(req.pop());
            }
            else {
                if (ors.length > 0) {
                    children.push(processOrs(ors));
                    ors = [];
                }
                children.push(buildCourseNode(req.pop()));
            }
        }
        if (ors.length > 0) {
            children.push(processOrs(ors));
        }
        if (parentNodeID) {
            for (var key in children) {
                addEdge(parentNodeID, children[key], {
                    'length': 5,
                    'color': {'r':175,'g':175,'b':175,'a': 0.2}

                });
            }
        }
    }


    function processOrs(ors) {
        var children = [];

        while (ors.length > 0) {
            if (ors[ors.length - 1].length > 1 ) {
                children.push(processAnd(ors.pop()));
            }
            else {
                children.push(buildCourseNode(ors.pop().pop()));
            }
        }
        var orNodeID = buildOrNode(children);
        for (var x = 0; x < children.length; x++) {
            addEdge(orNodeID, children[x],  {
                'length': 2,
                'weight':1,
                'color': {'r':150,'g':205,'b':50,'a': 0.2}
            });
        }
        return orNodeID;
    }

    function processAnd(and) {
        var children = [];
        var ors = [];

        while (and.length > 0) {
            if (and[and.length - 1] instanceof Array) {
                ors.push(and.pop());
            }
            else {
                if (ors.length > 0) {
                    children.push(processOrs(ors));
                    ors = [];
                }
                children.push(buildCourseNode(and.pop()));
            }
        }
        if (ors.length > 0) {
            children.push(processOrs(ors));
        }
        var andNodeID = buildAndNode(children);
        for (var x = 0; x < children.length; x++) {
            addEdge(andNodeID, children[x], {
                'length': 2,
                'weight':1,
                    'color': {'r':255,'g':69,'b':0,'a': 0.2}
            });
        }
        return andNodeID;
    }

    function buildAndNode(args) {
        var ID = args.sort().toString()+"AND";
        treeJSON.nodes[ID] = {
            'label': 'AND',
            'shape': 'dot',
            'color': {'r':125,'g':125,'b':125,'a': 0.6}
        };
        return ID;
    }

    function buildOrNode(args) {
        var ID = args.sort().toString()+"OR";
        treeJSON.nodes[ID] = {
            'label': 'OR',
            'shape': 'dot',
            'color': {'r':125,'g':125,'b':125,'a': 0.6}
        };
        return ID;
    }

    function buildCourseNode(id) {
        var data = {
                    'label': id,
                    'color': {'r':0,'g':255,'b':255, 'a': 0.6}
                    }
        if(treeJSON.nodes[id] === undefined){
            if (courses[id]) {
                var course = $.extend(true, {}, courses[id]);
                treeJSON.nodes[id] = data;
                parseRequirements(id, course.prereqs);
            }
            else {
                treeJSON.nodes[id] = data;
            }
        }
        return id;
    }

    function addEdge(source, target, data) {
        var _target = {};
        var specs = data ? $.extend({
            "directed": true
        }, data) : {};
        _target[target] = specs;
        treeJSON.edges[source] = $.extend(treeJSON.edges[source], _target);
        if (treeJSON.nodes[target].label !== "OR" &&
            treeJSON.nodes[target].label !== "AND" &&
            specs.color !== 'none') {
            treeJSON.nodes[target].color = makeHotter(treeJSON.nodes[target].color);
        }
    }

    function makeHotter(colour) {
        colour.r = Math.min(colour.r + 100, 255);
        colour.g = Math.max(colour.g - 55, 0);
        colour.b = Math.max(colour.b - 120, 0);
        return colour;
    }

    function clearTree() {
        sys.eachNode(function(node, pt1) {
            sys.pruneNode(node);
        });
        sys.eachEdge(function(edge, pt1, pt2) {
            sys.pruneEdge(edge);
        });
    }

})();