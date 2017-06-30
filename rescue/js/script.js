var $petfinderAPI = 'https://api.petfinder.com/';
var $devkey = '3c73470956892905e562a55f0e113f50';

function updateShelterStatus(message) {
  console.log(message);
  if(message) {
    $('#searchstatus').fadeOut("slow","swing", function() {
      $('#searchstatus').html('<h3>' + message + '</h3>')
        .fadeIn("slow","swing");
    });
  } else {
    $('#searchstatus').fadeOut("slow","swing", function() {
      $('#searchstatus').empty();
    });
  };
};

function evaluatePictures(photos, animal) {
  /*trying to ascertain if a usuable picture is available
  otherwise display default value based on cat or dog*/
  var photoslength = photos.length;
  var goodphoto = '';
  var defaultphoto = animal === "dog" ? '../img/dogdefault_1.png' : '../img/catdefault_1.png';
  for(i = 0;i < photoslength;i++) {
    if(photos[i]['@size'] === "pn") {
      goodphoto = photos[i].$t;
      //console.log(goodphoto);
    }
  };
  return goodphoto != '' ? goodphoto : defaultphoto;
};

function renderShelter(shelter) {
  $('#shelters').fadeOut("slow","swing", function() {
    $('#shelters').empty()
      .html('<div class="shelter-detail">\
          <div class="shelter-header">\
            <div class="shelter-name">\
              <h3>'+ shelter.sheltername +'</h3>\
            </div>\
            <div class="shelter-contact">\
              <h4>Address: ' + shelter.shelteraddress1  + ' ' +
                shelter.shelteraddress2 + ', ' +
                shelter.sheltercity + ', ' +
                shelter.shelterstate + '</h4>\
              <h4>Phone: ' + shelter.shelterphone + '</h4>\
              <h4>Email: ' + shelter.shelteremail + '</h4>\
            </div>\
          </div>\
          <div class="shelter-pets">\
          </div>\
        </div>')
      .fadeIn("slow","swing",getShelterPets(shelter.shelterid));
      });
}

function getShelter(id) {
  updateShelterStatus('Getting that family info...');
  $.getJSON($petfinderAPI + 'shelter.get?id=' + id + '&format=json&key=' + $devkey + '&callback=?')
    .done(function(shelterdata){
      console.log(shelterdata);
      shelterdetail = shelterdata.petfinder.shelter;
      var shelterObject = {
        shelterid: shelterdetail.id.$t,
        sheltername: shelterdetail.name.$t,
        shelteraddress1: shelterdetail.address1.$t ? shelterdetail.address1.$t : "Not available",
        shelteraddress2: shelterdetail.address2.$t ? shelterdetail.address2.$t : "",
        sheltercity: shelterdetail.city.$t ? shelterdetail.city.$t : "",
        shelterstate: shelterdetail.state.$t ? shelterdetail.state.$t : "",
        shelterphone: shelterdetail.phone.$t ? shelterdetail.phone.$t : "Not available",
        shelteremail: shelterdetail.email.$t ? shelterdetail.email.$t : "Not available"
      }
      renderShelter(shelterObject);
    })
    .done(function(){
      updateShelterStatus(null);
    })
    .error(function(err) {
      console.log('Get shelter by ID error! ' + err);
    });
};

