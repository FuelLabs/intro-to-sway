/* ANCHOR: fe_app_all */
// ANCHOR: fe_app_template
import { useState, useMemo } from "react";
// ANCHOR: fe_import_hooks
import { useConnectUI, useIsConnected, useWallet } from "@fuels/react";
// ANCHOR_END: fe_import_hooks
import { SwayStore } from "./sway-store-api";
import AllItems from "./components/AllItems";
import ListItem from "./components/ListItem";
import "./App.css";

// ANCHOR: fe_contract_id
const CONTRACT_ID =
  "0x797d208d0104131c2ab1f1e09c4914c7aef5b699fb494be864a5c37057076921";
// ANCHOR_END: fe_contract_id

function App() {
  // ANCHOR_END: fe_app_template
  // ANCHOR: fe_state_active
  const [active, setActive] = useState<"all-items" | "list-item">("all-items");
  // ANCHOR_END: fe_state_active
  // ANCHOR: fe_call_hooks
  const { isConnected } = useIsConnected();
  const { connect, isConnecting } = useConnectUI();
  // ANCHOR: fe_wallet
  const { wallet } = useWallet();
  // ANCHOR_END: fe_wallet
  // ANCHOR_END: fe_call_hooks

  // ANCHOR: fe_use_memo
  const contract = useMemo(() => {
    if (wallet) {
      const contract = new SwayStore(CONTRACT_ID, wallet)
      return contract;
    }
    return null;
  }, [wallet]);
  // ANCHOR_END: fe_use_memo

  return (
    <div className="App">
      <header>
        <h1>Sway Marketplace</h1>
      </header>
      {/* // ANCHOR: fe_ui_state_active */}
      <nav>
        <ul>
          <li
            className={active === "all-items" ? "active-tab" : ""}
            onClick={() => setActive("all-items")}
          >
            See All Items
          </li>
          <li
            className={active === "list-item" ? "active-tab" : ""}
            onClick={() => setActive("list-item")}
          >
            List an Item
          </li>
        </ul>
      </nav>
      {/* // ANCHOR: fe_ui_state_active */}
      {/* // ANCHOR: fe_fuel_obj */}
      <div>
        {isConnected ? (
          <div>
            {active === "all-items" && <AllItems contract={contract} />}
            {active === "list-item" && <ListItem contract={contract} />}
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                connect();
              }}
            >
              {isConnecting ? "Connecting" : "Connect"}
            </button>
          </div>
        )}
      </div>
      {/* // ANCHOR_END: fe_fuel_obj */}
    </div>
  );
}

export default App;
/* ANCHOR_END: fe_app_all */
