const CLIENT_ID = '5cbb504da1fc782009f52e46';
const CLIENT_SECRET = 'gvhs0gebgir8vz8yo2l0jfb49u9xzzhrkuo1uvs8';
const REDIRECT_URL = `${window.location.protocol}//${window.location.host}/login.html`;

window.addEventListener('load', () => {
  
  let homepage;
  let config;

  const api = new AthomCloudAPI({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUrl: REDIRECT_URL,
  });
  
  const $setup = document.getElementById('setup');
  
  const $setupStepLogin = $setup.querySelector('.setup-step-login');
  const $setupStepLoginButton = $setupStepLogin.querySelector('.setup-step-button');
  
  const $setupStepUpload = $setup.querySelector('.setup-step-upload');
  const $setupStepUploadButton = $setupStepUpload.querySelector('.setup-step-button');
  const $setupStepUploadFile = $setupStepUpload.querySelector('#setup-step-upload-file');
  
  const $setupStepDownload = $setup.querySelector('.setup-step-download');
  const $setupStepDownloadButton = $setupStepDownload.querySelector('.setup-step-button');
  
  $setupStepLoginButton.addEventListener('click', () => {
    const url = api.getLoginUrl();
    const popup = window.open(url, 'login', 'width=500,height=800');
    
    window.addEventListener('message', message => {
      const { code } = message.data;
      if(!code) return alert('Something went wrong.');
      
      api.authenticateWithAuthorizationCode(code).then(token => {
        token = JSON.stringify(token);
        token = btoa(token);
        
        const url = new URL('https://app.homey.ink');
        url.searchParams.append('theme', 'kobo-h2o');
        url.searchParams.append('token', token);
        
        homepage = url.toString();
        console.log('URL:', homepage);
        
        $setupStepLogin.classList.add('completed');
        $setupStepUpload.classList.remove('disabled');
      }).catch(err => {
        alert(err.message || err.toString());
      });
    })
  });
  
  $setupStepUploadFile.addEventListener('change', e => {
    const [ file ] = e.target.files;
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = e => {
      config = window.ini.parse(e.target.result);
      
      config.Browser = config.Browser || {};
      config.Browser.homePage = homepage;      
      
      config.FeatureSettings = config.FeatureSettings || {};
      config.FeatureSettings.FullScreenBrowser = true;
      
      $setupStepUpload.classList.add('completed');
      $setupStepDownload.classList.remove('disabled');      
    }
    reader.onerror = err => {
      alert(err.message || err.toString());
    }
  });
  
  
  $setupStepDownloadButton.addEventListener('click', () => {
    const file = ini.stringify(config);
    downloadFile(file, 'Kobo eReader.conf');
    $setupStepDownload.classList.add('completed');
  });
  
});