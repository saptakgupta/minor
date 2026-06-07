const VERSION = 8;
const SIZE = VERSION * 4 + 17;
const ECC_CODEWORDS_PER_BLOCK = 24;
const DATA_BLOCK_SIZES = [97, 97];
const TOTAL_DATA_CODEWORDS = DATA_BLOCK_SIZES.reduce((total, size) => total + size, 0);
const TOTAL_CODEWORDS = TOTAL_DATA_CODEWORDS + DATA_BLOCK_SIZES.length * ECC_CODEWORDS_PER_BLOCK;
const MAX_BYTE_LENGTH = Math.floor((TOTAL_DATA_CODEWORDS * 8 - 12) / 8);
const ALIGNMENT_PATTERN_POSITIONS = [6, 24, 42];

type Matrix = boolean[][];

const createMatrix = () => Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

const cloneMatrix = (matrix: Matrix) => matrix.map((row) => row.slice());

const getBit = (value: number, index: number) => ((value >>> index) & 1) !== 0;

const appendBits = (bits: number[], value: number, length: number) => {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >>> index) & 1);
  }
};

const encodeDataCodewords = (value: string) => {
  const bytes = Array.from(new TextEncoder().encode(value));

  if (bytes.length > MAX_BYTE_LENGTH) {
    throw new Error(`QR payload is too long. Maximum is ${MAX_BYTE_LENGTH} bytes.`);
  }

  const bits: number[] = [];
  appendBits(bits, 0x4, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const capacityBits = TOTAL_DATA_CODEWORDS * 8;
  const terminatorLength = Math.min(4, capacityBits - bits.length);
  for (let index = 0; index < terminatorLength; index += 1) {
    bits.push(0);
  }
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const codewords: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    let byte = 0;
    for (let bit = 0; bit < 8; bit += 1) {
      byte = (byte << 1) | (bits[index + bit] || 0);
    }
    codewords.push(byte);
  }

  for (let padByte = 0xec; codewords.length < TOTAL_DATA_CODEWORDS; padByte ^= 0xec ^ 0x11) {
    codewords.push(padByte);
  }

  return codewords;
};

const reedSolomonMultiply = (left: number, right: number) => {
  let product = 0;
  for (let index = 7; index >= 0; index -= 1) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((right >>> index) & 1) * left;
  }
  return product & 0xff;
};

const reedSolomonComputeDivisor = (degree: number) => {
  const result = Array(degree).fill(0);
  result[degree - 1] = 1;

  let root = 1;
  for (let index = 0; index < degree; index += 1) {
    for (let position = 0; position < result.length; position += 1) {
      result[position] = reedSolomonMultiply(result[position], root);
      if (position + 1 < result.length) {
        result[position] ^= result[position + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }

  return result;
};

const reedSolomonComputeRemainder = (data: number[], divisor: number[]) => {
  const result = Array(divisor.length).fill(0);

  data.forEach((byte) => {
    const factor = byte ^ result.shift();
    result.push(0);
    divisor.forEach((coefficient, index) => {
      result[index] ^= reedSolomonMultiply(coefficient, factor);
    });
  });

  return result;
};

const interleaveCodewords = (dataCodewords: number[]) => {
  const divisor = reedSolomonComputeDivisor(ECC_CODEWORDS_PER_BLOCK);
  const dataBlocks: number[][] = [];
  const errorBlocks: number[][] = [];
  let offset = 0;

  DATA_BLOCK_SIZES.forEach((size) => {
    const block = dataCodewords.slice(offset, offset + size);
    dataBlocks.push(block);
    errorBlocks.push(reedSolomonComputeRemainder(block, divisor));
    offset += size;
  });

  const codewords: number[] = [];
  const maxDataBlockSize = Math.max(...DATA_BLOCK_SIZES);

  for (let index = 0; index < maxDataBlockSize; index += 1) {
    dataBlocks.forEach((block) => {
      if (index < block.length) {
        codewords.push(block[index]);
      }
    });
  }

  for (let index = 0; index < ECC_CODEWORDS_PER_BLOCK; index += 1) {
    errorBlocks.forEach((block) => {
      codewords.push(block[index]);
    });
  }

  if (codewords.length !== TOTAL_CODEWORDS) {
    throw new Error("QR codeword generation failed.");
  }

  return codewords;
};

const setFunctionModule = (modules: Matrix, isFunction: Matrix, x: number, y: number, dark: boolean) => {
  modules[y][x] = dark;
  isFunction[y][x] = true;
};

const drawFinderPattern = (modules: Matrix, isFunction: Matrix, x: number, y: number) => {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const xx = x + dx;
      const yy = y + dy;
      if (xx < 0 || xx >= SIZE || yy < 0 || yy >= SIZE) {
        continue;
      }

      const inPattern = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
      const dark =
        inPattern &&
        (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      setFunctionModule(modules, isFunction, xx, yy, dark);
    }
  }
};

const drawAlignmentPattern = (modules: Matrix, isFunction: Matrix, centerX: number, centerY: number) => {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setFunctionModule(modules, isFunction, centerX + dx, centerY + dy, distance === 2 || distance === 0);
    }
  }
};

