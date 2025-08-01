import ReceiveButton from "./receive-button";
import { EthAddress } from "./eth-address";
import { Balance } from "./balance";
import Logout from "./logout";
import { IcpAddress } from "./icp-address";

export default function Wallet() {
  return (
    <section className="shadow-sm rounded-lg px-4 py-3">
      {/* Layout utama diubah menjadi flex-col untuk mobile */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        {/* Logout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <Logout />
          </div>

          {/* Container*/}
          <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white min-w-[35px]">ETH:</span>
              <EthAddress />
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium text-white min-w-[35px]">ICP:</span>
              <IcpAddress />
            </div>
          </div>
        </div>

        {/*Balance*/}
        <div className="flex items-center justify-end gap-2 w-full md:w-auto">
          <Balance />
          <ReceiveButton />
        </div>
      </div>
    </section>
  );
}