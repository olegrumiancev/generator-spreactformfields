// Import * as Generator from 'yeoman-generator';
// import * as fs from 'fs';
// import * as path from 'path';
// import * as mkdirp from 'mkdirp';
// import * as colors from 'colors';
// import { exec } from 'child_process';
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const colors = require('colors');
const exec = require('child_process').exec;

module.exports = class Utils {
  // Settings = null;
  // destinationRoot = null;

  // private destinationPath: string;
  constructor(settings) {
    this.settings = {
      ...settings
    };
    this.destinationRoot = this.settings.yo.destinationRoot();
    // This.destinationPath = this.settings.yo.destinationPath();

    this.execPromise = command => {
      return new Promise((resolve, reject) => {
        exec(command, (err, stdout) => {
          if (err) {
            return reject(err);
          }
          return resolve(stdout);
        });
      });
    };
  }

  writeJsonAsModuleSync(relativePath, jsonData) {
    const absolutePath = this.resolveDestPath(relativePath);
    const destinationFolder = path.dirname(absolutePath);
    mkdirp.sync(destinationFolder);

    const exists = fs.existsSync(absolutePath);
    if (!exists) {
      fs.writeFileSync(
        absolutePath,
        `module.exports = ${JSON.stringify(jsonData, null, 4)};\n`,
        { encoding: 'utf8' }
      );
    } else {
      this.logFileExistsMessage(absolutePath);
    }
  }

  writeJsonSync(relativePath, jsonData, force = false) {
    const absolutePath = this.resolveDestPath(relativePath);
    const destinationFolder = path.dirname(absolutePath);
    mkdirp.sync(destinationFolder);

    const exists = fs.existsSync(absolutePath);
    if (!exists || force) {
      fs.writeFileSync(absolutePath, JSON.stringify(jsonData, null, 2), {
        encoding: 'utf8'
      });
    } else {
      this.logFileExistsMessage(absolutePath);
    }
  }

  removeDestFile(destRelPath) {
    const p = this.resolveDestPath(destRelPath);
    let exists = fs.existsSync(p);
    if (exists) {
      fs.unlinkSync(p);
    }
  }

  copyFile(sourceRelativePath, destRelativePath, force = false) {
    if (typeof destRelativePath === 'undefined' || destRelativePath === null) {
      destRelativePath = sourceRelativePath;
    }
    const fromPath = this.resolveSourcePath(sourceRelativePath);
    const toPath = this.resolveDestPath(destRelativePath);
    const destinationFolder = path.dirname(toPath);

    let exists = fs.existsSync(toPath);
    if (force) {
      exists = false;
    }
    if (!exists) {
      mkdirp.sync(destinationFolder);
      fs.writeFileSync(toPath, fs.readFileSync(fromPath));
    } else {
      this.logFileExistsMessage(toPath);
    }
  }

  createFolder(folderRelativePath) {
    mkdirp.sync(this.resolveDestPath(folderRelativePath));
  }

  copyFolder(sourceRelativePath, destRelativePath) {
    const fromFolder = this.resolveSourcePath(sourceRelativePath);
    const toFolder = this.resolveDestPath(destRelativePath);
    this.copyRecursiveSync(fromFolder, toFolder);
  }

  resolveDestPath(relativePath) {
    return path.join(this.destinationRoot, relativePath);
  }

  resolveSourcePath(relativePath) {
    return path.join(__dirname, '..', 'templates', relativePath);
  }

  copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (exists && isDirectory) {
      mkdirp.sync(dest);
      fs.readdirSync(src).forEach(childItemName => {
        this.copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      });
    } else {
      try {
        // Fs.linkSync(src, dest);
        fs.writeFileSync(dest, fs.readFileSync(src));
      } catch (ex) {
        if (ex.code === 'EEXIST') {
          this.logFileExistsMessage(dest);
        } else {
          console.log(ex.message);
        }
      }
    }
  }

  logFileExistsMessage(filePath) {
    console.log(`File already exists ${colors.red(filePath)}, copying is skipped.`);
  }
};
