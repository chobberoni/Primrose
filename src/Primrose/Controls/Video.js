pliny.class({
  parent: "Primrose.Controls",
  name: "Videa",
  baseClass: "Primrose.Controls.BaseTextured",
  description: "A simple 2D video to put on a Surface.",
  parameters: [{
    name: "options",
    type: "Object",
    description: "Named parameters for creating the Video."
  }]
});

let COUNTER = 0;

function getNetworkStateName(state){
  for(var key in HTMLMediaElement) {
    if(key.indexOf("NETWORK_") >= 0 && HTMLMediaElement[key] === state) {
      return key;
    }
  }
  return state;
}

// Videos don't auto-play on mobile devices, so let's make them all play whenever we tap the screen.
const processedVideos = [];
function findAndFixVideo(evt){
  const vids = document.querySelectorAll("video");
  for(let i = 0; i < vids.length; ++i){
    fixVideo(vids[i]);
  }
  window.removeEventListener("touchend", findAndFixVideo);
  window.removeEventListener("mouseup", findAndFixVideo);
  window.removeEventListener("keyup", findAndFixVideo);
}

function fixVideo(vid) {
  if(processedVideos.indexOf(vid) === -1){
    processedVideos.push(vid);
    enableInlineVideo(vid, false);
  }
}

window.addEventListener("touchend", findAndFixVideo, false);
window.addEventListener("mouseup", findAndFixVideo, false);
window.addEventListener("keyup", findAndFixVideo, false);

import enableInlineVideo from "iphone-inline-video";

import BaseTextured from "./BaseTextured";
import textured from "../../live-api/textured";
import isiOS from "../../flags/isiOS";

export default class Video extends BaseTextured {

  constructor(videos, options) {
    ////////////////////////////////////////////////////////////////////////
    // normalize input parameters
    ////////////////////////////////////////////////////////////////////////
    if(!(videos instanceof Array)) {
      videos = [videos];
    }

    options = Object.assign({}, {
      id: "Primrose.Controls.Video[" + (COUNTER++) + "]"
    }, options);

    super(videos, options);
  }

  _loadFiles(videos, progress) {
    this._elements = Array.prototype.map.call(videos, (spec, i) => {
      let video = null;
      if(typeof spec === "string"){
        video = document.querySelector(`video[src='${spec}']`);
        if(!video) {
          video = document.createElement("video");
          video.src = spec;
        }
      }
      else if(spec instanceof HTMLVideoElement){
        video = spec;
      }
      else if(spec.toString() === "[object MediaStream]" || spec.toString() === "[object LocalMediaStream]"){
        video = document.createElement("video");
        video.srcObject = spec;
      }
      video.onprogress = progress;
      video.onloadedmetadata = progress;
      video.muted = true;
      video.loop = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      if(!isiOS) {
        video.preload = "auto";
      }

      this._meshes[i] = textured(
        this._geometry,
        video,
        this.options);

      if(!video.parentElement){
        document.body.insertBefore(video, document.body.children[0]);
        fixVideo(video);
      }

      this.options.promise.then((txt) => {
        this._textures[i] = txt;
      });

      return video;
    });
    return Promise.resolve();
  }

  play() {
    if(this._elements.length > 0) {
      this._elements[0].play();
    }
  }

  update(){
    super.update();
    for (let i = 0; i < this._textures.length; ++i) {
      if(this._textures[i]) {
        const elem = this._elements[i];
        if(elem.currentTime !== this._lastTime){
          this._textures[i].needsUpdate = true;
          this._lastTime = elem.currentTime;
        }
      }
    }
  }
}