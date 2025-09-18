import React from "react";
import ReactMarkdown from "react-markdown";
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";

const docsMarkdown = `# 📚 Starklytics Suite Documentation

## 🚀 Introduction to Starknet
**Starknet** is a Layer 2 scaling solution for Ethereum, built using STARK proofs. It enables fast, secure, and low-cost transactions, and supports complex dApps with high throughput.

### Why Starknet?
- Scales Ethereum with lower fees and higher speed
- Uses Cairo, a custom language for provable computation
- Features account abstraction (smart contract wallets by default)
- Unique fee model: fees are paid in ETH, but the structure is different from L1

### How Starknet Differs
- Uses Cairo instead of Solidity
- All accounts are smart contracts (account abstraction)
- Data is event-driven and more flexible, but sometimes less standardized than EVM chains

## 🏗️ Platform Overview
### Purpose
- Starklytics Suite is a data analytics and bounty platform for Starknet

### Who is it for?
- Web2 analysts, Web3 researchers, Starknet ecosystem participants, and anyone interested in on-chain data

### App Flow
1. **Query:** Write and run queries on Starknet data
2. **Save:** Store queries and results for later use
3. **Visualize:** Build charts and dashboards from query results
4. **Dashboard:** Organize and share your analytics
5. **Share:** Collaborate and publish dashboards

## 🗃️ Data Explanation
### How Starknet Data Works
- Data is stored in native tables, contracts, and events
- Interactions are decoded from calldata and event logs
- Events are the main source for analytics (not logs like EVM)

### Example Queries
\`\`\`sql
-- Find all active bounties
SELECT * FROM bounties WHERE is_active = true;

-- Get total rewards distributed
SELECT SUM(reward_amount) FROM bounties WHERE winner IS NOT NULL;

-- Active participants in last 7 days
SELECT COUNT(DISTINCT participant) FROM bounty_participants 
WHERE joined_at > NOW() - INTERVAL '7 days';
\`\`\`

## 🛠️ Smart Contract Integration
### Bounty Contract Events
- \`BountyCreated\`: When a new bounty is posted
- \`BountyJoined\`: When a participant joins
- \`SolutionSubmitted\`: When solutions are submitted
- \`RewardDistributed\`: When rewards are paid out

### Example Event Query
\`\`\`sql
-- Track all bounty solutions
SELECT 
  bounty_id,
  participant,
  solution_hash,
  block_timestamp
FROM solution_submitted_events
ORDER BY block_timestamp DESC;
\`\`\`

## 💡 Getting Started
1. Connect your Starknet wallet (Argent X or Braavos)
2. Browse active bounties in the Bounties section
3. Start with basic queries in Query Editor
4. Build your first dashboard
5. Join the community discord for support

## 📚 Resources
- [Starknet Docs](https://docs.starknet.io/)
- [Cairo Book](https://book.cairo-lang.org/)
- [Starknet Community](https://community.starknet.io/)
- [Platform Tutorials](https://docs.starklytics.xyz/)
- [API Reference](https://api.starklytics.xyz/docs)
`;

export default function Docs() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
          <Header title="Documentation" />
          <main className="container mx-auto p-6">
            <div className="prose prose-invert prose-headings:text-primary prose-a:text-primary max-w-4xl mx-auto bg-card p-8 rounded-lg border border-border">
              <ReactMarkdown>{docsMarkdown}</ReactMarkdown>
            </div>
          </main>
      </div>
    </div>
  );
}
