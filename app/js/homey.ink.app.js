var CLIENT_ID = '5cbb504da1fc782009f52e46';
var CLIENT_SECRET = 'gvhs0gebgir8vz8yo2l0jfb49u9xzzhrkuo1uvs8';

window.addEventListener('load', function() {
  
  var homey;
  var me;
  
  var $textLarge = document.getElementById('text-large');
  var $textSmall = document.getElementById('text-small');
  var $logo = document.getElementById('logo');
  var $weatherTemperature = document.getElementById('weather-temperature');
  var $weatherState = document.getElementById('weather-state');
  var $flowsInner = document.getElementById('flows-inner');
  var $devicesInner = document.getElementById('devices-inner');
  
  $logo.addEventListener('click', function(){
    window.location.reload();
  });
  
  renderText();
  later.setInterval(function(){
    renderText();
  }, later.parse.text('every 1 hour'));

  var api = new AthomCloudAPI({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
  });
  
  var theme = getQueryVariable('theme');
  var $css = document.createElement('link');
  $css.rel = 'stylesheet';
  $css.type = 'text/css';
  $css.href = './css/themes/' + theme + '.css';
  document.head.appendChild($css);
  
  var token = getQueryVariable('token');
  token = atob(token);
  token = JSON.parse(token);
  api.setToken(token);
  
  api.isLoggedIn().then(function(loggedIn) {
    if(!loggedIn)
      throw new Error('Token Expired. Please log-in again.');
  }).then(function(){
    return api.getAuthenticatedUser();
  }).then(function(user) {
    return user.getFirstHomey();
  }).then(function(homey) {
    return homey.authenticate();
  }).then(function(homey_) {
    homey = homey_;
    
    renderHomey();    
    later.setInterval(function(){
      renderHomey();
    }, later.parse.text('every 1 hour'));
  }).catch(console.error);
  
  function renderHomey() {
    homey.users.getUserMe().then(function(user) {
      me = user;
      me.properties = me.properties || {};
      me.properties.favoriteFlows = me.properties.favoriteFlows || [];
      me.properties.favoriteDevices = me.properties.favoriteDevices || [];
      
      homey.weather.getWeather().then(function(weather) {
        return renderWeather(weather);
      }).catch(console.error);
      
      homey.flow.getFlows().then(function(flows) {
        var favoriteFlows = me.properties.favoriteFlows.map(function(flowId){
          return flows[flowId];
        }).filter(function(flow){
          return !!flow;
        });
        return renderFlows(favoriteFlows);        
      }).catch(console.error);
      
      homey.devices.getDevices().then(function(devices) {
        var favoriteDevices = me.properties.favoriteDevices.map(function(deviceId){
          return devices[deviceId];
        }).filter(function(device){
          return !!device;
        }).filter(function(device){
          if(!device.ui) return false;
          if(!device.ui.quickAction) return false;
          return true;
        });
        
        favoriteDevices.forEach(function(device){
          device.makeCapabilityInstance(device.ui.quickAction, function(value){
            var $device = document.getElementById('device-' + device.id);
            if( $device ) {
              $device.classList.toggle('on', !!value);
            }
          });
        });
        
        return renderDevices(favoriteDevices);
      }).catch(console.error);
    }).catch(console.error);
  }
  
  function renderWeather(weather) {
    $weatherTemperature.innerHTML = Math.round(weather.temperature);
    $weatherState.innerHTML = weather.state;
  }
  
  function renderFlows(flows) {
    $flowsInner.innerHTML = '';
    flows.forEach(function(flow) {
      var $flow = document.createElement('div');
      $flow.id = 'flow-' + flow.id;
      $flow.classList.add('flow');
      $flow.addEventListener('click', function(){        
        if( $flow.classList.contains('running') ) return;
        homey.flow.triggerFlow({
          id: flow.id,
        }).then(function(){          
          
          $flow.classList.add('running');                
          setTimeout(function(){
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
      $name.innerHTML = flow.name;
      $flow.appendChild($name);
    });
  }
  
  function renderDevices(devices) {
    $devicesInner.innerHTML = '';
    devices.forEach(function(device) {
      var $device = document.createElement('div');
      $device.id = 'device-' + device.id;
      $device.classList.add('device');
      $device.classList.toggle('on', device.capabilitiesObj && device.capabilitiesObj[device.ui.quickAction] && device.capabilitiesObj[device.ui.quickAction].value === true);
      $device.addEventListener('click', function(){
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
      $icon.style.webkitMaskImage = 'url(https://icons-cdn.athom.com/' + device.iconObj.id + '-128.png)';
      $device.appendChild($icon);
      
      var $name = document.createElement('div');
      $name.classList.add('name');
      $name.innerHTML = device.name;
      $device.appendChild($name);
    });
  }
  
  function renderText() {
    var now = new Date();
    var hours = now.getHours();
    
    var tod;
    if( hours >= 18 ) {
      tod = 'evening';
    } else if( hours >= 12 ) {
      tod = 'afternoon';
    } else if( hours >= 6 ) {
      tod = 'morning';
    } else {
      tod = 'night';
    }
    
    $textLarge.innerHTML = 'Good ' + tod + '!';
    $textSmall.innerHTML = 'Today is ' + moment(now).format('dddd[, the ]Do[ of ]MMMM YYYY[.]');
  }
  
});