export const EVENT_FULLSCREEN_EXIT = "fullScreenExit";

export const isFullScreen = () => {
  const documentAny: any = document;
  return Boolean(document.fullscreenElement) ||
    documentAny.webkitIsFullScreen ||
    documentAny.mozFullScreen ||
    Boolean(documentAny.msFullscreenElement);
};


const onFullScreenChange = () => {
  if (!isFullScreen()) {
    window.dispatchEvent(new Event(EVENT_FULLSCREEN_EXIT));
  }
};

document.addEventListener("fullscreenchange", onFullScreenChange, false);
document.addEventListener("mozfullscreenchange", onFullScreenChange, false);
document.addEventListener("MSFullscreenChange", onFullScreenChange, false);
document.addEventListener("webkitfullscreenchange", onFullScreenChange, false);


export const requestFullScreen = (element: Element): Promise<void> => {
  type FullScreenFunction = typeof HTMLElement.prototype.requestFullscreen;
  const elementAny = element as any;
  const requestFullScreen: FullScreenFunction =
    element.requestFullscreen ||
    elementAny.webkitRequestFullscreen ||
    elementAny.webkitRequestFullScreen ||
    elementAny.mozRequestFullScreen ||
    elementAny.msRequestFullscreen;

  return requestFullScreen.call(element, {navigationUI: "hide"});
};
