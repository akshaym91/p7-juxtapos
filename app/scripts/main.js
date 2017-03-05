/**
 * Model for a place.
 * @param {[type]} place Data received from the array
 * @param {[type]} map   Google Map object
 * @param {[type]} id    To maintain the count
 */
var Place = function(place, map, id) {

    // Required for Foursquare
    var CLIENT_ID = 'TVNLRRSOKAUSJ4DSKLQNEMGZLWQZ4EXXTRXKJUOSZEXKFBQW';
    var CLIENT_SECRET = 'MYWSU5FU0HQGQXCK15BQYERIEAJT1UFW1VW1YAAJGDY0TY2Y';

    // Holding on to the context
    var self = this;

    // Details from Array
    this.title = place.title;
    this.location = {
        lat: place.location.lat,
        lng: place.location.lng
    };

    // Placeholder for data from Foursquare
    this.street = '';
    this.city = '';
    this.phone = '';
    this.info = '<div class="info-window-content"><div class="title"><b>' + place.title + "</b></div>" +
        '<div class="content"><a href="' + self.URL + '">' + self.URL + "</a></div>" +
        '<div class="content">' + self.street + "</div>" +
        '<div class="content">' + self.city + "</div>" +
        '<div class="content">' + self.phone + "</div></div>";

    // Some more meta data
    this.id = id;
    this.map = map;

    // Observable entity on the model
    this.visible = ko.observable(true);
    this.position = place.location;
    this.marker = new google.maps.Marker({
        position: new google.maps.LatLng(place.location.lat, place.location.lng),
        map: map,
        title: place.title
    });
    this.infoWindow = new google.maps.InfoWindow({
        content: self.info
    });

    // Controls whether the marker can be seen
    this.showMarker = ko.computed(function() {
        if (this.visible() === true) {
            this.marker.setMap(map);
        } else {
            this.marker.setMap(null);
        }
        return true;
    }, this);

    // Listener for the click on marker
    this.marker.addListener('click', function() {
        self.info = '<div class="info-window-content"><div class="title"><b>' + place.title + "</b></div>" +
            '<div class="content"><a href="' + self.URL + '">' + self.URL + "</a></div>" +
            '<div class="content">' + self.street + "</div>" +
            '<div class="content">' + self.city + "</div>" +
            '<div class="content"><a href="tel:' + self.phone + '">' + self.phone + "</a></div></div>";
        self.infoWindow.setContent(self.info);
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        self.infoWindow.open(map, this);
        setTimeout(function() {
            self.marker.setAnimation(null);
        }, 2000);
    });

    //Mocks a click event
    this.indicate = function(place) {
        google.maps.event.trigger(self.marker, 'click');
    };

    var FOURSQUARE_URL = 'https://api.foursquare.com/v2/venues/search?ll=' +
        this.location.lat + ',' + this.location.lng +
        '&client_id=' + CLIENT_ID + '&client_secret=' +
        CLIENT_SECRET + '&v=20170101' + '&query=' + this.title;

    // Fetches data from the foursquare API
    $.getJSON(FOURSQUARE_URL).done(function(data) {
        var results = data.response.venues[0];
        self.URL = results.url;
        if (typeof self.URL === 'undefined') {
            self.URL = '';
        }
        self.street = results.location.formattedAddress[0];
        self.city = results.location.formattedAddress[1];
        self.phone = results.contact.phone;
        if (typeof self.phone === 'undefined') {
            self.phone = '';
        } else {
            self.phone = formatPhone(self.phone);
        }
    }).fail(function() {
        alert('Unable to get foursquare data');
    });

    /**
     * To be implement in the future. Yelp API.
     * @param  {[type]} )    {}          [description]
     * @param  {[type]} this [description]
     * @return {[type]}      [description]
     */
    this.getYelpInfo = ko.computed(function() {}, this);
};

var map;
var bounds;

var locations = [{
    title: 'Prestige Nottinghill',
    location: {
        lat: 12.8710893,
        lng: 77.5931917
    }
}, {
    title: 'Royal Meenakshi Mall',
    location: {
        lat: 12.8721135,
        lng: 77.5927885
    }
}, {
    title: 'Ajmera Green Acres',
    location: {
        lat: 12.869475,
        lng: 77.5926261
    }
}, {
    title: 'Purva Panorama',
    location: {
        lat: 12.8647766,
        lng: 77.5916578
    }
}, {
    title: 'Windsor Four Seasons Appartments',
    location: {
        lat: 12.8752177,
        lng: 77.5927981
    }
}, {
    title: 'Mantri Residency',
    location: {
        lat: 12.8709999,
        lng: 77.5925268
    }
}];

function ViewModel() {
    var self = this;
    this.initMap = (function() {
        var seat = $('#map');
        map = new google.maps.Map(seat[0], {
            center: {
                lat: 12.8709999,
                lng: 77.5925268
            },
            zoom: 15,
            mapTypeControl: false
        });
    })();
    this.status = ko.observable('active');
    this.query = ko.observable('');
    this.places = ko.observableArray([]);
    this.placesToShow = ko.computed(function() {
        var filter = self.query().toLowerCase();
        if (!filter) {
            self.places().forEach(function(place) {
                place.visible(true);
            });
            return self.places();
        } else {
            return ko.utils.arrayFilter(self.places(), function(place) {
                var string = place.title.toLowerCase();
                var result = (string.search(filter) >= 0);
                place.visible(result);
                return result;
            });
        }
    }, self);
    // Based on the results from the API create a list of places in the model we need.
    locations.forEach(function(location, index) {
        self.places.push(new Place(location, map, index));
    });

    this.showMarkers = function() {
        for (var i = 0; i < self.markersToShow().length; i++) {
            self.markersToShow()[i].setMap(null);
        }
        bounds = new google.maps.LatLngBounds();

        // Extend the boundaries of the map for each marker and display the marker
        self.markersToShow().forEach(function(place) {
            place.setMap(map);
            bounds.extend(place.position);
        });
        for (var i = 0; i < self.markersToShow().length; i++) {
            self.markersToShow()[i].setMap(map);
            bounds.extend(self.markersToShow()[i].position);
        }
        map.fitBounds(bounds);
    };
}

/**
 * Entry point of the application.
 * @return {[type]} [description]
 */
function init() {
    var myViewModel = new ViewModel();
    ko.applyBindings(myViewModel, $('html')[0]);
}