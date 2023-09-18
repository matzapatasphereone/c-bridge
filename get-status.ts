import * as fcl from "@onflow/fcl";
import { ethers } from "ethers";

export const getFlowTxStatus = async (txHash: string) => {
    try {
      const response = await fcl.tx(txHash).onceSealed();
      console.log("Snapshot:", response);
      if (response.status === 4) {
        console.log({
          status: response.errorMessage === "" ? "SUCCESS" : "FAILURE",
          recipient: null,
        });
      } else {
        console.log({
          status: "PROCESSING",
          recipient: null,
        });
      }
      const events = response.events;
      const flowFeeEvent = events.find((event: any) =>
        event.type.includes("FeesDeducted")
      );
      console.log("Fee Event:", flowFeeEvent);
      console.log("Fee Event Data", typeof flowFeeEvent.data.amount);
      if (flowFeeEvent) {
        const feeAmount = ethers.utils.parseUnits(flowFeeEvent.data.amount, 8);
        console.log("Flow Fee Amount:", feeAmount);
      }
    } catch (error) {
      throw new Error("Error getting Tx Status on Flow:" + error);
    }
  };