// add the open close functionality of the side menu
$(document).ready(function() {

    // Open navbarSide when button is clicked
    $('#navbarSideButton').on('click', function() {
        $('#navbarSide').addClass('reveal');
        $('.overlay').show();
    });

    // Close navbarSide when the outside of menu is clicked
    $('.overlay').on('click', function() {
        $('#navbarSide').removeClass('reveal');
        $('.overlay').hide();
    });

});

// global images varibles
var restIconS = "img/restIconS.png";
var shopIconS = "img/shopIconS.png";
var placeIconS = "img/placeIconS.png";

// global map and infoWindow varibles so they can be used outside of initMap
var map, infoWindow;

// Array of objects contains the data about the locations: titles, types, and lats and lngs
// Notice some of the titles are in Arabic, that's because in foursquare queres this is the only correct text to search
var locationsData = [{
        title: "مطعم دارك",
        type: "resturant",
        location: {
            lat: 25.860054,
            lng: 44.219249
        }
    },
    {
        title: "sbecial-falafel",
        type: "resturant",
        location: {
            lat: 25.860780,
            lng: 44.219185
        }
    },
    {
        title: "سوق-الديرة",
        type: "shop",
        location: {
            lat: 25.861180,
            lng: 44.226046
        }
    },
    {
        title: "dark-chocolate",
        type: "shop",
        location: {
            lat: 25.849858,
            lng: 44.229932
        }
    },
    {
        title: "Panda",
        type: "shop",
        location: {
            lat: 25.850148,
            lng: 44.228082
        }
    },
    {
        title: "Khartam",
        type: "place",
        location: {
            lat: 25.893154,
            lng: 44.227084
        }
    },
    {
        title: "Lake Park",
        type: "place",
        location: {
            lat: 25.879105,
            lng: 44.205530
        }
    }
];

// Location class, used to initilze each object (later in forEach) with knockout observables.
// It also assign the data from locationsData array to each object.
var Location = function(data) {
    // doing the self trick so we can assign this anywhere without confusing with other this
    var self = this;
    self.title = ko.observable(data.title);
    self.type = ko.observable(data.type);
    self.lat = ko.observable(data.location.lat);
    self.lng = ko.observable(data.location.lng);
    self.contact = ko.observable("");
    self.category = ko.observable("");
    self.address = ko.observable("");
    self.marker = ko.observable();
    self.content = ko.observable("");
};

function errorMsgGoogle() {
    console.log("Error Google Maps Call");
    $("#errorMsgGoogle").text("We couldn't create the map.");
    $("#errorMsg").modal("show");
}

// Here is the function to build the map, then it calls a new instence of the ViewModel
// which will bind the observables and call the APIs and make markers.
function initMap() {
    // TODO: custom style
    var methnab = {
        lat: 25.860731,
        lng: 44.218878
    };
    map = new google.maps.Map(document.getElementById('map'), {
        center: methnab,
        zoom: 13
    });
    ko.applyBindings(new ViewModel());
    infoWindow = new google.maps.InfoWindow();
}

// Previous version

// function popUpInfoWindow(marker, infoWindow){
//   if (infoWindow.marker != marker) {
//     infoWindow.marker = marker;
//     infoWindow.setContent("<br><div>" + marker.title + "</div>");
//     infoWindow.open(map,marker);
//     infoWindow.addListener("closeclick", function(){
//       infoWindow.setMarker(null);
//     });
//   }
// }

