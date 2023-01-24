import { useState, useEffect } from "react";
import { SwayStoreContractAbi } from "../contracts";
import { ItemOutput } from "../contracts/SwayStoreContractAbi";
import ItemCard from "./ItemCard";

interface AllItemsProps {
  contract: SwayStoreContractAbi | null;
}

export default function AllItems({ contract }: AllItemsProps) {
  const [items, setItems] = useState<ItemOutput[]>([]);
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
    async function getAllItems() {
      if (contract !== null) {
        try {
          let { value } = await contract.functions.get_count().get();
          let formattedValue = parseFloat(value.format()) * 1_000_000_000;
          console.log("COUNT:", formattedValue);
          setItemCount(formattedValue);
          let max = formattedValue + 1;
          let tempItems = [];
          for(let i=1; i < max; i++){
            let resp = await contract.functions.get_item(i).get();
            tempItems.push(resp.value)
          }
          setItems(tempItems)

        } catch (e) {
          console.log("ERROR:", e);
        }
      }
    }
    getAllItems();
  }, [contract]);

  return (
    <div>
      <h2>All Items</h2>

      <div>
        {itemCount === 0 ? (
          <div>Uh oh! No items have been listed yet</div>
        ) : (
          <div>
            <div>Total items: {itemCount}</div>
            <div className="items-container">
                {items.map((item) => (
                <ItemCard key={item.id.format()} contract={contract} item={item}/>
            ))}
            </div>
        </div>
        )}
      </div>
    </div>
  );
}
