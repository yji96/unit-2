/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
var dataStats = {}; 
var curAttribute;

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [40, -93],
        zoom: 3
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=fqi6cfeSKDgbxmTFln7Az50KH80kQ9XiendFp9kY5i3IR5yzHuAOqNSeNaF7DGxs', {
	attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 3,
	maxZoom:5,
	subdomains: 'abcd',
	accessToken: 'fqi6cfeSKDgbxmTFln7Az50KH80kQ9XiendFp9kY5i3IR5yzHuAOqNSeNaF7DGxs'
    }).addTo(map);

    var southWest = L.latLng(0, -170),
    northEast = L.latLng(70, -20);
    var bounds = L.latLngBounds(southWest, northEast);

    map.setMaxBounds(bounds);
    map.on('drag', function() {
        map.panInsideBounds(bounds, { animate: false });
    });

    //call getData function
    getData();
    createTitle(); 
};

//add the title to the map
function createTitle(){
	//add a new control to the map to show the text content
    var TitleControl = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'title-container');
			
			//specify the title content
			var content = "<h2>Educational Attainment by State from 1960 to 2020</h2>";
			container.insertAdjacentHTML('beforeend', content)
			
			//disable click inside the container
			L.DomEvent.disableClickPropagation(container);

            return container;
        }
    });
    map.addControl(new TitleControl());
}


function createInfoBox(properties){
    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (properties) {
        this._div.innerHTML = "<b>Percent of Bachelor's Degree of </b>" +  (properties ?
            '<b>' + properties.state + ' in ' + curAttribute.split("_")[1] + ' </b><br />' + properties[curAttribute] + ' %'
            : 'Hover over a State');
    };

    info.addTo(map);

    return info
}

function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Edu") > -1){
            attributes.push(attribute);
        };
    };

    return attributes;
};


function getAllValues(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each state
    for(var state of data.features){
        //loop through each year
        for(var year = 1960; year <= 2020; year+=10){
              //get population for current year
              var value = state.properties['Edu_'+String(year)];
              //add value to array
              allValues.push(value);
        }
    }
    return allValues
}

// function calculateMinValue(data){
//     allValues = getAllValues(data)
//     //get minimum value of our array
//     var minValue = Math.min(...allValues)
//     return minValue;
// }

function calcStats(data){
    //create empty array to store all data values
    allValues = getAllValues(data)

    //get min, max, mean stats for our array
    dataStats.min = Math.min(...allValues);
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return Number(a)+Number(b);});
    dataStats.mean = sum/ allValues.length;

}   


// functions for choropleth map
//calculate the radius of each proportional symbol
function calcChoroColor(attValue) {
    return attValue> 30 ? '#0D585F' :
           attValue> 25 ? '#287274' :
           attValue> 20 ? '#448C8A' :
           attValue> 15 ? '#89C0B6' :
           attValue> 10 ? '#B4D9CC' :
                     '#E4F1E1';
};

// popup content creation
function createPopupContent(properties, attribute){
    // def content of popups
    var popupContent = "<h3>" + properties[attribute] + "%</h3>";

    return popupContent;
};

//function to convert markers to circle markers
function setChoroStyle(feature, attributes){
    //create marker options
    var attribute = attributes[0];
    var options = {
        fillColor: "#015958",
        color: "#015958",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    //Give each feature's circle marker a radius based on its attribute value
    options.fillColor = calcChoroColor(attValue);

    return options
};


function highlightFeature(e) {
    // console.log('mouse here')
    var layer = e.target;
    if (layer.feature && (layer.feature.geometry['type']==='Polygon' || layer.feature.geometry['type']==='MultiPolygon')){
        // updateChoropleth(layer)
        layer.setStyle({
            weight: 4,
            color: '#015958',
            dashArray: '',
            fillOpacity: 0.7
        });
    
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    }

    info.update(layer.feature.properties, curAttribute)
    
}

function resetHighlight(e) {
    var layer = e.target
    resymbolize(curAttribute)
    info.update()

}


// attach popups to features
function onEachFeature(feature, layer) {
    // // does this feature have a property named popupContent?
    // var popupContent = createPopupContent(feature.properties, attribute)
    // layer.bindPopup(popupContent);
    // layer.on({
    //     click: function(){
    //         this.openPopup();
    //     }
    // });
    layer.on({
        mouseover: function(e){
            highlightFeature(e)
        },
        mouseout: function(e){
            resetHighlight(e)
        },
    });

}


//.function to create the legend
function createChoroLegend(attributes){
    var choroLegendControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var div = L.DomUtil.create('div', 'choro-legend-control-container'),
			grades = [0, 10, 15, 20, 25, 30],
			labels = [];
			
            div.innerHTML = "<p class='temporalLegend'>Percent / %</p>";
            var content = ''
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                content +=
                '<i style="background:' + calcChoroColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }	
            console.log(content)		
            div.insertAdjacentHTML('beforeend',content);
            return div;
        }
    });

    map.addControl(new choroLegendControl());

    

};

