'use strict';

import Homey from 'homey';

class SamjinApp extends Homey.App {
   /**
    * onInit is called when the app is initialized.
    */
   async onInit() {
      this.log('Samjin app has been initialized');
   }
}

module.exports = SamjinApp;
