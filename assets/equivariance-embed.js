(() => {
  const frame = document.getElementById('equivariance-frame');
  if (!frame) return;
  let visible = true;
  const updateVisibility = () => {
    frame.contentWindow.postMessage({
      type: 'equivariance-visibility', visible: visible && !document.hidden
    }, window.location.origin);
  };
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type !== 'equivariance-size') return;
    const height = event.data.height;
    if (Number.isFinite(height) && height > 0 && height < 2000) {
      frame.style.height = `${Math.ceil(height)}px`;
    }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateVisibility();
    }).observe(frame);
  }
  frame.addEventListener('load', updateVisibility);
  document.addEventListener('visibilitychange', updateVisibility);
})();
