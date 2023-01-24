import { useState } from "react";
import { ItemOutput } from "../contracts/SwayStoreContractAbi";
import { SwayStoreContractAbi } from "../contracts";

interface ItemCardProps {
  contract: SwayStoreContractAbi | null;
  item: ItemOutput;
}

const assetId = "0x0000000000000000000000000000000000000000000000000000000000000000"

export default function ItemCard({ item, contract }: ItemCardProps) {
  const [status, setStatus] = useState<"success" | "error" | "none">("none");

  async function handleBuyItem() {
    if (contract !== null) {
      try {
        let resp = await contract.functions.buy_item(item.id)
        .txParams({ variableOutputs: 1 })
        .callParams({
            forward: [item.price, assetId],
          })
        .call()
        console.log("RESPONSE:", resp);
        setStatus("success");
      } catch (e) {
        console.log("ERROR:", e);
      }
    }
  }

  return (
    <div className="item-card">
      <div>Id: {parseFloat(item.id.format()) * 1_000_000_000}</div>
      <div>Metadata: {item.metadata}</div>
      <div>Price: {parseFloat(item.price.format())}</div>
      <div>Total Bought: {parseFloat(item.total_bought.format()) * 1_000_000_000}</div>
      {status === 'success' && <div>Purchased ✅</div>}
      {status === 'error' && <div>Something went wrong ❌</div>}
      {status === 'none' &&  <button onClick={handleBuyItem}>Buy Item</button>}
      
     
    
    </div>
  );
}
