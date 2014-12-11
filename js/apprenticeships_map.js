/**
 * Apprenticeships Map
 *
 * This JS file presents the map on the home pahe of Australian Apprenticeships. It also powers the 
 * internal view of the same AAC data, as well as power the internal Australian Apprenticeships Ambassadors 
 * map.
 *
 * 1. Initialise map and turn on 'throbber' overlay.
 * 2. Initialise form functions.
 * 3. Load the markers.
 * 4. Add infoboxes to markers.
 * 5. Add markers to clustering system and turn off 'throbber' overlay.
 * 6. Power user loop:
 * 		a) Parse search 
 *		b) Obtain geocode
 *		c) Parse geocode
 *		d) Plot geocode.
 *		e) Move map to geocode.
 *		f) Perform auto zooming.
 *		g) Provide feedback.
 *		h) Provide popups. 
 *
 * @TODO: Build generic messaging function for the feedback loop. 
 */


jQuery(function ($) {
	// Initialise some global variables.
	var firstSearch = true, map, pinBounds, cluster, url = "/map_do_search", markers = [], infoWindow;

/**
 * Initialise function.
 */

	var initialize = function() {
		console.log("initialize");
		// Create a map options variable.
		var mapOptions = {
			center: new google.maps.LatLng(
				-28.62441593910887, 
				138.50637499999993
			),
			zoom: 3,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			streetViewControl: false
		};

		// Initialise the InfoBox object.
		infoWindow = new InfoBox({
			content: '',
			disableAutoPan: false,
			pixelOffset: new google.maps.Size(-110, 10),
			zIndex: 10,
			maxWidth: 150,
			boxStyle: {
				background: "#FFD100",
				width: "200px",
				minHeight: "50px"
			},
			closeBoxMargin: "0 0 0 0",
			closeBoxURL: Drupal.settings.apprenticeships_map.basePath + "/img/close-button.png",
			infoBoxClearance: new google.maps.Size(1, 1),
		});

		// Initialise the map with the mapOptions variable.
		map = new google.maps.Map(document.getElementById("map-canvas-home"), mapOptions);

		// Now that the map exists, create the cluster layer.
		cluster = new MarkerClusterer(map);

		// Load the markers
		loadMarkers();

		// Count the markers once the map is idle. This function will always work.
		google.maps.event.addListener(map, 'idle', function() {
			countMarkers();
			$('#map-overlay').addClass('hidden');
		});
	};

/**
 * Update the result based on the form submission.
 */

	var updateResult = function(location,term) {
				console.log("updateResult");

		var parameter = [];
		if (location != undefined || location != "" ) {
			parameter.push("location=" + location);
		}
		if (term != undefined || term != "" ) {
			parameter.push("term=" + term);
		}
		var urlString = url + "?" + parameter.join("&");
		loadMarkers(urlString);
		google.maps.event.addListener(map, 'idle', countMarkers);
	};

/**
 * Add submit function to the form.
 */

	var formSubmit = function() {
		console.log("formSubmit");
		$("#apprenticeships-map-aac-search").submit(function(event) {
			event.preventDefault();
			if ($('#map-overlay').hasClass('hidden')) {
				$('#map-overlay').removeClass('hidden');
			}
			clearTimeout(typingTimer);
			typingTimer = setTimeout(function() {
				updateResult($("#edit-location").val(),$("#edit-keywords").val());   
			}, 1000);
		});
	};

/**
 * Test postcodes and apply states.
 */

	var postcodeTest = function(address) {
		console.log("postcodeTest");
		// Test whether the address 
		var postcodeTest = /^(0[289][0-9]{2})|([1345689][0-9]{3})|(2[0-8][0-9]{2})|(290[0-9])|(291[0-4])|(7[0-4][0-9]{2})|(7[8-9][0-9]{2})$/;
		if (postcodeTest.test(address)) {
			// Set state
			var pcNum = parseInt(address, 10);
			var state;
			if ((pcNum >= 200 && pcNum <= 299) || (pcNum >= 2600 && pcNum <= 2639)) {
				state = 'ACT';
			} else if ((pcNum >= 1000 && pcNum <= 2599) || (pcNum >= 2640 && pcNum <= 2914)) {
				state = 'NSW';
			} else if ((pcNum >= 900 && pcNum <= 999) || (pcNum >= 800 && pcNum <= 899)) {
				state = 'NT';
			} else if ((pcNum >= 9000 && pcNum <= 9999) || (pcNum >= 4000 && pcNum <= 4999)) {
				state = 'QLD';
			} else if (pcNum >= 5000 && pcNum <= 5999) {
				state = 'SA';
			} else if ((pcNum >= 7800 && pcNum <= 7999) || (pcNum >= 7000 && pcNum <= 7499)) {
				state = 'TAS';
			} else if ((pcNum >= 8000 && pcNum <= 8999) || (pcNum >= 3000 && pcNum <= 3999)) {
				state = 'VIC';
			} else if ((pcNum >= 6800 && pcNum <= 6999) || (pcNum >= 6000 && pcNum <= 6799)) {
				state = 'WA';
			}
			return state;
		}
		return null;
	};

/**
 * Load the markers.
 */

 	var loadMarkers = function() {
 		console.log("loadMarkers");
	 	//clearMarkers();

	 	// Get the data from the JSON-encoded URL.
	 	$.getJSON(url, function(data) {

	 		// This is the 'success' function for the $.getJSON function.
	 		pinBounds = new google.maps.LatLngBounds();

	 		// For each return data item (address), build a marker using the setMarkers function.
	 		$.each(data, function(i, item) {
	 			// Perform some validation checks
	 			if (item.geo !==  undefined) {
	 				if (item.geo.lat.length !== null && item.geo.lon.length !== null) {
	 					// Send each 'data' item off to the setMarkers function.
	 					markers.push(setMarkers(item));	
	 				}
	 			}
	 		});

	 		// If the data doesn't exist, fail out.
	 		if (data.length === 0) {
	 			alert('No Australian Apprenticeship Centres were found');	
	 			return;
	 		}
	 	});
	};

/**
 * Function to create the marker objects.
 */

	var setMarkers = function(item) {
		var myLatLng = new google.maps.LatLng(item.geo.lat, item.geo.lon);
		var marker = new google.maps.Marker({
			position: myLatLng,
			map: map,
			title: item.title,
			icon: Drupal.settings.apprenticeships_map.basePath + '/img/16_circle_red.png'
		});

		pinBounds.extend(myLatLng);
		
		// Add the new marker to the cluster layer.
		cluster.addMarker(marker);

		// Add click functionality to the marker
		google.maps.event.addListener(marker, 'click', function() {
			$('#map-feedback').addClass('hidden');
			wrapper = $('<div class="infoBox"/>');
			wrapper.append(renderTitle(item.title, item.alias));
			wrapper.append(renderAddress(item));
			wrapper.append('<span class="triangle"></span>');
			infoWindow.close();
			infoWindow.setContent(wrapper.html());
			google.maps.event.addListener(infoWindow, 'closeclick', showFeedback);
			infoWindow.open(map, marker);
		});

		// Send the new marker object back to the loadMarkers function.
		return marker;
	};

/**
 * Geocode the user-submitted search.
 */

	var geocodeSearch = function() {
		console.log("geocodeSearch");
 		// Check whether the form field has a value. If it does, then geocode the value.
 		if ($('#edit-location').val() != '') {
 			var address = $('#edit-location').val();
 			var geocoder = new google.maps.Geocoder();
 			var ne = new google.maps.LatLng(10.41, 153.38);
 			var sw = new google.maps.LatLng(43.38, 113.09);
 			var mapBounds = new google.maps.LatLngBounds(sw, ne);
 			var state = postcodeTest(address);

 			// Check if a postcode was used as the search. If it was, then add the state to the geocode object.
 			if (state !== null) {
				geocoder.geocode({
					'address': address + ' ' + state + ' Australia',
					'region': 'AU',
					'bounds': mapBounds,
					'componentRestrictions': {
						'country':'AU'
					}
				},
				function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						map.fitBounds(results[0].geometry.viewport);
						map.setCenter(results[0].geometry.location);
					if (!(firstSearch)) {
						markers[markers.length-1].setMap(null);
					}
					place_user_marker(results);
					map.setZoom(9); //Set the map to a more usable zoom
					auto_zoom();
					} else { 
						//console.log(status);
					}
				});
			} else {
				// Otherwise, the state is left off as the address is fine without it.
				geocoder.geocode({
				  'address': address + 'Australia',
				  'region': 'AU',
				  'bounds': mapBounds,
				  'componentRestrictions': {
				  	'country':'AU'
				  }
				},
				function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						map.fitBounds(results[0].geometry.viewport);
						map.setCenter(results[0].geometry.location);
						if (!(firstSearch)) {
							markers[markers.length - 1].setMap(null);
						}
						place_user_marker(results);
						map.setZoom(9);
						auto_zoom();
						firstSearch = false;
					} 
				});
			}

			// If the form field has no value, then just display everything.
		} else {
			map.fitBounds(pinBounds);
		}

		// Check if the zoom is too high. If it is, prevent any further zooming.
		if (map.getZoom() > 16) map.setZoom(16); 
	};

