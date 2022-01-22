var platform = new H.service.Platform({
  'apikey': '5m_ZN-4NdP689fgeRBbPVNGPOCOHx7ok9qKTu7LYzwE' //Chave de acesso da API
});

var cordenadaInicio = '-8.3678162,-35.0315702';
var cordenadaFinal = '-23.1019916,-46.9665265';

var defaultLayers = platform.createDefaultLayers();

var map = new H.Map(
    document.getElementById('map'),//inicializa o mapa
    defaultLayers.vector.normal.map,
    {
      zoom: 4,
      center: { lat:-8.3678162, lng: -35.0315702 }
     
    });

    var mapEvents = new H.mapevents.MapEvents(map);
    var behavior = new H.mapevents.Behavior(mapEvents);
    var ui = H.ui.UI.createDefault(map, defaultLayers); // Zoom map
    
    var inicio = new H.map.Marker({  //Marcador map
      lat:-8.3678162,
      lng:-35.0315702,
    });
    map.addObject(inicio);
    
    var fim = new H.map.Marker({  //Marcador map
      lat:-23.1019916,
      lng:-46.9665265,
    });
    map.addObject(fim);
    
    
    
    var arRisco = (new H.map.Circle(  // 'AREA DE RISCO UNILEVER LOUVEIRA 100KM'
    {lat:-23.089533,lng:-46.949870},
    100000,
       { style: {
          strokeColor: 'rgba(255,0,0, 0.4)', 
          lineWidth: 2,
          fillColor: 'rgba(255,0,0, 0.4)'  
        }}
      
    ));
  ;
  map.addObject(arRisco);
    
    var arRisco1 = (new H.map.Circle(     // 'AREA DE RISCO UNILEVER IPOJUCA 100KM'
      {lat:-8.398104, lng:-35.061195},
      100000,
      {
        style: {
          strokeColor: 'rgba(255,0,0, 0.4)', 
            lineWidth: 2,
            fillColor: 'rgba(255,0,0, 0.4)'  
        }
      }
    ));
  ;
  map.addObject(arRisco1); 

  var arSegu = (new H.map.Circle(     // 'AREA DE RISCO UNILEVER IPOJUCA 100KM'
  {lat:-8.367838,lng:-35.03406},
  100000,
  {
    style: {
      strokeColor: 'rgba(255,0,0, 0.4)', 
        lineWidth: 2,
        fillColor: 'rgba(255,0,0, 0.4)'  
    }
  }
));
;
map.addObject(arSegu);  


/*
  Parâmetro entrada
  platform - Plataforma do mapa
*/
calculateRouteFromAtoB(platform);


//Função responsável por calcular a rota de A a B
function calculateRouteFromAtoB(platform) {
  var router = platform.getRoutingService(null, 8),
      routeRequestParams = {
        routingMode: 'fast',
        transportMode: 'car',
        origin: cordenadaInicio, //Origem
        destination: cordenadaFinal, //Destino
        return: 'polyline'
        //return: 'polyline,turnByTurnActions,actions,instructions,travelSummary'
      };

  router.calculateRoute(
    routeRequestParams,
    onSuccess,
    onError
  );
}


function addRouteShapeToMap(route) {
  route.sections.forEach((section) => {
    // decode LineString from the flexible polyline
    let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

    // Create a polyline to display the route:
    let polyline = new H.map.Polyline(linestring, {
      style: {
        lineWidth: 4,
        strokeColor: 'rgba(0, 128, 255, 0.7)'
      }
    });

    map.addObject(polyline);
    map.getViewModel().setLookAtData({
      bounds: polyline.getBoundingBox()
    });
  });
}



/* Arrumar as funções e comentar*/

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
 function addManueversToMap(route) {
  var svgMarkup = '<svg width="18" height="18" ' +
    'xmlns="http://www.w3.org/2000/svg">' +
    '<circle cx="8" cy="8" r="8" ' +
      'fill="#1b468d" stroke="white" stroke-width="1" />' +
    '</svg>',
    dotIcon = new H.map.Icon(svgMarkup, {anchor: {x:8, y:8}}),
    group = new H.map.Group(),
    i,
    j;

  route.sections.forEach((section) => {
    let poly = H.geo.LineString.fromFlexiblePolyline(section.polyline).getLatLngAltArray();

    let actions = section.actions;
    // Add a marker for each maneuver
    for (i = 0; i < actions.length; i += 1) {
      let action = actions[i];
      var marker = new H.map.Marker({
        lat: poly[action.offset * 3],
        lng: poly[action.offset * 3 + 1]},
        {icon: dotIcon});
      marker.instruction = action.instruction;
      group.addObject(marker);
    }

    group.addEventListener('tap', function (evt) {
      map.setCenter(evt.target.getGeometry());
      openBubble(evt.target.getGeometry(), evt.target.instruction);
    }, false);

    // Add the maneuvers group to the map
    map.addObject(group);
  });
}

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addWaypointsToPanel(route) {
  var nodeH3 = document.createElement('h3'),
    labels = [];

  route.sections.forEach((section) => {
    labels.push(
      section.turnByTurnActions[0].nextRoad != undefined ? 
      section.turnByTurnActions[0].nextRoad.name[0].value : "")
    labels.push(
      section.turnByTurnActions[section.turnByTurnActions.length - 1].currentRoad.name != undefined ?
      section.turnByTurnActions[section.turnByTurnActions.length - 1].currentRoad.name[0].value : '')
  });

  nodeH3.textContent = labels.join(' - ');
  routeInstructionsContainer.innerHTML = '';
  routeInstructionsContainer.appendChild(nodeH3);
}

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addSummaryToPanel(route) {
  let duration = 0,
    distance = 0;

  route.sections.forEach((section) => {
    distance += section.travelSummary.length;
    duration += section.travelSummary.duration;
  });

  var summaryDiv = document.createElement('div'),
    content = '<b>Total distance</b>: ' + distance + 'm. <br />' +
      '<b>Travel Time</b>: ' + toMMSS(duration) + ' (in current traffic)';

  summaryDiv.style.fontSize = 'small';
  summaryDiv.style.marginLeft = '5%';
  summaryDiv.style.marginRight = '5%';
  summaryDiv.innerHTML = content;
  routeInstructionsContainer.appendChild(summaryDiv);
}

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addManueversToPanel(route) {
  var nodeOL = document.createElement('ol');

  nodeOL.style.fontSize = 'small';
  nodeOL.style.marginLeft ='5%';
  nodeOL.style.marginRight ='5%';
  nodeOL.className = 'directions';

  route.sections.forEach((section) => {
    section.actions.forEach((action, idx) => {
      var li = document.createElement('li'),
        spanArrow = document.createElement('span'),
        spanInstruction = document.createElement('span');

      spanArrow.className = 'arrow ' + (action.direction || '') + action.action;
      spanInstruction.innerHTML = section.actions[idx].instruction;
      li.appendChild(spanArrow);
      li.appendChild(spanInstruction);

      nodeOL.appendChild(li);
    });
  });

  routeInstructionsContainer.appendChild(nodeOL);
}

function toMMSS(duration) {
  return Math.floor(duration / 60) + ' minutes ' + (duration % 60) + ' seconds.';
}

/**/


function onSuccess(result) {
  var route = result.routes[0];
  addRouteShapeToMap(route);
  // addManueversToMap(route);
  // addWaypointsToPanel(route);
  // addManueversToPanel(route);
  // addSummaryToPanel(route);
}

function onError(error) {
  //Erro retornado da API
  console.log(error);

  alert('Erro ao calcular rota');
}

calculateRouteFromAtoB(platform);