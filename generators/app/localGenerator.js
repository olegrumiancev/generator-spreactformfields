'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const utils = require('./utils');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

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
    // console.log(pkg);
    pkg.scripts['rebuild'] = 'gulp build --prod && gulp push --diff';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

    this.log(`${colors.green('[spformfields] Done writing')}`);
  }

  install() {
    const done = this.async();

    (async () => {
      let next = true;
      let installer = null;
      let depOptions = null;
      let devDepOptions = null;

      next && await this.utils.execPromise('yarn --version').then(_ => {
        installer = this.yarnInstall.bind(this);
        depOptions = { 'save': true };
        devDepOptions = { 'dev': true };
        next = false;
      }).catch(_ => next = true);

      next && (() => {
        installer = this.npmInstall.bind(this);
        depOptions = { 'save': true };
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
