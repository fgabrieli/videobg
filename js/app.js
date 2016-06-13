/**
 * To add a new video type just create a class that extends from Video and add
 * it to videoTypes.
 */

(function($) {
    /**
     * Video types. Add new video types in this array so the builder can render them properly as video backgrounds.
     */
    window.neo = window.neo ? window.neo : {};
    
    neo.getVideoBgTypes = function() {
        return [ YoutubeVideoBg, VimeoVideoBg ];
    }
    
    /**
     * Video background class (abstract).
     * 
     * @param jQuery element where the player will be embedded.
     * @param String optional raw video url from user input.
     */
    function VideoBg($targetEl, videoUrl) {
        this.$targetEl = $targetEl;

        if (typeof videoUrl !== 'undefined') {
            this.load(videoUrl);
        }
        
        $(window).resize(this.onResize.bind(this));
    }

    $.extend(VideoBg.prototype, {
        videoUrl : '',
        
        videoWidth : 0,

        videoHeight : 0,
        
        // video will go within this container; say we are using youtube, the iframe will go within it
        $videoContainerEl : {},
        
        // overlay set to the target element so that the video can not be clicked/hovered
        $overlayEl : {},
        
        load : function(url) {
            this.videoUrl = url;

            this.render();
        },

        unload : function() {
            this.$overlayEl.remove();
            
            this.$videoContainerEl.remove();
        },

        // implemented by child classes
        render : function() {},
        
        // implemented by child classes
        play : function() {},
        
        // implemented by child classes
        stop : function() {},
        
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

        calcSize : function($referenceEl) {
            var videoWidth = $('body').width();
            
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
        },

        createContainer : function() {
            this.$videoContainerEl = $('<div class="video-container">');
            this.$videoContainerEl.appendTo(this.$targetEl);
        },
        
        appendOverlay : function() {
            // set overlay so the video can not be clicked/hovered
            this.$overlayEl = $('<div class="video-container-overlay">');
            this.$overlayEl.appendTo(this.$targetEl);
        }
    });


    /**
     * Youtube Video backgrounds.
     * 
     * @param jQuery element where the player will be embedded.
     * @param String raw video url from user input.
     */
    function YoutubeVideoBg($targetEl, videoUrl) {
        VideoBg.call(this, $targetEl, videoUrl);
    }

    $.extend(YoutubeVideoBg.prototype, VideoBg.prototype, {
        type : 'youtube',
       
        isApiLoaded : false,
        
        player : false,

        // @static
        loadApi : function() {
            var apiLoadedPromise = $.Deferred();

            if (YoutubeVideoBg.prototype.isApiLoaded) {
                apiLoadedPromise.resolve();
            } else {
                var tag = document.createElement('script');

                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                // Called when the Youtube API finishes loading, it must be global according to the documentation.
                window.onYouTubeIframeAPIReady = function() {
                    YoutubeVideoBg.prototype.isApiLoaded = true;

                    apiLoadedPromise.resolve();
                }
            }
            
            return apiLoadedPromise;
        },

        render : function() {
            this.createContainer();
            
            this.appendOverlay();

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
                        origin : document.location.origin,
                        playlist : t.getVideoId()
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

        unload : function() {
            this.player.destroy();
            
            VideoBg.prototype.unload.call(this);
        },
        
        play : function() {
            this.player.playVideo();
        },
        
        stop : function() {
            this.player.stopVideo();
        },

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
        
        // @static
        isValid : function(url) {
            return url.match(/^https:\/\/(?:www\.)?youtube\.com/) != null;
        }
    });
    

    /**
     * Vimeo Video backgrounds.
     * 
     * @param jQuery element where the player will be embedded.
     * @param String raw video url from user input.
     * @see https://developer.vimeo.com/player/js-api
     */
    function VimeoVideoBg($targetEl, videoUrl) {
        VideoBg.call(this, $targetEl, videoUrl);
    }

    $.extend(VimeoVideoBg.prototype, VideoBg.prototype, {
        type : 'vimeo',
        
        // @static
        apiLoadedPromise : false,

        // this is the name given by vimeo to their api
        froogaloop : {},
        
        // video iframe
        $iframe : {},
        
        api : false,
        
        createIframe : function() {
            return $('<iframe src="//player.vimeo.com/video/'
                    + this.getVideoId()
                    + '?api=1&autoplay=1&color=transparent&title=0&byline=0&portrait=0&badge=0" width="640" height="360" frameborder="0"</iframe>');
        },

        // @static
        loadApi : function() {
            if (VimeoVideoBg.prototype.apiLoadedPromise === false) {
                VimeoVideoBg.prototype.apiLoadedPromise = $.Deferred();

                var tag = document.createElement('script');
                tag.src = "https://f.vimeocdn.com/js/froogaloop2.min.js";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                tag.onload = function() {
                    VimeoVideoBg.prototype.apiLoadedPromise.resolve();
                }
            }
            
            return VimeoVideoBg.prototype.apiLoadedPromise;
        },
        
        play : function() {
            this.froogaloop.api('play');
        },
        
        stop : function() {
            this.froogaloop.api('pause');
        },
        
        unload : function() {
            this.froogaloop.api('unload');

            this.$iframe.remove();
            
            VideoBg.prototype.unload.call(this);
        },

        render : function() {
            var t = this;
            $.when(t.loadApi()).then(function() {
                t.$iframe = t.createIframe();
                
                t.createContainer();
                
                t.appendOverlay();

                t.bindEvents();

                t.$iframe.appendTo(t.$videoContainerEl);
            })
        },

        bindEvents : function() {
            if (window.addEventListener) {
                window.addEventListener('message', this.onMessageReceived.bind(this), false);
            }
            else {
                window.attachEvent('onmessage', this.onMessageReceived.bind(this), false);
            }
        },
        
        onMessageReceived : function(e) {
            // handle messages from the vimeo player only
            if (!(/^https?:\/\/player.vimeo.com/).test(e.origin)) {
                return false;
            }
            
            var data = JSON.parse(event.data);
            
            var t = this;
            switch (data.event) {
                case 'ready':
                    t.onPlayerReady(event);
                    break;
            }
        },
        
        onPlayerReady : function() {
            var t = this;
            $.when(VimeoVideoBg.prototype.apiLoadedPromise).then(function() {
                t.froogaloop = $f(t.$iframe.get(0));
                
                t.froogaloop.api('setLoop', 1);
                
                t.froogaloop.api('setVolume', 0);

                t.onResize();
            })
        },
        
        calcSize : function() {
            // 1.06 = 6%. We need to add this width to hide vimeo
            // controls
            var videoWidth = 1.06 * $('body').width();

            var videoHeight = (9 / 16 * videoWidth);

            var elHeight = this.$targetEl.height();

            // 1.08 = 8%. We need to add this height to hide vimeo
            // controls
            var heightToHideControls = elHeight + (elHeight * 1.08);

            if (videoHeight < heightToHideControls) {
                videoHeight = heightToHideControls;

                // recalc video width
                videoWidth = (16 / 9 * videoHeight);
            }

            return {
                videoWidth : videoWidth,
                videoHeight : videoHeight
            }
        },
        
        updateSize : function(size) {
            this.$iframe.css('width', size.videoWidth + 'px');
            this.$iframe.css('height', size.videoHeight + 'px')
        },
        
        getVideoId : function() {
            var videoId = false;
            
            var lastPart = this.videoUrl.match(/\/(\d+)$/);
            if (lastPart == null) {
                throw 'Vimeo url is not valid';
            } 

            videoId = lastPart[1];
            
            return videoId;
        },
        
        isValid : function(url) {
            return (url.match(/(?: https:\/\/)?(?:www)?\.?vimeo\.com/) != null);
        }
    });
    
    
    $(document).ready(function() {
//        var videoUrl = 'https://www.youtube.com/watch?v=3nmnMtbzzjE';
        var videoUrl = 'https://vimeo.com/168794118';
        
        var videoTypes = neo.getVideoBgTypes();
        
        for (var i = 0; i < videoTypes.length; i++) {
            var videoType = videoTypes[i];
            if (videoType.prototype.isValid(videoUrl)) {
                window.video = new videoType($('.nd-el'), videoUrl);
                break;
            }
        }
    })
    
    window.onSetVideoUrl = function(e) {
        var videoUrl = $(e.target).val();
            
        video.load(videoUrl);
    }

})(jQuery);