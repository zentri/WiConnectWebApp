# ACKme WiConnect WebApp

## Installation

The WiConnect WebApp uses the following development tools:

* [Node.js](http://nodejs.org)
* [Grunt](http://gruntjs.com)
* [Bower](http://bower.io)

To develop, build or run the WebGUI on your local machine, these will need to be installed. Instructions for installation of these tools:

* [Windows](docs/windows-install.md)
* [Linux](docs/linux-install.md)

After pulling the repo, run the following commands in a terminal to download and install required packages:
```
bower install
npm install
```

## Development Testing

To sucessfully communicate with a remote device, the WiConnect variable `http.server.cors_origin` needs to be set as described by the [WiConnectJS documentation](https://github.com/ackme/WiConnectJS).

If a grunt task fails to run and an error about missing packages is displayed, you may need to run `npm install` to install any missing packages.

```
grunt
```

Will run a local nodejs server on port 5002 (by default - see Development Options) for testing.

```
grunt watch
```

Will start a task that listens for file changes, and compile/compress HTML, CSS and JS

### Development Options

#### Config.json

Edit `config.json` to specify:
  - `localDevelopmentIP`: address (e.g. `12.34.56.789`) of running the local development server. *Note: `grunt deploy` will silently fail if this address is not configured correctly*
  - `localDevelopmentPort`: port for local development server (the default grunt server runs on 5002).
  - `deviceAddress`: address (e.g. `12.34.56.789` or `device.local`) of the device to communicate with.

The WiConnect WebApp has been primarily developed using [Jade templating](http://jade-lang.com/) and [LESS CSS pre-processing language](http://lesscss.org/)

#### `no-jade`

If you are unfamiliar with Jade and wish to write traditional HTML run the following grunt task:

```
runt no-jade
```

This will create the files `public/html/index.html` and `public/html/unauthorized.html` for development.

_Note: Running this grunt task again will overwrite any changes made to `index.html` and `unauthorized.html`_

#### `no-less`

If you are unfamiliar with LESS and wish to write traditional CSS run the following grunt task:

```
grunt no-less
```

This will create the file `public/css/wiconnect.css` for development.

_Note: Running this grunt task again will overwrite any changes made to `wiconnect.css`_


## Build / Compile

```
grunt build
```

Compiled and compressed JS, CSS and HTML files will be exported to `/out`

Version, git hash, and build date information are automatically built into the complied JS as an object named `_webgui` for debugging purposes. To view the version/hash/build-date for reporting a bug, open the developer console in your browser, and type `_webgui` and press enter to view the current webgui version/hash/build-date information.

If the files `public/html/index.html` and `public/html/unauthorized.html` exist, they will be used in the build process, and the changes to the jade files will be ignored.

If the file `public/css/wiconnect.css` exists, it will be used in the build process, and the changes to the less files will be ignored.

## Deploy

````
grunt deploy
````

Put webapp files onto the device specified in `config.json` by `deviceAddress`. This requires the default `grunt` task to already be running in another terminal and accessible at the address specified by `localDevelopmentIP` in the config file.

## Release

```
grunt release:[type]
```

Release an official major|minor|patch verion.
When the task is run, the project version is updated and the release will be committed and tagged with the appropriate version, and all files packaged into `/out/release/Release-[version].zip`

Appropriate uses of the release task:
```
grunt release:major
grunt release:minor
grunt release:patch
```

## Licence

WiConnect Web App, WiConnect JS API Library & WiConnect JS Build System

Copyright (C) 2015, Sensors.com, Inc.
All Rights Reserved.

The WiConnect Web App, WiConnect JavaScript API and WiConnect JS build system
are provided free of charge by Sensors.com. The combined source code, and
all derivatives, are licensed by Sensors.com SOLELY for use with devices
manufactured by ACKme Networks, or devices approved by Sensors.com.

Use of this software on any other devices or hardware platforms is strictly
prohibited.

THIS SOFTWARE IS PROVIDED BY THE AUTHOR AS IS AND ANY EXPRESS OR IMPLIED
WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
OF SUCH DAMAGE.
