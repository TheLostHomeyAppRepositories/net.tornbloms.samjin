'use strict';

import Homey from 'homey';
const { Log } = require('homey-log');
const HomeyLog = require('homey-betterstack');

// Start debuger
// if (process.env.DEBUG === '1') {
//   require('inspector').open(9229, '0.0.0.0');
// }

class SamjinApp extends HomeyLog {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.homeyLog = new Log({ homey: this.homey });
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} started...`,
    );
  }
  async onUninit() {
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} has been uninitialised`,
    );
  }
}

module.exports = SamjinApp;
