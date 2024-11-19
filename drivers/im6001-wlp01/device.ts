'use strict';

const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, CLUSTER } = require('zigbee-clusters');

// Enable debug logging if the DEBUG environment variable is set
if (process.env.DEBUG === '1') {
  debug(true);
}

/**
 * Class representing the SmartThings Moisture Sensor device.
 * This class handles initialization, reporting, and configuration of the sensor's Zigbee capabilities.
 */
class IM6001wlp01Device extends ZigBeeDevice {
  /**
   * onInit is called when the device is first initialized.
   */
  async onInit() {
    // Log that the device has been initialized successfully
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001wlp01Device has been initialized`,
    );
  }

  /**
   * onNodeInit is called when the Zigbee node is initialized.
   * This method sets up attribute reporting for various clusters (battery, temperature, and IAS zone for water detection).
   *
   * @param {Object} zclNode - The Zigbee Cluster Library (ZCL) node representing this device.
   */
  async onNodeInit({ zclNode }: { zclNode: any }) {
    // Log that the Zigbee node has been initialized
    this.homey.app.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - SmartThings Moisture Sensor device initialized`,
    );

    if (process.env.DEBUG === '1') {
      debug(true);
    }
    this.printNode(); // Print node details for debugging purposes

    // Register battery level reporting capability
    this.registerCapability('measure_battery', CLUSTER.genPowerCfg);

    // Register temperature measurement reporting capability
    this.registerCapability(
      'measure_temperature',
      CLUSTER.msTemperatureMeasurement,
    );

    // Register water detection reporting capability via IAS Zone
    this.registerCapability('alarm_water', CLUSTER.ssIasZone);

    // Register attribute listener for battery level reporting
    this.registerAttrReportListener(
      'genPowerCfg', // General Power Configuration cluster
      'batteryPercentageRemaining', // Attribute for battery percentage remaining
      60, // Minimum reporting interval (in seconds)
      3600, // Maximum reporting interval (1 hour)
      0, // Minimum change in value to trigger a report
      this.onBatteryPercentageRemainingReport.bind(this), // Callback function to handle reports
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register battery report listener: ${err}`,
      );
    });

    // Register attribute listener for temperature measurement reporting
    this.registerAttrReportListener(
      'msTemperatureMeasurement', // Temperature Measurement cluster
      'measuredValue', // Attribute for measured temperature
      300, // Minimum reporting interval (5 minutes)
      1800, // Maximum reporting interval (30 minutes)
      50, // Minimum change in value to trigger a report
      this.onTemperatureReport.bind(this), // Callback function to handle reports
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register temperature report listener: ${err}`,
      );
    });

    // Register attribute listener for IAS zone status (used for water detection)
    this.registerAttrReportListener(
      'ssIasZone', // IAS Zone cluster
      'zoneStatus', // Attribute for zone status
      1, // Minimum reporting interval (in seconds)
      300, // Maximum reporting interval (in seconds)
      0, // Minimum change in value to trigger a report
      this.onZoneStatusReport.bind(this), // Callback function to handle reports
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register IAS zone report listener: ${err}`,
      );
    });

    // Bind necessary clusters to their corresponding handlers
    await zclNode.bind('genIdentify', 'ota').catch(this.error);
  }

  /**
   * Handle battery percentage reporting.
   * This method is called whenever a new battery percentage report is received.
   *
   * @param {number} value - The battery percentage remaining (0-200, where 200 = 100%).
   */
  onBatteryPercentageRemainingReport(value: number) {
    const batteryPercentage = value / 2;
    this.setCapabilityValue('measure_battery', batteryPercentage).catch(
      this.error,
    );
  }

  /**
   * Handle temperature measurement reporting.
   * This method is called whenever a new temperature report is received.
   *
   * @param {number} value - The measured temperature in centidegrees Celsius.
   */
  onTemperatureReport(value: number) {
    const temperature = value / 100; // Convert from centidegrees to degrees Celsius
    this.setCapabilityValue('measure_temperature', temperature).catch(
      this.error,
    );
  }

  /**
   * Handle IAS zone status reporting (used for water detection).
   * This method is called whenever a new IAS zone status report is received.
   *
   * @param {number} value - The zone status value, where bits represent different sensor states.
   */
  onZoneStatusReport(value: number) {
    const alarmWater = (value & 1) > 0; // Bit 0 represents water detection
    this.setCapabilityValue('alarm_water', alarmWater).catch(this.error);
  }

  /**
   * onAdded is called when the device is added to the system.
   * This method can be used to perform actions immediately after pairing.
   */
  async onAdded() {
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001wlp01Device has been added`,
    );
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * This method handles changes in device settings, allowing customization.
   *
   * @param {object} event - The event data containing old and new settings.
   * @param {object} event.oldSettings - The old settings object.
   * @param {object} event.newSettings - The new settings object.
   * @param {string[]} event.changedKeys - An array of keys that were changed.
   * @returns {Promise<string|void>} - A custom message that will be displayed, or nothing.
   */
  async onSettings({
    oldSettings,
    newSettings,
    changedKeys,
  }: {
    oldSettings: {
      [key: string]: boolean | string | number | undefined | null;
    };
    newSettings: {
      [key: string]: boolean | string | number | undefined | null;
    };
    changedKeys: string[];
  }): Promise<string | void> {
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001wlp01Device settings were changed`,
    );
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used to synchronize the new name with the device.
   *
   * @param {string} name - The new name given to the device.
   */
  async onRenamed(name: string) {
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001wlp01Device was renamed`,
    );
  }

  /**
   * onDeleted is called when the user deletes the device.
   * This method can be used to perform cleanup actions when the device is removed.
   */
  async onDeleted() {
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001wlp01Device has been deleted`,
    );
  }
}

module.exports = IM6001wlp01Device;
