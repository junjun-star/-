const fs = require('fs');
const files = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js'));
if (files.length > 0) {
  const code = fs.readFileSync('dist/assets/' + files[0], 'utf8');
  try {
    const fakeWindow = { location: {}, navigator: {} };
    const fakeDocument = { createElement: () => ({}), getElementById: () => ({}), querySelector: () => null };
    new Function('window', 'document', 'navigator', code)(fakeWindow, fakeDocument, fakeWindow.navigator);
    console.log("No top-level error");
  } catch(e) {
    console.error("Top-level error:", e);
  }
}
