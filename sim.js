const fs = require('fs');
const isa = require('./isa');

function splitInstr(num, strt, end) {
    const bits = num.split('');
    const selected = bits.slice(bits.length - end, bits.length - strt);
    return parseInt(selected.join(''), 2);
}

class DJVM {

    constructor(instrArr, bp) {
        this.instructions = instrArr;
        this.break = bp;

        this.pc = 0;
        this.registerFile = {};
        this.mainMemory = [];
    }

    exec() {
        while(this.pc < this.instructions.length) {
            step();
        }
    }

    fetch() {
        return this.instructions[this.pc];
    }

    decode(raw) {
        return {
            opCode: splitInstr(raw, 28, 32),
            rd: splitInstr(raw, 22, 28),
            rs: splitInstr(raw, 16, 22),
            rt: splitInstr(raw, 10, 16),
            imediate: splitInstr(raw, 0, 10),
        };
    }

    step() {
        const instr = this.fetch();
        const decoded = this.decode(instr);
        const decoder = isa.fromOp(decoded.opCode);
    }
}

function main() {
    if(process.argv.length < 2) {
        console.log('Usage: node sim.js [-s] [-b pc] <input binary>');
        process.exit(1);
    }

    let currentArg = 2;

    const config = {
        step: false,
        break: undefined,
        inputFile: '',
    };

    while(process.argv[currentArg][0] === '-') {
        if(process.argv[currentArg][1] === 'b') {
            config.break = parseInt(process.argv[currentArg + 1]);
            currentArg += 2;
        } else if(process.argv[currentArg][1] === 'e') {
            config.step = true;
            currentArg += 1;
        } else {
            console.error('bad flag', process.argv[currentArg][1]);
            process.exit(1);
        }
    }

    config.inputFile = process.argv[currentArg];

    if(!fs.existsSync(config.inputFile)) {
        console.error('Input file does not exist');
        process.exit(1);
    }

    const vm = new DJVM();

    vm.decode("inst00rd0011rs1122rt221234567890");

    console.log();
}

main();