// Input: keyboard (arrows + WASD) and mouse clicks. Keys are tracked as
// held state; one-shot actions (flaps, pause, restart, mute) are exposed as
// flags the game loop consumes once.

export function createInput() {
  const keys = new Set();
  const input = {
    keys,
    // Held controls.
    get pitchUp() { return keys.has('ArrowUp') || keys.has('KeyW'); },
    get pitchDown() { return keys.has('ArrowDown') || keys.has('KeyS'); },
    get throttleUp() { return keys.has('ArrowRight') || keys.has('KeyD'); },
    get throttleDown() { return keys.has('ArrowLeft') || keys.has('KeyA'); },
    // One-shot actions, set on keydown and cleared by the game loop.
    flapsToggle: false,
    pauseToggle: false,
    restart: false,
    muteToggle: false,
    confirm: false,
    // Mouse click position (set on click, cleared by the game loop).
    click: null,
    // True once the player has pressed anything: the audio engine may start.
    interacted: false,
  };

  function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    keys.add(e.code);
    input.interacted = true;
    if (e.code === 'Space') input.flapsToggle = true;
    if (e.code === 'KeyP' || e.code === 'Escape') input.pauseToggle = true;
    if (e.code === 'KeyR') input.restart = true;
    if (e.code === 'KeyM') input.muteToggle = true;
    if (e.code === 'Enter') input.confirm = true;
  }

  function onKeyUp(e) {
    keys.delete(e.code);
  }

  function onClick(e) {
    input.interacted = true;
    input.click = { x: e.clientX, y: e.clientY };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('click', onClick);

  input.destroy = function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('click', onClick);
  };

  return input;
}
