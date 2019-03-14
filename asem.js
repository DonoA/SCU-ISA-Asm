const fs = require('fs');
const util = require('util');
const isa = require('./isa');

const valueType = 'value';
const regType = 'reg';

function splitInstr(labelTable, inst, line) {
    inst = inst.toLowerCase();

    const splitPoint = inst.indexOf(' ');
    if(splitPoint === -1) {
        return {
            inst: inst,
            args: []
        };
    }
    const name = inst.substring(0, splitPoint);
    const rest = inst.substring(splitPoint + 1);
    const args = rest.split(/,\s*/).map((e, i) => {
        if(e.trim() === '') {
            console.error('Invalid empty parameter in: "' + inst + '" param id:', i);
            process.exit(1);
        }
        return e;
    }).map((e, i) => {
        const labelValue = labelTable[e];
        if(labelValue !== undefined) {
            return {
                type: valueType,
                value: labelValue - line - 1
            };
        } else if(e[0] === 'r') {
            return {
                type: regType,
                value: parseInt(e.substring(1))
            };
        } else if(!isNaN(parseInt(e))){
            return {
                type: valueType,
                value: parseInt(e)
            };
        } else {
            console.error('Unexpected value token in instruction: "' + inst + '" param id:', i);
            process.exit(1);
        }
    });
    return {
        inst: name,
        args: args,
    };
}

function cleanLabels(rawInput) {
    let lines = rawInput.split('\n').map(e => e.trim());
    const labels = {};
    lines = lines.map((line, index) => {
        const colon = line.indexOf(':');
        if(colon === -1) {
            return line;
        }
        const label = line.substring(0, colon);
        const instr = line.substring(colon + 1);
        if(labels[label] !== undefined) {
            console.error('Re-def of label', label, 'on', index+1);
            process.exit(1);
        }
        labels[label] = index + 1;
        return instr.trim();
    });
    return {
        labelTable: labels,
        instructions: lines
    };
}

function main() {

    if(process.argv.length < 3) {
        console.log('Usage: node asem.js [-f bin | dec | hex] [-e] [-v] <input file> [output file]');
        process.exit(1);
    }

    let currentArg = 2;

    const config = {
        outputFormat: 'bin',
        experimental: false,
        verbose: false,
        inputFile: '',
        outputFile: '',
    }

    while(process.argv[currentArg][0] === '-') {
        if(process.argv[currentArg][1] === 'f') {
            config.outputFormat = process.argv[currentArg + 1];
            currentArg += 2;
        } else if(process.argv[currentArg][1] === 'e') {
            config.experimental = true;
            currentArg += 1;
        } else if(process.argv[currentArg][1] === 'v') {
            config.verbose = true;
            currentArg += 1;
        } else {
            console.error('bad flag', process.argv[currentArg][1]);
            process.exit(1);
        }
    }

    config.inputFile = process.argv[currentArg];
    config.outputFile = process.argv[currentArg + 1] || 'out.bin';

    if(config.verbose) {
        console.log('config:', config);
    }

    if(!fs.existsSync(config.inputFile)) {
        console.error('Input file does not exist');
        process.exit(1);
    }

    const rawInput = fs.readFileSync(config.inputFile).toString('utf8');

    const firstPass = cleanLabels(rawInput);
    if(config.verbose) {
        console.log('first pass:', firstPass);
    }

    const decoded = firstPass.instructions.filter((e) => e !== '').map((line, ind) => splitInstr(firstPass.labelTable, line, ind));
    if(config.verbose) {
        console.log('decoded:', util.inspect(decoded, false, null, true));
    }

    const encoders = decoded.map((instr, index) => {
        const encoder = isa.fromName(instr.inst);
        if(encoder === undefined) {
            console.error('No op code for', instr.inst, 'line:', index + 1);
            process.exit(1);
        }
        return {
            encoder: encoder,
            instr: instr
        };
    });

    let encodedOutput = encoders.map((e) => e.encoder.encode(e.encoder.op, e.instr));

    encodedOutput = encodedOutput.map(encoded => {
        if(config.outputFormat === 'bin') {
            return encoded.toString(2).padStart(32, '0');
        }
        if(config.outputFormat === 'dec') {
            return encoded.toString(10).padStart(9, '0');
        }
        if(config.outputFormat === 'hex') {
            return encoded.toString(16).padStart(8, '0');
        }
    });

    encodedOutput = encodedOutput.map((str, i) => {
        return 'assign instructions[' + i + '] = 32\'b' + str + ';' + '// ' + firstPass.instructions[i];
    });

    fs.writeFileSync(config.outputFile, encodedOutput.join('\n'));
}

main();