function getSheltersZip(zip) {
  updateShelterStatus('Finding families...');
  $.getJSON($petfinderAPI + 'shelter.find?location=' + zip + '&format=json&key=' + $devkey + '&callback=?')
    .done(function(petApiData){
      console.log(petApiData);
      if(petApiData.petfinder.hasOwnProperty('shelters')) {
        $('#shelters').fadeOut("slow","swing", function() {
          $('#shelters').empty();
          var shelters = petApiData.petfinder.shelters.shelter;
          for (i in shelters) {
            //abstract this render as a function accepting an object
            var listing = '<div class="shelter" shelterid=' + shelters[i].id.$t + '>\
                <h4>' + shelters[i].name.$t + '</h4>\
                <div>See Family</div>\
              </div>';
            $('#shelters').append(listing);
          };
          $('#shelters').fadeIn("slow","swing");
          $('.shelter').on("click", function() {
            getShelter($(this).attr('shelterid'));
            $('html, body').animate({
              scrollTop: $('#adoption').offset().top - 35
            }, 500);
          });
        });
        updateShelterStatus('Here\'s what we found...');
      } else {
        updateShelterStatus('Hmm... We didn\'t find any shelters. Please check the zip code and try again.');
        $('#shelters').fadeOut("slow","swing", function() {
          $('#shelters').empty();
        });
      }
    })
    .error(function(err){
      console.log('Get shelters by zip error! ' + err);
    });
};

function getShelterPets(id) {
  $.getJSON($petfinderAPI + 'shelter.getPets?id=' + id + '&output=full&format=json&key=' + $devkey + '&callback=?')
    .done(function(petApiData){
      console.log(petApiData);
      //petfinder returns an object if only one pet exists, it returns an array of objects for multiple pets
      if(petApiData.petfinder.pets.hasOwnProperty('pet') && Array.isArray(petApiData.petfinder.pets.pet)) {
        console.log('found pets is an array');
        var rescues = petApiData.petfinder.pets.pet;
        for (x in rescues) {
          //description data is random, holding off for now
          //var petdescription = rescues[x].description.$t ? rescues[x].description.$t.replace("'","\'") : "Not available";
          var petbreed = rescues[x].breeds.breed.$t ? rescues[x].breeds.breed.$t : "Unknown";
          var petimage = evaluatePictures(rescues[x].media.photos.photo, rescues[x].animal.$t);
          //abstract this render as a function accepting an object
          $('shelter-pets').empty();
          $('.shelter-pets').append('<div>\
              <figure>\
                <img src=' + petimage + '/>\
                <figcaption>\
                  <h4>' + rescues[x].name.$t + '</h4>\
                </figcaption>\
              </figure>\
              <span>Sex: ' + rescues[x].sex.$t + '</span>\
              <span>Breed: ' + petbreed + '</span>\
            </div>');
        };
      } else if (petApiData.petfinder.pets.hasOwnProperty('pet') && typeof petApiData.petfinder.pets.pet === 'object') {
        console.log('found pet is an object');
        var rescues = petApiData.petfinder.pets.pet;
        var petbreed = rescues.breeds.breed.$t ? rescues.breeds.breed.$t : "Unknown";
        var petimage = evaluatePictures(rescues.media.photos.photo, rescues.animal.$t);
        $('shelter-pets').empty();
        $('.shelter-pets').append('<div>\
            <figure>\
              <img src=' + petimage + ' alt="pet image" />\
              <figcaption>\
                <h4>' + rescues.name.$t + '</h4>\
              </figcaption>\
            </figure>\
            <span>Sex: ' + rescues.sex.$t + '</span>\
            <span>Breed: ' + petbreed + '</span>\
          </div>');
      } else {
        console.log('looked for pets but none found');
        $('.shelter-pets').append('<h4>Looks like there are no pets currently at this shelter</h4>');
      }
    })
    .error(function(err){
      console.log('Get shelters by zip error! ' + err);
    });
}


$(document).ready(function() {

  $(function() {
    $('a[href*="#"]:not([href="#"])').click(function() {
      if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
        if (target.length) {
          $('html, body').animate({
            scrollTop: target.offset().top - 35
          }, 500);
          return false;
        }
      }
    });
  });

  $('#sheltersearchgo').click(function(){
    var zip = $('#sheltersearch').val()
    if(zip.length === 5) {
      console.log('searching ', zip);
      getSheltersZip(zip);
    } else {
      updateShelterStatus('Oops! That doesn\'t look like a valid zip code.');
    }
  });
});
