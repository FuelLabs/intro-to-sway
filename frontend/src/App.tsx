import { useState, useMemo } from "react";
import { useFuel, useIsConnected, useAccount, useWallet } from '@fuel-wallet/react';
import { ContractAbi__factory } from "./contracts"
import AllItems from "./components/AllItems";
import ListItem from "./components/ListItem";
import "./App.css";

const CONTRACT_ID = "0xe924cde59c8b07fe4155f484038cdab8a027e3549eda80022c7c515a4933a594"

function App() {
  const [active, setActive] = useState<'all-items' | 'list-item'>('all-items');
  const fuelObj = useFuel();
  const isConnectedObj = useIsConnected();
  const accountObj = useAccount();
  const walletObj = useWallet({ address: accountObj.account });

  const contract = useMemo(() => {
    if (walletObj.wallet) {
      const contract = ContractAbi__factory.connect(CONTRACT_ID, walletObj.wallet);
      return contract;
    }
    return null;
  }, [walletObj]);

  return (
    <div className="App">
      <header>
        <h1>Sway Marketplace</h1>
      </header>
      <nav>
        <ul>
          <li 
          className={active === 'all-items' ? "active-tab" : ""} 
          onClick={() => setActive('all-items')}
          >
            See All Items
          </li>
          <li 
          className={active === 'list-item' ? "active-tab" : ""} 
          onClick={() => setActive('list-item')}
          >
            List an Item
          </li>
        </ul>
      </nav>

      {fuelObj.fuel ? (
        <div>
          { isConnectedObj.isConnected ? (
            <div>
              {active === 'all-items' && <AllItems contract={contract} />}
              {active === 'list-item' && <ListItem contract={contract} />}
            </div>
          ) : (
            <div>
              <button onClick={() => fuelObj.fuel?.connect()}>
                Connect Wallet
              </button>
          </div>
          )}
        </div>
      ) : (
        <div>
          Download the{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://wallet.fuel.network/"
          >
            Fuel Wallet
          </a>{" "}
          to use the app.
        </div>
      )}
    </div>
  );
}

export default App;