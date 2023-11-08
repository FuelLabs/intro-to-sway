/* ANCHOR: fe_app_all */
// ANCHOR: fe_app_template
import { useState, useMemo } from "react";
// ANCHOR: fe_import_hooks
import { useFuel, useIsConnected, useAccount, useWallet } from '@fuel-wallet/react';
// ANCHOR_END: fe_import_hooks
import { ContractAbi__factory } from "./contracts"
import AllItems from "./components/AllItems";
import ListItem from "./components/ListItem";
import "./App.css";

// ANCHOR: fe_contract_id
const CONTRACT_ID = "0xfece81e27ec47a789d84f5c6f72278dece588e8ff652f65332ea5037539e1c9e"
// ANCHOR_END: fe_contract_id

function App() {
// ANCHOR_END: fe_app_template
  // ANCHOR: fe_state_active
  const [active, setActive] = useState<'all-items' | 'list-item'>('all-items');
  // ANCHOR_END: fe_state_active
  // ANCHOR: fe_call_hooks
  const fuelObj = useFuel();
  const isConnectedObj = useIsConnected();
  const accountObj = useAccount();
  // ANCHOR: fe_wallet
  const walletObj = useWallet({ address: accountObj.account });
  // ANCHOR_END: fe_wallet
  // ANCHOR_END: fe_call_hooks
  
  // ANCHOR: fe_use_memo
  const contract = useMemo(() => {
    if (walletObj.wallet) {
      const contract = ContractAbi__factory.connect(CONTRACT_ID, walletObj.wallet);
      return contract;
    }
    return null;
  }, [walletObj]);
  // ANCHOR_END: fe_use_memo

  return (
    <div className="App">
      <header>
        <h1>Sway Marketplace</h1>
      </header>
      {/* ANCHOR: fe_ui_state_active */}
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
      {/* ANCHOR: fe_ui_state_active */}
      {/* ANCHOR: fe_fuel_obj */}
      {fuelObj.fuel ? (
        <div>
          { isConnectedObj.isConnected ? (
            <div>
              {/* ANCHOR: fe_items_contract */}
              {/* ANCHOR: fe_all_items_contract */}
              {active === 'all-items' && <AllItems contract={contract} />}
              {/* ANCHOR_END: fe_all_items_contract */}
              {active === 'list-item' && <ListItem contract={contract} />}
              {/* ANCHOR_END: fe_items_contract */}
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
      {/* ANCHOR_END: fe_fuel_obj */}
    </div>
  );
}

export default App;
/* ANCHOR_END: fe_app_all */
