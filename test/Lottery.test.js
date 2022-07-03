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
})
