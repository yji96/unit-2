/* Map of GeoJSON data from MegaCities.geojson */
//declare map var in global scope
var map;
//function to instantiate the Leaflet map
function createMap(){
    //create the map
    map = L.map('map', {
        center: [40, -100],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=fqi6cfeSKDgbxmTFln7Az50KH80kQ9XiendFp9kY5i3IR5yzHuAOqNSeNaF7DGxs', {
	attribution: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    minZoom: 0,
	maxZoom: 22,
	subdomains: 'abcd',
	accessToken: 'fqi6cfeSKDgbxmTFln7Az50KH80kQ9XiendFp9kY5i3IR5yzHuAOqNSeNaF7DGxs'
    }).addTo(map);

    //call getData function
    getData();
};

//attach popups to each mapped feature
function onEachFeature(feature, layer) {
    console.log('here')
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};


//function to retrieve the data and place it on the map
function getData(){
    //load the data
    fetch("data/data.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){        
            //create marker options
            var geojsonMarkerOptions = {
                radius: 6,
                fillColor: '#800080',
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            };
            //create a Leaflet GeoJSON layer and add it to the map
            L.geoJson(json, {
                pointToLayer: function (feature, latlng){
                    // console.log('here')
                    var pointLayer = L.circleMarker(latlng, geojsonMarkerOptions);
                    onEachFeature(feature, pointLayer) // bind popup to marker layer
                    return pointLayer
                }
            }).addTo(map);

            

        })

};

document.addEventListener('DOMContentLoaded',createMap)