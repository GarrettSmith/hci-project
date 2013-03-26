(function(){
    var container = $("#InformationSystems"),
        e0 = jsPlumb.addEndpoint("1903", {
            endpoint: "Blank"
        }),
        e1 = jsPlumb.addEndpoint("1904", {
            endpoint: "Blank"
        });

    jsPlumb.registerConnectionType("basic", {
        paintStyle: {
            strokeStyle: "white",
            lineWidth: 5
        }
    });

    jsPlumb.connect({
        source: e0,
        target: e1,
        container: container,
        type: "basic"
    });

});