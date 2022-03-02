/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [40, -93],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=fqi6cfeSKDgbxmTFln7Az50KH80kQ9XiendFp9kY5i3IR5yzHuAOqNSeNaF7DGxs', {
	attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 3,
	maxZoom: 6,
	subdomains: 'abcd',
	accessToken: 'fqi6cfeSKDgbxmTFln7Az50KH80kQ9XiendFp9kY5i3IR5yzHuAOqNSeNaF7DGxs'
    }).addTo(map);

    //call getData function
    getData();
};

function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var state of data.features){
        //loop through each year
        for(var year = 1970; year <= 2020; year+=10){
              //get population for current year
              var value = state.properties['Edu_'+String(year)];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    var minValue = Math.min(...allValues)
    // console.log(minValue)
    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    console.log(minValue)
    //constant factor adjusts symbol sizes evenly
    var minRadius = 6;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //create marker options
    var attribute = attributes[0];
    // console.log(attribute)

    var options = {
        radius: 4,
        fillColor: "#027373",
        color: "#F2E7DC",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);
    // console.log(attValue)
    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    var year = attribute.split("_")[1];
    // console.log(year)
    //build popup content string
    var popupContent = "<p><b>Percent bachelor's degree or higher of State " + feature.properties.name + " in year " + year + " is " + feature.properties[attribute] + "%</p>";
    // console.log(popupContent)
    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(0,-options.radius*0.01) 
    });
    // console.log('popup bind')
    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


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

    //check result
    // console.log(attributes);

    return attributes;
};

// proportional symbols by attribute
function createPropSymbols(data, attributes){
    // console.log('start symbol');
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};

function updatePropSymbols(attribute){
    // console.log(attribute)
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //update the layer style and popup
            if (layer.feature && layer.feature.properties[attribute]){
                //access feature properties
                var props = layer.feature.properties;
                // console.log(props)
                //update each feature's radius based on new attribute values
                var radius = calcPropRadius(props[attribute]);
                layer.setRadius(radius);
    
                //add formatted attribute to panel content string
                var year = attribute.split("_")[1];
                var popupContent = "<p><b>Percent bachelor's degree or higher of State " + props.name + " in year " + year + " is " + props[attribute] + "%</p>";
    
                //update popup content            
                popup = layer.getPopup();            
                popup.setContent(popupContent).update();
            };
        };
    });
};


//Step 1: Create new sequence controls
function createSequenceControls(attributes){
    
    //create range input element (slider)
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //set slider attributes
    document.querySelector(".range-slider").max = 5;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = 0;
    document.querySelector(".range-slider").step = 1;

    // add button
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="reverse"></button>');
    document.querySelector('#panel').insertAdjacentHTML('beforeend','<button class="step" id="forward"></button>');

    //replace button content with images
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/reverse.png'>")
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/forward.png'>")

    //click listener for buttons
    document.querySelectorAll('.step').forEach(function(step){
        step.addEventListener("click", function(){
            var index = document.querySelector('.range-slider').value;
            console.log(attributes)
            //Step 6: increment or decrement depending on button clicked
            if (step.id == 'forward'){
                index++;
                //Step 7: if past the last attribute, wrap around to first attribute
                index = index > 5 ? 0 : index;
            } else if (step.id == 'reverse'){
                index--;
                //Step 7: if past the first attribute, wrap around to last attribute
                index = index < 0 ? 5 : index;
            };

            //Step 8: update slider
            document.querySelector('.range-slider').value = index;
            console.log(attributes[index])
            updatePropSymbols(attributes[index])
        })
    })
    console.log(attributes[0])

    //Step 5: input listener for slider
    document.querySelector('.range-slider').addEventListener('input', function(){            
        console.log(attributes)
        var index = this.value;
        console.log(attributes[index])
        updatePropSymbols(attributes[index])
    });
};


//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/education_attainment_by_state.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //create an attributes array
           var attributes = processData(json);
           minValue = calculateMinValue(json);
           createPropSymbols(json, attributes);
           createSequenceControls(attributes);
       })

            

        // })

};

document.addEventListener('DOMContentLoaded',createMap)