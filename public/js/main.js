$(function () {
    inputs = ['category', 'date', 'time', 'location']
    $inputs = {}
    inputs.forEach(function(input) {
        $inputs[input] = $('input[name=' + input +']')
    })
    $inputs['notes']= $('textarea[name=notes]')
    $inputs['gmaps']= $('#google-maps')

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        $inputs['location'].val("Geolocation is not supported.");
    }

    function showError(error) {
        msg = 'Error'
        switch (error.code) {
            case error.PERMISSION_DENIED:
                msg = "User denied the request for Geolocation."
                break;
            case error.POSITION_UNAVAILABLE:
                msg = "Location information is unavailable."
                break;
            case error.TIMEOUT:
                msg = "The request to get user location timed out."
                break;
            case error.UNKNOWN_ERROR:
                msg = "An unknown error occurred."
                break;
        }
        $inputs['location'].val(msg);
    }

    function showPosition(position) {
        lat = position.coords.latitude
        lon = position.coords.longitude
        msg = lat + ',' + lon
        url = 'https://www.google.com/maps?ll=' + msg + '&q=' + msg + '&hl=en&t=m&z=15'
        $inputs['location'].val(msg);
        $inputs['gmaps'].click(function () {
            window.open(url, "_blank");
        })
    }
    var date = new Date();
    var currentDate = date.toISOString().substring(0, 10)
    var currentTime = date.toISOString().substring(11, 16)

    $inputs['time'].val(currentTime)
    $inputs['date'].val(currentDate)
})