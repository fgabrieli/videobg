// Video classes
var videoTypes = [ YoutubeVideo, VimeoVideo];

// Abstract
function Video($targetEl, videoUrl) {
    this.$targetEl = $targetEl;

    this.videoUrl = videoUrl;

    this.$iframe = {};

    var t = this;
    $(window).resize(function() {
        t.reload();
    })
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

    render : function() {
        this.videoUrl = this.getEmbedUrl();

        this.createIframe();

        this.adjustSize();

        // video container
        $videoContainerEl = $('<div class="video-background">');
        this.$iframe.appendTo($videoContainerEl);

        // set overlay so the video can not be clicked/hovered
        var $overlayEl = $('<div class="video-background-overlay">');
        $overlayEl.appendTo(this.$targetEl);

        // append video bg to element
        $videoContainerEl.appendTo(this.$targetEl);

        // target the middle part of the video
        this.targetMiddlePart($videoContainerEl);
    },

    remove : function() {
        this.$targetEl.find('.video-background').remove();
        this.$targetEl.find('.video-background-overlay').remove();
    },
    
    reload : function() {
        this.remove();
        
        this.render();
    }
})

// Youtube
function YoutubeVideo($targetEl, videoUrl) {
    Video.call(this, $targetEl, videoUrl);
}

$.extend(YoutubeVideo.prototype, Video.prototype, {
    createIframe : function() {
        this.$iframe = $('<iframe width="560" height="315" src="' + this.videoUrl
                + '?autoplay=1&loop=1&controls=0" frameborder="0" allowfullscreen></iframe>');
    },
    
    adjustSize : function() {
        this.videoWidth = $('body').width();

        this.videoHeight = (9 / 16 * this.videoWidth);

        if (this.videoHeight < this.$targetEl.height()) {
            this.videoHeight = this.$targetEl.height();

            // recalc video width
            this.videoWidth = (16 / 9 * this.videoHeight);
        }

        // apply dimensions to iframe
        this.$iframe.css('width', this.videoWidth + 'px');
        this.$iframe.css('height', this.videoHeight + 'px')
    },

    getEmbedUrl : function() {
        var url = this.videoUrl;
        
        var watchType = url.match(/\/watch\?v=(.*)$/);
        if (watchType !== null) {
            var videoId = watchType[1];
            url = 'https://www.youtube.com/embed/' + videoId;
        }

        return url;
    },

    // static
    isValid : function(url) {
        return url.match(/^https:\/\/(www\.)?youtube\.com/) != null;
    }
});

// Vimeo
function VimeoVideo($targetEl, videoUrl) {
    Video.call(this, $targetEl, videoUrl);
}

$.extend(VimeoVideo.prototype, Video.prototype, {
    createIframe : function() {
        this.$iframe = $('<iframe src="'
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
        this.$iframe.css('width', this.videoWidth + 'px');
        this.$iframe.css('height', this.videoHeight + 'px')
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
        return (url.match(/\/\/.*?vimeo\.com/) != null);
    }
});

{
    function onSetVideoUrl(e) {
        var videoUrl = $(e.target).val();
        
        for (var i = 0; i < videoTypes.length; i++) {
            var videoType = videoTypes[i];
            if (videoType.prototype.isValid(videoUrl)) {
                var video = new videoType($('.nd-el'), videoUrl);
                video.render();
                break;
            }
        }
    }
    
    
//    var videos = [];
//
//    $(document).ready(function() {
//
//        var $el = $('.nd-el:nth(0)');
//
//        //var videoUrl = 'https://www.youtube.com/watch?v=6pxRHBw-k8M';
//
//        var videoUrl = 'https://vimeo.com/35396305';
//        
//        for (var i = 0; i < videoTypes.length; i++) {
//            var videoType = videoTypes[i];
//            if (videoType.prototype.isValid(videoUrl)) {
//                var video = new videoType($el, videoUrl);
//                video.render();
//                videos.push(video);
//            }
//        }
//    });
}