function paddedBinArr(v, len) {
    v = v || 0;
    return v.toString(2).padStart(len, '0').split('');
}

function packDefType(op, rd, rs, rt, imediate) {
    op = paddedBinArr(op, 4);
    rd = paddedBinArr(rd, 6);
    rs = paddedBinArr(rs, 6);
    rt = paddedBinArr(rt, 6);
    imediate = paddedBinArr(imediate, 10);
    const bitArray = op.concat(rd).concat(rs).concat(rt).concat(imediate);
    return parseInt(bitArray.join(''), 2);
}

const instNameMap = {
    'nop': {
        op: 0b0000,
        encode: () => {
            return packDefType(0, 0, 0, 0);
        },
        execute: (vm, instr) => {/* nop */},
    },
    'ldpc': {
        op: 0b1111,
        encode: (op, instr) => {
            return packDefType(op, instr.args[0].value, 0, 0, instr.args[1].value);
        },
        execute: (vm, instr) => {
            const pc_x = vm.pc + instr.imediate;
            vm.registerFile[instr.rd] = pc_x;
        },
    },
    'ld': {
        op: 0b1110,
        encode: (op, instr) => {
            return packDefType(op, instr.args[0].value, instr.args[1].value, 0);
        },
        execute: (vm, instr) => {
            /* need to sim mem */
        },
    },
    'st': {
        op: 0b0011,
        encode: (op, instr) => {
            return packDefType(op, 0, instr.args[1].value, instr.args[0].value);
        },
        execute: (vm, instr) => {
            /* need to sim mem */
        },
    },
    'add': {
        op: 0b0100,
        encode: (op, instr) => {
            return packDefType(op, instr.args[0].value, instr.args[1].value, instr.args[2].value);
        },
        execute: (vm, instr) => {
            const x1 = vm.registerFile[instr.rs];
            const x2 = vm.registerFile[instr.rt];
            const sum = x1 + x2;
            vm.registerFile[instr.rd] = sum;
        },
    },
    'inc': {
        op: 0b0101,
        encode: (op, instr) => {
            return packDefType(op, instr.args[0].value, instr.args[1].value, 0);
        },
        execute: (vm, instr) => {
            const x1 = vm.registerFile[instr.rs];
            const sum = x1 + 1;
            vm.registerFile[instr.rd] = sum;
        },
    },
    'neg': {
        op: 0b0110,
        encode: (op, instr) => {
            return packDefType(op, instr.args[0].value, instr.args[1].value, 0);
        },
        execute: (vm, instr) => {
            const x1 = vm.registerFile[instr.rs];
            vm.registerFile[instr.rd] = -x1;
        },
    },
    'sub': {
        op: 0b0111,
        encode: (op, instr) => {
            return packDefType(op, instr.args[0].value, instr.args[1].value, instr.args[2].value);
        },
        execute: (vm, instr) => {
            const x1 = vm.registerFile[instr.rs];
            const x2 = vm.registerFile[instr.rt];
            const dif = x1 - x2;
            vm.registerFile[instr.rd] = dif;
        },
    },
    'j': {
        op: 0b1000,
        encode: (op, instr) => {
            return packDefType(op, 0, instr.args[0].value, 0);
        },
        execute: (vm, instr) => {
            /* define better */
        },
    },
    'brz': {
        op: 0b1001,
        encode: (op, instr) => {
            return packDefType(op, 0, instr.args[0].value, 0);
        },
        execute: (vm, instr) => {},
    },
    'jm': {
        op: 0b1010,
        encode: (op, instr) => {
            return packDefType(op, 0, instr.args[0].value, 0);
        },
        execute: (vm, instr) => {},
    },
    'brn': {
        op: 0b1011,
        encode: (op, instr) => {
            return packDefType(op, 0, instr.args[0].value, 0);
        },
        execute: (vm, instr) => {},
    },
};

function instrFromName(name) {
    return instNameMap[name];
}

function instrFromOP(op) {
    return Object.keys(instNameMap).filter(e => e.op == op)[0];
}

module.exports = {
    fromName: instrFromName,
    fromOp: instrFromOP
};