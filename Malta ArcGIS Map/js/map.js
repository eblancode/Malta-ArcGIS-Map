require([
        'esri/map',
        'esri/geometry/Extent',
        'esri/layers/FeatureLayer',
        'esri/dijit/FeatureTable',

        'esri/dijit/BasemapGallery',
        'esri/dijit/PopupTemplate',
        'esri/dijit/Search',
        'esri/InfoTemplate',

        'esri/dijit/LayerList',
        'esri/symbols/SimpleFillSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleMarkerSymbol',

        'esri/toolbars/draw',
        'esri/graphic',
        'esri/tasks/query',

        'dojo/ready',
        'dojo/parser',
        'dojo/on',
        'dojo/dom',

        'dojo/store/Memory',

        'dojo/_base/Color',
        'dojo/_base/declare',
        'dojo/_base/array',

        'dgrid/OnDemandGrid',
        'dgrid/Selection',

        'esri/dijit/Legend',
        'dijit/layout/BorderContainer',
        'dijit/layout/ContentPane',
        'dijit/form/Button',
        'dojo/dom-construct',
        'dijit/registry',

        'esri/dijit/LocateButton'
    ],
    function(Map, Extent, FeatureLayer, FeatureTable, BasemapGallery, PopupTemplate, Search, InfoTemplate, LayerList, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, Draw, Graphic, Query, ready, parser, on, dom, Memory, Color, declare, array, Grid, Selection, Legend, BorderContainer, ContentPane, Button, domConstruct, registry, LocateButton) {

        // Wait until DOM is ready *and* all outstanding require() calls have been resolved
        ready(function() {

            /*Functions --*/
            function createLayer(url) {
                return new FeatureLayer(url, {
                    outFields: outFieldsMalta,
                    visible: false,
                    infoTemplate: popup
                });
            };

            function createAllLayers() {
                var arrayLayers = [];
                for (var i = 21; i >= 0; i--) {
                    arrayLayers.push(createLayer(sUrlMalta + i));
                }
                return arrayLayers;
            };

            function displayPolygon(evt) {
                // cleaning the last iteration
                backupMemStore = null;

                // Get the geometry from the event object
                var geometryInput = evt.geometry;

                // Define symbol for finished polygon
                var tbDrawSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 255, 0]), 2), new Color([255, 255, 0, 0.2]));
                //var tbDrawSymbol = null;
                // Clear the map's graphics layer
                mapMain.graphics.clear();

                /*
                 * Step: Construct and add the polygon graphic
                 */
                var graphicPolygon = new Graphic(geometryInput, tbDrawSymbol);
                mapMain.graphics.add(graphicPolygon);

                // Call the next function
                selectStuff(geometryInput);
                toolbar.deactivate();
            }

            function selectStuff(geometryInput) {

                // Define symbol for selected features (using JSON syntax for improved readability!)
                var symbolSelected = new SimpleMarkerSymbol({
                    'type': 'esriSMS',
                    'style': 'esriSMSCircle',
                    'color': [255, 115, 0, 128], //rgb(255, 115, 0)
                    'size': 6,
                    'outline': {
                        'color': [255, 0, 0, 214],
                        'width': 1
                    }
                });

                //Step: Initialize the query
                var queryMalta = new Query();
                queryMalta.geometry = geometryInput;
                console.log(geometryInput);

                var setSymbolStuff = function(e) {
                    e.setSelectionSymbol(symbolSelected);
                    e.on('selection-complete', populateGrid);
                    e.selectFeatures(queryMalta, FeatureLayer.SELECTION_NEW);
                };

                for (l in allLayers) {
                    if (allLayers[l].visible) {
                        setSymbolStuff(allLayers[l]);
                    }
                }
            }

            function populateGrid(results) {
                var gridData;
                var dataMalta;

                // Removing dupes
                function arrayContains(arr, val, equals) {
                    var i = arr.length;
                    while (i--) {
                        if (equals(arr[i], val)) {
                            return true;
                        }
                    }
                    return false;
                }

                function removeDuplicates(arr, equals) {
                    var originalArr = arr.slice(0);
                    var i, len, j, val;
                    arr.length = 0;

                    for (i = 0, len = originalArr.length; i < len; ++i) {
                        val = originalArr[i];
                        if (!arrayContains(arr, val, equals)) {
                            arr.push(val);
                        }
                    }
                }

                function thingsEqual(thing1, thing2) {
                    return thing1.id === thing2.id;
                }


                dataMalta = array.map(results.features, function(feature) {
                    return {
                        //Step: Reference the attribute field values
                        'name': feature.attributes[outFieldsMalta[0]],
                        'address': feature.attributes[outFieldsMalta[1]],
                        'council': feature.attributes[outFieldsMalta[2]],
                        'postcode': feature.attributes[outFieldsMalta[3]],
                        'phone': feature.attributes[outFieldsMalta[4]],
                        'url': feature.attributes[outFieldsMalta[5]],
                        'email': feature.attributes[outFieldsMalta[6]],
                        'type': feature.attributes[outFieldsMalta[7]],
                        'id': feature.attributes[outFieldsMalta[8]]
                    }
                });


                // Pass the data to the grid
                var memStore = new Memory({
                    data: dataMalta
                });

                if (typeof backupMemStore !== 'undefined' && backupMemStore != null) {
                    for (f in dataMalta) {
                        backupMemStore.data.push(dataMalta[f]);
                    }
                    memStore.data = backupMemStore.data;
                } else {
                    backupMemStore = memStore;
                }
                removeDuplicates(memStore.data, thingsEqual);
                gridMalta.set('store', memStore);
            }

            function removeStrangeLayer(search) {
                document.getElementById('layerList_checkbox_0').parentNode.parentNode.parentNode.remove();
            }

            function loadTable() {
                ProTable = new FeatureTable({
                    "featureLayer": allLayers[21],
                    "outFields": outFieldsMalta,
                    "map": mapMain,
                    editable: false,
                    dateOptions: {
                        datePattern: 'M/d/y',
                        timeEnabled: true,
                        timePattern: 'H:mm',
                    },
                    fieldInfos: [{
                        name: 'type',
                        alias: 'Type',
                        editable: false //disable editing on this field
                    }, {
                        name: 'name',
                        alias: 'Name',
                        editable: false
                    }, {
                        name: 'address',
                        alias: 'Address',
                        editable: false,
                    }, {
                        name: 'council',
                        alias: 'Council',
                        editable: false,
                    }, {
                        name: 'postcode',
                        alias: 'Post Code',
                        editable: false,
                    }, {
                        name: 'phone',
                        alias: 'Phone',
                        editable: false,
                    }, {
                        name: 'url',
                        alias: 'Web Site',
                        editable: false,
                    }, {
                        name: 'email',
                        alias: 'E-Mail',
                        editable: false,
                    }]
                }, 'divGrid');
                ProTable.startup();
                $('#divGrid').addClass('hidden');
            };

            /*-- Functions */


            /*Initialize stuff --*/
            var backupMemStore;


            var gridMalta = new(declare([Grid, Selection]))({
                bufferRows: Infinity,
                columns: {
                    name: 'Name',
                    address: 'Address',
                    council: 'Council',
                    postcode: 'Postcode',
                    phone: 'Phone',
                    url: 'URL',
                    email: 'Email',
                    type: 'Type'
                }
            }, 'divGrid');

            var popup = new PopupTemplate({

                title: '{name}',
                fieldInfos: [{
                    fieldName: 'type',
                    visible: true,
                    label: 'Type'
                }, {
                    fieldName: 'council',
                    visible: true,
                    label: 'Council',
                }, {
                    fieldName: 'address',
                    visible: true,
                    label: 'Address',
                }, {
                    fieldName: 'postcode',
                    visible: true,
                    label: 'PostCode',
                }, {
                    fieldName: 'phone',
                    visible: true,
                    label: 'Telephone',
                }, {
                    fieldName: 'url',
                    visible: true,
                    label: 'WebSite',
                }, {
                    fieldName: 'email',
                    visible: true,
                    label: 'E-Mail',
                }, ],
                howAttachments: true,
                mediaInfos: [{
                    'type': 'image',
                    'title': 'GeoSys',
                    'caption': '',
                    'value': {
                        'sourceURL': 'https://pbs.twimg.com/media/CFdXn5QWAAAFih7.jpg',
                        'linkURL': 'https://pbs.twimg.com/media/CFdXn5QWAAAFih7.jpg'
                    }
                }]
            });

            //var sources = search.get('sources');

            //Extent Initial
            var extentInitial = new Extent({
                "xmin": 14.177588972947799,
                "ymin": 35.871827841072786,
                "xmax": 14.587801577885589,
                "ymax": 36.109143978044926,
                "spatialReference": {
                    "wkid": 4326
                }
            });
            // URL variables
            var sUrlMalta = ''; //URL PROVIDED UNDER REQUEST

            // Create the map
            var mapMain = new Map('divMap', {
                basemap: 'hybrid',
                //center : [14.403056, 35.885834],
                zoom : 10,
                extent: extentInitial
            });

            var basemapGallery = new BasemapGallery({
                showArcGISBasemaps: true,
                map: mapMain
            }, 'divGalleryImages');

            var outFieldsMalta = ['name', 'address', 'council', 'postcode', 'phone', 'url', 'email', 'type', 'OBJECTID'];

            var allLayers = createAllLayers();

            var layerList = new LayerList({
                map: mapMain,
                //showLegend: true,
            }, 'layerList');
            
            /*
            // Applying for a legend!
            var legend = new Legend({
                map: mapMain,
                arrangement: Legend.ALIGN_RIGHT,
                layerInfos: allLayers[0]
            }, 'divLegend');*/

            var toolbar = new Draw(mapMain);

            var search = new Search({
                enableButtonMode: true, //this enables the search widget to display as a single button
                enableLabel: true,
                enableInfoWindow: true,
                enableSuggestions: true,
                showInfoWindowOnSelect: true,
                map: mapMain,
                addLayersFromMap: true
            }, "divSearch");

            geoLocate = new LocateButton({
                map: mapMain,
                setScale: true,
                scale: 20
            }, "divLocate");
            geoLocate.startup();

            /*-- Initialize stuff*/

            /* Connect things --*/
            parser.parse();

            // main stuff
            mapMain.addLayers(allLayers);

            basemapGallery.startup();

            layerList.startup();
            //legend.startup();
            layerList.on('load', removeStrangeLayer);

            // remove first layer
            search.sources.splice(0, 1);
            search.startup();

            // toolbar objects
            toolbar.on('draw-complete', displayPolygon);

            $('.glyphicon-pencil').click(function(){
              toolbar.activate(Draw.POLYGON);
            });

            $('.glyphicon-trash').click(function(){
              mapMain.graphics.clear();
              // TODO borrar FeatureTable
            });

            $('.glyphicon-stats').click(function(){
              $('#divGrid').toggleClass('hidden');
            });

            $('.glyphicon-th-list').click(function(){
              $('#layerList').toggleClass('hidden');
            });

            $('.glyphicon-th-large').click(function(){
              $('.dijitTitlePane').toggleClass('hidden');
            });

            $('.glyphicon').hover(
              function(){
                var temp = $(this).attr('title');
                $('.text').text(temp);
              },
              function(){
                $('.text').text('');
              }
            );
            
            mapMain.on(loadTable());
            /*-- Connect things */
        });
    });
