const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const lock = `
  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
`;

function render(svg, file, size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  fs.writeFileSync(file, resvg.render().asPng());
  console.log('wrote', file, size);
}

const out = path.join(__dirname, '..', 'assets/images');

const icon = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="220" fill="#0C0B0A"/>
  <g transform="translate(212 200) scale(25)" fill="none" stroke="#C9A36A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    ${lock}
  </g>
</svg>`;

const foreground = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(212 200) scale(25)" fill="none" stroke="#C9A36A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    ${lock}
  </g>
</svg>`;

const background = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="#0C0B0A"/>
</svg>`;

const splash = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g transform="translate(56 48) scale(16.6)" fill="none" stroke="#C9A36A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    ${lock}
  </g>
</svg>`;

const mono = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <g transform="translate(212 200) scale(25)" fill="none" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    ${lock}
  </g>
</svg>`;

render(icon, path.join(out, 'icon.png'), 1024);
render(foreground, path.join(out, 'android-icon-foreground.png'), 1024);
render(background, path.join(out, 'android-icon-background.png'), 1024);
render(mono, path.join(out, 'android-icon-monochrome.png'), 1024);
render(splash, path.join(out, 'splash-icon.png'), 512);
render(icon, path.join(out, 'favicon.png'), 48);
