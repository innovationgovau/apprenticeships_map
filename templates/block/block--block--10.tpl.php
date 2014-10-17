<div class="view view-find-my-aac view-dom-id-f42364547a67429d43021ee447395d25" id="block-views-find-my-aac-block-aac-list">

	<div id="map-canvas-internal"></div>
    <div id="map-feedback"></div>
    <div id="map-overlay"></div>
	<div class="content clearfix">
		<div class="view-header"><p>Enter your search terms below. You can do a simple text search for the city, postcode or company name.</p></div>

		<div class="view-filters">
			<form id="search-center-form" class="map-form wide" action="javascript:void(0);">
				<label for="location">Location</label>
				<input type="text" placeholder="City,Suburb,Postcode" name="location" id="location">
				<label for="term">Search Keywords</label>
				<input type="text" placeholder="Keywords" name="term" id="term">
				<input type="submit" id="search_button" />
			</form>
		</div>
        <div id="region-search">
            <p style="margin-top: 1em; margin-left: 1em">
                <a href="/find-my-aac-by-region" title="Find my AAC by region">Find an AAC by region...</a>
            </p>
        </div>

            <div class="view-content">
		</div>
	</div>

</div>

<script src="/sites/all/themes/apprenticeships_subtheme/js/infobox_packed.js"></script>

<script type="text/javascript" src="/sites/all/themes/apprenticeships_subtheme/js/jquery.placeholder.min.js"></script>
<script type="text/javascript">
jQuery('input, textarea').placeholder(); 
</script>


<script type="text/javascript">
/**
 * Google Map / Find AAC Mashup 
 */

