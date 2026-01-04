var CLIENT_ID = '5cbb504da1fc782009f52e46';
var CLIENT_SECRET = 'gvhs0gebgir8vz8yo2l0jfb49u9xzzhrkuo1uvs8';

var flowCache = {};
var advancedFlowCache = {};
var deviceCache = {};

window.addEventListener('load', function () {
  try {
    var homey;
    var me;

    var $textLarge = document.getElementById('text-large');
    var $textSmall = document.getElementById('text-small');
    var $logo = document.getElementById('logo');
    var $weatherTemperature = document.getElementById('weather-temperature');
    var $weatherState = document.getElementById('weather-state');
    var $flowsInner = document.getElementById('flows-inner');
    var $devicesInner = document.getElementById('devices-inner');

    $logo.addEventListener('click', function () {
      window.location.reload();
    });

    renderText();
    later.setInterval(function () {
      renderText();
    }, later.parse.text('every 1 hour'));

    var theme = getQueryVariable('theme');
    if (!theme) {
      theme = 'web';
    }
    var $css = document.createElement('link');
    $css.rel = 'stylesheet';
    $css.type = 'text/css';
    $css.href = './css/themes/' + theme + '.css';
    document.head.appendChild($css);

    var token = getQueryVariable('token');
    if (!token) {
      throw new Error('Missing ?token=... ');
    }

    token = atob(token);
    token = JSON.parse(token);
    var tokenInstance = new AthomCloudAPI.Token({
      access_token: token.access_token,
      token_type: 'bearer',
      refresh_token: token.refresh_token,
      expires_in: token.expires_in,
    });
    var api = new AthomCloudAPI({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      token: tokenInstance,
    });

    api.isLoggedIn().then(function (loggedIn) {
      if (!loggedIn)
        throw new Error('Token Expired. Please log-in again.');
    }).then(function () {
      return api.getAuthenticatedUser();
    }).then(function (user) {
      return user.getFirstHomey();
    }).then(function (homey) {
      return homey.authenticate();
    }).then(function (homey_) {
      homey = homey_;

      renderHomey();
      setupRealtime();
      later.setInterval(function () {
        renderHomey();
      }, later.parse.text('every 1 hour'));
    }).catch(function (err) {
      console.error(err);
      document.head.innerHTML = '';
      document.body.innerHTML = '';
      var $pre = document.createElement('pre');
      $pre.innerText = 'Error: ' + err.message + '\n' + err.stack;
      document.body.appendChild($pre);
    });

    function renderHomey() {
      homey.users.getUserMe().then(function (user) {
        me = user;
        me.properties = me.properties || {};
        me.properties.favoriteFlows = me.properties.favoriteFlows || [];
        me.properties.favoriteDevices = me.properties.favoriteDevices || [];

        homey.weather.getWeather().then(function (weather) {
          return renderWeather(weather);
        }).catch(console.error);

        homey.flow.getFlows().then(function (flows) {
          flowCache = flows;
          return homey.flow.getAdvancedFlows()
            .catch(function () { return {} })
            .then(function (advancedFlows) {
              advancedFlowCache = advancedFlows;
              var favoriteFlows = me.properties.favoriteFlows.map(function (flowId) {
                return flows[flowId] || advancedFlows[flowId];
              }).filter(function (flow) {
                return !!flow;
              });
              return renderFlows(favoriteFlows);
            })
        }).catch(console.error);

        homey.devices.getDevices().then(function (devices) {
          deviceCache = devices;
          var favoriteDevices = me.properties.favoriteDevices.map(function (deviceId) {
            return devices[deviceId];
          }).filter(function (device) {
            return !!device;
          }).filter(function (device) {
            if (!device.ui) return false;
            if (!device.ui.quickAction) return false;
            return true;
          });

          favoriteDevices.forEach(function (device) {
            device.makeCapabilityInstance(device.ui.quickAction, function (value) {
              var $device = document.getElementById('device-' + device.id);
              if ($device) {
                $device.classList.toggle('on', !!value);
              }
            });
          });

          return renderDevices(favoriteDevices);
        }).catch(console.error);
      }).catch(console.error);
    }

    function renderWeather(weather) {
      $weatherTemperature.innerText = Math.round(weather.temperature);
      $weatherState.innerText = weather.state;
    }

    function renderFlows(flows) {
      $flowsInner.innerHTML = '';
      flows.forEach(function (flow) {
        if (!flow.triggerable) return;
        var $flow = document.createElement('div');
        $flow.id = 'flow-' + flow.id;
        $flow.classList.add('flow');
        $flow.addEventListener('click', function () {
          if ($flow.classList.contains('running')) return;

          homey.flow[flow.cards ? 'triggerAdvancedFlow' : 'triggerFlow']({
            id: flow.id,
          }).then(function () {

            $flow.classList.add('running');
            setTimeout(function () {
              $flow.classList.remove('running');
            }, 3000);
          }).catch(console.error);
        });
        $flowsInner.appendChild($flow);

        var $play = document.createElement('div');
        $play.classList.add('play');
        $flow.appendChild($play);

        var $name = document.createElement('div');
        $name.classList.add('name');
        $name.innerText = flow.name;
        $flow.appendChild($name);
      });
    }

    function renderDevices(devices) {
      $devicesInner.innerHTML = '';
      devices.forEach(function (device) {
        var $device = document.createElement('div');
        $device.id = 'device-' + device.id;
        $device.classList.add('device');
        $device.classList.toggle('on', device.capabilitiesObj && device.capabilitiesObj[device.ui.quickAction] && device.capabilitiesObj[device.ui.quickAction].value === true);
        $device.addEventListener('click', function () {
          var value = !$device.classList.contains('on');
          $device.classList.toggle('on', value);
          homey.devices.setCapabilityValue({
            deviceId: device.id,
            capabilityId: device.ui.quickAction,
            value: value,
          }).catch(console.error);
        });
        $devicesInner.appendChild($device);

        var $icon = document.createElement('div');
        $icon.classList.add('icon');
        $icon.style.webkitMaskImage = device.iconOverride
          ? 'url(./img/devices/' + device.iconOverride + '-128.png)'
          : 'url(https://icons-cdn.athom.com/' + device.iconObj.id + '-128.png)';
        $device.appendChild($icon);

        var $name = document.createElement('div');
        $name.classList.add('name');
        $name.innerText = device.name;
        $device.appendChild($name);
      });
    }

    function renderText() {
      var now = new Date();
      var hours = now.getHours();

      var tod;
      if (hours >= 18) {
        tod = 'evening';
      } else if (hours >= 12) {
        tod = 'afternoon';
      } else if (hours >= 6) {
        tod = 'morning';
      } else {
        tod = 'night';
      }

      $textLarge.innerText = 'Good ' + tod + '!';
      $textSmall.innerText = 'Today is ' + moment(now).format('dddd[, the ]Do[ of ]MMMM YYYY[.]');
    }

    async function setupRealtime() {
      await homey.devices.connect();
      homey.devices.on('device.create', function (deviceData) {
        deviceCache[deviceData.id] = deviceData;
      });
      homey.devices.on('device.update', function (deviceData) {
        deviceCache[deviceData.id] = Object.assign({}, deviceCache[deviceData.id] || {}, deviceData);
        var $device = document.getElementById('device-' + deviceData.id);
        if ($device && deviceData.name !== $device.innerText) {
          $device.querySelector('.name').innerText = deviceData.name;
        }
      });
      homey.devices.on('device.delete', function (deviceData) {
        delete deviceCache[deviceData.id];
        var $device = document.getElementById('device-' + deviceData.id);
        if ($device) {
          $device.remove();
        }
      });
      await homey.flow.connect();
      homey.flow.on('flow.update', function (flowData) {
        flowCache[flowData.id] = Object.assign({}, flowCache[flowData.id] || {}, flowData);
        var $flow = document.getElementById('flow-' + flowData.id);
        if ($flow && flowData.name !== $flow.innerText) {
          $flow.querySelector('.name').innerText = flowData.name;
        }
        if ($flow && flowData.triggerable === false) {
          $flow.remove();
        }
      });
      homey.flow.on('flow.delete', function (flowData) {
        delete flowCache[flowData.id];
        var $flow = document.getElementById('flow-' + flowData.id);
        if ($flow) {
          $flow.remove();
        }
      });
      homey.flow.on('flow.create', function (flowData) {
        flowCache[flowData.id] = flowData;
      });
      homey.flow.on('advancedflow.update', function (flowData) {
        advancedFlowCache[flowData.id] = Object.assign({}, advancedFlowCache[flowData.id] || {}, flowData);
        var $flow = document.getElementById('flow-' + flowData.id);
        if ($flow && flowData.name !== $flow.innerText) {
          $flow.querySelector('.name').innerText = flowData.name;
        }
        if ($flow && flowData.triggerable === false) {
          $flow.remove();
        }
      });
      homey.flow.on('advancedflow.delete', function (flowData) {
        delete advancedFlowCache[flowData.id];
        var $flow = document.getElementById('flow-' + flowData.id);
        if ($flow) {
          $flow.remove();
        }
      });
      homey.flow.on('advancedflow.create', function (flowData) {
        advancedFlowCache[flowData.id] = flowData;
      });
      await homey.users.connect();
      homey.users.on('user.update', function (userData) {
        if (userData.id !== me.id || !userData.properties) return;
        if (userData.properties.favoriteDevices) {
          var favoriteDevices = userData.properties.favoriteDevices.map(function (deviceId) {
            return deviceCache[deviceId];
          }).filter(function (device) {
            return !!device;
          }).filter(function (device) {
            if (!device.ui) return false;
            if (!device.ui.quickAction) return false;
            return true;
          });
          renderDevices(favoriteDevices);
        }
        if (userData.properties.favoriteFlows) {
          var favoriteFlows = userData.properties.favoriteFlows.map(function (flowId) {
            return flowCache[flowId] || advancedFlowCache[flowId];
          }).filter(function (flow) {
            return !!flow;
          });
          renderFlows(favoriteFlows);
        }
      });
    }
  } catch (err) {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    var $pre = document.createElement('pre');
    $pre.innerText = 'Error: ' + err.message + '\n' + err.stack;
    document.body.appendChild($pre);
    console.error(err);
  }
});