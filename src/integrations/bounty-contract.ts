// BountyContract integration with Starknet.js
// Provides service class for interacting with deployed Cairo contract

import { Contract, Provider, Account, CallData } from 'starknet';

// Update this address after deployment
export const BOUNTY_CONTRACT_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"; // Placeholder - UPDATE AFTER DEPLOYMENT

export const BOUNTY_CONTRACT_ABI = [
  {
    "name": "create_bounty",
    "type": "function",
    "inputs": [
      {"name": "title", "type": "felt252"},
      {"name": "description", "type": "felt252"},
      {"name": "reward_amount", "type": "u256"},
      {"name": "deadline", "type": "u64"},
      {"name": "max_participants", "type": "u32"}
    ],
    "outputs": [{"type": "u256"}],
    "state_mutability": "external"
  },
  {
    "name": "join_bounty",
    "type": "function",
    "inputs": [{"name": "bounty_id", "type": "u256"}],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "submit_solution",
    "type": "function",
    "inputs": [
      {"name": "bounty_id", "type": "u256"},
      {"name": "solution_hash", "type": "felt252"}
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "select_winner",
    "type": "function",
    "inputs": [
      {"name": "bounty_id", "type": "u256"},
      {"name": "winner", "type": "ContractAddress"}
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "get_bounty",
    "type": "function",
    "inputs": [{"name": "bounty_id", "type": "u256"}],
    "outputs": [{"type": "BountyContract::Bounty"}],
    "state_mutability": "view"
  },
  {
    "name": "get_bounty_count",
    "type": "function",
    "inputs": [],
    "outputs": [{"type": "u256"}],
    "state_mutability": "view"
  }
];

export class BountyContractService {
  private contract: Contract;
  private provider: Provider;

  constructor(providerUrl: string = 'https://starknet-mainnet.public.blastapi.io') {
    this.provider = new Provider({ sequencer: { network: 'mainnet-alpha' } });
    this.contract = new Contract(BOUNTY_CONTRACT_ABI, BOUNTY_CONTRACT_ADDRESS, this.provider);
  }

  async createBounty(
    account: Account,
    title: string,
    description: string,
    rewardAmount: string,
    deadline: number,
    maxParticipants: number
  ) {
    const callData = CallData.compile({
      title: title,
      description: description,
      reward_amount: rewardAmount,
      deadline: deadline,
      max_participants: maxParticipants
    });

    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'create_bounty',
      calldata: callData
    });
  }

  async joinBounty(account: Account, bountyId: string) {
    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'join_bounty',
      calldata: CallData.compile({ bounty_id: bountyId })
    });
  }

  async submitSolution(account: Account, bountyId: string, solutionHash: string) {
    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'submit_solution',
      calldata: CallData.compile({ bounty_id: bountyId, solution_hash: solutionHash })
    });
  }

  async selectWinner(account: Account, bountyId: string, winner: string) {
    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'select_winner',
      calldata: CallData.compile({ bounty_id: bountyId, winner: winner })
    });
  }

  async getBounty(bountyId: string) {
    return await this.contract.call('get_bounty', [bountyId]);
  }

  async getBountyCount() {
    return await this.contract.call('get_bounty_count', []);
  }

  async isParticipant(bountyId: string, participant: string) {
    return await this.contract.call('is_participant', [bountyId, participant]);
  }
}