const drawFormatBits = (modules: Matrix, isFunction: Matrix, mask: number) => {
  const errorCorrectionLevelBits = 1;
  const data = (errorCorrectionLevelBits << 3) | mask;
  let remainder = data;

  for (let index = 0; index < 10; index += 1) {
    remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
  }

  const bits = ((data << 10) | remainder) ^ 0x5412;

  for (let index = 0; index <= 5; index += 1) {
    setFunctionModule(modules, isFunction, 8, index, getBit(bits, index));
  }
  setFunctionModule(modules, isFunction, 8, 7, getBit(bits, 6));
  setFunctionModule(modules, isFunction, 8, 8, getBit(bits, 7));
  setFunctionModule(modules, isFunction, 7, 8, getBit(bits, 8));
  for (let index = 9; index < 15; index += 1) {
    setFunctionModule(modules, isFunction, 14 - index, 8, getBit(bits, index));
  }

  for (let index = 0; index < 8; index += 1) {
    setFunctionModule(modules, isFunction, SIZE - 1 - index, 8, getBit(bits, index));
  }
  for (let index = 8; index < 15; index += 1) {
    setFunctionModule(modules, isFunction, 8, SIZE - 15 + index, getBit(bits, index));
  }

  setFunctionModule(modules, isFunction, 8, SIZE - 8, true);
};

const drawFunctionPatterns = () => {
  const modules = createMatrix();
  const isFunction = createMatrix();

  drawFinderPattern(modules, isFunction, 0, 0);
  drawFinderPattern(modules, isFunction, SIZE - 7, 0);
  drawFinderPattern(modules, isFunction, 0, SIZE - 7);

  for (let index = 0; index < SIZE; index += 1) {
    if (!isFunction[6][index]) {
      setFunctionModule(modules, isFunction, index, 6, index % 2 === 0);
    }
    if (!isFunction[index][6]) {
      setFunctionModule(modules, isFunction, 6, index, index % 2 === 0);
    }
  }

  ALIGNMENT_PATTERN_POSITIONS.forEach((centerY) => {
    ALIGNMENT_PATTERN_POSITIONS.forEach((centerX) => {
      const overlapsFinder =
        (centerX === 6 && centerY === 6) ||
        (centerX === 6 && centerY === SIZE - 7) ||
        (centerX === SIZE - 7 && centerY === 6);

      if (!overlapsFinder) {
        drawAlignmentPattern(modules, isFunction, centerX, centerY);
      }
    });
  });

  drawFormatBits(modules, isFunction, 0);

  return { modules, isFunction };
};

const drawCodewords = (modules: Matrix, isFunction: Matrix, codewords: number[]) => {
  let bitIndex = 0;
  let movingUp = true;

  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1;
    }

    for (let vertical = 0; vertical < SIZE; vertical += 1) {
      const y = movingUp ? SIZE - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (isFunction[y][x]) {
          continue;
        }

        const byte = codewords[Math.floor(bitIndex / 8)];
        modules[y][x] = byte !== undefined && getBit(byte, 7 - (bitIndex % 8));
        bitIndex += 1;
      }
    }

    movingUp = !movingUp;
  }
};

