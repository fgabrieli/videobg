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

    $(window).resize(this.onResize.bind(this));
}

$.extend(Video.prototype, {
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
    
    onResize : function() {
        var t = this;

        setTimeout(function() {
            var size = t.calcSize();

            t.videoWidth = size.videoWidth;
            t.videoHeight = size.videoHeight;

            console.log('new size', t.videoWidth, t.videoHeight);

            t.updateSize(size);
            
            t.targetMiddlePart(t.$videoContainerEl);
        })
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

        if (YoutubeVideo.prototype.isApiLoaded) {
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
        
        // set overlay so the video can not be clicked/hovered
        var $overlayEl = $('<div class="video-container-overlay">');
        $overlayEl.appendTo(this.$targetEl);

        // placeholder for youtube iframe
        this.$iframePlaceholder = $('<div>');
        this.$iframePlaceholder.appendTo(this.$videoContainerEl);

        var t = this;
        $.when(t.loadApi()).then(function() {
            t.player = new YT.Player(t.$iframePlaceholder.get(0), {
                videoId : t.getVideoId(),
                playerVars : {
                    autoplay : 1,
                    loop : 1,
                    controls : 0,
                    showinfo : 0,
                    modestbranding : 1,
                    iv_load_policy : 3,
                    origin : document.location.origin
                },
                events : {
                    'onReady' : t.onPlayerReady.bind(t)
                }
            });
        });
    },

    // The API will call this function when the video player is ready.
    onPlayerReady : function(e) {
        this.player.playVideo();
         
        this.player.mute();

        this.onResize();
    },

    updateSizeTimer : false,
    
    updateSize : function() {
        this.player.setSize(this.videoWidth, this.videoHeight);
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
        var videoUrl = $(e.target).val();

        //var videoUrl = 'https://www.youtube.com/watch?v=PdCylcA_c40';
        
        for (var i = 0; i < videoTypes.length; i++) {
            var videoType = videoTypes[i];
            if (videoType.prototype.isValid(videoUrl)) {
                var video = new videoType($('.nd-el'), videoUrl);
                video.render();
                break;
            }
        }
    }
    
//    $(document).ready(function() {
//        onSetVideoUrl();
//    })
}
