import Homey from 'homey';
import { ZigBeeDriver } from 'homey-zigbeedriver';

class IM6001btp02Driver extends ZigBeeDriver {
  async onInit() {
    try {
      this.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001btp02Driver has been initialized`,
      );
    } catch (error) {
      this.error('Driver initialization failed:', error);
    }
  }

  async onPairListDevices() {
    try {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Listing devices...`,
      );
    } catch (error) {
      this.error('Error listing devices:', error);
      throw error; // Re-throw the error to ensure the pairing process fails gracefully
    }
  }
}

module.exports = IM6001btp02Driver;
