// ==UserScript==
// @name         OppetArkiv nextBtn
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds AutoPlay and Prev/Next Episode buttons to ÖppetArkiv
// @author       OZONE
// @match        https://www.oppetarkiv.se/video/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let prevBtn = document.createElement('button');
    prevBtn.appendChild(document.createTextNode('Previous'))
    prevBtn.onclick = onClickPrevious;
    let nextBtn = document.createElement('button');
    nextBtn.onclick = onClickNext;
    nextBtn.appendChild(document.createTextNode('Next'))
    document.querySelector('.svt-heading-l').appendChild(prevBtn)
    document.querySelector('.svt-heading-l').appendChild(nextBtn)
    if (window.location.hash === '#autoplayed') {
        setTimeout(() => {
            eventFire(document.querySelector('.svp_splash__inner'), 'click')
            eventFire(document.querySelector('.svp_js-controls-btn--fullscreen'), 'click')
        }, 1000);
    }
    setInterval(() => {
        if (document.querySelector("div.svp_ui-controls__timeline-progress.svp_js-controls-timeline--progress.svp_css-timeline--progress").style.width.split('%')[0] > 97) {
            let ep = nextEpisode();
            findEpisode(ep.season, ep.episode, (url) => {
                if (!url) {
                    return;
                }
                setUrl(url+"#autoplayed");
            })
        }
    }, 1000)
})();
function setUrl(url) {
    if (!url) {
        return
    }
    window.location.href = url;
}
function onClickPrevious() {
    let obj = previousEpisode();
    findEpisode(obj.season, obj.episode, setUrl);
}
function onClickNext() {
    let obj = nextEpisode();
    findEpisode(obj.season, obj.episode, setUrl);
}
function previousEpisode() {
    let [match, season, episode, seasonLength] = window.location.href.match(/sasong-(\d{1,2})-avsnitt-(\d{1,2})-av-(\d{1,2})/);
    if (parseInt(episode, 10) !== 1) {
        return { season: parseInt(season, 10), episode: parseInt(episode, 10)-1 };
    } else if (season !== 1) {
        return { season: parseInt(season, 10)-1, episode: parseInt(episode, 10) };
    }
    return false;
}
function nextEpisode() {
    let [match, season, episode, seasonLength] = window.location.href.match(/sasong-(\d{1,2})-avsnitt-(\d{1,2})-av-(\d{1,2})/);
    if (parseInt(episode, 10)+1 < seasonLength) {
        return { season: parseInt(season, 10), episode: parseInt(episode, 10)+1 };
    } else {
        return { season: parseInt(season, 10)+1, episode: parseInt(episode, 10) };
    }
    return false;
}
function findEpisode(season, episode, cb) {
    let miniatures = document.querySelectorAll('.svtUnit > div > div > .svt-overflow-hidden');
    let minShown = null;
    let maxShown = null;
    for (let i = 0; i < miniatures.length; i++) {
        let miniature = miniatures[i];
        let seasonNode = miniature.children[0];
        let episodeNode = miniature.children[1];
        let link = miniature.children[1].firstChild.href;

        let seasonMatch = seasonNode.innerText.match(/Säsong (\d{1,2})/)
        let episodeMatch = episodeNode.innerText.match(/Avsnitt (\d{1,2}) av (\d{1,2})/);
        if (!seasonMatch && !episodeMatch) {
           continue;
        }
        let mSeason = parseInt(seasonMatch[1], 10)
        let mEpisode = parseInt(episodeMatch[1], 10)
        let mSeasonLength = parseInt(episodeMatch[2], 10)
        if (season === mSeason && episode === mEpisode) {
            return cb(link);
        }


        if (!minShown) {
            minShown = { season: mSeason, episode: mEpisode };
        }
        if (!maxShown) {
            maxShown = { season: mSeason, episode: mEpisode };
        }
        if (mSeason < minShown.season || (mSeason === minShown.season && mEpisode < minShown.episode)) {
            minShown = { season: mSeason, episode: mEpisode };
        }
        if (mSeason > maxShown.season || (mSeason === minShown.season && mEpisode > minShown.episode)) {
            minShown = { season: mSeason, episode: mEpisode };
        }
    }
    // Convert to regular array
    let loadButtons = Array.prototype.slice.call(document.querySelectorAll('button[data-target=".svtoa_js-more-episodes-list"]'));

    let loadPrevious = loadButtons.filter((el) => { return el.innerText === ' Visa föregående'; }).pop();
    let loadMore = loadButtons.filter((el) => { return el.innerText === ' Visa fler'; }).pop();


    if (minShown.episode === 1 && maxShown.season === 1) {
        return cb(false);
    }
    if (season < minShown.season || (season === minShown.season && episode < minShown.episode)) {
        eventFire(loadPrevious, 'click');
    } else if (season > maxShown.season || (season === maxShown.season && episode > maxShown.episode)) {
        eventFire(loadMore, 'click');
    }

    return setTimeout(() => {
        findEpisode(season, episode, cb);
    }, 1000);
}

function eventFire(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}
