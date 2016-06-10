/**
 * To add a new video type just create a class that extends from Video and add
 * it to videoTypes.
 */

// Video classes
var videoTypes = [ YoutubeVideo, VimeoVideo ];

// Abstract, Video
function Video($targetEl, videoUrl) {
    this.$targetEl = $targetEl;

    this.videoUrl = videoUrl;

    this.$videoEl = {};
    
    $(window).resize(this.updateSize.bind(this, true));
}

$.extend(Video.prototype, {
    render : function() {

//        this.videoUrl = this.getEmbedUrl();
//
//        this.createVideoEl();
//
//        this.adjustSize();
//
//        // video container
//        $videoContainerEl = $('<div class="video-container">');
//        this.$videoEl.appendTo($videoContainerEl);
//
//        // set overlay so the video can not be clicked/hovered
//        var $overlayEl = $('<div class="video-container-overlay">');
//        $overlayEl.appendTo(this.$targetEl);
//
//        // append video bg to element
//        $videoContainerEl.appendTo(this.$targetEl);
//
//        // target the middle part of the video
//        this.targetMiddlePart($videoContainerEl);
    },

    targetMiddlePart : function($containerEl) {
        var deltaY = this.videoHeight / 2;
        deltaY -= this.$targetEl.height() / 2;
        deltaY = -1 * deltaY;

        $containerEl.css('top', deltaY + 'px');

        var deltaX = this.videoWidth / 2;
        deltaX -= this.$targetEl.width() / 2;
        deltaX = -1 * deltaX;

        $containerEl.css('left', deltaX + 'px');
    },

    remove : function() {
        this.$targetEl.find('.video-container').remove();
        this.$targetEl.find('.video-container-overlay').remove();
    }
})

// Youtube
function YoutubeVideo($targetEl, videoUrl) {
    Video.call(this, $targetEl, videoUrl);
}

$.extend(YoutubeVideo.prototype, Video.prototype, {
    isApiLoaded : false,
    
    player : false,
    
    // static
    loadApi : function() {
        var apiLoadedPromise = $.Deferred();

        if (this.isApiLoaded) {
            apiLoadedPromise.resolve();
        } else {
            var tag = document.createElement('script');

            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Called when the Youtube API finishes loading, it must be global according to the documentation.
            window.onYouTubeIframeAPIReady = function() {
                YoutubeVideo.prototype.isApiLoaded = true;

                apiLoadedPromise.resolve();
            }
        }
        
        return apiLoadedPromise;
    },

    render : function() {
        // video container, iframe will be appended to it
        this.$videoContainerEl = $('<div class="video-container">');
        this.$videoContainerEl.appendTo(this.$targetEl);

        // placeholder for youtube iframe
        var $iframePlaceholder = $('<div>');
        $iframePlaceholder.appendTo(this.$videoContainerEl);

        // set overlay so the video can not be clicked/hovered
        var $overlayEl = $('<div class="video-container-overlay">');
        $overlayEl.appendTo(this.$targetEl);

        var t = this;
        $.when(t.loadApi()).then(function() {
            t.player = new YT.Player($iframePlaceholder.get(0), {
                videoId : t.getVideoId(),
                playerVars : {
                    controls : 0,
                    showinfo : 0,
                    autoplay : 1,
                    modestbranding : 1,
                    iv_load_policy : 3,
                    loop : 1,
                    origin : document.location.origin
                },
                events : {
                    'onReady' : t.onPlayerReady.bind(t)
                }
            });
        });
    },

    isStarting : true,
    
    // The API will call this function when the video player is ready.
    onPlayerReady : function(e) {
        this.player.playVideo();
         
        this.player.mute();

        this.updateSize();
        
        this.targetMiddlePart(this.$videoContainerEl);

        this.isStarting = false;
    },

    calcSize : function() {
        var videoWidth = $('body').width();
        
        console.log('body width', videoWidth);

        var videoHeight = (9 / 16 * videoWidth);

        if (videoHeight < this.$targetEl.height()) {
            videoHeight = this.$targetEl.height();

            // recalc video width
            videoWidth = (16 / 9 * videoHeight);
        }

        return {
            videoWidth : videoWidth,
            videoHeight : videoHeight
        }
    },

    updateSizeTimer : false,
    
    updateSize : function(timed) {
        var t = this;

        setTimeout(function() {
            var size = t.calcSize();

            t.videoWidth = size.videoWidth;
            t.videoHeight = size.videoHeight;

            console.log('new size', t.videoWidth, t.videoHeight);

            t.player.setSize(t.videoWidth, t.videoHeight);
            
            t.targetMiddlePart(t.$videoContainerEl);
        })
    },

    getVideoId : function() {
        var videoId = false;
        
        var watchType = this.videoUrl.match(/\/watch\?v=(.*)$/);
        if (watchType !== null) {
            videoId = watchType[1];
        }
        
        return videoId;
    },

    // static
    isValid : function(url) {
        return url.match(/^https:\/\/(?:www\.)?youtube\.com/) != null;
    }
});

// Vimeo
function VimeoVideo($targetEl, videoUrl) {
    Video.call(this, $targetEl, videoUrl);
}

$.extend(VimeoVideo.prototype, Video.prototype, {
    createVideoEl : function() {
        this.$videoEl = $('<iframe src="'
                + this.videoUrl
                + '?autoplay=1&loop=1&color=transparent&title=0&byline=0&portrait=0&badge=0&byline=0" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
    },

    adjustSize : function() {
        // 1.06 = 6%. We need to add this width to hide vimeo
        // controls
        this.videoWidth = 1.06 * $('body').width();

        this.videoHeight = (9 / 16 * this.videoWidth);

        var elHeight = this.$targetEl.height();

        // 1.08 = 8%. We need to add this width to hide vimeo
        // controls
        var heightToHideControls = elHeight + (elHeight * 1.08);

        if (this.videoHeight < heightToHideControls) {
            this.videoHeight = heightToHideControls;

            // recalc video width
            this.videoWidth = (16 / 9 * this.videoHeight);
        }

        // apply dimensions to iframe
        this.$videoEl.css('width', this.videoWidth + 'px');
        this.$videoEl.css('height', this.videoHeight + 'px')
    },

    getEmbedUrl : function() {
        var url = this.videoUrl;

        var lastPart = url.match(/\/(\d+)$/);
        if (lastPart == null) {
            throw 'Vimeo url is not valid';
        }

        var videoId = lastPart[1];
        url = '//player.vimeo.com/video/' + videoId;

        return url;
    },

    // static
    isValid : function(url) {
        return (url.match(/(?: https:\/\/)?(?:www)?\.?vimeo\.com/) != null);
    }
});

{
    function onSetVideoUrl(e) {
        //var videoUrl = $(e.target).val();

        var videoUrl = 'https://www.youtube.com/watch?v=PdCylcA_c40';
        
        for (var i = 0; i < videoTypes.length; i++) {
            var videoType = videoTypes[i];
            if (videoType.prototype.isValid(videoUrl)) {
                var video = new videoType($('.nd-el'), videoUrl);
                video.render();
                break;
            }
        }
    }
    
    $(document).ready(function() {
        onSetVideoUrl();
    })
}
