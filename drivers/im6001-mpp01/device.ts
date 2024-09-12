const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { debug, CLUSTER } = require('zigbee-clusters');

if (process.env.DEBUG === '1') {
  debug(true);
}

/**
 * Class representing the IM6001 Samjin Multi Sensor device.
 * This class handles initialization, reporting, and configuration of the sensor's Zigbee capabilities.
 */
class IM6001Device extends ZigBeeDevice {
  /**
   * onInit is called when the device is first initialized.
   * This method is triggered only once, when the device is added to the system.
   */
  async onInit() {
    // Log that the device has been initialized successfully
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001Device has been initialized`,
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
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - Samjin Multi Sensor device initialized`,
    );

    if (process.env.DEBUG === '1') {
      debug(true);
    }
    this.printNode(); // only for debugging purposes

    // Register battery percentage reporting capability
    this.registerCapability(
      'measure_battery',
      CLUSTER.batteryPercentageRemaining,
    );
    this.registerCapability('alarm_contact', CLUSTER.alarm_contact);
    this.registerCapability('alarm_tamper', CLUSTER.alarm_tamper);
    this.registerCapability('measure_temperature', CLUSTER.measure_temperature);
    this.registerCapability('alarm_motio', CLUSTER.alarm_motio);

    // Register attribute listener for battery percentage reporting
    this.registerAttrReportListener(
      'genPowerCfg', // General Power Configuration cluster
      'batteryPercentageRemaining', // Attribute for battery percentage remaining
      60, // Minimum reporting interval (in seconds)
      65534, // Maximum reporting interval (in seconds)
      0, // Minimum change in value to trigger a report
      this.onBatteryPercentageRemainingReport.bind(this), // Callback function to handle reports
      0,
    ).catch((err: Error) => {
      // Log an error if the listener registration fails
      this.homey.app
        .log(`${this.homey.manifest.id} - ${this.homey.manifest.version} - 
        Failed to register attribute report listener for batteryPercentageRemaining: $(err)`);
    });

    // Register attribute listener for temperature measurement reporting
    this.registerAttrReportListener(
      'msTemperatureMeasurement', // Temperature Measurement cluster
      'measuredValue', // Attribute for measured temperature
      300, // Minimum reporting interval (5 minutes)
      1800, // Maximum reporting interval (30 minutes)
      0, // Minimum change in value to trigger a report
      this.onTemperatureReport.bind(this), // Callback function to handle reports
      0,
    ).catch((err: Error) => {
      // Log an error if the listener registration fails
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register attribute report listener for measuredValue: $(err)`,
      );
    });

    // Register attribute listener for IAS zone status (motion/contact sensors)
    this.registerAttrReportListener(
      'ssIasZone', // IAS Zone cluster
      'zoneStatus', // Attribute for zone status (e.g., motion detection)
      1, // Minimum reporting interval (in seconds)
      65534, // Maximum reporting interval (in seconds)
      0, // Minimum change in value to trigger a report
      this.onZoneStatusReport.bind(this), // Callback function to handle reports
      0,
    ).catch((err: Error) => {
      // Log an error if the listener registration fails
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register attribute report listener for zoneStatus: $(err)`,
      );
    });

    // Bind necessary clusters to their corresponding handlers
    await zclNode.bind('genIdentify', 'ota').catch(this.error);
  }

  onEndDeviceAnnounce() {
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - device came online!`,
    );
  }

  /**
   * onAdded is called when the device is added to the system.
   * This method can be used to perform actions immediately after pairing.
   */
  async onAdded() {
    // Log that the device has been added successfully
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001Device has been added`,
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
    // Log that the settings have been changed
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001Device settings were changed`,
    );
  }

  /**
   * Handle battery percentage reporting.
   * This method is called whenever a new battery percentage report is received.
   *
   * @param {number} value - The battery percentage remaining (0-200, where 200 = 100%).
   */
  onBatteryPercentageRemainingReport(value: number) {
    // Convert the reported value to a percentage
    const batteryPercentage = value / 2;

    // Update the device's battery capability with the new value
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
    // Convert the reported value to degrees Celsius
    const temperature = value / 100;

    // Update the device's temperature capability with the new value
    this.setCapabilityValue('measure_temperature', temperature).catch(
      this.error,
    );
  }

  /**
   * Handle IAS zone status reporting (e.g., motion/contact sensors).
   * This method is called whenever a new IAS zone status report is received.
   *
   * @param {number} value - The zone status value, where bits represent different sensors.
   */
  onZoneStatusReport(value: number) {
    // Extract specific bits for different sensors
    const alarmContact = (value & 1) > 0; // Bit 0 represents contact alarm
    const alarmTamper = (value & 4) > 0; // Bit 2 represents tamper alarm
    const alarmMotion = (value & 2) > 0; // Bit 1 typically represents motion detection

    // Update the device's capabilities with the new values
    this.setCapabilityValue('alarm_contact', alarmContact).catch(this.error);
    this.setCapabilityValue('alarm_tamper', alarmTamper).catch(this.error);
    this.setCapabilityValue('alarm_motion', alarmMotion).catch(this.error);
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used to synchronize the new name with the device.
   *
   * @param {string} name - The new name given to the device.
   */
  async onRenamed(name: string) {
    // Log that the device was renamed
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001Device was renamed`,
    );
  }

  /**
   * onDeleted is called when the user deletes the device.
   * This method can be used to perform cleanup actions when the device is removed.
   */
  async onDeleted() {
    // Log that the device has been deleted
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - IM6001Device has been deleted`,
    );
  }
}

module.exports = IM6001Device;
