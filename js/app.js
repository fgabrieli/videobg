
function getVimeoIframe(videoUrl) {
    return $('<iframe src="'
            + videoUrl
            + '?autoplay=1&loop=1&color=ffffff&title=0&byline=0&portrait=0" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
}

function getYoutubeIframe(videoUrl) {
    return $('<iframe width="560" height="315" src="' + videoUrl
            + '?autoplay=true&controls=0" frameborder="0" allowfullscreen></iframe>');
}

function setVideoBg($ndEl, videoUrl) {
    var $iframe = {};
    if (videoUrl.match(/^https:\/\/(www\.)?youtube\.com/) != null) {
        $iframe = getYoutubeIframe(videoUrl);
    } else if (videoUrl.match(/^https:\/\/player\.vimeo\.com/) != null) {
        $iframe = getVimeoIframe(videoUrl);
    } else {
        throw 'Video url is not valid';
    }
    
    var $videoBg = $('<div class="video-background">');
    $iframe.appendTo($videoBg);

    // adjust iframe size to match 16:9 aspect ratio
    var videoWidth = $ndEl.width();
    $iframe.css('width', videoWidth + 'px');

    var videoHeight = (9 / 16 * videoWidth);
    $iframe.css('height', videoHeight + 'px')

    // set overlay so the video can not be clicked/hovered
    var $overlay = $('<div class="video-background-overlay">');
    $overlay.appendTo($ndEl);

    // append video bg to element
    $videoBg.appendTo($ndEl);

    // target the middle part of the video
    var deltaY = videoHeight / 2;
    deltaY -= $ndEl.height() / 2;
    deltaY = -1 * deltaY;

    var deltaX = videoWidth / 2;
    deltaX -= $ndEl.width() / 2;
    deltaX = -1 * deltaX;

    $videoBg.css('top', deltaY + 'px');
    $videoBg.css('left', deltaX + 'px');

}

function setYoutubeVideo($ndEl, videoUrl) {
    var $videoBg = $('<div class="video-background">');

    $iframe.appendTo($videoBg);

    // adjust iframe size to match 16:9 aspect ratio
    var videoWidth = $ndEl.width();
    $iframe.css('width', videoWidth + 'px');

    var videoHeight = (9 / 16 * videoWidth);
    $iframe.css('height', videoHeight + 'px')

    // set overlay so the video can not be clicked/hovered
    var $overlay = $('<div class="video-background-overlay">');
    $overlay.appendTo($ndEl);

    // append video bg to element
    $videoBg.appendTo($ndEl);

    // target the middle part of the video
    var deltaY = videoHeight / 2;
    deltaY -= $ndEl.height() / 2;
    deltaY = -1 * deltaY;

    var deltaX = videoWidth / 2;
    deltaX -= $ndEl.width() / 2;
    deltaX = -1 * deltaX;

    $videoBg.css('top', deltaY + 'px');
    $videoBg.css('left', deltaX + 'px');
}

function unsetVideoBg($ndEl) {
    $ndEl.find('.video-background').remove();
    $ndEl.find('.video-background-overlay').remove();
}

$(document).ready(function() {
    var $ndEl = $('.nd-el:nth(0)');
    setVideoBg($ndEl, 'hssssttps://player.vimeo.com/visssdeo/164437997');
})