function seconds_to_hhmmss(t)
{
    if (isNaN(t)) return '-:--';
    var h = parseInt(t / 3600);
    var m = parseInt(t / 60) % 60;
    var s = parseInt(t % 60);
    return (h ? h + ':' : '') + (h ? ('0' + m).slice(-2) : m) + ':' + ('0' + s).slice(-2);
}

function show_default_artwork(img_element)
{
    if (img_element.getAttribute('data-replaced-by-error')) return;
    img_element.setAttribute('data-replaced-by-error', '1');
    img_element.src = '/img/logo-gray.svg';
}

var _podcastsSearchDelayTimer = null;
function podcastsSearchQueryChanged(event)
{
    if (_podcastsSearchDelayTimer) {
        clearTimeout(_podcastsSearchDelayTimer);
        _podcastsSearchDelayTimer = null;
    }
    
    _podcastsSearchDelayTimer = setTimeout(function(){ podcastsSearchQueryChangedCallback(event.target); }, 250);
}

var _podcastsSearchInProgress = null;
var _podcastsSearchInProgressQuery = null;
function podcastsSearchQueryChangedCallback(searchbox) {
    if (searchbox.value == _podcastsSearchInProgressQuery) return;
    _podcastsSearchInProgressQuery = searchbox.value;
    if (_podcastsSearchInProgress) {
        _podcastsSearchInProgress.abort();
        _podcastsSearchInProgress = null;
    }
    
    if (_podcastsSearchInProgressQuery.length < 3) {
        podcastsSearchQueryNewResults([], searchbox);
        return;
    }
    
    _podcastsSearchInProgress = new XMLHttpRequest();
    _podcastsSearchInProgress.open('GET', '/podcasts/search_autocomplete?q=' + encodeURIComponent(searchbox.value), true);
    _podcastsSearchInProgress.onreadystatechange = function() {
        if (_podcastsSearchInProgress.readyState == 4) {
            if (_podcastsSearchInProgress.status == 200) {
                var decoded = false;
                try { decoded = JSON.parse(_podcastsSearchInProgress.responseText); }
                catch (e) { console.log('JSON decoding error: ' + e + "\nResponse:\n\n" + _podcastsSearchInProgress.responseText); }

                podcastsSearchQueryNewResults(decoded.results, searchbox);
            } else {
                podcastsSearchQueryNewResults([], searchbox);
            }
            _podcastsSearchInProgress = null;
        }
    };
    _podcastsSearchInProgress.send(null);
}

function feedListItemDelete(event)
{
    event.preventDefault();
    var feedList = event.target.parentNode;
    var feedID = event.target.getAttribute('data-feed-id');
    var targetItem = document.getElementById(feedList.getAttribute('id') + '_f' + feedID);
    
    var exclusionListID = feedList.getAttribute('data-wildcard-exclusion-list');
    var inclusionListID = feedList.getAttribute('data-wildcard-inclusion-list');

    if (exclusionListID && $(targetItem).hasClass('wildcard_result')) {
        $(targetItem).addClass('excluded_result');
        targetItem.setAttribute('id', exclusionListID + '_f' + feedID);
        var exclusionList = document.getElementById(exclusionListID);
        exclusionList.appendChild(targetItem);
        exclusionList.appendChild(event.target);
        updateFeedListInput(exclusionList);
    } else if (inclusionListID && $(targetItem).hasClass('wildcard_result')) {
        $(targetItem).removeClass('excluded_result');
        targetItem.setAttribute('id', inclusionListID + '_f' + feedID);
        var inclusionList = document.getElementById(inclusionListID);
        inclusionList.appendChild(targetItem);
        inclusionList.appendChild(event.target);
        updateFeedListInput(inclusionList);
    } else {
        targetItem.parentNode.removeChild(targetItem);
        event.target.parentNode.removeChild(event.target);        
    }
    
    updateFeedListInput(feedList);
}