// proportional symbols by attribute
function createChoropleth(data, attributes){
    console.log('start create choro')
    //create a Leaflet GeoJSON layer and add it to the map
    var layer = L.geoJson(data, {
                style: function(feature){
                    return setChoroStyle(feature, attributes)
                },
                onEachFeature: function(feature, layer){
                    onEachFeature(feature, layer, attributes[0])
                }
            });
    // layer.addTo(map);
    // // generate the legend for the choropleth map
	// var legend1 = L.control({position: 'bottomleft'});

	// legend1.onAdd = function (map) {

	// 	var div = L.DomUtil.create('div', 'info legend'),
	// 		grades = [0, 10, 15, 20, 25, 30],
	// 		labels = [];
			
	// 	// var content = "Spending in Education ($US billion)<br>";
	// 	// $(div).append(content);

	// 	// loop through our density intervals and generate a label with a colored square for each interval
	// 	for (var i = 0; i < grades.length; i++) {
	// 		div.innerHTML +=
	// 			'<i style="background:' + calcChoroColor(grades[i] + 1) + '"></i> ' +
	// 			grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
	// 	}			

	// 	return div;
	// };
	// legend1.addTo(map);	
    

    return layer
};


function updateChoropleth(layer, attribute){
    //update the layer style and popup
    if (layer.feature && layer.feature.properties[attribute]){
        //access feature properties
        var props = layer.feature.properties;
        //update each feature's color based on new attribute values
        var options = {
            fillColor: calcChoroColor(props[attribute]),
            color: "#015958",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
        };
        layer.setStyle(options);
        // info.update(layer.feature.properties, attribute)
        //add formatted attribute to panel content string
        // var year = attribute.split("_")[1];
        // var popupContent = createPopupContent(props, attribute);

        // //update popup content            
        // popup = layer.getPopup();            
        // popup.setContent(popupContent).update();
    };
};


// functions for proportional map
//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 4;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

// popup content creation
function createPopupContent(properties, attribute){
    // def content of popups
    var popupContent = "<h3>" + properties[attribute] + "%</h3>";

    return popupContent;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //create marker options
    var attribute = attributes[0];

    var options = {
        radius: 4,
        fillColor: "#015958",
        color: "#ffffff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
        borderRadius: 0.5
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    // var popupContent = createPopupContent(feature.properties, attribute)

    // //bind the popup to the circle marker
    // layer.bindPopup(popupContent, {
    //     offset: new L.Point(0,-options.radius*0.01) 
    // });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


// proportional symbols by attribute
function createPropSymbols(data, attributes){
    
    //create a Leaflet GeoJSON layer and add it to the map
    var layer = L.geoJson(data, {
                    pointToLayer: function(feature, latlng){
                        return pointToLayer(feature, latlng, attributes);
                    },
                    onEachFeature: function(feature, layer){
                        onEachFeature(feature, layer, attributes[0])
                    }
                });
    layer.addTo(map);
    return layer
};


function updatePropSymbols(layer, attribute){
    //update the layer style and popup
    if (layer.feature && layer.feature.properties[attribute]){
        //access feature properties
        var props = layer.feature.properties;
        layer.setRadius(calcPropRadius(props[attribute]))
        var options = {
            fillColor: "#015958",
            color: "#ffffff",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
            borderRadius: 0.5
        };
        //update each feature's radius based on new attribute values
        // layer.setStyle(options)
        layer.setStyle(options);

        // //add formatted attribute to panel content string
        // // var year = attribute.split("_")[1];
        // var popupContent = createPopupContent(props, attribute);

        // //update popup content            
        // popup = layer.getPopup();            
        // popup.setContent(popupContent).update();
    };
};

function resymbolize(attribute){
    map.eachLayer(function(layer){
        // resymbolize based on map type
        if (layer.feature){
            if  (layer.feature.geometry['type']==='Polygon' || layer.feature.geometry['type']==='MultiPolygon'){
                updateChoropleth(layer, attribute);
            }
            if(layer.feature.geometry['type']==='Point'){
                updatePropSymbols(layer, attribute);
            }
            // onEachFeature(layer.feature, layer, attribute);

        }
    });
};

//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    // create the control container div with a particular class name
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function () {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

            //create range input element (slider)
            container.insertAdjacentHTML('beforeend', '<input class="range-slider" type="range">')

            //add skip buttons
            container.insertAdjacentHTML('beforeend', '<button class="step" id="reverse" title="Reverse"><img src="img/reverse.png"></button>'); 
            container.insertAdjacentHTML('beforeend', '<button class="step" id="forward" title="Forward"><img src="img/forward.png"></button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });
        

    map.addControl(new SequenceControl());    // add listeners after adding control}

    //set slider attributes
    document.querySelector(".range-slider").max = 6;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    //click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 6 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 6 : index;
            };
            curAttribute = attributes[index]
            //Step 8: update slider
            document.querySelector('.range-slider').value = index;    
            // console.log(layer.constructor.name)
            resymbolize(curAttribute)
            // updatePropSymbols(attributes[index])
        })
    })

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
        var index = this.value;
        curAttribute = index
        // console.log(layer.constructor.name)
        resymbolize(attributes[index])
        // updatePropSymbols(attributes[index])
    });
};

