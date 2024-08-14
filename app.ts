'use strict';

import Homey from 'homey';

class SmartThingsApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('SmartThings app has been initialized');
  }

}

module.exports = SmartThingsApp;
