'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const utils = require('./utils');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const dargs = require('dargs');

const npmDependencies = {
  dependencies: [
    '@pnp/pnpjs',
    '@pnp/common',
    '@pnp/logging',
    '@pnp/nodejs',
    '@pnp/odata',
    '@pnp/sp',
    '@pnp/sp-clientsvc',
    '@pnp/sp-taxonomy',
    'core-js',
    'office-ui-fabric-react',
    'react',
    'react-dom',
    'sp-react-formfields'
  ],
  devDependencies: [
    'inquirer',
    'sp-jsom-node',
    'gulp'
  ]
};

module.exports = class extends Generator {
  constructor(...args) {
    super(...args);
    this.utils = new utils({ yo: this });

    // Custom options
    this.option('package-manager', {
      description: 'preferred package manager (npm, yarn, pnpm)',
      type: String,
      alias: 'pm',
      default: 'npm'
    });
  }

  writing() {
    this.log(`\n${
      colors.yellow.bold('[spformfields] Writing files')
    }`);

    this.utils.removeDestFile('src/scripts/index.ts');
    this.utils.removeDestFile('src/scripts/index.tsx');
    this.utils.copyFolder('src', 'src');
    this.utils.copyFolder('tools', 'tools');

    // modify existing package.json
    const pkgPath = path.join(this.destinationRoot(), 'package.json');
    let pkg = require(pkgPath);
    pkg.scripts['rebuild'] = 'gulp build --prod && gulp push --diff';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    // modify existing app.json
    const appPath = path.join(this.destinationRoot(), 'config/app.json');
    let app = require(appPath);
    // console.log(app);
    if (app.copyAssetsMap) {
      let f = app.copyAssetsMap.filter(el => el.name === 'Moment');
      if (!f || f.length === 0) {
        app.copyAssetsMap.push({
          name: 'Moment',
          src: [ './node_modules/moment/min/moment.min.js' ],
          dist: './dist/libs'
        })
      }
    }
    if (app.webpackItemsMap) {
      for (let i of app.webpackItemsMap) {
        if (i.entry.indexOf('index.tsx') !== -1) {
          i.entry = i.entry.replace('index.tsx', 'index.ts');
        }
      }
    }
    fs.writeFileSync(appPath, JSON.stringify(app, null, 2));

    this.log(`${colors.green('[spformfields] Done writing')}`);
  }

  install() {
    const done = this.async();

    (async () => {
      let next = true;
      let installer = null;
      let depOptions = null;
      let devDepOptions = null;

      depOptions = { 'save': true };
    
      if (this.options['package-manager'].match(/pnpm/gi)) {
        next && await this.utils.execPromise('pnpm --version').then(_ => {
          installer = (dep, opt) => {
            const args = ['install'].concat(dep).concat(dargs(opt));
            this.spawnCommandSync('pnpm', args);
          };
          devDepOptions = { 'save-dev': true };
          next = false;
        }).catch(_ => next = true);
      }

      if (this.options['package-manager'].match(/yarn/gi)) {
        next && await this.utils.execPromise('yarn --version').then(_ => {
          installer = this.yarnInstall.bind(this);
          devDepOptions = { 'dev': true };
          next = false;
        }).catch(_ => next = true);
      }

      next && (() => {
        installer = this.npmInstall.bind(this);
        devDepOptions = { 'save-dev': true };
      })();


      let dependencies = npmDependencies.dependencies;
      let devDependencies = npmDependencies.devDependencies;
      installer(dependencies, depOptions);
      installer(devDependencies, devDepOptions);

      done();
    })();
  }
};
