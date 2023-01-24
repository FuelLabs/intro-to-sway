import { useState, useEffect, useMemo } from "react";
import { useIsConnected } from "./hooks/useIsConnected";
import { useFuel } from "./hooks/useFuel";
import { WalletLocked } from "fuels";
import { FuelWalletProvider } from "@fuel-wallet/sdk";
import { SwayStoreContractAbi__factory } from "./contracts"
import AllItems from "./components/AllItems";
import ListItem from "./components/ListItem";
import "./App.css";

const CONTRACT_ID = "0xd715df667608312fe9f2e57f8e92d2dd0f5e23db94d8a27f63c3c5c74c01da77"

function App() {
  const [accounts, setAccounts] = useState<Array<string>>([]);
  const [provider, setProvider] = useState<FuelWalletProvider>();
  const [active, setActive] = useState<'all-items' | 'list-item'>('all-items');
  const isConnected = useIsConnected();
  const [Fuel] = useFuel();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await Fuel.accounts();
      const prov = await Fuel.getProvider();
      setAccounts(accounts);
      setProvider(prov);
    }
    if (Fuel) getAccounts();
  }, [Fuel]);

  const contract = useMemo(() => {
    if (Fuel && accounts[0] && provider) {
      const wallet = new WalletLocked(accounts[0], provider);
      // Connects out Contract instance to the deployed contract
      // address using the given wallet.
      const contract = SwayStoreContractAbi__factory.connect(CONTRACT_ID, wallet);

      return contract;
    }
    return null;
  }, [Fuel, accounts, provider]);

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

      {Fuel ? (
        <div>
          {isConnected ? (
            <div>
              {active === 'all-items' && <AllItems contract={contract} />}
              {active === 'list-item' && <ListItem contract={contract} />}
            </div>
          ) : (
            <div>
              <button onClick={() => Fuel.connect()}>Connect Wallet</button>
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
