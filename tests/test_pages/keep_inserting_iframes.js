const colors = [
  '#ef476f', '#f78c6b', '#ffd166', '#83d483', '#06d6a0',
  '#118ab2', '#5e60ce', '#9b5de5', '#f15bb5', '#7f5539'
];
const iframeContainer = document.getElementById('iframes');
const insertButton = document.getElementById('insert-iframe');

function createIframe() {
  const iframe = document.createElement('iframe');
  const color = colors[iframeContainer.children.length % colors.length];

  iframe.srcdoc = `<!doctype html><html><body style="align-items:center;background:${color};display:flex;height:100vh;justify-content:center;margin:0">iframe</body></html>`;
  iframeContainer.appendChild(iframe);
}

function ensureFiveIframes() {
  while (iframeContainer.querySelectorAll('iframe').length < 5) {
    createIframe();
  }
}

insertButton.addEventListener('click', createIframe);
ensureFiveIframes();
setInterval(ensureFiveIframes, 3000);