function podcastsSearchQueryNewResults(data, searchbox)
{    
    var container = document.getElementById('autocomplete_results');
    container.innerHTML = '';
    container.style.display = data.length ? 'block' : 'none';
    if (! data.length) return;
    
    for (var i = 0; i < data.length; i++) {
        var selectURL = '/p' + data[i]['id'] + '-' + data[i]['hash'];
        var selectFunction = null;
        
        var customTarget = searchbox.getAttribute('data-autocomplete-target');
        if (customTarget.indexOf('ocfeedlistinput:') === 0) {
            targetFeedListID = customTarget.split(':')[1];
            selectURL = '#';
            selectFunction = function(event){
                event.preventDefault();
                var target = event.target;
                while (target.parentNode && target.nodeName != 'A') target = target.parentNode;
                
                target.addEventListener('click', function(e) { e.preventDefault(); }, false);
                var inputList = document.getElementById(targetFeedListID);
                var clonedItem = target.cloneNode(true);
                clonedItem.setAttribute('id', targetFeedListID + '_f' + target.getAttribute('data-feed-id'));
                inputList.appendChild(clonedItem);
                updateFeedListInput(inputList);
                
                var deleteButton = document.createElement('a');
                deleteButton.setAttribute('href', '#');
                deleteButton.setAttribute('class', 'ocbutton');
                deleteButton.setAttribute('data-feed-id', target.getAttribute('data-feed-id'));
                deleteButton.appendChild(document.createTextNode('X'));
                deleteButton.addEventListener('click', feedListItemDelete, false);
                inputList.appendChild(deleteButton);
                
                searchbox.value = '';
                podcastsSearchQueryChangedCallback(searchbox);
            };
        } else if (customTarget.indexOf('buyad') === 0) {
            selectURL = '/ads?category=' + container.getAttribute('data-buyad-category') + '&podcast=' + data[i]['id'] + '-' + data[i]['hash'];
        }

        var outer = document.createElement('a');
        outer.setAttribute('class', 'autocomplete_result vcenter_parent');
        outer.setAttribute('href', selectURL);
        outer.setAttribute('data-feed-id', data[i]['id']);
        container.appendChild(outer);
        
        if (selectFunction) outer.addEventListener('click', selectFunction, false);

        var img = document.createElement('img');
        img.setAttribute('class', 'art');
        img.setAttribute('src', data[i]['thumbURL']);
        img.addEventListener('error', function(e){ show_default_artwork(e.target); }, false);
        outer.appendChild(img);
        
        var inner = document.createElement('div');
        inner.setAttribute('class', 'vcenter singleline');
        outer.appendChild(inner);
        
        var h = document.createElement('h4');
        h.setAttribute('class', 'singleline');
        h.appendChild(document.createTextNode(data[i]['title']));
        inner.appendChild(h);

        if (data[i]['author']) inner.appendChild(document.createTextNode(data[i]['author']));        
    }
}

function updateFeedListInput(t)
{
    var input = t.getElementsByTagName('input')[0];
    var items = t.getElementsByClassName('autocomplete_result');
    
    input.value = '';
    for (var i = 0; i < items.length; i++) {
        input.value += (input.value.length ? ',' : '') + items[i].getAttribute('data-feed-id');
    }
}

function fragmentVariables()
{
    var out = {};
    location.hash.substr(1).split("&").forEach(function(item) {out[decodeURIComponent(item.split("=")[0])] = decodeURIComponent(item.split("=")[1]); });
    return out;
}

function setSpeedID(player, speedControl)
{
    var speedIDs = [   750,   0,  1125,  1250,  1375,  1500,  1750,  2000,  2250 ];
    var speeds   = [ 0.750, 1.0, 1.125, 1.250, 1.375, 1.500, 1.750, 2.000, 2.250 ];
    var speedID = speedIDs[speedControl.value];

    var selectedLabel = false;
    for (var i = 0; i < speedIDs.length; i++) {
        var speedLabel = document.getElementById('speedlabel' + speedIDs[i]);
        speedLabel.style.color = (speedIDs[i] == speedID ? '#fff' : 'inherit');
        if (speedIDs[i] == speedID) {
            var paused = player.paused;
            if (! paused) player.pause();
            player.playbackRate = speeds[i];
            player.oc_speedID = speedIDs[i];
            if (! paused) player.play();
        }
    }
}

