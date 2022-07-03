const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const {interface, bytecode} = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({data: bytecode})
        .send({from: accounts[0], gas: '1000000'});
})

describe('Lottery Contract', () => {
    it('should correctly deploy contract', function () {
        assert.ok(lottery.options.address);
    });

    it('should allow one account to enter', async () => {
        const UNIT = "ether";
        const VAL = '0.02';
        const ACCOUNT = accounts[0];

        await lottery.methods.enter().send({
            from: ACCOUNT,
            value: web3.utils.toWei(VAL, UNIT)
        });

        const addresses = await lottery.methods.getPlayers().call({
            from: ACCOUNT
        });

        assert.strictEqual(1, addresses.length);
        assert.strictEqual(ACCOUNT, addresses[0])

    })

    it('should allow multiple accounts to enter', async () => {
        const UNIT = "ether";
        const VAL = '0.02';
        const ACCOUNT0 = accounts[0];
        const ACCOUNT1 = accounts[1];
        const ACCOUNT2 = accounts[2];

        await lottery.methods.enter().send({
            from: ACCOUNT0,
            value: web3.utils.toWei(VAL, UNIT)
        });

        await lottery.methods.enter().send({
            from: ACCOUNT1,
            value: web3.utils.toWei(VAL, UNIT)
        });

        await lottery.methods.enter().send({
            from: ACCOUNT2,
            value: web3.utils.toWei(VAL, UNIT)
        });

        const addresses = await lottery.methods.getPlayers().call({
            from: ACCOUNT0
        });

        assert.strictEqual(3, addresses.length);
        assert.strictEqual(ACCOUNT0, addresses[0])
        assert.strictEqual(ACCOUNT1, addresses[1])
        assert.strictEqual(ACCOUNT2, addresses[2])

    })

    it('should require a minimum amount of wey', async () => {
        const ACCOUNT = accounts[0];

        try {
            await lottery.methods.enter().send({
                from: ACCOUNT,
                value: 0
            });
            assert(false);
        } catch (err) {
            assert(err);
        }

    });

    it('should only allow manager to call pickWinner', async () => {
        const NON_MANAGER_ACCOUNT = accounts[1];
        const UNIT = 'ether';
        const AMOUNT = "0.02";

        try{
            await lottery.methods.pickWinner.send({
                from: NON_MANAGER_ACCOUNT,
                value: web3.utils.toWei(AMOUNT,UNIT)
            });
            assert(false);
        } catch (e) {
            assert(e);
        }

    });

    it('should send money to winner and clear player list', async () => {
        const ACCOUNT = accounts[0];
        const AMOUNT = "2";
        const UNIT = "ether"
        const AMOUNT_MINUS_GAS = "1.8";

        await lottery.methods.enter().send({
            from: ACCOUNT,
            value: web3.utils.toWei(AMOUNT, UNIT)
        })

        const initialBalance = await web3.eth.getBalance(ACCOUNT);
        await lottery.methods.pickWinner().send({from: ACCOUNT});
        const finalBalance = await web3.eth.getBalance(ACCOUNT);
        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei(AMOUNT_MINUS_GAS, UNIT));
    });

})