/**
 * The autoZoom function zooms the map out until at least one marker is visible.
 */

	var autoZoom = function() {
		console.log("autoZoom");
		while (countMarkers() == 0) {
			var currentZoom = map.getZoom()
			if (currentZoom == 5) {
				break;
			}
			map.setZoom(currentZoom - 1);
		}
	};

/**
 * The userMarker function places a marker at the centre of the geocoded search.
 */

	var userMarker = function(results) {
		console.log("userMarker");
		var searchMarker = []; //Clear out the searchMarker array.
		var searchCenter = new google.maps.Marker({
			position: results[0].geometry.location,
			map: map,
			title: address,
			clickable: false,
			icon: Drupal.settings.apprenticeships_map.basePath + '/img/marker-gold.png',
		});
		searchMarker.push(searchCenter); //The search center is added to a separate array so it is not included in the marker count.
	};

/**
 * Function to clear all the markers so they can be reloaded.
 */

	var clearMarkers = function() {
		console.log("clearMarkers");
		if (typeof(markers) !== 'undefined') {
			for (i in markers) {
				markers[i].setMap(null);
			}
		}
		markers = [];
	};

/**
* Parse and return title html markup 
* @params {String} title Center name
* @params {String} url Link to center detail page
* @return {object} jQuery HTML Object
*/
	var renderTitle = function(title, url){
		console.log("renderTitle");
		var wrapper = $('<div class="map-title"></div>'),
		header = $('<h3></h3>'),
		link = $('<a href=""></a>');

		link.attr('href', url);
		link.text(title);

		header.append(link);
		wrapper.append(header);

		return wrapper;
	};