function initAudioPlayer(player, timestampLink)
{
    player.volume = 1.0;
    player.oc_speedID = 0;

    var itemID = player.getAttribute('data-item-id');
    player.oc_loggedIn = player.getAttribute('data-logged-in') == '1';
    player.oc_savedForUser = player.getAttribute('data-saved-for-user') == '1';

    var hashTime = parseInt(fragmentVariables()['t']);
    var startTime = hashTime ? hashTime : player.getAttribute('data-start-time');
    player.oc_baseShareURL = player.getAttribute('data-share-url');
    
    var pauseIcon = document.getElementById('playpausebutton_pauseicon');
    var playIcon = document.getElementById('playpausebutton_playicon');
    pauseIcon.style.display = 'none';
    playIcon.style.display = 'block';
    
    var playPauseButton = document.getElementById('playpausebutton');
    if (playPauseButton) playPauseButton.addEventListener('click', function(e) {
        e.preventDefault();
        if (player.paused) player.play(); else player.pause();
    });
    
    var seekBackButton = document.getElementById('seekbackbutton');
    if (seekBackButton) seekBackButton.addEventListener('click', function(e) { e.preventDefault(); player.currentTime -= parseInt(seekBackButton.getAttribute('data-seek-back-interval')); });
    var seekForwardButton = document.getElementById('seekforwardbutton');
    if (seekForwardButton) seekForwardButton.addEventListener('click', function(e) { e.preventDefault(); player.currentTime += parseInt(seekForwardButton.getAttribute('data-seek-forward-interval')); });

    var progressBackground = document.getElementById('progresssliderbackground');
    var progressSlider = document.getElementById('progressslider');
    var timeElapsedLabel = document.getElementById('timeelapsed');
    var timeRemainingLabel = document.getElementById('timeremaining');
    
    timeElapsedLabel.innerHTML = seconds_to_hhmmss(startTime);
    
    if (progressSlider) {
        progressSlider.oc_mouseDown = false;
        progressSlider.addEventListener('change', function(e) {
            e.target.oc_mouseDown = false;
            player.currentTime = e.target.value;
        });
        progressSlider.addEventListener('input', function(e) {
            e.target.oc_mouseDown = true;
            progressBackground.value = progressSlider.value;
            if (timeElapsedLabel) timeElapsedLabel.innerHTML = seconds_to_hhmmss(progressBackground.value);
            if (timeRemainingLabel) timeRemainingLabel.innerHTML = seconds_to_hhmmss(player.duration - progressBackground.value);
        });
    }
    
    var speedControl = document.getElementById('speedcontrol');
    if (speedControl) {
        setSpeedID(player, speedControl);
        speedControl.addEventListener('input', function(e) { setSpeedID(player, e.target); });
    }

    player.oc_serverNotifyXHR = null;
    player.oc_lastNotifiedServerAtTime = startTime;
    player.oc_seekedAndReady = false;
    player.oc_lastNotifiedServerOfSpeedID = parseInt(player.getAttribute('data-speed-id'));
    player.oc_syncVersion = parseInt(player.getAttribute('data-sync-version'));

    player.oc_updateBufferedRanges = function() {
        var progressSliderContainer = document.getElementById('progressslidercontainer');
        if (! progressSliderContainer || ! this.buffered || ! this.duration || isNaN(this.duration)) return;

        var bars = progressSliderContainer.getElementsByClassName('progresssliderloadedrange');
        if (bars.length > this.buffered.length) {
            for (var b = this.buffered.length; b < bars.length; b++) { bars[b].parentNode.removeChild(bars[b]); }
            bars = progressSliderContainer.getElementsByClassName('progresssliderloadedrange');
        }

        for (var i = 0; i < this.buffered.length; i++) {
            var bar = bars[i];
            if (bar === undefined) {
                bar = document.createElement('div');
                bar.setAttribute('class', 'progresssliderloadedrange');
                progressSliderContainer.appendChild(bar);
            }
        
            bar.style.left = (100 * this.buffered.start(i) / this.duration) + '%';
            bar.style.width = (100 * (this.buffered.end(i) - this.buffered.start(i)) / this.duration) + '%';
        }
        
        if (this.buffered.length == 1 && this.buffered.start(0) == 0 && this.buffered.end(0) == this.duration) {
            clearInterval(this.oc_updateBufferedRangesInterval);
        }
    };
    player.oc_updateBufferedRangesInterval = setInterval(function() { player.oc_updateBufferedRanges(); }, 1000);

    player.addEventListener('canplay', function(e) {
        if (! player.oc_seekedAndReady) {
            setTimeout(function(){
                if (speedControl) setSpeedID(player, speedControl);
                var wasPlaying = ! player.paused;
                player.play();
                player.currentTime = player.oc_lastNotifiedServerAtTime;
                if (! wasPlaying && player.getAttribute('data-autoplay') != '1') { player.pause(); }
                player.oc_seekedAndReady = true;
            }, 250);
        } else {
            if (player.getAttribute('data-autoplay') == '1') player.play();
        }
    });

    player.addEventListener('play', function(e) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    });

    player.addEventListener('pause', function(e) {
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
        if (player.oc_seekedAndReady) audioPlayerNotifyServerIfNeeded(e.target.currentTime, true, true, itemID, player);
    });
    
    player.forceServerSync = function() {
        if (player.oc_seekedAndReady) audioPlayerNotifyServerIfNeeded(player.currentTime, true, true, itemID, player);
    };

    player.addEventListener('timeupdate', function(e) {
        if (! isFinite(e.target.duration)) return;
        
        if (! progressSlider || ! progressSlider.oc_mouseDown) {
            if (timeElapsedLabel) timeElapsedLabel.innerHTML = seconds_to_hhmmss(e.target.currentTime);
            if (timeRemainingLabel) timeRemainingLabel.innerHTML = seconds_to_hhmmss(e.target.duration - e.target.currentTime);
        }
        if (progressBackground && progressSlider && ! progressSlider.oc_mouseDown) {
            progressBackground.max = progressSlider.max = parseInt(e.target.duration);
            progressBackground.value = progressSlider.value = parseInt(e.target.currentTime);
        }
                
        if (! player.oc_seekedAndReady) return;
        if (timestampLink) {
            var intTime = parseInt(e.target.currentTime);
            var shareURL = player.oc_baseShareURL + (intTime > 0 ? '/' + seconds_to_hhmmss(intTime) : '');
            timestampLink.href = shareURL;
            // if (window.history.replaceState) window.history.replaceState({}, document.title, shareURL);
        }
        audioPlayerNotifyServerIfNeeded(e.target.currentTime, false, true, itemID, player);
    });

    player.addEventListener('ended', function(e) {
        audioPlayerNotifyServerIfNeeded(0x7FFFFFFF /* PROGRESS_FINISHED_SENTINEL */, true, true, itemID, player);
    });
}

