'use strict';

const got = require('got');
const parse = require('parse5');
const catchify = require('catchify');

const getSiteData = async (url) => {
  const site = await got(url);

  return parse.parse(site.body).childNodes
    .filter(c => c.nodeName === 'html')
    .reduce((accumulator, node) => {
      const head = node.childNodes.filter(h => h.nodeName === 'head')[0];

      const meta = head.childNodes.filter(node => node.nodeName === 'meta');
      meta.forEach((m, index) => {
        if (m.attrs.some(f => f.name === 'name' && f.value === 'description')) {
          const content = meta[index].attrs.filter(f => f.name === 'content')[0];
          if (content && content.value) {
            accumulator.description = content.value;
          }
        }
        if (m.attrs.some(f => f.name === 'property' && f.value === 'og:image')) {
          const content = meta[index].attrs.filter(f => f.name === 'content')[0];
          if (content && content.value) {
            accumulator.image = content.value;
          }
        }
      });

      const titleNode = head.childNodes.filter(node => node.nodeName === 'title')[0];
      accumulator.title = titleNode.childNodes[0].value;

      return accumulator;
    }, {});
};

module.exports = async (url) => {
  const [siteErr, siteData] = await catchify(getSiteData(url));

  if (siteErr) {
    return { url };
  } else {
    return {
      image: siteData.image,
      title: siteData.title,
      description: siteData.description,
      url,
    };
  }
};
