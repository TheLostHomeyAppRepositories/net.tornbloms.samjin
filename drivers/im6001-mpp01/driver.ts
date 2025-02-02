import Homey from 'homey';

const { ZigBeeDriver } = require('homey-zigbeedriver');

/**
 * Class representing the driver for the IM6001 Samjin Multi Sensor device.
 * This class manages the pairing process and initialization of the device driver.
 */
class IM6001Driver extends ZigBeeDriver {
  /**
   * onInit is called when the driver is initialized.
   * This method is triggered once when the driver is loaded, typically when Homey starts or when the app is installed.
   */
  async onInit() {
    try {
      this.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001Driver has been initialized`,
      );
    } catch (error) {
      this.error('Driver initialization failed:', error);
    }
  }

  /**
   * onPairListDevices is called during the pairing process, specifically when the 'list_devices' view is invoked.
   * This method should return an array of devices that are available for pairing, including their capabilities and configuration.
   *
   * @returns {Promise<Array<Object>>} - A promise that resolves to an array of devices available for pairing.
   */
  async onPairListDevices() {
        try {
          // Return an array of device configurations available for pairing
          this.homey.app.log(
            `${this.homey.manifest.id} - ${this.homey.manifest.version} - Listing devices...`,
          );
        } catch (error) {
          this.error('Error listing devices:', error);
          throw error; // Re-throw the error to ensure the pairing process fails gracefully
        }  
  }
}

module.exports = IM6001Driver;
