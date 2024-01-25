$(function () {
    window.app = app = {}
    // local vars
    inputs = ['date', 'time', 'location']
    app.inputs = inputs
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
    function getGoogleMapsUrl(lat, lon) {
        msg = lat + ',' + lon
        url = 'https://www.google.com/maps?ll=' + msg + '&q=' + msg + '&hl=en&t=m&z=15'
        return url
    }
    function showPosition(position) {
        lat = position.coords.latitude
        lon = position.coords.longitude
        url = getGoogleMapsUrl(lat, lon)
        $inputs['location'].val(msg);
        $inputs['gmaps'].click(function () {
            window.open(url, "_blank");
        })
    }
    function addActivity() {
        app.$activityForm.show()
        app.$activityList.hide()
        app.$categoriesEdit.hide()

        var date = new Date();
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
            html = '<span>No Entries</span>'
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
                        locationHtml = '<a href="' + url + '"  target="_blank")">🌎</a>'
                    }
                    noteHtml = '<button ' + 
                    'type="button" ' + 
                    'class="btn btn-light" ' + 
                    'data-bs-toggle="popover" ' + 
                    'data-bs-placement="left" ' + 
                    'data-bs-title="Note" ' + 
                    'data-bs-content="'+ quoteattr(doc.notes) + '"  ' + 
                    '> ' + 
                    ' 📄 ' + 
                    '</button>'
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
            setupPopover()
        });
    }
    function copyCategories(cb) {
        db = new PouchDB('lenb')
        db.put({
            _id: 'lenb-categories',
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
            var date = new Date();
            var currentDate = date.toISOString().substring(0, 10)
            var currentTime = date.toISOString().substring(11, 16).replace(':', '-')
            filename = 'lenb-activity-sheet-' + currentDate + '-' + currentTime
            download(csv, filename, 'text/csv')
        })

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
            _id: 'lenb-categories',
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
    function setupPopover() {
        const popoverTriggerList = document.querySelectorAll(
            "[data-bs-toggle='popover']"
          );
          const popoverList = [...popoverTriggerList].map(
            popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl)
          );
    }
    $('.js-add').click(addActivity)
    $('.js-save').click(saveActivity)
    $('.js-list').click(showList)
    $('.js-delete-db').click(deleteDatabase)
    $('.js-export').click(saveToSheet)
    $('.js-categories').click(categoriesEdit)
    $('.js-categories-save').click(categoriesSave)
    app.addActivity = addActivity
    addActivity(); // init
})