function audioPlayerNotifyServerIfNeeded(progress, force, async, itemID, player)
{
    if (! player.oc_loggedIn || ! player.oc_savedForUser) return;
    if (player.oc_speedID != player.oc_lastNotifiedServerOfSpeedID) force = true;
    
    // Notify every 10 seconds of change
    progress = Math.floor(progress);
    if (! force && Math.abs(player.oc_lastNotifiedServerAtTime - progress) < 10) return;
    
    player.oc_lastNotifiedServerAtTime = progress;
    if (player.oc_serverNotifyXHR) player.oc_serverNotifyXHR.abort();
    player.oc_serverNotifyXHR = new XMLHttpRequest();
    player.oc_serverNotifyXHR.open('POST',
        '/podcasts/set_progress/' + itemID,
        async
    );
    player.oc_serverNotifyXHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    player.oc_serverNotifyXHR.onreadystatechange = function() {
        if (player.oc_serverNotifyXHR.readyState == 4) {
            player.oc_syncVersion = parseInt(player.oc_serverNotifyXHR.responseText);
            player.oc_serverNotifyXHR = null;
        }
    };
    player.oc_serverNotifyXHR.send('p=' + progress + '&speed=' + player.oc_speedID + '&v=' + player.oc_syncVersion);
    player.oc_lastNotifiedServerOfSpeedID = player.oc_speedID;
}

