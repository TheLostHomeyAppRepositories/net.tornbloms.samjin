'use strict';

const { ZigBeeDriver } = require('homey-zigbeedriver');

class CentraLiteDriver extends ZigBeeDriver {
  /**
   * Called when the driver is initialized.
   */
  onInit() {
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - CentraLite 3200-Sgb driver has been initialized`,
    );
  }

  /**
   * Called when a device is being paired.
   * Returns a list of available devices for pairing.
   */
  async onPairListDevices() {
    this.homey.app.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - Listing devices...`,
    );
    //  return [
    //    {
    //      name: 'CentraLite 3200-Sgb',
    //      data: {
    //        ieeeAddress: 'XX:XX:XX:XX:XX:XX:XX:XX', // Replace with actual IEEE address if known
    //        modelId: '3200-Sgb',
    //      },
    //      capabilities: [
    //        'onoff',
    //        'measure_voltage',
    //        'measure_current',
    //        'measure_power',
    //      ],
    //    },
    //  ];
  }
}

module.exports = CentraLiteDriver;
