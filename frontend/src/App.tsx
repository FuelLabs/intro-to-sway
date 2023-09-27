import { useState, useEffect, useMemo } from "react";
import { Fuel } from '@fuel-wallet/sdk';
import { WalletLocked } from "fuels";
import { ContractAbi__factory } from "./contracts"
import AllItems from "./components/AllItems";
import ListItem from "./components/ListItem";
import "./App.css";

const CONTRACT_ID = "0xe924cde59c8b07fe4155f484038cdab8a027e3549eda80022c7c515a4933a594"

function App() {
  const [wallet, setWallet] = useState<WalletLocked>();
  const [active, setActive] = useState<'all-items' | 'list-item'>('all-items');
  const [isConnected, setIsConnected] = useState(false);
  const fuel = useMemo(() => new Fuel(), []);

  useEffect(() => {
    async function getAccounts() {
      const currentAccount = await fuel.currentAccount();
      const tempWallet = await fuel.getWallet(currentAccount)
      setWallet(tempWallet)

      const connected = await fuel.isConnected()
      setIsConnected(connected);
    }
    if (fuel) getAccounts();
  }, [fuel]);

  const contract = useMemo(() => {
    if (fuel && wallet) {
      const contract = ContractAbi__factory.connect(CONTRACT_ID, wallet);
      return contract;
    }
    return null;
  }, [fuel, wallet]);

  return (
    <div className="App">
      <header>
        <h1>Sway Marketplace</h1>
      </header>
      <nav>
        <ul>
          <li className={active === 'all-items' ? "active-tab" : ""} onClick={() => setActive('all-items')}>See All Items</li>
          <li className={active === 'list-item' ? "active-tab" : ""} onClick={() => setActive('list-item')}>List an Item</li>
        </ul>
      </nav>

      {fuel ? (
        <div>
          { isConnected ? (
            <div>
              {active === 'all-items' && <AllItems contract={contract} />}
              {active === 'list-item' && <ListItem contract={contract} />}
            </div>
          ) : (
            <div>
              <button onClick={() => fuel.connect()}>Connect Wallet</button>
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