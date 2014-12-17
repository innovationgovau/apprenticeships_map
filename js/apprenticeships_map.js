/**
 * Apprenticeships Map
 *
 * This JS file presents the map on the home pahe of Australian Apprenticeships. It also powers the 
 * internal view of the same AAC data, as well as power the internal Australian Apprenticeships Ambassadors 
 * map.
 */


jQuery(function ($) {
	// Initialise some global variables.
	var resultContainer, zoomInit, zoomAuto, firstSearch = true, map, pinBounds = new google.maps.LatLngBounds(), cluster, url = "/map_do_search", markers = [], infoWindow, mapCenter, mapID = Drupal.settings.apprenticeships_map.mapID;

/**
 * Initialise function.
 */

	var initialize = function() {

		// Turn on the throbber.
		$('#map-overlay').show();

		// Set some initial variables depending on where the map is (internal/home).
		switch (mapID) {
			case 'map-canvas-home':
				zoomInit = 3;
				zoomAuto = 9;
				break;
			case 'map-canvas-internal':
				zoomInit = 4;
				zoomAuto = 11;
				resultContainer = $('#result-container');
				break;
		}

		// Create a map options variable.
		var mapOptions = {
			center: new google.maps.LatLng(
				-27.226655302429965, 
				134.63918749999996
			),
			zoom: zoomInit,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDefaultUI: true,
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

		// Initialise the map with the mapOptions variable. The element ID is passed in by the Drupal settings object.
		map = new google.maps.Map(document.getElementById(mapID), mapOptions);

		// Ensure that the initial map center is filled.
		mapCenter = map.getCenter();

		google.maps.event.addDomListener(window, 'resize', function() {
			map.setCenter(mapCenter);
		});

		// Now that the map exists, create the cluster layer.
		cluster = new MarkerClusterer(map);
		cluster.ignoreHidden = true;
		google.maps.event.addListener(cluster, 'clusteringend', function() {
			$('#map-overlay').hide();
		})
		// Load the markers
		loadMarkers(url);

		// Add form functionality.
		formSubmit();

		// Count the markers once the map is idle.
		google.maps.event.addListener(map, 'idle', function() {
			$('#map-overlay').hide();
			countMarkers();
		});

		// Redraw the map when the zoom changes.
		google.maps.event.addListener(map, 'zoom_changed', function() {
			$('#map-overlay').show();
		});
	};

/**
 * Update the result based on the form submission.
 */

	var updateResult = function(location,term) {
		var parameter = [];
		if (location != undefined || location != "" ) {
			parameter.push("location=" + location);
		}
		if (term != undefined || term != "" ) {
			parameter.push("term=" + term);
		}
		var urlString = url + "?" + parameter.join("&");
		$('#map-message').hide();
		loadMarkers(urlString);
	};

/**
 * Add submit function to the form.
 */

	var formSubmit = function() {
		$("#apprenticeships-map-aac-search").submit(function(event) {
			event.preventDefault();
			$('#map-overlay').show();
			updateResult($("#edit-location").val(), $("#edit-keywords").val());
			geocodeSearch();  
		});
	};

/**
 * Test postcodes and apply states.
 */

	var postcodeTest = function(address) {
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

 	var loadMarkers = function(url) {

 		// Clear out the markers
	 	clearMarkers();

	 	// Get the data from the JSON-encoded URL.
	 	$.getJSON(url, function(data) {
	 		// This is the 'success' function for the $.getJSON function.
	 		// For each return data item (address), build a marker using the setMarkers function.
	 		$.each(data, function(i, item) {
	 			// Perform some validation checks
	 			if (item.geo !==  undefined) {
	 				if (item.geo.lat.length !== null && item.geo.lon.length !== null) {
	 					// Send each 'data' item off to the setMarkers function.
	 					markers.push(setMarkers(item));
	 				}
	 			}
	 			// If the marker is in the current bounds, render the result out under the map.
				if (resultContainer) {
					var itemPosition = new google.maps.LatLng(item.geo.lat, item.geo.lon);
					if (map.getBounds().contains(itemPosition)) {
						renderResult(item);
					}
				}
	 		});
	 		
	 		// Now that all the markers have been added, turn the throbber off.
	 		$('#map-overlay').hide();

	 		// Count the markers.
	 		countMarkers();

	 		// If the data doesn't exist, fail out.
	 		if (data.length === 0) {
	 			setMessage('No Australian Apprenticeship Centres were found. Try altering your search.', 'warning');	
	 			return;
	 		}
	 	});
	};

/**
 * Function to create the marker objects.
 */

	var setMarkers = function(item) {
		var position = new google.maps.LatLng(item.geo.lat, item.geo.lon);
		var marker = new google.maps.Marker({
			position: position,
			map: map,
			title: item.title,
		});

		pinBounds.extend(position);

		// Add the new marker to the cluster layer.
		cluster.addMarker(marker);

		// Add click functionality to the marker
		google.maps.event.addListener(marker, 'click', function() {
			wrapper = $('<div class="infoBox"/>');
			wrapper.append(renderTitle(item.title, item.alias));
			wrapper.append(renderAddress(item));
			wrapper.append('<span class="triangle"></span>');
			infoWindow.close();
			infoWindow.setContent(wrapper.html());
			infoWindow.open(map, marker);
		});

		// Send the new marker object back to the loadMarkers function.
		return marker;
	};

/**
 * Geocode the user-submitted search.
 */

	var geocodeSearch = function() {
 		// Check whether the form field has a value. If it does, then geocode the value.
 		if ($('#edit-location').val() !== '') {
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

						// Center the map on the location of the geocode.
						map.setCenter(results[0].geometry.location);

						// Make sure the mapCenter variable is updated, in case the viewport is resized.
						mapCenter = map.getCenter();

						//Set the map to a more usable zoom
						map.setZoom(zoomAuto); 
						autoZoom();
					} else { 
						setMessage('An error has occurred with the geocoding service. Please try again.', 'warning');
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
						map.setCenter(results[0].geometry.location);
						mapCenter = map.getCenter();
						map.setZoom(zoomAuto);
						autoZoom();
						firstSearch = false;
					} else {
						setMessage('An error has occurred with the geocoding service. Please try again.', 'warning');
					}
				});
			}
		} else {
			// If the form field has no value, then just display everything.
			map.fitBounds(pinBounds);
		}

		// Check if the zoom is too high. If it is, prevent any further zooming.
		//if (map.getZoom() > 16) map.setZoom(16); 
	};