function formattedByteSize(x, alwaysGB)
{
    if (x > 1000000000 || ((typeof alwaysGB !== 'undefined') && alwaysGB)) return (x / 1000000000).toFixed(1) + ' GB';
    else return ceil(x / 1000000) + ' MB';
}

function uploadFormFilesChanged(event)
{
    var file_input = document.getElementById('upload_file');
    if (! file_input.files) return false; // file API not supported

    if (file_input.files.length < 1) {
        alert('Please select a file.');
        return false;
    }
    
    var sizeLimit = parseInt(file_input.getAttribute('data-max-bytes'));
    var totalFreeBytes = parseInt(file_input.getAttribute('data-free-bytes'));
    var freeBytesNeeded = 0;
    for (var i = 0; i < file_input.files.length; i++) {
        var file = file_input.files[i];
        if (file.size > sizeLimit) {
            alert("This file is too big at " + formattedByteSize(file.size) + ". The maximum size is " + formattedByteSize(sizeLimit) + ".\n\n" + file.name);
            if (event) event.preventDefault();
            return false;
        }

        var file_ext = file.name.substr(file.name.length - 4, 4).toLowerCase();
        if (file_ext != '.wav' && file_ext != '.mp3' && file_ext != '.m4a'  && file_ext != '.m4b' && file_ext != '.aac') {
            alert("Sorry, this does not appear to be an MP3, M4A, M4B, or AAC file: \n\n" + file.name);
            if (event) event.preventDefault();
            return false;
        }
        
        freeBytesNeeded += file.size;
    }
    
    if (freeBytesNeeded > totalFreeBytes) {
        alert("These files are too large at " + formattedByteSize(freeBytesNeeded, true) + " total. You have " + formattedByteSize(totalFreeBytes, true) + " available.");
        if (event) event.preventDefault();
        return false;
    }

    file_input.disabled = true;
    var done = 0;
    for (var i = 0; i < file_input.files.length; i++) {
        var file = file_input.files[i];
        
        var uploadingFileDiv = document.createElement('div');
        uploadingFileDiv.setAttribute('class', 'uploading_file');
        
        var uploadingProgress = document.createElement('progress');
        uploadingFileDiv.appendChild(uploadingProgress);
        uploadingFileDiv.appendChild(document.createTextNode(file.name));
        
        document.getElementById('upload_progresses').appendChild(uploadingFileDiv);

        var formCopy = document.getElementById('upload_form').cloneNode(true);
        document.body.appendChild(formCopy);
        
        performUpload(file, formCopy, uploadingProgress, function(){
            done++;
            if (done >= file_input.files.length) {
                console.log('all done');
                window.location.href = '/uploads';
            }
        });
    }
}

function performUpload(file, form, progress, completion)
{
    var s3key = form.getAttribute('data-key-prefix') + file.name;    

    var xhr = createCORSRequest(form.getAttribute('method'), form.getAttribute('action'));
    xhr.addEventListener('readystatechange', function(e) {
        if (this.readyState == 4) {
            var completionXHR = createCORSRequest('POST', '/podcasts/upload_succeeded');
            completionXHR.addEventListener('readystatechange', function(e) {
                if (this.readyState == 4) {
                    progress.setAttribute('class', 'upload_complete');
                    completion();
                }
            }, false);
            var completionData = new FormData();
            completionData.append('key', s3key);
            completionXHR.send(completionData);
        }
    }, false);

    if (xhr.upload) xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            progress.setAttribute('value', e.loaded);
            progress.setAttribute('max', e.total);
        }
    }, false);

    var formData = new FormData(form);
    formData.append('file', file);
    xhr.send(formData);
    progress.style.visibility = 'visible';        

}