const getMaskBit = (mask: number, x: number, y: number) => {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
};

const applyMask = (modules: Matrix, isFunction: Matrix, mask: number) => {
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (!isFunction[y][x] && getMaskBit(mask, x, y)) {
        modules[y][x] = !modules[y][x];
      }
    }
  }
};

const getRunPenalty = (line: boolean[]) => {
  let penalty = 0;
  let runColor = line[0];
  let runLength = 1;

  for (let index = 1; index < line.length; index += 1) {
    if (line[index] === runColor) {
      runLength += 1;
      continue;
    }

    if (runLength >= 5) {
      penalty += 3 + runLength - 5;
    }
    runColor = line[index];
    runLength = 1;
  }

  if (runLength >= 5) {
    penalty += 3 + runLength - 5;
  }

  return penalty;
};

const hasFinderLikePattern = (line: boolean[], start: number) => {
  const pattern = [true, false, true, true, true, false, true];
  const matches = pattern.every((dark, index) => line[start + index] === dark);
  if (!matches) {
    return false;
  }

  const beforeIsLight =
    start >= 4 && line.slice(start - 4, start).every((module) => module === false);
  const afterIsLight =
    start + 11 <= line.length && line.slice(start + 7, start + 11).every((module) => module === false);

  return beforeIsLight || afterIsLight;
};

const getPenaltyScore = (modules: Matrix) => {
  let penalty = 0;
  let darkModules = 0;

  for (let y = 0; y < SIZE; y += 1) {
    penalty += getRunPenalty(modules[y]);
    for (let x = 0; x < SIZE; x += 1) {
      if (modules[y][x]) {
        darkModules += 1;
      }
    }
  }

  for (let x = 0; x < SIZE; x += 1) {
    penalty += getRunPenalty(modules.map((row) => row[x]));
  }

  for (let y = 0; y < SIZE - 1; y += 1) {
    for (let x = 0; x < SIZE - 1; x += 1) {
      const module = modules[y][x];
      if (module === modules[y][x + 1] && module === modules[y + 1][x] && module === modules[y + 1][x + 1]) {
        penalty += 3;
      }
    }
  }

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x <= SIZE - 7; x += 1) {
      if (hasFinderLikePattern(modules[y], x)) {
        penalty += 40;
      }
    }
  }

  for (let x = 0; x < SIZE; x += 1) {
    const column = modules.map((row) => row[x]);
    for (let y = 0; y <= SIZE - 7; y += 1) {
      if (hasFinderLikePattern(column, y)) {
        penalty += 40;
      }
    }
  }

  const totalModules = SIZE * SIZE;
  penalty += Math.floor(Math.abs(darkModules * 20 - totalModules * 10) / totalModules) * 10;

  return penalty;
};

const createQrModules = (value: string) => {
  const dataCodewords = encodeDataCodewords(value);
  const codewords = interleaveCodewords(dataCodewords);
  const base = drawFunctionPatterns();

  drawCodewords(base.modules, base.isFunction, codewords);

  let bestModules = base.modules;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (let mask = 0; mask < 8; mask += 1) {
    const modules = cloneMatrix(base.modules);
    applyMask(modules, base.isFunction, mask);
    drawFormatBits(modules, base.isFunction, mask);

    const penalty = getPenaltyScore(modules);
    if (penalty < bestPenalty) {
      bestModules = modules;
      bestPenalty = penalty;
    }
  }

  return bestModules;
};

export const createQrSvg = (value: string) => {
  const modules = createQrModules(value);
  const quietZone = 4;
  const svgSize = SIZE + quietZone * 2;
  const darkPath = modules
    .flatMap((row, y) =>
      row.map((dark, x) => (dark ? `M${x + quietZone} ${y + quietZone}h1v1h-1z` : "")),
    )
    .filter(Boolean)
    .join("");

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" shape-rendering="crispEdges">`,
    `<path fill="#fff" d="M0 0h${svgSize}v${svgSize}H0z"/>`,
    `<path fill="#111827" d="${darkPath}"/>`,
    "</svg>",
  ].join("");
};

export const createQrSvgDataUri = (value: string) => `data:image/svg+xml,${encodeURIComponent(createQrSvg(value))}`;
