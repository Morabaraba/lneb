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
    app.$activityForm = $('.js-activity-form')
    app.$activityList = $('.js-activity-tbody')
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
            $inputs['location'].val("Geolocation Unsupported.");
        }
        function showError(error) {
            msg = 'Error'
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    msg = "Geolocation Denied."
                    break;
                case error.POSITION_UNAVAILABLE:
                    msg = "Geolocation Unavailable."
                    break;
                case error.TIMEOUT:
                    msg = "Geolocation Timeout."
                    break;
                case error.UNKNOWN_ERROR:
                    msg = "Geolocation Unknown."
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
        app.$activityForm.show()
        app.$activityList.hide()
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
    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
      }
    function saveActivity() {
        formData = new FormData(app.$activityForm[0]);
        entries = Object.fromEntries(formData.entries());
        
        entries._id = 'activity-' + entries.date + '-' + entries.time + '-' + uuidv4()
        db.post(entries, function (err, response) {
            if (err) { 
                console.log(err)
                alert('Error:' + err)
             }
            // handle response
            console.log(response);
            console.log(entries);
            alert('Saved')
            addActivity()
          });
          
          
    }
    function quoteattr(s, preserveCR) {
        preserveCR = preserveCR ? '&#13;' : '\n';
        return ('' + s) /* Forces the conversion to string. */
            .replace(/&/g, '&amp;') /* This MUST be the 1st replacement. */
            .replace(/'/g, '&apos;') /* The 4 other predefined entities, required. */
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            /*
            You may add other replacements here for HTML only 
            (but it's not necessary).
            Or for XML, only if the named entities are defined in its DTD.
            */ 
            .replace(/\r\n/g, preserveCR) /* Must be before the next replacement. */
            .replace(/[\r\n]/g, preserveCR);
            ;
    }
    function showList() {
        app.$activityForm.hide()
        app.$activityList.show()

        db.allDocs({
            include_docs: true,
            attachments: false,
        }, function(err, response) {
            if (err) { return console.log(err); }
            console.log(response)
            html = '<span>No Entries</span>'
            app.$activityList.html(html)
            i = 0
            response.rows.forEach(function(row) {
                if (row.id.search('activity-') != -1) {
                    doc = row.doc
                    i += 1
                    html += '<tr>' +
                        '<th scope="row">' + i +'</th>' +
                        '<td>' + doc.date +'</td>' +
                        '<td>' + doc.time +'</td>' +
                        '<td>' + doc.location +'</td>' + 
                        '<td class="text-end"><span title="' + quoteattr(doc.notes) +'">📝</span></td>' +
                    '</tr>'
                }
            })
            app.$activityList.text(JSON.stringify(response))
            app.$activityList.html(html)
        });  
    }
    function deleteDatabase() {
        if (confirm("All data will be lost, are you sure?") == true) {
            db.destroy(function (err, response) {
                console.log(response)
                if (err) {
                    console.log(err);
                    alert('Error:' + err)
                  return 
                } else {
                  // success
                  alert('Success, reloading app.')
                  location.reload(); 
                }
              });
              
          }
    }
    $('.js-add').click(addActivity)
    $('.js-save').click(saveActivity)
    $('.js-list').click(showList)
    $('.js-delete-db').click(deleteDatabase)
    addActivity(); // init
})