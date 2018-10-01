'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
// const utils = require('./utils');
// const colors = require('colors');

module.exports = class extends Generator {
  constructor(...args) {
    super(...args);

    // Custom options
    this.option('package-manager', {
      description: 'preferred package manager (npm, yarn, pnpm)',
      type: String,
      alias: 'pm',
      default: 'npm'
    });
  }

  initialising() {
    this.composeWith('sppp:app', this.options);
    this.composeWith(require.resolve('./localGenerator'), this.options);
  }

  prompting() {
    //console.log(utils.toString());
    //console.log(this.utils.toString());
    // Have Yeoman greet the user.
    this.log(
      yosay(`Welcome to ${chalk.redBright('generator-spformfields')}, using ${chalk.green('generator-sppp')} by ${chalk.green('Andrew Koltyakov')} as a base`)
    );

    const prompts = [
      {
        type: 'confirm',
        name: 'confirmSppp',
        message: `Please make sure to run ${chalk.redBright('npm i generator-sppp@latest -g')} before proceeding. Proceed?`,
        default: true
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }
};
