export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getLzEndpoint = (network: string) => {
  switch (network) {
    case "bscTestnet":
      return "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1";
    case "arbitrumGoerli":
      return "0x6aB5Ae6822647046626e83ee6dB8187151E1d5ab";
    case "mumbai":
      return "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8";
    default:
      throw new Error("LayerZero endpoint address not found for the network");
  }
};
