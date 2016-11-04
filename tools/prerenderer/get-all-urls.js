'use strict';
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

function getAllFiles(root /** string */)/** : string[] */ {
  // console.log('getAllFiles', root);
  const list = fs.readdirSync(root);
  return list.reduce((prev, file) => {
    const stats = fs.lstatSync(path.resolve(root, file));
    if (stats.isFile()) {
      // console.log('pushing', path.resolve(root, file));
      prev.push(path.resolve(root, file));
      return prev;
    } else if (stats.isDirectory()) {
      return prev.concat(getAllFiles(path.resolve(root, file)))
    } else {
      console.error('Wat?', stats, file);
    }
  }, []);
}

function chunkArray(arr, numChunks) {
  const itemsPerChunk = Math.ceil(arr.length / numChunks);
  let chunkedArray = [];
  console.log('numChunks', numChunks);
  for (let i=0; i< numChunks; i++) {
    chunkedArray.push(arr.slice(i*itemsPerChunk, (i+1) * itemsPerChunk))
  }
  return chunkedArray;
}

const docsUrls = getAllFiles(path.resolve('dist/pages'))
  .map(f => `http://localhost:4200/${path.relative('dist/pages', f)}`);
const chunked = chunkArray(docsUrls, 10);
mkdirp.sync('prerender-specs');
chunked.forEach((chunk, i) => {
  fs.writeFileSync(`prerender-specs/chunk${i}.spec.js`, `
  'use strict';
  const protractor = require('protractor');
  const browser = protractor.browser;
  const url = require('url');
  const mkdirp = require('mkdirp');
  const fs = require('fs');
  const BASE_DIR = 'dist/prerendered';
  const path = require('path');
  describe('chunk ${i}', () => {
    ${JSON.stringify(chunk)}.forEach((urlToPage) => {
      it(\`should render \${url.parse(urlToPage).path}\`, (done) => {
        browser.get(urlToPage);
        browser.getPageSource()
          .then((source) => {
            if (source.indexOf(\`Whoops. Looks like what you're looking for can't be found.\`) > -1) {
              return Promise.reject(\`404 for \${urlToPage}\`)
            }
            let filePath = url.parse(urlToPage).path.replace(/^\\//, '');
            console.log('mkdirp', path.resolve(BASE_DIR, /(.*)\\/.+$/gi.exec(filePath)[1]));
            mkdirp(path.resolve(BASE_DIR, /(.*)\\/.+$/gi.exec(filePath)[1]))
            console.log('writing to', path.resolve(BASE_DIR, filePath));
            fs.writeFileSync(path.resolve(BASE_DIR, filePath), source, 'utf-8')
          })
          .then(() => done(), err => done.fail(err))
      });
    })
  });
  `, 'utf-8');
})