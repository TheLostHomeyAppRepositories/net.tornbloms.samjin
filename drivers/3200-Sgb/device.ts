const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER, Cluster, ZCLDataTypes } = require('zigbee-clusters');
const { debug } = require('zigbee-clusters');

if (process.env.DEBUG === '1') {
  debug(true);
}

/**
 * Class representing the Centra Lite Device.
 * This class handles initialization, reporting, and configuration of the sensor's Zigbee capabilities.
 */
class CentraLiteDevice extends ZigBeeDevice {
  /**
   * onInit is called when the device is first initialized.
   * This method is triggered only once, when the device is added to the system.
   */
  async onInit() {
    // Log that the device has been initialized successfully
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - CentraLiteDevice has been initialized`,
    );
  }

  /**
   * onNodeInit is called when the Zigbee node is initialized.
   * This method sets up attribute reporting for various clusters (battery, temperature, and IAS zone).
   *
   * @param {Object} zclNode - The Zigbee Cluster Library (ZCL) node representing this device.
   */
  async onNodeInit({ zclNode }: { zclNode: any }) {
    this.homey.app.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - CentraLite 3200-Sgb device initialized`,
    );

    const { subDeviceId } = this.getData();

    this.printNode();
    this.homey.app.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - Device data: ${subDeviceId}`,
    );

    if (!this.hasCapability('measure_current')) {
      await this.addCapability('measure_current').catch(this.error);
    }

    if (!this.hasCapability('measure_voltage')) {
      await this.addCapability('measure_voltage').catch(this.error);
    }

    if (!this.hasCapability('measure_power')) {
      await this.addCapability('measure_power').catch(this.error);
    }

    // Register capability listeners
    this.registerCapability('onoff', 'genOnOff');
    // meter_power
    this.registerCapability('meter_power', CLUSTER.METERING, {
      reportParser: (value: number) => (value * this.meteringOffset) / 100.0,
      getParser: (value: number) => (value * this.meteringOffset) / 100.0,
      getOpts: {
        getOnStart: true,
        pollInterval: 300000,
      },
    });

    // measure_power
    this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT, {
      reportParser: (value: number) => {
        return (value * this.measureOffset) / 100;
      },
      getOpts: {
        getOnStart: true,
        pollInterval: this.minReportPower,
      },
    });

    this.registerCapability('measure_current', CLUSTER.ELECTRICAL_MEASUREMENT, {
      reportParser: (value: number) => {
        return value / 100;
      },
      getOpts: {
        getOnStart: true,
        pollInterval: this.minReportCurrent,
      },
    });

    this.registerCapability('measure_voltage', CLUSTER.ELECTRICAL_MEASUREMENT, {
      reportParser: (value: number) => {
        return value;
      },
      getOpts: {
        getOnStart: true,
        pollInterval: this.minReportVoltage,
      },
    });
    // Register electrical measurement cluster attributes
    this.registerAttrReportListener(
      'seMetering', // Electrical measurement cluster
      'instantaneousDemand', // Attribute for measuring power
      1, // Min reporting interval
      300, // Max reporting interval
      1, // Minimum change
      this.onPowerReport.bind(this), // Callback function
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register power reporting: ${err}`,
      );
    });

    // Register voltage measurement
    this.registerAttrReportListener(
      'haElectricalMeasurement',
      'rmsVoltage',
      1,
      300,
      1,
      this.onVoltageReport.bind(this),
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register voltage reporting: ${err}`,
      );
    });

    // Register current measurement
    this.registerAttrReportListener(
      'haElectricalMeasurement',
      'rmsCurrent',
      1,
      300,
      1,
      this.onCurrentReport.bind(this),
    ).catch((err: Error) => {
      this.homey.app.log(
        `${this.homey.manifest.id} - ${this.homey.manifest.version} - Failed to register current reporting: ${err}`,
      );
    });

    await zclNode.endpoints[1].clusters.basic
      .readAttributes(
        'manufacturerName',
        'zclVersion',
        'appVersion',
        'modelId',
        'powerSource',
        'attributeReportingStatus',
      )
      .catch((err: Error) => {
        this.error('Error when reading device attributes ', err);
      });
  }
  onPowerReport(value: number) {
    const power = value / 10; // Convert to actual power measurement (depending on the device spec)
    this.setCapabilityValue('measure_power', power).catch(this.error);
  }

  onVoltageReport(value: number) {
    const voltage = value / 100; // Convert to actual voltage
    this.setCapabilityValue('measure_voltage', voltage).catch(this.error);
  }

  onCurrentReport(value: number) {
    const current = value / 1000; // Convert to actual current
    this.setCapabilityValue('measure_current', current).catch(this.error);
  }

  /**
   * onAdded is called when the device is added to the system.
   * This method can be used to perform actions immediately after pairing.
   */
  async onAdded() {
    // Log that the device has been added successfully
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - CentraLiteDevice has been added`,
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
   * onRenamed is called when the user updates the device's name.
   * This method can be used to synchronize the new name with the device.
   *
   * @param {string} name - The new name given to the device.
   */
  async onRenamed(name: string) {
    // Log that the device was renamed
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - CentraLiteDevice was renamed`,
    );
  }

  /**
   * onDeleted is called when the user deletes the device.
   * This method can be used to perform cleanup actions when the device is removed.
   */
  async onDeleted() {
    // Log that the device has been deleted
    const { subDeviceId } = this.getData();
    this.log(
      `${this.homey.manifest.id} - ${this.homey.manifest.version} - CentraLiteDevice: ${subDeviceId}, has been deleted`,
    );
  }
}

module.exports = CentraLiteDevice;