function createCORSRequest(method, url) 
{
    var xhr = new XMLHttpRequest();
    if ('withCredentials' in xhr) xhr.open(method, url, true);
    else if (typeof XDomainRequest != 'undefined') {
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else xhr = null;
    return xhr;
}

function appLinkClicked(e)
{
    e.preventDefault();
    var appURL = e.target.getAttribute('href');
    var s = document.createElement('script'); 
    s.onload = function() { document.location = appURL; };
    s.onerror = function() { document.location = 'https://itunes.apple.com/us/app/overcast-podcast-player/id888422857?ls=1&mt=8&at=11lIuy&ct=site-deeplink'; }
    s.setAttribute('src', appURL); 
    document.getElementsByTagName('head')[0].appendChild(s);
}

$(document).ready(function(){
    var player = document.getElementById('audioplayer');
    if (player) {
        initAudioPlayer(player, document.getElementById('audiotimestamplink'));
        var saveButton = document.getElementById('save_episode_button');
        if (saveButton) saveButton.addEventListener('click', function(e) {
            player.oc_savedForUser = true;
            document.getElementById('save_episode_button').style.display = 'none';
            document.getElementById('delete_episode_button').style.display = 'inline-block';
            player.forceServerSync();
            e.preventDefault();
        });

        window.addEventListener('keydown', function(e) {
            var target = e.target;
            do {
                var nodeName = target.nodeName.toLowerCase();
                if (nodeName == 'input' || nodeName == 'textarea' || nodeName == 'button' || nodeName == 'form') return;
                target = target.parentNode;
            } while (target);
            
            if (e.keyCode === 32) {
                e.preventDefault();
                if (player.paused) player.play(); else player.pause();
            } else if (e.keyCode === 37) {
                var seekBackButton = document.getElementById('seekbackbutton');
                if (seekBackButton) { e.preventDefault(); player.currentTime -= parseInt(seekBackButton.getAttribute('data-seek-back-interval')); }
            } else if (event.keyCode === 39) {
                var seekForwardButton = document.getElementById('seekforwardbutton');
                if (seekForwardButton) { e.preventDefault(); player.currentTime += parseInt(seekForwardButton.getAttribute('data-seek-forward-interval')); }
            }
        });
    }
    
    var deletePodcastForm = document.getElementById('deletepodcastform');
    if (deletePodcastForm) deletePodcastForm.addEventListener('submit', function(e) { if (! confirm('Are you sure you want to unsubscribe and delete all episodes of this podcast?')) e.preventDefault(); } , false);

    var uploadFile = document.getElementById('upload_file');
    if (uploadFile) uploadFile.addEventListener('change', uploadFormFilesChanged, false);
    
    var privacyOptInForm = document.getElementById('privacy_opt_in_form');
    if (privacyOptInForm) privacyOptInForm.addEventListener('submit', function(e) {
        var checkbox = document.getElementById('privacy_opt_in');
        if (! checkbox || ! checkbox.checked) {
            alert('You must accept the privacy policy for Overcast to store your email address.');
            e.preventDefault();
        }
    });
    
    $('.art').each(function(){
        $(this).error(function(){ show_default_artwork($(this)[0]); });
    });

    var links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('href').indexOf('overcast://') === 0) links[i].addEventListener('click', appLinkClicked, false);
    }
    
    var confirms = document.getElementsByClassName('alertconfirm');
    for (var i = 0; i < confirms.length; i++) confirms[i].addEventListener('click', function(e) { if (! confirm('Are you sure?')) e.preventDefault(); } , false);
    
    var ocfeedlistinputs = document.getElementsByClassName('ocfeedlistinput');
    for (var l = 0; l < ocfeedlistinputs.length; l++) {
        var ocfeedlistinput = ocfeedlistinputs[l];
        var localID = ocfeedlistinput.getAttribute('id');
        var items = ocfeedlistinput.getElementsByTagName('a');
        for (var i = 0; i < items.length; i++) {
            if (items[i].getAttribute('class') == 'ocbutton') {
                items[i].addEventListener('click', feedListItemDelete, false);
            }
        }
    }

    var feed_autocomplete_search_box = document.getElementById('ocpodcastsearch');
    if (feed_autocomplete_search_box) feed_autocomplete_search_box.addEventListener('keyup', podcastsSearchQueryChanged, false);
});
