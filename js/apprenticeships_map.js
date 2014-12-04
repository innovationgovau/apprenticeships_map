(function () {

	var search_first_time = true;
	var map, pin_bounds, cluster;
	var page = 0;
	var size = 20;
	var url = "/map_do_search";
	var typingTimer;



	jQuery(function(){
		function updateResult(location,term){
			var parameter = [];
			if(location != undefined || location != "" ){
				parameter.push("location="+location);
			}
			if(term != undefined || term != "" ){
				parameter.push("term="+term);
			}
			var urlString = url+ "?" + parameter.join("&");
			load_markers(urlString);
			google.maps.event.addListener(map, 'idle', count_markers);
		}
		jQuery("#apprenticeships-map-aac-search").submit(function(event){
			event.preventDefault();
			if (jQuery('#map-overlay').hasClass('hidden')) {
				jQuery('#map-overlay').removeClass('hidden');
			}
			clearTimeout(typingTimer);
			typingTimer = setTimeout(function(){
				updateResult(jQuery("#edit-location").val(),jQuery("#edit-keywords").val());   
			}, 1000);

		});	
	});

	var InfoWindow = new InfoBox({
		content: '',
		disableAutoPan: false,
		pixelOffset: new google.maps.Size(-110, 10),
		zIndex: 10,
		maxWidth: 150,
		disableAutoPan : false,
		boxStyle: {
			background: "#FFD100",
			width: "200px",
			minHeight: "50px"
		},
		closeBoxMargin: "0 0 0 0",
		closeBoxURL: Drupal.settings.apprenticeships_map.basePath + "/img/close-button.png",
		infoBoxClearance: new google.maps.Size(1, 1)
	});	


	function initialize() {
		var mapOptions = {
			center: new google.maps.LatLng(-28.62441593910887,138.50637499999993),
			zoom: 4,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			streetViewControl: false
		};
		map = new google.maps.Map(document.getElementById("map-canvas-home"),
			mapOptions);

		google.maps.event.addListener(map, 'idle', function() {
			count_markers();
			jQuery('#map-overlay').addClass('hidden');
			if (typeof map !== undefined) {
				//cluster = new MarkerClusterer(map, markers);
			}
		});
	}

	google.maps.event.addDomListener(window, 'load', initialize);

	var markers = [];

	load_markers(url);

	function load_markers(url) {
		clear_markers();
		jQuery.getJSON(url, function(data) {
		    var check_load = setInterval(function() { 
		    	clearInterval(check_load);
		    	pin_bounds = new google.maps.LatLngBounds();
		    	jQuery.each(data, function(i,item) {	
		    		if(item.geo !=  undefined){
		    			if(item.geo.lat.length != null && item.geo.lon.length != null){
		    				setMarkers(map, item, i);	
		    			}
		    		}
		    	});
		    	if (data.length == 0) {
		    		alert('No Australian Apprenticeship Centres were found');	
		    		return;
		    	}  	

		    	if (jQuery('#edit-location').val() != '') {
		    		var address = jQuery('#edit-location').val();
		    		var geocoder = new google.maps.Geocoder();
		    		var ne = new google.maps.LatLng(10.41, 153.38);
		    		var sw = new google.maps.LatLng(43.38, 113.09);
		    		var map_bounds = new google.maps.LatLngBounds(sw, ne);
		            var postcode_test = /^(0[289][0-9]{2})|([1345689][0-9]{3})|(2[0-8][0-9]{2})|(290[0-9])|(291[0-4])|(7[0-4][0-9]{2})|(7[8-9][0-9]{2})$/; //To test whether a postcode has been sent
		            if (postcode_test.test(address)) {
	            		// Set state
	            		var pc_num = parseInt(address, 10);
	            		var state;
	            		if ((pc_num >= 200 && pc_num <= 299) || (pc_num >= 2600 && pc_num <= 2639)) {
	            			state = 'ACT';
	            		} else if ((pc_num >= 1000 && pc_num <= 2599) || (pc_num >= 2640 && pc_num <= 2914)) {
	            			state = 'NSW';
	            		} else if ((pc_num >= 900 && pc_num <= 999) || (pc_num >= 800 && pc_num <= 899)) {
	            			state = 'NT';
	            		} else if ((pc_num >= 9000 && pc_num <= 9999) || (pc_num >= 4000 && pc_num <= 4999)) {
	            			state = 'QLD';
	            		} else if (pc_num >= 5000 && pc_num <= 5999) {
	            			state = 'SA';
	            		} else if ((pc_num >= 7800 && pc_num <= 7999) || (pc_num >= 7000 && pc_num <= 7499)) {
	            			state = 'TAS';
	            		} else if ((pc_num >= 8000 && pc_num <= 8999) || (pc_num >= 3000 && pc_num <= 3999)) {
	            			state = 'VIC';
	            		} else if ((pc_num >= 6800 && pc_num <= 6999) || (pc_num >= 6000 && pc_num <= 6799)) {
	            			state = 'WA';
	            		}
	            		geocoder.geocode( { 'address': address + ' ' + state + ' Australia', 'region': 'AU', 'bounds': map_bounds, 'componentRestrictions': {'country':'AU'} }, function(results, status) {
	            			if (status == google.maps.GeocoderStatus.OK) {
	            				map.fitBounds(results[0].geometry.viewport);
	            				map.setCenter(results[0].geometry.location);
	            				if (!(search_first_time)) {
	            					markers[markers.length-1].setMap(null);
	            				}
	            				place_user_marker(results);
			                	map.setZoom(9); //Set the map to a more usable zoom
			                	auto_zoom();
			                }

			                else {
			                	//console.log(status);
			                } 
			              });
	            	} else {
	            		// Geocode for regular address
	            		geocoder.geocode( { 'address': address + 'Australia', 'region': 'AU', 'bounds': map_bounds, 'componentRestrictions': {'country':'AU'} }, function(results, status) {
	            			if (status == google.maps.GeocoderStatus.OK) {
	            				map.fitBounds(results[0].geometry.viewport);
	            				map.setCenter(results[0].geometry.location);
	            				if (!(search_first_time)) {
	            					markers[markers.length-1].setMap(null);
	            				}
	            				place_user_marker(results);
	            				map.setZoom(9);
	            				auto_zoom();
	            				search_first_time = false;

	            			} 
	            		});
	            	}
	            	function auto_zoom() {
	            		while (count_markers() == 0) {
	            			var currentZoom = map.getZoom()
	            			if (currentZoom == 5) {
	            				break;
	            			}
	            			map.setZoom(currentZoom - 1);
	            		}
	            	}
	            	function place_user_marker(results) {
	            		var searchMarker = []; //Clear out the searchMarker array.
	            		var search_center = new google.maps.Marker({
	            			position: results[0].geometry.location,
	            			map: map,
	            			title: address,
	            			clickable: false,
	            			icon: Drupal.settings.apprenticeships_map.basePath + '/img/marker-gold.png',
	            		});
	            		searchMarker.push(search_center); //The search center is added to a separate array so it is not included in the marker count.
	            	}

	            } else {
	            	map.fitBounds(pin_bounds);
	            }
	            if (map.getZoom() > 16) map.setZoom(16); 
	          }, 100);        
	});
	}

	function clear_markers() {
		//console.log('Clearing markers.')
		if (typeof(markers) !== 'undefined') {
			for (i in markers) {
				markers[i].setMap(null);
			}
		}
		markers = [];
	}

	/**
	* Parse and return title html markup 
	* @params {String} title Center name
	* @params {String} url Link to center detail page
	* @return {object} jQuery HTML Object
	*/
	var renderTitle = function(title, url){
		var wrapper = jQuery('<div class="map-title"></div>'),
		header = jQuery('<h3></h3>'),
		link = jQuery('<a href=""></a>');

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
	var renderAddress = function(project){
		var wrapper = jQuery('<div class="maps-address"></div>'),
		content = jQuery('<div class="maps-content"></div>'),
		row = jQuery('<div class="maps-item"></div>'),
		postal = "";

		if(project.street !== undefined) {
			content.append(row.clone().text(project.street ));
		}

		if(project.premise !== undefined) {
			content.append(row.clone().text(project.premise ));
		}

		if(project.city !== undefined) {
			postal += project.city;
		}

		if(project.state !== undefined) {
			postal += ' ' + project.state;
		}

		if(project.postcode !== undefined) {
			postal += ' ' + project.postcode;
		}

		content.append(row.clone().text(postal));

		if(project.country !== undefined) {
			content.append(row.clone().text(project.country ));
		}

		wrapper.append(content);

		return wrapper;
	};


	function setMarkers(map, project, i) {

		var myLatLng = new google.maps.LatLng(project.geo.lat, project.geo.lon);
		var marker = new google.maps.Marker({
			position: myLatLng,
			map: map,
			title: project.title,
			icon: Drupal.settings.apprenticeships_map.basePath + '/img/16_circle_red.png'
		});

		pin_bounds.extend(myLatLng);

		markers.push(marker);

		function showFeedback(){
			if (jQuery('#map-feedback').hasClass('hidden')) {
				jQuery('#map-feedback').removeClass('hidden');
			}
		}

		google.maps.event.addListener(marker, 'click', function() {
			jQuery('#map-feedback').addClass('hidden');
			var wrapper = jQuery('<div class="infoBox"/>');
			wrapper.append(renderTitle(project.title, project.alias));
			wrapper.append(renderAddress(project));
			wrapper.append('<span class="triangle"></span>');
			InfoWindow.close();
			InfoWindow.setContent(wrapper.html());
			google.maps.event.addListener(InfoWindow, 'closeclick', showFeedback)
			InfoWindow.open(map,marker);
		}); 
	}

	function count_markers() {
		var marker_count = 0;
		var plural_string = '';
		for(var i = markers.length, bounds = map.getBounds(); i--;) {
			if( bounds.contains(markers[i].getPosition()) ) {
				marker_count++;
			}
		}
		if (marker_count != 1) {
			plural_string = 's';
		}
		jQuery('#map-feedback').html('<p>Showing <strong>' + marker_count + '</strong> AAC' + plural_string + '</p>').removeClass('hidden');
		return marker_count;
	}
}());