/**
 * The autoZoom function zooms the map out until at least one marker is visible.
 */

	var autoZoom = function() {
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
		var searchMarker = []; //Clear out the searchMarker array.
		var searchCenter = new google.maps.Marker({
			position: results[0].geometry.location,
			map: map,
			title: results[0].address_components.formatted_address,
			clickable: false,
			icon: Drupal.settings.apprenticeships_map.basePath + '/img/marker-gold.png',
		});
		searchMarker.push(searchCenter); //The search center is added to a separate array so it is not included in the marker count.
	};

/**
 * Function to clear all the markers so they can be reloaded.
 */

	var clearMarkers = function() {
		if (typeof(markers) !== 'undefined') {
			for (i in markers) {
				markers[i].setMap(null);
			}
		}
		markers = [];
		cluster.clearMarkers();

		// Empty the result container.
		$(resultContainer).empty();

	};

/**
 * Function to render addresses underneath the internal map only.
 */

	var renderResult = function(item) {

		// Define the wrapper.
		var wrapper = $('<div class="map-item"/>');

		// Add the title with the link
		wrapper.append(renderTitle(item.title, item.alias));

		// Add the address
		wrapper.append(renderAddress(item));

		// Add the freecall number, if it exists.
		if(item.freecall) {
			wrapper.append(renderNumber(item.freecall, 'Freecall: '));
		}

		// Add the telephone number, if it exists.
		if(item.phone) {
			wrapper.append(renderNumber(item.phone, 'Tel: '));
		}

		// Add the fax number, if it exists.
		if(item.fax) {
			wrapper.append(renderNumber(item.fax, 'Fax: '));
		}

		// Add the email address, if it exists.
		if(item.email) {
			wrapper.append(renderEmail(item.email));
		}

		// Add the website, if it exists.
		if(item.website) {
			var title;
			if(item.website.title) {
				title = item.website.title;
			} else {
				title = item.title;
			}
			wrapper.append(renderWebsite(title, item.website.url));
		}

		// Add the AAC type, if it exists.
		if(item.type) {
			wrapper.append(renderNumber(item.type, 'Type: '));
		}

		// Add everything to the result container.
		$(resultContainer).append(wrapper);
	}

