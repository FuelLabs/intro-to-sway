import { useState, useEffect } from "react";
import { SwayStoreContractAbi } from "../contracts";

interface AllItemsProps {
  contract: SwayStoreContractAbi | null;
}

export default function AllItems({ contract }: AllItemsProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [projectCount, setProjectCount] = useState<number>(0);

  useEffect(() => {
    async function getAllItems() {
      if (contract !== null) {
        try {
          let { value } = await contract.functions.get_count().get();
          let formattedValue = parseFloat(value.format()) * 1_000_000_000;
          console.log("COUNT:", formattedValue);
          setProjectCount(formattedValue);
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
        {projectCount === 0 ? (
          <div>Uh oh! No projects have been listed yet</div>
        ) : (
          <div>Total Projects: {projectCount}</div>
        )}
      </div>
    </div>
  );
}
