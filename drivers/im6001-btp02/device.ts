const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, CLUSTER } = require('zigbee-clusters');

if (process.env.DEBUG === '1') {
  debug(true);
}

/**
 * Class representing the Samjin Button device.
 * Handles initialization, attribute reporting, and button press detection.
 */
class IM6001btp02Device extends ZigBeeDevice {
  /**
   * Called when the device is initialized.
   */
  async onInit() {
    // Log that the device has been initialized successfully
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001btp02Device initialized`,
    );
  }

  /**
   * onNodeInit is called when the Zigbee node is initialized.
   * This method sets up attribute reporting for various clusters (battery, temperature, and IAS zone).
   *
   * @param {Object} zclNode - The Zigbee Cluster Library (ZCL) node representing this device.
   */
  async onNodeInit({ zclNode }: { zclNode: any }) {
    // Log that the Zigbee node has been initialized
    this.homey.app.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - Samjin Button device initialized`,
    );

    if (process.env.DEBUG === '1') {
      debug(true);
    }

    this.printNode(); // only for debugging purposes

    // Register capabilities
    this.registerCapability('measure_battery', CLUSTER.genPowerCfg);
    this.registerCapability(
      'measure_temperature',
      CLUSTER.msTemperatureMeasurement,
    );
    this.registerCapability('alarm_generic', CLUSTER.ssIasZone);

    // Register battery percentage reporting
    this.registerAttrReportListener(
      'genPowerCfg',
      'batteryPercentageRemaining',
      60,
      3600,
      0,
      this.onBatteryReport.bind(this),
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register battery report listener: ${err}`,
      );
    });

    // Register temperature reporting
    this.registerAttrReportListener(
      'msTemperatureMeasurement',
      'measuredValue',
      300,
      1800,
      50,
      this.onTemperatureReport.bind(this),
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register temperature report listener: ${err}`,
      );
    });

    // Register button press detection
    this.registerAttrReportListener(
      'ssIasZone',
      'zoneStatus',
      1,
      300,
      0,
      this.onButtonPress.bind(this),
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register button press listener: ${err}`,
      );
    });
  }

  /**
   * Handles battery percentage reporting.
   */
  onBatteryReport(value: number) {
    const batteryPercentage = value / 2;
    this.setCapabilityValue('measure_battery', batteryPercentage).catch(
      this.error,
    );
  }

  /**
   * Handles temperature reporting.
   */
  onTemperatureReport(value: number) {
    const temperature = value / 100;
    this.setCapabilityValue('measure_temperature', temperature).catch(
      this.error,
    );
  }

  /**
   * Handles button press events.
   */
  onButtonPress(value: number) {
    const pressed = (value & 1) > 0;
    this.setCapabilityValue('alarm_generic', pressed).catch(this.error);
  }
}

module.exports = IM6001btp02Device;
