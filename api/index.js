require('reflect-metadata');

/** @type {import('express').Application | undefined} */
let expressApp;

async function getExpressApp() {
  if (expressApp) {
    return expressApp;
  }

  const { createApp } = require('../apps/api/dist/bootstrap');
  const nestApp = await createApp();
  await nestApp.init();
  expressApp = nestApp.getHttpAdapter().getInstance();
  return expressApp;
}

module.exports = async (req, res) => {
  const app = await getExpressApp();
  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('error', reject);
    app(req, res);
  });
};
