import { branch, Field, proofSystem, ProofWithInput } from 'snarkyjs';
import { RollupStateTransition } from './models/rollup_state_transition';
import { TransferProof } from '../snapp/proof';
import { AccountDb, PendingRcTxDb, PendingRcTxRootDb, WrapField } from './store';
import { RollupState } from './models/rollup_state';

@proofSystem
export class RollupProof extends ProofWithInput<RollupStateTransition> {
  @branch
  static merge(p1: RollupProof, p2: RollupProof): RollupProof {
    p1.publicInput.target.assertEquals(p2.publicInput.source);
    return new RollupProof(new RollupStateTransition(p1.publicInput.source, p2.publicInput.target));
  }

  @branch static processTransfer(
    proofWithInput: TransferProof,
    accountDb: AccountDb,
    pendingTcTxRootDb: PendingRcTxRootDb,
    pendingRcTxDb: PendingRcTxDb,
    accountsCommitmentOnchain: Field,
    pendingRcTxRootsCommitment: Field
  ): RollupProof {
    let before = new RollupState(accountDb.getMerkleRoot(), pendingTcTxRootDb.getMerkleRoot());

    // proofWithInput.assertVerifies();

    let transferArgs = proofWithInput.publicInput;
    transferArgs.accountsCommitment.assertEquals(accountsCommitmentOnchain);
    transferArgs.pendingRcTxRootsCommitment.assertEquals(pendingRcTxRootsCommitment);
    let account = transferArgs.finalAccount;
    let tx = transferArgs.newPendingTx;
    account.nonce.equals(tx.nonce).assertEquals(true);
    account.nonce = account.nonce.add(1);

    let nameHash = transferArgs.nameHash;
    accountDb.set(nameHash.toString(), account);
    pendingRcTxDb.set(tx.hash().toString(), tx);
    // for(let i=0; i<transferArgs.mergedPendingTxCommitments.length; i++) {
    // delete
    // }

    let subTreeRoot = pendingRcTxDb.getMerkleRoot();
    pendingTcTxRootDb.set(nameHash.toString(), new WrapField(subTreeRoot));

    let after = new RollupState(accountDb.getMerkleRoot(), pendingTcTxRootDb.getMerkleRoot());

    return new RollupProof(new RollupStateTransition(before, after));
  }
}