// the ViewModel class
var ViewModel = function() {
    // doing the self trick so we can assign this anywhere without confusing with other this
    var self = this;
    // declare varibles here not in loops
    var position, title, marker, icon, foursquareVenue, foursquareLocation, foursquarePhone, qurey;
    // keys for foursquare API
    var foursquareClientID = "2ZE4GTC4FM5HSCBW33K1KCKXJWNR015WQY21Z51WGVXHOIXS";
    var foursquareClientSecret = "XPBHZY4EWKOSBCCOWSZGIOYRYNAGTOLKW5WUPDYCKTZ5JT3H";

    // an observableArray with the name (locations)
    // we will use this to store our objects after we create them and assign the data from locationsData to them
    this.locations = ko.observableArray([]);

    // // an observableArray that we will use it to store our visible objects
    // this.visibleLocations = ko.observableArray([]);

    // loop to each object in locationsData and using the object literal locationItem (called data in Location class)
    // we push to locations observableArray a new object of class Location with data from locationsData
    locationsData.forEach(function(locationItem) {
        self.locations.push(new Location(locationItem));
    });

    // // push all the objects in locations to visibleLocations (default all is visible)
    // this.locations().forEach(function(locationItem){
    //   self.visibleLocations().push(locationItem);
    // });
    //
    // console.log(this.visibleLocations());

    // Here the action happens!
    // loop to each object in locations observableArray and do bunch of stuff
    // note that we are passing the object leteral so we can access proporties of the object
    self.locations().forEach(function(locationItem) {
        // matching varibles with data so we can use it in marker creating
        position = {
            lat: locationItem.lat(),
            lng: locationItem.lng()
        };
        title = locationItem.title();
        // set the icon of the marker depending on the type
        if (locationItem.type() === "resturant") {
            icon = restIconS;
        } else if (locationItem.type() === "shop") {
            icon = shopIconS;
        } else if (locationItem.type() === "place") {
            icon = placeIconS;
        }
        // new marker object with its options
        marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            icon: icon,
            animation: google.maps.Animation.DROP,
        });

        // assign the marker to the observable marker
        locationItem.marker = marker;

        // Foursquare's API call
        $.ajax({
            url: "https://api.foursquare.com/v2/venues/search",
            dataType: "json",
            data: "limit=1" +
                "&ll=25.860731,44.218878" +
                "&radius=30000" +
                "&query=" + locationItem.title() +
                "&client_id=" + foursquareClientID +
                "&client_secret=" + foursquareClientSecret +
                "&v=20170801",
            success: function(data) {
                // make it readable
                foursquareVenue = data.response.venues[0];
                foursquareLocation = foursquareVenue.location;
                // get the new title from API
                locationItem.title(foursquareVenue.name);
                // get the address from API
                locationItem.address(foursquareLocation.address);
                // assign the category for the location
                locationItem.category(foursquareVenue.categories["0"].name);

                // check if the location has a phone number, if not leave it empty
                if (foursquareVenue.contact.hasOwnProperty("formattedPhone")) {
                    locationItem.contact(foursquareVenue.contact.formattedPhone);
                } else {
                    locationItem.contact(" ");
                }

                // Making the content of infoWindow of eacj object
                locationItem.content = "<div id=\"infoWindow\"><h3 class=\"location-title\">" +
                    locationItem.title() + "</h3><p class=\"location-address text-muted\">" + locationItem.address() + "</p>" +
                    "<p class=\"loaction-category lead\">" + locationItem.category() + "</p><p class=\"loaction-contact\">" +
                    locationItem.contact() + "</p><p class=\"powerdby-msg small text-muted\">Powerd By <i class=\"fab fa-foursquare foursquare-icon\">" +
                    "</i> Foursquare</p></div>";

                // add click listener for each marker on the object
                // open, and make the marker bounce for a 500ms
                // set the content of the infoWindow = the content we just made
                locationItem.marker.addListener("click", function() {
                    infoWindow.open(map, locationItem.marker);
                    self.markerAnimation(locationItem);
                    infoWindow.setContent(locationItem.content);
                });
            },
            // when there is an error in the AJAX call, add a click listener in markers with error errorMsgs
            // also show a bootstrap modal with another error msg
            error: function(e) {
                locationItem.marker.addListener("click", function() {
                    infoWindow.open(map, locationItem.marker);
                    self.markerAnimation(locationItem);
                    infoWindow.setContent("Foursquare Error");
                });
                $("#errorMsg").modal("show");
            }

            // Previous version

            // markers.push(marker);
            // bounds.extend(marker.position);
            // marker.addListener("click", function(){
            //   popUpInfoWindow(this, infoWindow);
            // });
        });
    });

    // marker bounce function, it will bounce for 500ms then stop
    this.markerAnimation = function(location) {
        location.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            location.marker.setAnimation(null);
        }, 500);
    };

    // adding filter functionality

    // the text entered
    this.filter = ko.observable("");
    // computed observable return objects that have same charachers of filter
    this.visibleLocations = ko.computed(function() {
        self.locations().forEach(function(location) {
            // desible all the markers
            location.marker.setVisible(false);
        });
        return self.locations().filter(function(location) {
            if (!self.filter() || location.title().indexOf(self.filter()) !== -1) {
                // only show markers with applied condetion
                location.marker.setVisible(true);
                return location;
            }
        });
    }, this);

    // Error messege
    this.errorMsgContentFS = "We didn't get a response from Foursquare API.";
};