var rr = (function(parent, google, $) {

    var $form = $('#search-center-form'),
        $location = $('#location'),
        $term = $('#term'),
        $mapCanvas = document.getElementById("map-canvas-internal"),
        $resultContainer = $('.content .view-content'),
        url = "/map_do_search",
        map, pin_bounds,
        markers = [];

    /**
    * Initialise Module. 
    * Bind search form submit and initialise google Map
    */
    var init = function() {
        $form.on('submit', function(e){
            if (jQuery('#map-overlay').hasClass('hidden')) {
                jQuery('#map-overlay').removeClass('hidden');
            }
            updateResult($location.val(), $term.val());
            e.preventDefault();
        });

        google.maps.event.addDomListener(window, 'load', initializeMap);
        load_markers(url);
    };

	var InfoWindow = new InfoBox({
        content: '',
        disableAutoPan: false,
        pixelOffset: new google.maps.Size(-110, 10),
        zIndex: null,
        maxWidth: 300,
        disableAutoPan : false,
        boxStyle: {
            background: "#FFD100",
            width: "300px",
            minHeight: "100px",
            opacity: "0.9"
        },
        closeBoxMargin: "0 0 0 0",
        closeBoxURL: "/sites/all/themes/apprenticeships_subtheme/images/close-button.png",
        infoBoxClearance: new google.maps.Size(70, 20)
    });	

    /**
    * Initialise Google Map
    */
    var initializeMap = function() {
        var mapOptions = {
          center: new google.maps.LatLng(-28.62441593910887,138.50637499999993),
          zoom: 4,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map($mapCanvas, mapOptions);
        google.maps.event.addListener(map, 'idle', count_markers);
    }


    /**
    * Loop throught returned result and render result list
    * @params {object} data Center location data
    */
    var renderResult = function(data) {

    	$.each(data, function(i,item) {
    		
    		if (item.field_aac_location.length != 0) { // Checking that all items have a lat and lon

    			var myLatLng = new google.maps.LatLng(item.field_aac_location.und[0].lat, item.field_aac_location.und[0].lon); // If they do create a gmaps object
   		
	    		if (map.getBounds().contains(myLatLng)) { // And then append it to our listing if it's within bounds
	    			
		    		var $wrapper = $('<div class="views-row"/>'),
		    			positionClass,
		    			count = i+1;
		
		    		if(count%2 == 0) {
		    			positionClass = 'views-row-even';
		    		} else {
		    			positionClass = 'views-row-odd';
		    		}
		
		    		$wrapper.addClass('views-row-' + count);
		    		$wrapper.addClass(positionClass);
		
		    		$wrapper.append(renderTitle(item.title, item.node_alias));
		
		    		$wrapper.append(renderAddress(item.field_aac_address.und[0]));
		
		    		if(item.field_aac_freecall.und !==  undefined){
		    			$wrapper.append(renderNumber(item.field_aac_freecall.und[0].value, 'Freecall: '));
		    		}
		
					if(item.field_aac_telephone_number.und !==  undefined){
		    			$wrapper.append(renderNumber(item.field_aac_telephone_number.und[0].value, 'Tel: '));
		    		}
		
		    		if(item.field_aac_fax_number.und !==  undefined){
		    			$wrapper.append(renderNumber(item.field_aac_fax_number.und[0].value, 'Fax: '));
		    		}
		
		    		if(item.field_aac_email.und !==  undefined){
		
		    			$wrapper.append(renderEmailAdd(item.field_aac_email.und[0].email));
		    		}
		
		    		if(item.field_aac_website.und !==  undefined){
		    			var title = "";
		
		    			if(item.field_aac_website.und[0].title == null) {
		    				title = item.title;
		    			} else {
		    				title = item.field_aac_website.und[0].title;
		    			}
		    			$wrapper.append(renderWebsite(title, item.field_aac_website.und[0].url));
		    		}
		
		            if(item.type !==  undefined){
		                $wrapper.append(renderNumber(item.type, 'Type: '));
		            }
		
		    		$resultContainer.append($wrapper);
	    		
	    		}
    		}
    	});
    };

    /**
    * Parse and return address html markup 
    * @params {object} address Address object
    * @return {object} jQuery HTML Object
    */
    var renderAddress = function(address){
    	var $wrapper = $('<div class="views-field"></div>'),
    		$content = $('<div class="field-content"></div>'),
    		$row = $('<div></div>'),
    		postal = "";

    	if(address.thoroughfare !== undefined) {
    		$content.append($row.clone().text(address.thoroughfare ));
    	}

    	if(address.premise !== undefined) {
    		$content.append($row.clone().text(address.premise ));
    	}

    	if(address.locality !== undefined) {
    		postal += address.locality;
    	}

    	if(address.administrative_area !== undefined) {
    		postal += ' ' + address.administrative_area;
    	}

    	if(address.postal_code !== undefined) {
            if (address.postal_code.length == 3) {
                postal += ' 0' + address.postal_code;
            } else {
                postal += ' ' + address.postal_code;
            }
    	}

    	$content.append($row.clone().text(postal));

    	if(address.country !== undefined) {
    		$content.append($row.clone().text(address.country ));
    	}

    	$wrapper.append($content);

    	return $wrapper;
    };


    /**
    * Parse and return title html markup 
    * @params {String} title Center name
    * @params {String} url Link to center detail page
    * @return {object} jQuery HTML Object
    */
    var renderTitle = function(title, url){
    	var $wrapper = $('<div class="views-field views-field-title"></div>'),
    		$header = $('<h3 class="field-content"></h3>'),
    		$link = $('<a href=""></a>');

    	$link.attr('href', 'http://'+location.hostname + '/' + url);
    	$link.text(title);

    	$header.append($link);
    	$wrapper.append($header);

    	return $wrapper;
    };

    /**
    * Parse and return center website html markup 
    * @params {String} title Center website title or center name
    * @params {String} url Link to center homepage
    * @return {object} jQuery HTML Object
    */
    var renderWebsite = function(title, url){
    	var $wrapper = $('<div class="views-field views-field-field-aac-website"></div>'),
    		$label = $('<strong class="views-label views-label-field-aac-website">Website: </strong>'),
    		$span = $('<span class="field-content"></span>'),
    		$link = $('<a href=""></a>');

    		$link.attr('href', 'http://' + url);
	    	$link.text(title);

	    	$span.append($link);

    		 $wrapper
    		 	.append($label)
    		 	.append($span)

    	return $wrapper;
    };

    /**
    * Parse and return label/number html markup
    * @params {String} callNum Number to render
    * @params {String} prefix Text of number label
    * @return {object} jQuery HTML Object
    */
    var renderNumber = function(callNum, prefix){
    	var $wrapper = $('<div class="views-field"></div>'),
    		$label = $('<strong class="views-label">' + prefix + '</strong>'),
    		$span = $('<span class="field-content"></span>');

    		$span.text(callNum);

    		 $wrapper
    		 	.append($label)
    		 	.append($span)

    	return $wrapper;
    };


    /**
    * Parse and return email html markup
    * @params {String} email Email address
    * @return {object} jQuery HTML Object
    */
    var renderEmailAdd = function(email){
    	var $wrapper = $('<div class="views-field views-field-field-aac-email"></div>'),
    		$label = $('<strong class="views-label views-label-field-aac-email">Email: </strong>'),
    		$span = $('<span class="field-content"></span>'),
    		$link = $('<a href=""></a>');

    		$link.attr('href', 'mailto:' + email);
	    	$link.text(email);

	    	$span.append($link);

    		 $wrapper
    		 	.append($label)
    		 	.append($span)

    	return $wrapper;
    };

    /**
    * Parse and return email html markup
    * @params {String} $loc Location
    * @params {string} $term Search terms
    */
    var updateResult = function($loc, $term) {
        var parameter = [];

        if($location != undefined || $location != "" ){
            parameter.push("location="+ $loc);
        }

        if($term != undefined || $term != "" ){
            parameter.push("term="+ $term);
        }

        var urlString = url+ "?" + parameter.join("&");

        $resultContainer.empty();

        load_markers(urlString);
        google.maps.event.addListener(map, 'idle', count_markers);
    };

    /**
    * Load map markers
    */
    var load_markers = function(url) {
        clear_markers();

        jQuery.getJSON(url, function(data) {
            
            pin_bounds = new google.maps.LatLngBounds();

            $.each(data, function(i,item) {
                if(item.field_aac_location.und !=  undefined){
                    if(item.field_aac_location.und[0].lat.length!=null && item.field_aac_location.und[0].lon.length!=null){
                        setMarkers(map, item, i);
                    }
                }
            });
						
            if (data.length == 0) {
                alert('No Australian Apprenticeship Centres were found'); 
                return;
            };
            google.maps.event.addListenerOnce(map, 'idle', function(){
                //turn throbber off
                $('#map-overlay').addClass('hidden');
            });

            if ($('#location').val() != '') {
	            var address = jQuery('#location').val();
                var geocoder = new google.maps.Geocoder();
                var ne = new google.maps.LatLng(10.41, 153.38)
                var sw = new google.maps.LatLng(43.38, 113.09)
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
                    geocoder.geocode( { 'address': address + ' ' + state + ' Australia', 'region': 'AU', 'bounds': map_bounds }, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            map.fitBounds(results[0].geometry.viewport);
                            map.setCenter(results[0].geometry.location);
                            map.setZoom(12); //Set the map to a more usable zoom
                            renderResult(data);                	                
		            } else {
                            //console.log(status);
                        } 
                    });
                } else {
                    // Geoode for regular address
                    geocoder.geocode( { 'address': address + 'Australia', 'region': 'AU', 'bounds': map_bounds }, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            map.fitBounds(results[0].geometry.viewport);
                            map.setCenter(results[0].geometry.location);
                            map.setZoom(10); //Set the map to a more usable zoom
                            renderResult(data);
                        } else {
                            //console.log(status);
                        } 
                    });
                }
            } else {
                map.fitBounds(pin_bounds);
		        renderResult(data);
	        }
	        
	        if (map.getZoom() > 16) map.setZoom(16); 
	        
        });
    };

    /**
    * Clear map markers
    */
    var clear_markers = function() {
        if (typeof(markers) !== 'undefined') {
          for (i in markers) {
            markers[i].setMap(null);
          }
        }
        markers = [];
    };

    /**
    * Set map markers
    */
    function setMarkers(map, item, i) {
        // var project_coords = project.Coordinates.split(':');
        // var project_node_id = project.Nid;
        
        var myLatLng = new google.maps.LatLng(item.field_aac_location.und[0].lat, item.field_aac_location.und[0].lon);
        var marker = new google.maps.Marker({
            position: myLatLng,
            map: map,
            title: item.title,
            icon: '/sites/all/themes/apprenticeships_subtheme/images/maps/16_circle_red.png'
        });

        pin_bounds.extend(myLatLng);

        markers.push(marker);
        
        google.maps.event.addListener(marker, 'click', function() {
            var $wrapper = $('<div class="infoBox"/>');
            $wrapper.append(renderTitle(item.title, item.node_alias));
    		$wrapper.append(renderAddress(item.field_aac_address.und[0]));
    		if(item.field_aac_freecall.und !==  undefined){
    			$wrapper.append(renderNumber(item.field_aac_freecall.und[0].value, 'Freecall: '));
    		}
			if(item.field_aac_telephone_number.und !==  undefined){
    			$wrapper.append(renderNumber(item.field_aac_telephone_number.und[0].value, 'Tel: '));
    		}
    		if(item.field_aac_fax_number.und !==  undefined){
    			$wrapper.append(renderNumber(item.field_aac_fax_number.und[0].value, 'Fax: '));
    		}
    		if(item.field_aac_email.und !==  undefined){
    			$wrapper.append(renderEmailAdd(item.field_aac_email.und[0].email));
    		}
    		if(item.field_aac_website.und !==  undefined){
    			var title = "";
    			if(item.field_aac_website.und[0].title == null) {
    				title = item.title;
    			} else {
    				title = item.field_aac_website.und[0].title;
    			}
    			$wrapper.append(renderWebsite(title, item.field_aac_website.und[0].url));
    		}
            if(item.type !==  undefined){
                $wrapper.append(renderNumber(item.type, 'Type: '));
            }
			$wrapper.append('<span class="triangle"></span>');
            InfoWindow.close();
            InfoWindow.setContent($wrapper.html());
            InfoWindow.open(map,marker);
        });
    }

    /**
    * Expose module methods
    */
    parent.googleMap = {
        init:init
    };

    return parent;
    function count_markers() {
    // Check number of markers when the map is idle.
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
    $('#map-feedback').html('Showing <strong>' + marker_count + '</strong> AAC' + plural_string).removeClass('hidden');
}

}(rr || {}, google, jQuery));



jQuery(function(){
	rr.googleMap.init();
});

</script>