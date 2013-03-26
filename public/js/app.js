//
// Garrett Smith, 3018390
// James Mackay, 3030203
//
// The main driver for the app.
//
// Create anonymous scope to run in
(function () {

    var degrees;
    var courses;
    var departments;

    var course_select, department_select, degree_select;
    var container;
    var course_section, department_section, degree_section, help_section;

    var course_tab, department_tab, degree_tab, help_tab;

    window.onload = function () {
        // get course
        $.ajax({
            url: 'json/courses.json',
            context: document.body,
            dataType: "json",
            success: function (data) {
                var def = data.
                default;
                delete data.
                default;
                setDefaults(data, def);
                courses = data;
                populate();
            },
            error: function (data, status, error) {
                console.log(arguments);
            }
        });

        // get degrees
        $.ajax({
            url: "json/degrees.json",
            context: document.body,
            dataType: "json",
            success: function (data) {
                var def = data.
                default;
                delete data.
                default;
                setDefaults(data, def);
                degrees = data;
                populate();
            },
            error: function (data, status, error) {
                console.log(arguments);
            }
        });

        // get departments
        $.ajax({
            url: "json/departments.json",
            context: document.body,
            dataType: "json",
            success: function (data) {
                var def = data.
                default;
                delete data.
                default;
                setDefaults(data, def);
                departments = data;
                populate();
            },
            error: function (data, status, error) {
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
            sections.forEach(function (section) {
                section.height(window.innerHeight - section.offset().top - 12);
            });
            fixDropDownWidths();
        }
        sizeSections();

        function clearTabs() {
            tabs.forEach(function (tab) {
                tab.removeClass("active");
            });
            sections.forEach(function (section) {
                section.hide();
            });
        }

        course_tab.click(function () {
            clearTabs();
            course_tab.addClass("active");
            course_section.show();
            sizeSections();
        });

        department_tab.click(function () {
            clearTabs();
            department_tab.addClass("active");
            department_section.show();
            sizeSections();
        });

        degree_tab.click(function () {
            clearTabs();
            degree_tab.addClass("active");
            degree_section.show();
            sizeSections();
        });

        help_tab.click(function () {
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

        course_select = $("#course-select");
        course_select.change(function() {
            var id = course_select.val();
            var course = courses[id];
            updateCourseSelected(course);
        });

        department_select= $("#department-select");
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

        window.onresize = function () {
            sizeContainer();
            sizeSections();
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
        select.val(id);//.trigger('change');
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
            setDegree(degree_select.val());
            //TEST
            printDepartment(departments.ACS, department_section);
            //TEST
            var current_course = courses["ACS-1903"];
            printCourse(current_course, course_section);
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
        for (var key in objs) {
            var option = new Option(nameFunc(key, objs), key);
            select.append(option);
        }
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
                class: "humanity badge"
            }));
            if (course.humanity) {

            }

            if (course.science) {
                elems.push($('<div/>', {
                    html: "Science",
                    class: "science badge"
                }));
            }

            elems.push($('<hr/>'));

            // department
            elems.push(getDepartmentElement(course));

            course.description.split('\n').forEach(function (text) {
                elems.push($('<p/>', {
                    html: text
                }));
            });

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
                elems.push(createCourseTable(course.coreqs));
            }

            // coreqs
            if (course.coreqs && course.coreqs.length > 0) {
                elems.push($('<h3/>', {
                    html: "Corequisites"
                }));
                elems.push(createCourseTable(course.coreqs));
            }

            // restrictions
            if (course.restrictions && course.restrictions.length > 0) {
                elems.push($('<h3/>', {
                    html: "Restrictions"
                }));
                elems.push($('<p/>', {
                    html: "Students may not hold a credit in this course and any of the following courses."
                }));
                elems.push(createCourseTable(course.restrictions));
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
                html: "<strong>Professors:</strong> " + department.professors.reduce(function (profs, name, iter) {
                    return profs + (iter !== 0) ? ", " : "" + name;
                })
            }));
            department.description.split('\n').forEach(function (text) {
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
            elems.push(createCourseTable(getDepartmentObjs(department, courses).sort()));
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
            click: function (e) {
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
        return matches;
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

    function createCourseTable(courses, args, onclick) {
        args = args || defaultCourseArgs;
        onclick = onclick || defaultCourseOnclick;
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

    /**
     *  Returns a table of with the given headers and vals.
     */
    function createTable(courses, args, onclick) {
        var table = $('<table/>', {
            class: ''
        });

        var thead = $('<thead/>');
        var tr = $('<tr/>');
        for (var header in args) {
            tr.append($('<th/>', {
                html: header
            }));
        }
        thead.append(tr);
        table.append(thead);

        courses.forEach(function (course) {
            var row = $('<tr/>');
            var first = true;
            for (var key in args) {
                var val = args[key];
                var td = $('<td/>');
                if (first) {
                    first = false;
                    td.append($('<a/>', {
                        click: onclick(course),
                        html: course[val],
                        href: '#'
                    }));
                } else {
                    td.html(course[val]);
                }
                row.append(td);
            }
            table.append(row);
        });
        return table;
    }

    /**
     * Draw the given degree
     */
    function drawTree(degree) {
        if (degree) {
            $('#container').load('markUp.html #' + degree.name.replace(" ", ""));
            $.getScript('js/' +degree.name.replace(" ", "") +'.js');
        }
    }


    function makeCourseFunc(course, element) {
        return function () {
            printCourse(course, element);
        };
    }
})();