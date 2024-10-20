$(function () {
    window.app = app = {}
    // local vars
    inputs = ['date', 'time', 'location']
    app.inputs = inputs
    app.version = '240129.1'
    $inputs = {}
    inputs.forEach(function (input) {
        $inputs[input] = $('input[name=' + input + ']')
    })
    $inputs['category'] = $('select[name=category]')
    $inputs['notes'] = $('textarea[name=notes]')
    $inputs['gmaps'] = $('#google-maps')
    app.$inputs = $inputs
    app.$activityForm = $('.js-activity-form')
    app.$activityList = $('.js-activity-list')
    app.$activityTable = $('.js-activity-tbody')
    app.$categoriesEdit = $('.js-categories-edit')
    app.$categoriesTextArea = $('.js-categories-textarea')
    app.$leaflet = $('#js-leaflet')
    app.leaflet = setupLeaflet(app.$leaflet)
    db = new PouchDB('lneb')
    app.db = db
    app.categories = ['-']
    function setCategories(cb) {
        db.get('lneb-categories', function (err, doc) {
            if (err) {
                console.log(err);
                app.categories = ['-']
                db.put({
                    _id: 'lneb-categories',
                    categories: app.categories
                }, function (err, response) {
                    if (err) {
                        console.log(err);
                        alert('Error:' + err)
                        return
                    }
                    app.categories_rev = response._rev
                    // handle response
                    cb(response)
                });
                return
            }
            // handle doc
            app.categories = doc.categories
            app.categories_rev = doc._rev
            cb()
        });
    }
    function setLocation(cb=showPosition, cbErr=showError) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(cb, cbErr);
        } else {
            $inputs['location'].val("Geolocation Unsupported.");
        }
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
    function getGoogleMapsUrl(lat, lon) {
        msg = lat + ',' + lon
        url = 'https://www.google.com/maps?ll=' + msg + '&q=' + msg + '&hl=en&t=m&z=15'
        return url
    }
    function getReverseMapUrl(lat, lon) {
        url = 'https://nominatim.openstreetmap.org/ui/reverse.html?lat=' + lat + '&lon=' + lon +  '&zoom=18'
        return url
    }
    function setupLeaflet($elem) {
        var map = L.map($elem[0]).setView([-25.98953, 28.12843], 13)
        setLocation(function(position) {
            var latLon =  [position.coords.latitude, position.coords.longitude]
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map)
            var m = L.marker(latLon)
            m.addTo(map)
            m.bindPopup("<b>Are you here?</b><br> If not<br> drag this<br> pin where<br> you are!").openPopup()
        }, function() {
            $elem.html('<h3 class="error">Enable Location Sharing To Show Map!</h3>')
        })        
        return map
    }   
    function showPosition(position) {
        lat = position.coords.latitude
        lon = position.coords.longitude
        url = getGoogleMapsUrl(lat, lon)
        $inputs['location'].val(msg);
        $inputs['gmaps'].click(function () {
            window.open(url, "_blank")
        })
    }
    function addActivity() {
        app.$activityForm.show()
        app.$activityList.hide()
        app.$categoriesEdit.hide()

        var date = new DateSast();
        var currentDate = date.toISOString().substring(0, 10)
        var currentTime = date.toISOString().substring(11, 16)
        $inputs['time'].val(currentTime)
        $inputs['date'].val(currentDate)
        $inputs['notes'].val('')
        setCategories(function () {
            $inputs['category'].html('')
            app.categories.forEach(function (cat) {
                $inputs['category'].append($('<option>' + cat + '</option>'))
            })
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
        app.$categoriesEdit.hide()

        db.allDocs({
            include_docs: true,
            attachments: false,
        }, function (err, response) {
            if (err) {
                console.log(err);
                alert('Error:' + err)
                return
            }
            console.log(response)
            html = ''
            if (response.total_rows <= 1) html = '<span>No Entries</span>'
            app.$activityTable.html(html)
            i = 0
            response.rows.forEach(function (row) {
                if (row.id.search('activity-') != -1) {
                    doc = row.doc
                    i += 1
                    locationHtml = '❌'
                    if (doc.location.search(',') != -1) {
                        loc = doc.location.split(',')
                        url = getGoogleMapsUrl(loc[0], loc[1])
                        reverseUrl = getReverseMapUrl(loc[0], loc[1])
                        locationHtml = '<a class="btn btn-secondary" href="' + url + '"  target="_blank"> 🌎 </a>&nbsp;&nbsp;&nbsp;'
                        locationHtml += '<a class="btn btn-secondary" href="' + reverseUrl + '"  target="_blank"> 📍 </a>'
                    }
                    noteHtml = '<button ' + 
                        'type="button" class="btn btn-secondary" data-bs-toggle="modal" ' + 
                        'data-bs-content="'+ quoteattr(doc.notes) + '"  ' + 
                        'data-bs-target="#notes-modal-1">' +
                        ' 📄 </button>';
                    html += '<tr>' +
                        '<th scope="row">' + i + '</th>' +
                        '<td>' + doc.category + '</td>' +
                        '<td>' + doc.date + '</td>' +
                        '<td>' + doc.time + '</td>' +
                        '<td>' + locationHtml + '</td>' +
                        '<td class="text-end">' +  noteHtml +'</td>' +
                        '</tr>'
                }
            })
            app.$activityTable.html(html)
            setupModal()
        });
    }
    function copyCategories(cb) {
        db = new PouchDB('lneb')
        db.put({
            _id: 'lneb-categories',
            categories: app.categories
        }, function (err, response) {
            if (err) {
                console.log(err);
            }
            cb(response)
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
                    copyCategories(function() {
                        alert('Deleted Database')
                        location.reload();
                    })
                }
            });

        }
    }
    // Function to download data to a file
    function download(text, name, type) {
        var file = new Blob([text], { type: type });

        var a = document.createElement("a");
        var url = URL.createObjectURL(file);
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
    function saveToSheet() {
        data = []
        i = 0
        db.allDocs({
            include_docs: true,
            attachments: false,
        }, function (err, response) {
            if (err) {
                console.log(err);
                alert('Error:' + err)
                return
            }
            response.rows.forEach(function (row) {
                if (row.id.search('activity-') != -1) {
                    i += 1
                    delete row.doc._id
                    delete row.doc._rev
                    row.doc.number = i
                    data.push(row.doc)
                }
            })
            csv = Papa.unparse(data);
            var date = new DateSast();
            var currentDate = date.toISOString().substring(0, 10)
            var currentTime = date.toISOString().substring(11, 16).replace(':', '-')
            filename = 'lneb-activity-sheet-' + currentDate + '-' + currentTime
            download(csv, filename, 'text/csv')
        })

    }
    function DateSast() {
        var date = new Date();
        // Add 2 hours for SAST (South Africa Standard Time)
        date.setHours(date.getHours() + 2);
        return date
    }
    function categoriesEdit() {
        app.$activityForm.hide()
        app.$activityList.hide()
        app.$categoriesEdit.show()
        app.$categoriesTextArea.val(app.categories.join('\n'))
    }
    function categoriesSave() {
        app.categories = app.$categoriesTextArea.val().split('\n')
        db.put({
            _id: 'lneb-categories',
            _rev: app.categories_rev,
            categories: app.categories
        }, function (err, response) {
            if (err) {
                console.log(err);
                alert('Error:' + err) 
                return
            }
            // handle response
            alert('Categories Saved')
            addActivity();
        });
    }
    function setupModal() {
        /*const popoverTriggerList = document.querySelectorAll(
            "[data-bs-toggle='popover']"
          );
          const popoverList = [...popoverTriggerList].map(
            popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl)
          );*/
        // Auto-focus when modal is opened
        const modal = document.getElementById("notes-modal-1");
        const $modalNotes = $("#js-model-notes")
        if (modal) {
            modal.addEventListener("shown.bs.modal", (elem) => {
            if ($modalNotes) {
                //debugger
                $modalNotes.val($(elem.relatedTarget).attr('data-bs-content'))
                $modalNotes.focus();
            }
        });
        }
    }
    $('.js-add').click(addActivity)
    $('.js-save').click(saveActivity)
    $('.js-list').click(showList)
    $('.js-delete-db').click(deleteDatabase)
    $('.js-export').click(saveToSheet)
    $('.js-categories').click(categoriesEdit)
    $('.js-categories-save').click(categoriesSave)
    $('.js-version').text(app.version)
    app.addActivity = addActivity
    addActivity(); // init
})
