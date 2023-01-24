import { useIsConnected } from "./hooks/useIsConnected";
import { useFuel } from "./hooks/useFuel";

import "./App.css";

function App() {
  const isConnected = useIsConnected();
  const [Fuel] = useFuel();

  return (
    <div className="App">
      <header>
        <h1>Sway Marketplace</h1>
      </header>

      {isConnected ?
        <div>You are not connected</div>
        :
        <div>Connected!</div>
      }

      {Fuel ?
        <div>Wallet is installed</div>
        :
        <div>You need to install the Fuel Wallet</div>
      }
    </div>
  );
}

export default App;
