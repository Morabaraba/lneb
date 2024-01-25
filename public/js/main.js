$(function () {
    window.app = app = {}
    // local vars
    inputs = ['category', 'date', 'time', 'location']
    app.inputs = inputs
    $inputs = {}
    inputs.forEach(function (input) {
        $inputs[input] = $('input[name=' + input + ']')
    })
    $inputs['notes'] = $('textarea[name=notes]')
    $inputs['gmaps'] = $('#google-maps')
    app.$inputs = $inputs
    db = new PouchDB('lenb')
    app.db = db
    app.categories = ['-']
    function setCategories(cb) {
        db.get('lenb-categories', function (err, doc) {
            if (err) {
                console.log(err);
                app.categories = ['-']
                db.put({
                    _id: 'lenb-categories',
                    categories: app.categories
                }, function (err, response) {
                    if (err) { return console.log(err); }
                    // handle response
                   cb()
                });
                return
            }
            // handle doc
            app.categories = doc.categories
            cb()
        });
    }

    function setLocation() {
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

    function addActivity() {
        var date = new Date();
        var currentDate = date.toISOString().substring(0, 10)
        var currentTime = date.toISOString().substring(11, 16)
        $inputs['time'].val(currentTime)
        $inputs['date'].val(currentDate)
        $inputs['notes'].val('')
        setCategories(function() {
            $inputs['category'].html('')
            app.categories.forEach(function (cat) {
                $inputs['category'].append( $('<option>' + cat + '</option>') )
            })
            $inputs['category'].val('-')
        });
        
        setLocation();
    }
    function saveActivity() {
        const data = new FormData(event.target);
  
        const formJSON = Object.fromEntries(data.entries());
    }
    $('.js-add').click(addActivity)
    $('.js-save').click(addActivity)
    addActivity(); // init
})