import {
    Optional,
    Field,
    Bool,
    UInt64,
    Poseidon
} from "snarkyjs";
import { Account } from "./contract_type";
import { fieldToHex } from "./util";

// import { Keyed, KeyedDataStore } from 'snarkyjs/dist/server/lib/data_store';


// const AccountDbDepth: number = 32;
// const AccountDb = KeyedAccumulatorFactory<Field, Account>(
//   AccountDbDepth
// );
// type AccountDb = InstanceType<typeof AccountDb>;

// const keyFunc = (v: Account): Field => {
//     return v.name;
// };
// //It looks like the API doesn't work
// let testDb = AccountDb.create(keyFunc, DataStore.Keyed.InMemory(Account, Field, keyFunc, AccountDbDepth));
// testDb.key = keyFunc;


class AccountDb {
    data: Map<string, Account>;
  
    constructor() {
      this.data = new Map<string, Account>();
    }
  
    set(index: number, account: Account) {
      this.data.set(fieldToHex(account.name), account);
      console.log("set account success");
    }
  
    get(name: Field): [Optional<Account>, number] {
      let acc = this.data.get(fieldToHex(name));
      console.log("get account: ", acc?.toString());
      if(acc) {
        
        let newAcc = new Account(acc.name, acc.balance, acc.withDrawKeyHash, acc.authKeyHash, acc.ownerMailHash);
        return [new Optional(new Bool(true), newAcc), 0];
      } else {

        let newAcc = new Account(Field.zero, UInt64.zero, Field.zero, Field.zero, Field.zero);
        return [new Optional(new Bool(false), newAcc), 0];
      }
    }
  
    commitment() {
      return Poseidon.hash(new Field(this.data.size).toFields());
    }
  }

  var testDb: AccountDb = new AccountDb();

  export { AccountDb, testDb };