/**
 * Parse and return center website html markup 
 * @params {String} title Center website title or center name
 * @params {String} url Link to center homepage
 * @return {object} jQuery HTML Object
 */

	var renderWebsite = function(title, url){
		var wrapper = $('<div class="map-item-website"><p></p></div>'),
		label = $('<strong>Website: </strong>'),
		link = $('<a href=""></a>');
		content = $('<p></p>');

		link.attr('href', 'http://' + url);
		link.text(title);

		$(content).append(label).append(link);
		$(wrapper).append(content);

		return wrapper;
	};

/**
 * Parse and return label/number html markup
 * @params {String} callNum Number to render
 * @params {String} prefix Text of number label
 * @return {object} jQuery HTML Object
 */

	var renderNumber = function(num, prefix){
		var wrapper = $('<div class="map-item-number"></div>'),
		label = $('<strong>' + prefix + '</strong>');
		content = $('<p></p>');

		$(content).append(label).append(num);
		$(wrapper).append(content);

		return wrapper;
	};


/**
 * Parse and return email html markup
 * @params {String} email Email address
 * @return {object} jQuery HTML Object
 */

var renderEmail = function(email){
	var wrapper = $('<div class="map-item-email"><p></p></div>'),
	label = $('<strong>Email: </strong>'),
	link = $('<a href=""></a>');
	content = $('<p></p>');

	$(link).attr('href', 'mailto:' + email);
	$(link).text(email);
	$(content).append(label).append(link);
	$(wrapper).append(content);

	return wrapper;
};


/**
* Parse and return title html markup 
* @params {String} title Center name
* @params {String} url Link to center detail page
* @return {object} jQuery HTML Object
*/
	var renderTitle = function(title, url){
		var wrapper = $('<div class="map-title"></div>'),
		heading = $('<h3></h3>'),
		link = $('<a href=""></a>');

		link.attr('href', url);
		link.text(title);

		heading.append(link);
		wrapper.append(heading);

		return wrapper;
	};

/**
* Parse and return address html markup 
* @params {object} address Address object
* @return {object} jQuery HTML Object
*/
	var renderAddress = function (item) {
		var wrapper = $('<div class="map-address"></div>'),
		row = $('<p></p>'),
		postal = "";

		if(item.street) {
			wrapper.append(row.clone().text(item.street ));
		}

		if(item.premise) {
			wrapper.append(row.clone().text(item.premise ));
		}

		if(item.city) {
			postal += item.city;
		}

		if(item.state) {
			postal += ' ' + item.state;
		}

		if(item.postcode) {
			postal += ' ' + item.postcode;
		}

		wrapper.append(row.clone().text(postal));

		if(item.country) {
			wrapper.append(row.clone().text(item.country ));
		}

		return wrapper;
	};

/**
 * This function counts the markers currently visible on the map window.
 */

	var countMarkers = function() {
			var markerCount = 0, pluralString = '', bounds = map.getBounds();
			$.each(markers, function(i, marker) {
				if(bounds.contains(marker.getPosition())) {
					markerCount++;
				}			
			});
			if (markerCount !== 1) {
				pluralString = 's';
			}
			$('#map-feedback').html('<p>Showing <strong>' + markerCount + '</strong> AAC' + pluralString + '</p>').removeClass('hidden').show();
	};

/**
 * This functions places a message in the middle of the map to inform the user of some error.
 */

 	var setMessage = function(message, status) {
 		$('#map-message').show().html('<p>' + message + '</p>').removeClass().addClass(status);
 	}

	// Core function to initialise the map on DOM load and kick everything off.
	google.maps.event.addDomListener(window, 'load', initialize);
});