/**
* Parse and return address html markup 
* @params {object} address Address object
* @return {object} jQuery HTML Object
*/
	var renderAddress = function (item) {
		console.log("renderAddress");
		var html = $('<div class="maps-address"></div>'),
		content = $('<div class="maps-content"></div>'),
		row = $('<div class="maps-item"></div>'),
		postal = "";

		if(item.street !== undefined) {
			content.append(row.clone().text(item.street ));
		}

		if(item.premise !== undefined) {
			content.append(row.clone().text(item.premise ));
		}

		if(item.city !== undefined) {
			postal += item.city;
		}

		if(item.state !== undefined) {
			postal += ' ' + item.state;
		}

		if(item.postcode !== undefined) {
			postal += ' ' + item.postcode;
		}

		content.append(row.clone().text(postal));

		if(item.country !== undefined) {
			content.append(row.clone().text(item.country ));
		}

		html.append(content);

		return html;
	};



/**
 * Toggles the overlay.
 * @TODO this can probably be removed.
 */

	var showFeedback = function (){
		console.log("showFeedback");
		if (jQuery('#map-feedback').hasClass('hidden')) {
			jQuery('#map-feedback').removeClass('hidden');
		}
	};

/**
 * This function counts the markers currently visible on the map window.
 */

	var countMarkers = function() {
		console.log(markers.length);
		console.log("countMarkers");
		var markerCount = 0, pluralString = '';
		$.each(markers, function(i, marker) {
			if( bounds.contains(marker.getPosition()) ) {
				markerCount++;
			}			
		});
		if (markerCount != 1) {
			pluralString = 's';
		}
		$('#map-feedback').html('<p>Showing <strong>' + markerCount + '</strong> AAC' + pluralString + '</p>').removeClass('hidden');
	};

	// Core function to initialise the map on DOM load and kick everything off.
	google.maps.event.addDomListener(window, 'load', initialize);
});










	












	

	







