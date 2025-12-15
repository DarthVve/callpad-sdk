import '@livekit/components-styles';
import EgressHelper from '@livekit/egress-sdk';
import { LiveKitRoom } from '@livekit/components-react';
import { useState } from 'react';

import { CompositeTemplate } from './Room';
import './App.css';
// import { RtcProvider } from 'vg-x07df';

function App() {
  const url = EgressHelper.getLiveKitURL();
  const token = EgressHelper.getAccessToken();
  const [error, setError] = useState<Error>();

  return (
      <div className="container">
        <div className="header">
          <img src="/logo.svg" alt="Logo" />
          <p>Gopaddi</p>
        </div>
        {!url || !token && <div className="error">missing required params url and token</div>}
        <div className="content">
          <LiveKitRoom serverUrl={url} token={token} onError={setError}>
            {error ? <div className="error">{error.message}</div> : <CompositeTemplate />}
          </LiveKitRoom>
        </div>
      </div>
  );
}

export default App;
