const fs = require('fs-extra');
const tempfile = require('tempfile');
const argparse = require('../../utils/argparse');
const log = require('../../utils/logger').child({ __filename });
const WholeTestRecorderPlugin = require('../templates/plugin/WholeTestRecorderPlugin');
const SimulatorInstrumentsRecording = require('./SimulatorInstrumentsRecording');

class SimulatorInstrumentsPlugin extends WholeTestRecorderPlugin {
  constructor(config) {
    super(config);

    const recordPerformance = argparse.getArgValue('record-performance');

    this.client = config.client;
    this.shouldRecord = recordPerformance !== 'none'
      ? Boolean(recordPerformance)
      : false;
    this.enabled = this.shouldRecord;
  }

  async onBeforeTerminateApp(event) {
    await super.onBeforeTerminateApp(event);
    await this._stopRecordingIfExists();
  }

  async onBeforeShutdownDevice(event) {
    await super.onBeforeShutdownDevice(event);
    await this._stopRecordingIfExists();
  }

  async _stopRecordingIfExists() {
    if (this.testRecording) {
      await this.testRecording.stop();
    }
  }

  async onBeforeLaunchApp(event) {
    await super.onBeforeLaunchApp(event);

    if (this.shouldRecord) {
      const instrumentsPath = event.launchArgs['-instrumentsPath'];
      await this._assertDetoxInstrumentsInstalled(instrumentsPath);
    }

    if (this.testRecording && this.enabled) {
      event.launchArgs['-recordingPath'] = this.testRecording.temporaryRecordingPath;
    }
  }

  async _assertDetoxInstrumentsInstalled(instrumentsPath = SimulatorInstrumentsPlugin.DEFAULT_INSTRUMENTS_PATH) {
    if (await fs.exists(instrumentsPath)) {
      this.enabled = this.shouldRecord;
    } else {
      this.enabled = false;

      log.warn({ event: 'INSTRUMENTS_NOT_FOUND' },
        `Failed to find Detox Instruments app at path: ${instrumentsPath}\n` +
        `To enable recording performance profiles, please follow: https://github.com/wix/DetoxInstruments#installation`);
    }
  }

  async onLaunchApp(event) {
    await super.onLaunchApp(event);

    if (this.testRecording && this.enabled) {
      // doing a nominal start, without doing anything useful
      // to preserve correct recording state
      await this.testRecording.start({ dry: true });
    }
  }

  createTestRecording() {
    return new SimulatorInstrumentsRecording({
      client: this.client,
      temporaryRecordingPath: tempfile('.dtxrec'),
    });
  }

  async preparePathForTestArtifact(testSummary) {
    return this.api.preparePathForArtifact('test.dtxrec', testSummary);
  }
}

SimulatorInstrumentsPlugin.DEFAULT_INSTRUMENTS_PATH = '/Applications/Detox Instruments.app';

module.exports = SimulatorInstrumentsPlugin;
