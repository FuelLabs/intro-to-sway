import { useState, useEffect } from "react";
import { useFuel } from "../hooks/useFuel";

export function ConnectButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [Fuel] = useFuel();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div>
      {Fuel && isMounted && (
        <button onClick={() => Fuel.connect()}>
          Connect Wallet
        </button>
      )}
      {!Fuel && isMounted && (
        <div>
          {" "}
          Download the{" "}
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://fuels-wallet.vercel.app/"
          >
            Fuel Wallet
          </a>{" "}
          to use the app.
        </div>
      )}
    </div>
  );
}