//.function to create the legend
function createPropLegend(attributes){
    var propLegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

            container.innerHTML = "<p class='temporalLegend'>Percent / %</p>";

            var svg = '<svg id="attribute-legend" width="130px" height="60px">';
            //array of circle names to base loop on  
            var circles = ["max", "mean", "min"]; 

            //Step 2: loop to add each circle and text to svg string  
            for (var i=0; i<circles.length; i++){  

                //Step 3: assign the r and cy attributes  
                var radius = calcPropRadius(dataStats[circles[i]]);  
                var cy = 40 - radius;  
                // console.log(radius)

                //circle string  
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#015958" fill-opacity="0.8" stroke="#ffffff" cx="30"/>';  
                        //evenly space out labels            
                var textY = i * 15 + 10;            

                //text string            
                svg += '<text id="' + circles[i] + '-text" x="55" y="' + textY + '">' + Math.round(dataStats[circles[i]]) + '</text>';
            };  

            //close svg string  
            svg += "</svg>"; 

            //add attribute legend svg to container
            container.insertAdjacentHTML('beforeend',svg);
            return container;
        }
    });

    map.addControl(new propLegendControl());

    

};

function addLayerControl(propLayer, choroLayer, attributes){
    var overlays = {
        'Proportional Map': propLayer,
        'Choropleth Map': choroLayer
    }
    // console.log(overlays)
    L.control.layers(overlays).addTo(map)
    map.on('baselayerchange', function () {
        console.log('change')
        // var index = document.querySelector('.range-slider').value;
        // document.querySelector('.range-slider').value = index;    
        // console.log(layer.constructor.name)
        resymbolize(curAttribute)
     });
}

function getChoroData(propLayer){
    console.log('fetch polygon')
    //load the data
    fetch('data/education_attainment_by_state_polygon.geojson')
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
            var attributes = processData(json);
            console.log('start create polygon')
            var choroLayer = createChoropleth(json, attributes)
            // console.log(choroLayer)
            addLayerControl(propLayer, choroLayer, attributes)
            createChoroLegend(attributes);
            // map.on('baselayerchange', function (e) {
            //     console.log(e.layer);
            // });
       })

};



//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch('data/education_attainment_by_state.geojson')
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
           var attributes = processData(json);
           curAttribute = attributes[0]
           calcStats(json);  
           minValue = dataStats.min
           propLayer = createPropSymbols(json, attributes);
        //    console.log(propLayer)
           getChoroData(propLayer)
           info = createInfoBox()
           createSequenceControls(attributes);
           createPropLegend(attributes);
       })

            

        // })

};

document.addEventListener('DOMContentLoaded',createMap)