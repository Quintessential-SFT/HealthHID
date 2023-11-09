<h1 align="center">HealthHID</h1>
<p align="center">A library for interacting with medical devices over WebHID.</p>
<br />

This library is primarily focused around receiving readings from health-related biometric devices.

### Usage:
Due to WebHID security-related limitations, users need to explicitly grant the page permission to utilize their devices on every single page load.<br />
As such, users of the library need to manually call ask for a device handle via `Device.requestDevice()`.<br />
Upon receiving access, the device will be automatically opened and ready for use.<br />
Individual devices may then utilize said device handle to interact with the hardware device through the relevant device utils.<br />
<br />
Example: `await HealthHid.bpm.cmd.getUserId(device);`<br />
<br />
Due to WebHID being event-based, the library itself is currently also built around events.<br />
Meaning the aforementioned example's promise resolution won't actually return the hw response!<br />
Responses may be piped through an output handler specified via `HealthHid.bpm.setOutputHandler()`.<br />

### Demo Dashboard:
``` bash
npm run serve

# Navigate to http://localhost:8080
```

### Supported Devices:
- Microlife Blood Pressure Monitors (BPA-100-compatible)

### Limitations:
[WebHID is currently only supported on Chromium* desktop browsers.](https://caniuse.com/webhid)

### Acknowledgements
🐍 [joergmlpts/blood-pressure-monitor](https://github.com/joergmlpts/blood-pressure-monitor)
