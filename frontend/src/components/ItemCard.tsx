import { useState } from "react";
import { ItemOutput } from "../contracts/ContractAbi";
import { ContractAbi } from "../contracts";

interface ItemCardProps {
  contract: ContractAbi | null;
  item: ItemOutput;
}

const assetId = "0x0000000000000000000000000000000000000000000000000000000000000000"

export default function ItemCard({ item, contract }: ItemCardProps) {
  const [status, setStatus] = useState<'success' | 'error' | 'loading' | 'none'>('none');

  async function handleBuyItem() {
    if (contract !== null) {
      setStatus('loading')
      try {
        await contract.functions.buy_item(item.id)
        .txParams({ variableOutputs: 1 })
        .callParams({
            forward: [item.price, assetId],
          })
        .call()
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
      <div>Price: {parseFloat(item.price.format())} ETH</div>
      <div>Total Bought: {parseFloat(item.total_bought.format()) * 1_000_000_000}</div>
      {status === 'success' && <div>Purchased ✅</div>}
      {status === 'error' && <div>Something went wrong ❌</div>}
      {status === 'none' &&  <button onClick={handleBuyItem}>Buy Item</button>}
      {status === 'loading' && <div>Buying item..</div>}
    
    </div>
  );
}
